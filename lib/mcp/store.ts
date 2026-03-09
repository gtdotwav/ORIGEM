import { promises as fs } from "node:fs";
import path from "node:path";
import { encrypt, decrypt } from "@/lib/server/crypto";
import type {
  MCPConnector,
  MCPCredentialRecord,
  MCPAuditEntry,
  MCPDatabaseShape,
} from "@/types/mcp";

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Store — persists connectors, credentials, audit log     */
/*  Same pattern as SnapshotStore — file-based or Vercel Blob          */
/* ------------------------------------------------------------------ */

const DEFAULT_DB_PATH = path.join(process.cwd(), ".data", "origem-mcp.json");
const BLOB_KEY = "origem-mcp.json";
const MAX_AUDIT_ENTRIES = 1000;

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function blobRead(): Promise<MCPDatabaseShape | null> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
  if (blobs.length === 0) return null;
  const response = await fetch(blobs[0].url);
  if (!response.ok) return null;
  return (await response.json()) as MCPDatabaseShape;
}

async function blobWrite(db: MCPDatabaseShape): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(BLOB_KEY, JSON.stringify(db), { access: "public", addRandomSuffix: false });
}

class MCPStore {
  private db: MCPDatabaseShape = { connectors: {}, credentials: {}, audit: [] };
  private loaded = false;
  private writeChain: Promise<void> = Promise.resolve();
  private readonly dbPath = DEFAULT_DB_PATH;

  private async ensureLoaded() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (useBlob()) {
        const data = await blobRead();
        if (data) this.db = { connectors: data.connectors ?? {}, credentials: data.credentials ?? {}, audit: data.audit ?? [] };
      } else {
        const content = await fs.readFile(this.dbPath, "utf-8");
        const parsed = JSON.parse(content) as MCPDatabaseShape;
        if (parsed) this.db = { connectors: parsed.connectors ?? {}, credentials: parsed.credentials ?? {}, audit: parsed.audit ?? [] };
      }
    } catch {
      this.db = { connectors: {}, credentials: {}, audit: [] };
    }
  }

  private queueWrite() {
    this.writeChain = this.writeChain.then(async () => {
      if (useBlob()) {
        await blobWrite(this.db);
      } else {
        await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
        await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2), "utf-8");
      }
    });
    return this.writeChain;
  }

  /* ─── Connectors ─── */

  async listConnectors(spaceId?: string): Promise<MCPConnector[]> {
    await this.ensureLoaded();
    const all = Object.values(this.db.connectors);
    const filtered = spaceId ? all.filter((c) => c.spaceId === spaceId) : all;
    return filtered.map((c) => clone(c));
  }

  async getConnector(connectorId: string): Promise<MCPConnector | null> {
    await this.ensureLoaded();
    const c = this.db.connectors[connectorId];
    return c ? clone(c) : null;
  }

  async upsertConnector(connector: MCPConnector): Promise<MCPConnector> {
    await this.ensureLoaded();
    this.db.connectors[connector.id] = clone(connector);
    await this.queueWrite();
    return clone(connector);
  }

  async deleteConnector(connectorId: string): Promise<void> {
    await this.ensureLoaded();
    delete this.db.connectors[connectorId];
    // Also delete associated credentials
    const credKey = Object.keys(this.db.credentials).find(
      (k) => this.db.credentials[k].connectorId === connectorId
    );
    if (credKey) delete this.db.credentials[credKey];
    await this.queueWrite();
  }

  async updateConnectorStatus(connectorId: string, status: MCPConnector["status"], error?: string): Promise<void> {
    await this.ensureLoaded();
    const c = this.db.connectors[connectorId];
    if (!c) return;
    c.status = status;
    c.error = error;
    c.lastHealthCheck = new Date().toISOString();
    await this.queueWrite();
  }

  async updateConnectorTools(connectorId: string, tools: MCPConnector["tools"]): Promise<void> {
    await this.ensureLoaded();
    const c = this.db.connectors[connectorId];
    if (!c) return;
    c.tools = tools;
    await this.queueWrite();
  }

  /* ─── Credentials (encrypted) ─── */

  async setCredentials(connectorId: string, spaceId: string, serverId: string, creds: Record<string, string>): Promise<void> {
    await this.ensureLoaded();
    const key = `${spaceId}:${serverId}:${connectorId}`;
    this.db.credentials[key] = {
      connectorId,
      spaceId,
      serverId,
      credentials: encrypt(JSON.stringify(creds)),
      updatedAt: Date.now(),
    };
    await this.queueWrite();
  }

  async getCredentials(connectorId: string, spaceId: string, serverId: string): Promise<Record<string, string> | null> {
    await this.ensureLoaded();
    const key = `${spaceId}:${serverId}:${connectorId}`;
    const record = this.db.credentials[key];
    if (!record) return null;
    try {
      return JSON.parse(decrypt(record.credentials)) as Record<string, string>;
    } catch {
      return null;
    }
  }

  async removeCredentials(connectorId: string, spaceId: string, serverId: string): Promise<void> {
    await this.ensureLoaded();
    const key = `${spaceId}:${serverId}:${connectorId}`;
    delete this.db.credentials[key];
    await this.queueWrite();
  }

  /* ─── Audit ─── */

  async addAuditEntry(entry: MCPAuditEntry): Promise<void> {
    await this.ensureLoaded();
    this.db.audit.push(entry);
    if (this.db.audit.length > MAX_AUDIT_ENTRIES) {
      this.db.audit = this.db.audit.slice(-MAX_AUDIT_ENTRIES);
    }
    await this.queueWrite();
  }

  async getAuditEntries(spaceId: string, limit = 50): Promise<MCPAuditEntry[]> {
    await this.ensureLoaded();
    return this.db.audit
      .filter((e) => e.spaceId === spaceId)
      .slice(-limit)
      .reverse();
  }

  async clearAudit(spaceId: string): Promise<void> {
    await this.ensureLoaded();
    this.db.audit = this.db.audit.filter((e) => e.spaceId !== spaceId);
    await this.queueWrite();
  }
}

/* ─── Singleton ─── */

const globalMcpStore = globalThis as typeof globalThis & { __origemMCPStore?: MCPStore };

export function getMCPStore(): MCPStore {
  if (!globalMcpStore.__origemMCPStore) {
    globalMcpStore.__origemMCPStore = new MCPStore();
  }
  return globalMcpStore.__origemMCPStore;
}
