import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  BackendDatabaseShape,
  ProviderSecretRecord,
  SessionSnapshot,
  SessionSnapshotRecord,
} from "@/lib/server/backend/types";
import type { ProviderName } from "@/types/provider";

const DEFAULT_DB_PATH = path.join(process.cwd(), ".data", "origem-backend.json");

function parseBackendPath() {
  const fromEnv = process.env.ORIGEM_BACKEND_PATH;
  return fromEnv && fromEnv.trim().length > 0 ? fromEnv.trim() : DEFAULT_DB_PATH;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class SnapshotStore {
  private db: BackendDatabaseShape = { records: {}, providers: {} };
  private loaded = false;
  private writeChain: Promise<void> = Promise.resolve();
  private readonly dbPath = parseBackendPath();

  private async ensureLoaded() {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    try {
      const content = await fs.readFile(this.dbPath, "utf-8");
      const parsed = JSON.parse(content) as BackendDatabaseShape;
      if (parsed && typeof parsed === "object" && parsed.records) {
        this.db = {
          records: parsed.records ?? {},
          providers: parsed.providers ?? {},
        };
      }
    } catch {
      this.db = { records: {}, providers: {} };
    }
  }

  private queueWrite() {
    this.writeChain = this.writeChain.then(async () => {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2), "utf-8");
    });

    return this.writeChain;
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

  async listProviderRecords(): Promise<ProviderSecretRecord[]> {
    await this.ensureLoaded();

    return Object.values(this.db.providers)
      .filter((item): item is ProviderSecretRecord => Boolean(item))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((item) => clone(item));
  }

  async getProviderRecord(
    provider: ProviderName
  ): Promise<ProviderSecretRecord | null> {
    await this.ensureLoaded();
    const record = this.db.providers[provider];
    return record ? clone(record) : null;
  }

  async upsertProviderRecord(
    provider: ProviderName,
    input: { apiKey: string; selectedModel: string }
  ): Promise<ProviderSecretRecord> {
    await this.ensureLoaded();

    const nextRecord: ProviderSecretRecord = {
      provider,
      apiKey: input.apiKey,
      selectedModel: input.selectedModel,
      updatedAt: Date.now(),
    };

    this.db.providers[provider] = nextRecord;
    await this.queueWrite();
    return clone(nextRecord);
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
