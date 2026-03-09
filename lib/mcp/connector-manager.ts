import { connectMCP, disconnectMCP, discoverTools, callTool, isConnected } from "@/lib/mcp/client";
import { getMCPStore } from "@/lib/mcp/store";
import { getServerDefinition } from "@/config/mcp-registry";
import { DEFAULT_MCP_PERMISSION } from "@/types/mcp";
import type { MCPConnector, MCPToolSchema, MCPToolResult, MCPAuditEntry } from "@/types/mcp";

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Connector Manager                                       */
/*  High-level operations: install, uninstall, execute, health check   */
/* ------------------------------------------------------------------ */

function generateId(): string {
  return `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Install an MCP connector into a Space.
 * Creates the connector record, stores credentials, connects, and discovers tools.
 */
export async function installConnector(
  spaceId: string,
  serverId: string,
  credentials: Record<string, string>,
): Promise<MCPConnector> {
  const store = getMCPStore();
  const serverDef = getServerDefinition(serverId);

  if (!serverDef) {
    throw new Error(`Unknown MCP server: ${serverId}`);
  }

  // Validate required auth
  for (const req of serverDef.requiredAuth) {
    if (req.required && (!credentials[req.key] || credentials[req.key].trim() === "")) {
      throw new Error(`Missing required credential: ${req.label}`);
    }
  }

  const connectorId = generateId();

  const connector: MCPConnector = {
    id: connectorId,
    spaceId,
    serverId,
    serverName: serverDef.name,
    transport: serverDef.transport,
    url: serverDef.url,
    command: serverDef.command,
    args: serverDef.args,
    status: "connecting",
    tools: [],
    permissions: { ...DEFAULT_MCP_PERMISSION },
    installedAt: new Date().toISOString(),
    lastHealthCheck: null,
  };

  // Store credentials (encrypted)
  await store.setCredentials(connectorId, spaceId, serverId, credentials);

  // Save connector
  await store.upsertConnector(connector);

  // Connect and discover tools
  try {
    await connectMCP(connector, credentials);
    const tools = await discoverTools(connectorId);
    connector.tools = tools;
    connector.status = "connected";
    connector.lastHealthCheck = new Date().toISOString();
    await store.upsertConnector(connector);
    await store.updateConnectorTools(connectorId, tools);
  } catch (err) {
    connector.status = "error";
    connector.error = err instanceof Error ? err.message : "Connection failed";
    await store.upsertConnector(connector);
    throw err;
  }

  return connector;
}

/**
 * Uninstall a connector from a Space.
 */
export async function uninstallConnector(connectorId: string): Promise<void> {
  const store = getMCPStore();
  const connector = await store.getConnector(connectorId);
  if (!connector) return;

  await disconnectMCP(connectorId);
  await store.removeCredentials(connectorId, connector.spaceId, connector.serverId);
  await store.deleteConnector(connectorId);
}

/**
 * Execute a tool on a connector. Handles connection, permissions, audit.
 */
export async function executeTool(
  connectorId: string,
  toolName: string,
  args: Record<string, unknown>,
  context: { spaceId: string; sessionId: string; agentId?: string },
): Promise<MCPToolResult> {
  const store = getMCPStore();
  const connector = await store.getConnector(connectorId);

  if (!connector) {
    return {
      requestId: generateId(),
      status: "error",
      error: { code: "not_found", message: `Connector not found: ${connectorId}`, retryable: false },
      durationMs: 0,
    };
  }

  // Permission check
  if (connector.permissions.allowedTools !== "*") {
    if (!connector.permissions.allowedTools.includes(toolName)) {
      const result: MCPToolResult = {
        requestId: generateId(),
        status: "error",
        error: { code: "permission_denied", message: `Tool not allowed: ${toolName}`, retryable: false },
        durationMs: 0,
      };
      await logAudit(connector, toolName, "denied", 0, "Permission denied", context);
      return result;
    }
  }

  // Ensure connected
  if (!isConnected(connectorId)) {
    try {
      const creds = await store.getCredentials(connectorId, connector.spaceId, connector.serverId);
      await connectMCP(connector, creds ?? undefined);
      await store.updateConnectorStatus(connectorId, "connected");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reconnection failed";
      await store.updateConnectorStatus(connectorId, "error", message);
      return {
        requestId: generateId(),
        status: "error",
        error: { code: "connection_failed", message, retryable: true },
        durationMs: 0,
      };
    }
  }

  // Execute
  const result = await callTool(connectorId, toolName, args);

  // Audit
  const summary = result.status === "success"
    ? (result.content?.[0]?.text?.slice(0, 200) ?? "OK")
    : (result.error?.message ?? "Error");
  await logAudit(connector, toolName, result.status, result.durationMs, summary, context);

  return result;
}

/**
 * Refresh tool discovery for a connector.
 */
export async function refreshConnectorTools(connectorId: string): Promise<MCPToolSchema[]> {
  const store = getMCPStore();
  const connector = await store.getConnector(connectorId);
  if (!connector) throw new Error(`Connector not found: ${connectorId}`);

  if (!isConnected(connectorId)) {
    const creds = await store.getCredentials(connectorId, connector.spaceId, connector.serverId);
    await connectMCP(connector, creds ?? undefined);
  }

  const tools = await discoverTools(connectorId);
  await store.updateConnectorTools(connectorId, tools);
  return tools;
}

/**
 * Health check a connector.
 */
export async function healthCheck(connectorId: string): Promise<{ ok: boolean; error?: string }> {
  const store = getMCPStore();
  const connector = await store.getConnector(connectorId);
  if (!connector) return { ok: false, error: "Connector not found" };

  try {
    if (!isConnected(connectorId)) {
      const creds = await store.getCredentials(connectorId, connector.spaceId, connector.serverId);
      await connectMCP(connector, creds ?? undefined);
    }
    await discoverTools(connectorId);
    await store.updateConnectorStatus(connectorId, "connected");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed";
    await store.updateConnectorStatus(connectorId, "error", message);
    return { ok: false, error: message };
  }
}

/**
 * Get all tools available in a Space (from all connected MCPs).
 */
export async function getSpaceTools(spaceId: string): Promise<Array<MCPToolSchema & { connectorId: string; serverName: string }>> {
  const store = getMCPStore();
  const connectors = await store.listConnectors(spaceId);
  const tools: Array<MCPToolSchema & { connectorId: string; serverName: string }> = [];

  for (const c of connectors) {
    if (c.status !== "connected" && c.status !== "disconnected") continue;
    for (const t of c.tools) {
      const allowed = c.permissions.allowedTools === "*" || c.permissions.allowedTools.includes(t.name);
      if (allowed) {
        tools.push({ ...t, connectorId: c.id, serverName: c.serverName });
      }
    }
  }

  return tools;
}

/* ─── Internal ─── */

async function logAudit(
  connector: MCPConnector,
  toolName: string,
  status: MCPAuditEntry["status"],
  durationMs: number,
  summary: string,
  context: { spaceId: string; sessionId: string; agentId?: string },
) {
  const store = getMCPStore();
  await store.addAuditEntry({
    id: generateId(),
    timestamp: new Date().toISOString(),
    spaceId: context.spaceId,
    sessionId: context.sessionId,
    agentId: context.agentId,
    connectorId: connector.id,
    serverId: connector.serverId,
    toolName,
    status,
    durationMs,
    resultSummary: summary.slice(0, 300),
  });
}
