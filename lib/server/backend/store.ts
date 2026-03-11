import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  BackendDatabaseShape,
  ProviderSecretRecord,
  SessionSnapshot,
  SessionSnapshotRecord,
} from "@/lib/server/backend/types";
import type { ProviderName } from "@/types/provider";
import { assertEncryptionReady, decrypt, encrypt } from "@/lib/server/crypto";

const DEFAULT_DB_PATH = path.join(process.cwd(), ".data", "origem-backend.json");
const BLOB_KEY = "origem-backend.json";
const MAX_BLOB_WRITE_RETRIES = 8;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createEmptyDb(): BackendDatabaseShape {
  return { records: {}, providers: {} };
}

function parseBackendPath() {
  const fromEnv = process.env.ORIGEM_BACKEND_PATH;
  return fromEnv && fromEnv.trim().length > 0 ? fromEnv.trim() : DEFAULT_DB_PATH;
}

function shouldUseBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isBlobConflictError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("412") ||
    message.includes("precondition") ||
    message.includes("etag") ||
    message.includes("if-match")
  );
}

function mergeBackendDatabases(
  remote: BackendDatabaseShape,
  local: BackendDatabaseShape
): BackendDatabaseShape {
  const records: BackendDatabaseShape["records"] = { ...remote.records };
  for (const [sessionId, record] of Object.entries(local.records ?? {})) {
    const existing = records[sessionId];
    if (
      !existing ||
      record.version > existing.version ||
      record.updatedAt >= existing.updatedAt
    ) {
      records[sessionId] = record;
    }
  }

  const providers: BackendDatabaseShape["providers"] = { ...remote.providers };
  for (const [provider, record] of Object.entries(local.providers ?? {})) {
    if (!record) {
      continue;
    }

    const typedProvider = provider as ProviderName;
    const existing = providers[typedProvider];
    if (!existing || record.updatedAt >= existing.updatedAt) {
      providers[typedProvider] = record;
    }
  }

  return { records, providers };
}

async function blobRead(): Promise<{
  data: BackendDatabaseShape | null;
  etag: string | null;
}> {
  const { get } = await import("@vercel/blob");
  const result = await get(BLOB_KEY, { access: "private", useCache: false });

  if (!result || result.statusCode !== 200) {
    return { data: null, etag: null };
  }

  const content = await new Response(result.stream).text();
  return {
    data: JSON.parse(content) as BackendDatabaseShape,
    etag: result.blob.etag,
  };
}

async function blobWrite(
  db: BackendDatabaseShape,
  etag: string | null
): Promise<string> {
  const { put } = await import("@vercel/blob");
  const result = await put(BLOB_KEY, JSON.stringify(db), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    ...(etag ? { ifMatch: etag } : {}),
  });
  return result.etag;
}

class SnapshotStore {
  private db: BackendDatabaseShape = createEmptyDb();
  private blobEtag: string | null = null;
  private loaded = false;
  private writeChain: Promise<void> = Promise.resolve();
  private readonly dbPath = parseBackendPath();

  private async ensureLoaded() {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    try {
      if (shouldUseBlobStorage()) {
        const { data, etag } = await blobRead();
        this.blobEtag = etag;
        if (data && typeof data === "object" && data.records) {
          this.db = {
            records: data.records ?? {},
            providers: data.providers ?? {},
          };
        }
      } else {
        const content = await fs.readFile(this.dbPath, "utf-8");
        const parsed = JSON.parse(content) as BackendDatabaseShape;
        if (parsed && typeof parsed === "object" && parsed.records) {
          this.db = {
            records: parsed.records ?? {},
            providers: parsed.providers ?? {},
          };
        }
      }
    } catch (error: any) {
      // If the file or blob doesn't exist, we just start fresh
      if (error?.code === "ENOENT" || error?.message?.includes("404")) {
        this.db = createEmptyDb();
      } else {
        // Critical: Do NOT initialize an empty DB if this is a temporary read failure
        // Otherwise, the very next write will overwrite all data!
        console.error("[SnapshotStore] Critical failure loading database:", error);
        this.loaded = false; // allow retry on next call
        throw new Error("storage_unavailable: failed to read backend store");
      }
    }
  }

  private async writeBlobWithRetry() {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_BLOB_WRITE_RETRIES; attempt += 1) {
      try {
        this.blobEtag = await blobWrite(this.db, this.blobEtag);
        return;
      } catch (error) {
        if (!isBlobConflictError(error)) {
          throw error;
        }

        lastError = error;
        const { data, etag } = await blobRead();
        this.db = mergeBackendDatabases(data ?? createEmptyDb(), this.db);
        this.blobEtag = etag;
        await delay(60 * (attempt + 1));
      }
    }

    throw lastError;
  }

  private queueWrite() {
    const currentTask = this.writeChain.then(async () => {
      if (shouldUseBlobStorage()) {
        await this.writeBlobWithRetry();
      } else {
        await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
        await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2), "utf-8");
      }
    });

    this.writeChain = currentTask.catch((error) => {
      console.error("[SnapshotStore] Write task failed, but recovering write chain:", error);
    });

    return currentTask;
  }

  async listRecords(): Promise<SessionSnapshotRecord[]> {
    await this.ensureLoaded();

    return Object.values(this.db.records)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((item) => clone(item));
  }

  async getRecord(sessionId: string): Promise<SessionSnapshotRecord | null> {
    await this.ensureLoaded();
    const record = this.db.records[sessionId];
    return record ? clone(record) : null;
  }

  async upsertSnapshot(
    sessionId: string,
    snapshot: SessionSnapshot
  ): Promise<SessionSnapshotRecord> {
    await this.ensureLoaded();

    const previous = this.db.records[sessionId];
    const now = Date.now();
    const nextRecord: SessionSnapshotRecord = {
      sessionId,
      version: previous ? previous.version + 1 : 1,
      updatedAt: now,
      snapshot: clone(snapshot),
    };

    this.db.records[sessionId] = nextRecord;
    await this.queueWrite();

    return clone(nextRecord);
  }

  async deleteRecord(sessionId: string): Promise<void> {
    await this.ensureLoaded();

    if (!this.db.records[sessionId]) {
      return;
    }

    delete this.db.records[sessionId];
    await this.queueWrite();
  }

  private decryptRecord(record: ProviderSecretRecord): ProviderSecretRecord {
    return { ...record, apiKey: decrypt(record.apiKey) };
  }

  async listProviderRecords(): Promise<ProviderSecretRecord[]> {
    await this.ensureLoaded();

    return Object.values(this.db.providers)
      .filter((item): item is ProviderSecretRecord => Boolean(item))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((item) => this.decryptRecord(clone(item)));
  }

  async getProviderRecord(
    provider: ProviderName
  ): Promise<ProviderSecretRecord | null> {
    await this.ensureLoaded();
    const record = this.db.providers[provider];
    return record ? this.decryptRecord(clone(record)) : null;
  }

  async upsertProviderRecord(
    provider: ProviderName,
    input: { apiKey: string; selectedModel: string }
  ): Promise<ProviderSecretRecord> {
    await this.ensureLoaded();
    assertEncryptionReady("persist provider credentials");

    const nextRecord: ProviderSecretRecord = {
      provider,
      apiKey: encrypt(input.apiKey),
      selectedModel: input.selectedModel,
      updatedAt: Date.now(),
    };

    this.db.providers[provider] = nextRecord;
    await this.queueWrite();
    return { ...clone(nextRecord), apiKey: input.apiKey };
  }
}

const globalStore = globalThis as typeof globalThis & {
  __origemSnapshotStore?: SnapshotStore;
};

export function getSnapshotStore() {
  if (!globalStore.__origemSnapshotStore) {
    globalStore.__origemSnapshotStore = new SnapshotStore();
  }

  return globalStore.__origemSnapshotStore;
}
