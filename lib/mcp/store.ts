
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uzqzetbcynoiptmnufxv.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0ljR9h3-FUMUuKHGA9EVQA_qHgeCn0n";

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase error: ${res.statusText} - ${text}`);
  }
  
  if (res.status === 204) return null;
  return res.json();
}

class MCPStore {
  /* ─── Connectors ─── */
  async listConnectors(workspaceId?: string): Promise<MCPConnector[]> {
    const endpoint = workspaceId 
      ? `mcp_connectors?workspace_id=eq.${encodeURIComponent(workspaceId)}` 
      : "mcp_connectors";
    
    const data = await supabaseFetch(endpoint);
    return (data || []).map((row: any) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      serverId: row.server_id,
      serverName: row.name,
      transport: "stdio",
      status: row.status as MCPConnector["status"],
      error: row.error,
      tools: row.tools || [],
      permissions: { allowedTools: "*", maxCallsPerMinute: 30, requireApproval: false },
      installedAt: row.installed_at,
      lastHealthCheck: row.last_health_check,
    }));
  }

  async getConnector(connectorId: string): Promise<MCPConnector | null> {
    const data = await supabaseFetch(`mcp_connectors?id=eq.${encodeURIComponent(connectorId)}&select=*`);
    if (!data || data.length === 0) return null;
    const row = data[0];
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      serverId: row.server_id,
      serverName: row.name,
      transport: "stdio",
      status: row.status as MCPConnector["status"],
      error: row.error,
      tools: row.tools || [],
      permissions: { allowedTools: "*", maxCallsPerMinute: 30, requireApproval: false },
      installedAt: row.installed_at,
      lastHealthCheck: row.last_health_check,
    };
  }

  async upsertConnector(connector: MCPConnector): Promise<MCPConnector> {
    const nextRecord = {
      id: connector.id,
      workspace_id: connector.workspaceId || "",
      server_id: connector.serverId || "",
      name: connector.serverName,
      status: connector.status,
      error: connector.error,
      tools: connector.tools || [],
      installed_at: connector.installedAt,
      last_health_check: connector.lastHealthCheck,
    };

    await supabaseFetch("mcp_connectors", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify([nextRecord]),
    });
    return connector;
  }

  async deleteConnector(connectorId: string): Promise<void> {
    await supabaseFetch(`mcp_connectors?id=eq.${encodeURIComponent(connectorId)}`, { method: "DELETE" });
    await supabaseFetch(`mcp_credentials?connector_id=eq.${encodeURIComponent(connectorId)}`, { method: "DELETE" });
  }

  async updateConnectorStatus(connectorId: string, status: MCPConnector["status"], error?: string): Promise<void> {
    await supabaseFetch(`mcp_connectors?id=eq.${encodeURIComponent(connectorId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status, error: error || null, last_health_check: new Date().toISOString() }),
    });
  }

  async updateConnectorTools(connectorId: string, tools: MCPConnector["tools"]): Promise<void> {
    await supabaseFetch(`mcp_connectors?id=eq.${encodeURIComponent(connectorId)}`, {
      method: "PATCH",
      body: JSON.stringify({ tools: tools || [] }),
    });
  }

  /* ─── Credentials (encrypted) ─── */
  async setCredentials(connectorId: string, workspaceId: string, serverId: string, creds: Record<string, string>): Promise<void> {
    assertEncryptionReady("persist MCP credentials");
    const id = `${workspaceId}:${serverId}:${connectorId}`;
    const nextRecord = {
      id,
      workspace_id: workspaceId,
      server_id: serverId,
      connector_id: connectorId,
      credentials: encrypt(JSON.stringify(creds)),
      updated_at: Date.now(),
    };

    await supabaseFetch("mcp_credentials", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify([nextRecord]),
    });
  }

  async getCredentials(connectorId: string, workspaceId: string, serverId: string): Promise<Record<string, string> | null> {
    const id = `${workspaceId}:${serverId}:${connectorId}`;
    const data = await supabaseFetch(`mcp_credentials?id=eq.${encodeURIComponent(id)}&select=credentials`);
    if (!data || data.length === 0) return null;
    try {
      return JSON.parse(decrypt(data[0].credentials)) as Record<string, string>;
    } catch {
      return null;
    }
  }

  async removeCredentials(connectorId: string, workspaceId: string, serverId: string): Promise<void> {
    const id = `${workspaceId}:${serverId}:${connectorId}`;
    await supabaseFetch(`mcp_credentials?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  /* ─── Audit ─── */
  async addAuditEntry(entry: MCPAuditEntry): Promise<void> {
    const nextRecord = {
      id: entry.id,
      workspace_id: entry.workspaceId || "",
      connector_id: entry.connectorId,
      tool_name: entry.toolName,
      timestamp: entry.timestamp,
      success: entry.status === "success",
      error: entry.resultSummary,
      duration_ms: entry.durationMs,
    };

    await supabaseFetch("mcp_audit", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify([nextRecord]),
    });
  }

  async getAuditEntries(workspaceId: string, limit = 50): Promise<MCPAuditEntry[]> {
    const data = await supabaseFetch(
      `mcp_audit?workspace_id=eq.${encodeURIComponent(workspaceId)}&order=timestamp.desc&limit=${limit}`
    );
    
    return (data || []).map((row: any) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      sessionId: "",
      serverId: "",
      connectorId: row.connector_id,
      toolName: row.tool_name,
      timestamp: row.timestamp,
      status: row.success ? "success" : "error",
      resultSummary: row.error || "",
      durationMs: row.duration_ms,
    }));
  }

  async clearAudit(workspaceId: string): Promise<void> {
    await supabaseFetch(`mcp_audit?workspace_id=eq.${encodeURIComponent(workspaceId)}`, { method: "DELETE" });
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
