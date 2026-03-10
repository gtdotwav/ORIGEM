import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import type { AuthDatabaseShape, AuthUserRecord } from "@/lib/server/auth/types";

const DEFAULT_DB_PATH = path.join(process.cwd(), ".data", "origem-auth.json");
const BLOB_KEY = "origem-auth.json";
const MAX_BLOB_WRITE_RETRIES = 3;

function createEmptyDb(): AuthDatabaseShape {
  return { users: {} };
}

function parseAuthPath() {
  const fromEnv = process.env.ORIGEM_AUTH_PATH?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_DB_PATH;
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

function mergeAuthDatabases(
  remote: AuthDatabaseShape,
  local: AuthDatabaseShape
): AuthDatabaseShape {
  const users: AuthDatabaseShape["users"] = { ...remote.users };

  for (const [emailNormalized, record] of Object.entries(local.users ?? {})) {
    const existing = users[emailNormalized];
    if (
      !existing ||
      record.updatedAt > existing.updatedAt ||
      (record.updatedAt === existing.updatedAt &&
        (record.lastLoginAt ?? 0) >= (existing.lastLoginAt ?? 0))
    ) {
      users[emailNormalized] = record;
    }
  }

  return { users };
}

async function blobRead(): Promise<{
  data: AuthDatabaseShape | null;
  etag: string | null;
}> {
  const { get } = await import("@vercel/blob");
  const result = await get(BLOB_KEY, { access: "private", useCache: false });

  if (!result || result.statusCode !== 200) {
    return { data: null, etag: null };
  }

  const content = await new Response(result.stream).text();
  return {
    data: JSON.parse(content) as AuthDatabaseShape,
    etag: result.blob.etag,
  };
}

async function blobWrite(db: AuthDatabaseShape, etag: string | null): Promise<string> {
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

class AuthStore {
  private db: AuthDatabaseShape = createEmptyDb();
  private blobEtag: string | null = null;
  private loaded = false;
  private writeChain: Promise<void> = Promise.resolve();
  private readonly dbPath = parseAuthPath();

  private async ensureLoaded() {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    try {
      if (shouldUseBlobStorage()) {
        const { data, etag } = await blobRead();
        this.blobEtag = etag;
        if (data && typeof data === "object" && data.users) {
          this.db = { users: data.users ?? {} };
        }
      } else {
        const content = await fs.readFile(this.dbPath, "utf-8");
        const parsed = JSON.parse(content) as AuthDatabaseShape;
        if (parsed && typeof parsed === "object" && parsed.users) {
          this.db = { users: parsed.users ?? {} };
        }
      }
    } catch {
      this.db = createEmptyDb();
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
        this.db = mergeAuthDatabases(data ?? createEmptyDb(), this.db);
        this.blobEtag = etag;
      }
    }

    throw lastError;
  }

  private queueWrite() {
    this.writeChain = this.writeChain.then(async () => {
      if (shouldUseBlobStorage()) {
        await this.writeBlobWithRetry();
      } else {
        await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
        await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2), "utf-8");
      }
    });

    return this.writeChain;
  }

  async countUsers(): Promise<number> {
    await this.ensureLoaded();
    return Object.keys(this.db.users).length;
  }

  async listUsers(): Promise<AuthUserRecord[]> {
    await this.ensureLoaded();
    return Object.values(this.db.users)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((user) => clone(user));
  }

  async getUserByEmailNormalized(
    emailNormalized: string
  ): Promise<AuthUserRecord | null> {
    await this.ensureLoaded();
    const record = this.db.users[emailNormalized];
    return record ? clone(record) : null;
  }

  async getUserById(userId: string): Promise<AuthUserRecord | null> {
    await this.ensureLoaded();

    for (const user of Object.values(this.db.users)) {
      if (user.id === userId) {
        return clone(user);
      }
    }

    return null;
  }

  async upsertUser(record: AuthUserRecord): Promise<AuthUserRecord> {
    await this.ensureLoaded();
    this.db.users[record.emailNormalized] = clone(record);
    await this.queueWrite();
    return clone(record);
  }
}

const globalStore = globalThis as typeof globalThis & {
  __origemAuthStore?: AuthStore;
};

export function buildUserId(emailNormalized: string) {
  return `usr_${createHash("sha256")
    .update(emailNormalized)
    .digest("hex")
    .slice(0, 24)}`;
}

export function getAuthStore() {
  if (!globalStore.__origemAuthStore) {
    globalStore.__origemAuthStore = new AuthStore();
  }

  return globalStore.__origemAuthStore;
}

