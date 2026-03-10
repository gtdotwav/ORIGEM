import { promises as fs } from "node:fs";
import path from "node:path";
import {
  assertEncryptionReady,
  decrypt,
  encrypt,
} from "@/lib/server/crypto";
import type {
  MCPConnector,
  MCPAuditEntry,
  MCPCredentialRecord,
  MCPDatabaseShape,
} from "@/types/mcp";

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Store — persists connectors, credentials, audit log     */
/*  Same pattern as SnapshotStore — file-based or Vercel Blob          */
/* ------------------------------------------------------------------ */

const DEFAULT_DB_PATH = path.join(process.cwd(), ".data", "origem-mcp.json");
const BLOB_KEY = "origem-mcp.json";
const MAX_AUDIT_ENTRIES = 1000;
const MAX_BLOB_WRITE_RETRIES = 3;

function createEmptyDb(): MCPDatabaseShape {
  return { connectors: {}, credentials: {}, audit: [] };
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

function getWorkspaceScopeId(value: {
  workspaceId?: string;
  spaceId?: string;
}): string {
  return value.workspaceId ?? value.spaceId ?? "";
}

function normalizeConnector(connector: MCPConnector): MCPConnector {
  const workspaceId = getWorkspaceScopeId(connector);
  return {
    ...connector,
    workspaceId,
  };
}

function normalizeCredentialRecord(record: MCPCredentialRecord): MCPCredentialRecord {
  const workspaceId = getWorkspaceScopeId(record);
  return {
    ...record,
    workspaceId,
  };
}

function normalizeAuditEntry(entry: MCPAuditEntry): MCPAuditEntry {
  const workspaceId = getWorkspaceScopeId(entry);
  return {
    ...entry,
    workspaceId,
  };
}

function normalizeDatabaseShape(db: MCPDatabaseShape): MCPDatabaseShape {
  const connectors = Object.fromEntries(
    Object.entries(db.connectors ?? {}).map(([id, connector]) => [
      id,
      normalizeConnector(connector),
    ]),
  ) as Record<string, MCPConnector>;

  const credentials = Object.fromEntries(
    Object.values(db.credentials ?? {}).map((record) => {
      const normalized = normalizeCredentialRecord(record);
      const key = `${normalized.workspaceId}:${normalized.serverId}:${normalized.connectorId}`;
      return [key, normalized];
    }),
  ) as Record<string, MCPCredentialRecord>;

  const audit = (db.audit ?? []).map((entry) => normalizeAuditEntry(entry));

  return { connectors, credentials, audit };
}

function getConnectorActivityTs(connector: MCPConnector) {
  const lastHealthCheck = connector.lastHealthCheck
    ? Date.parse(connector.lastHealthCheck)
    : Number.NaN;
  if (Number.isFinite(lastHealthCheck)) {
    return lastHealthCheck;
  }

  const installedAt = Date.parse(connector.installedAt);
  return Number.isFinite(installedAt) ? installedAt : 0;
}

function mergeConnectors(
  remote: MCPConnector,
  local: MCPConnector
): MCPConnector {
  const remoteTs = getConnectorActivityTs(remote);
  const localTs = getConnectorActivityTs(local);
  const preferred = localTs >= remoteTs ? local : remote;
  const secondary = preferred === local ? remote : local;

  return {
    ...secondary,
    ...preferred,
    tools:
      preferred.tools.length >= secondary.tools.length
        ? preferred.tools
        : secondary.tools,
    error: preferred.error ?? secondary.error,
    lastHealthCheck: preferred.lastHealthCheck ?? secondary.lastHealthCheck,
  };
}

function mergeMcpDatabases(
  remote: MCPDatabaseShape,
  local: MCPDatabaseShape
): MCPDatabaseShape {
  const connectors = { ...remote.connectors };
  for (const [id, connector] of Object.entries(local.connectors ?? {})) {
    const existing = connectors[id];
    connectors[id] = existing ? mergeConnectors(existing, connector) : connector;
  }

  const credentials = { ...remote.credentials };
  for (const [id, record] of Object.entries(local.credentials ?? {})) {
    const existing = credentials[id];
    if (!existing || record.updatedAt >= existing.updatedAt) {
      credentials[id] = record;
    }
  }

  const auditMap = new Map<string, MCPAuditEntry>();
  for (const entry of [...remote.audit, ...local.audit]) {
    auditMap.set(entry.id, entry);
  }
  const audit = [...auditMap.values()]
    .sort(
      (a, b) =>
        Date.parse(a.timestamp) - Date.parse(b.timestamp)
    )
    .slice(-MAX_AUDIT_ENTRIES);

  return { connectors, credentials, audit };
}

async function blobRead(): Promise<{
  data: MCPDatabaseShape | null;
  etag: string | null;
}> {
  const { get } = await import("@vercel/blob");
  const result = await get(BLOB_KEY, { access: "private", useCache: false });

  if (!result || result.statusCode !== 200) {
    return { data: null, etag: null };
  }

  const content = await new Response(result.stream).text();
  return {
    data: JSON.parse(content) as MCPDatabaseShape,
    etag: result.blob.etag,
  };
}

async function blobWrite(db: MCPDatabaseShape, etag: string | null): Promise<string> {
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

class MCPStore {
  private db: MCPDatabaseShape = createEmptyDb();
  private blobEtag: string | null = null;
  private loaded = false;
  private writeChain: Promise<void> = Promise.resolve();
  private readonly dbPath = DEFAULT_DB_PATH;

  private async ensureLoaded() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (shouldUseBlobStorage()) {
        const { data, etag } = await blobRead();
        this.blobEtag = etag;
        if (data) this.db = normalizeDatabaseShape(data);
      } else {
        const content = await fs.readFile(this.dbPath, "utf-8");
        const parsed = JSON.parse(content) as MCPDatabaseShape;
        if (parsed) this.db = normalizeDatabaseShape(parsed);
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
        this.db = mergeMcpDatabases(data ?? createEmptyDb(), this.db);
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

  /* ─── Connectors ─── */

  async listConnectors(workspaceId?: string): Promise<MCPConnector[]> {
    await this.ensureLoaded();
    const all = Object.values(this.db.connectors);
    const filtered = workspaceId
      ? all.filter((connector) => connector.workspaceId === workspaceId)
      : all;
    return filtered.map((c) => clone(c));
  }

  async getConnector(connectorId: string): Promise<MCPConnector | null> {
    await this.ensureLoaded();
    const c = this.db.connectors[connectorId];
    return c ? clone(c) : null;
  }

  async upsertConnector(connector: MCPConnector): Promise<MCPConnector> {
    await this.ensureLoaded();
    this.db.connectors[connector.id] = normalizeConnector(clone(connector));
    await this.queueWrite();
    return clone(this.db.connectors[connector.id]);
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

  async setCredentials(connectorId: string, workspaceId: string, serverId: string, creds: Record<string, string>): Promise<void> {
    await this.ensureLoaded();
    assertEncryptionReady("persist MCP credentials");
    const key = `${workspaceId}:${serverId}:${connectorId}`;
    this.db.credentials[key] = {
      connectorId,
      workspaceId,
      serverId,
      credentials: encrypt(JSON.stringify(creds)),
      updatedAt: Date.now(),
    };
    await this.queueWrite();
  }

  async getCredentials(connectorId: string, workspaceId: string, serverId: string): Promise<Record<string, string> | null> {
    await this.ensureLoaded();
    const key = `${workspaceId}:${serverId}:${connectorId}`;
    const record = this.db.credentials[key];
    if (!record) return null;
    try {
      return JSON.parse(decrypt(record.credentials)) as Record<string, string>;
    } catch {
      return null;
    }
  }

  async removeCredentials(connectorId: string, workspaceId: string, serverId: string): Promise<void> {
    await this.ensureLoaded();
    const key = `${workspaceId}:${serverId}:${connectorId}`;
    delete this.db.credentials[key];
    await this.queueWrite();
  }

  /* ─── Audit ─── */

  async addAuditEntry(entry: MCPAuditEntry): Promise<void> {
    await this.ensureLoaded();
    this.db.audit.push(normalizeAuditEntry(entry));
    if (this.db.audit.length > MAX_AUDIT_ENTRIES) {
      this.db.audit = this.db.audit.slice(-MAX_AUDIT_ENTRIES);
    }
    await this.queueWrite();
  }

  async getAuditEntries(workspaceId: string, limit = 50): Promise<MCPAuditEntry[]> {
    await this.ensureLoaded();
    return this.db.audit
      .filter((entry) => entry.workspaceId === workspaceId)
      .slice(-limit)
      .reverse();
  }

  async clearAudit(workspaceId: string): Promise<void> {
    await this.ensureLoaded();
    this.db.audit = this.db.audit.filter((entry) => entry.workspaceId !== workspaceId);
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
