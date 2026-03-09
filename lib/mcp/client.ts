import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { MCPConnector, MCPToolSchema, MCPToolResult } from "@/types/mcp";

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Client — wraps @modelcontextprotocol/sdk                */
/* ------------------------------------------------------------------ */

interface MCPClientEntry {
  client: Client;
  transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport;
  connectorId: string;
  tools: MCPToolSchema[];
  connectedAt: number;
}

const clientPool = new Map<string, MCPClientEntry>();

/**
 * Connect to an MCP server and return the Client instance.
 * Reuses existing connections from the pool.
 */
export async function connectMCP(connector: MCPConnector, env?: Record<string, string>): Promise<MCPClientEntry> {
  const existing = clientPool.get(connector.id);
  if (existing) return existing;

  const client = new Client(
    { name: "origem-platform", version: "1.0.0" },
  );

  let transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport;

  switch (connector.transport) {
    case "stdio": {
      if (!connector.command) throw new Error(`MCP connector ${connector.id}: stdio requires command`);
      transport = new StdioClientTransport({
        command: connector.command,
        args: connector.args ?? [],
        env: { ...process.env, ...env } as Record<string, string>,
      });
      break;
    }
    case "sse": {
      if (!connector.url) throw new Error(`MCP connector ${connector.id}: SSE requires url`);
      transport = new SSEClientTransport(new URL(connector.url));
      break;
    }
    case "streamable-http": {
      if (!connector.url) throw new Error(`MCP connector ${connector.id}: HTTP requires url`);
      transport = new StreamableHTTPClientTransport(new URL(connector.url));
      break;
    }
    default:
      throw new Error(`Unknown MCP transport: ${connector.transport}`);
  }

  await client.connect(transport);

  const entry: MCPClientEntry = {
    client,
    transport,
    connectorId: connector.id,
    tools: [],
    connectedAt: Date.now(),
  };

  clientPool.set(connector.id, entry);
  return entry;
}

/**
 * Disconnect and remove from pool.
 */
export async function disconnectMCP(connectorId: string): Promise<void> {
  const entry = clientPool.get(connectorId);
  if (!entry) return;

  try {
    await entry.client.close();
  } catch {
    // ignore close errors
  }

  clientPool.delete(connectorId);
}

/**
 * Discover tools from a connected MCP server.
 */
export async function discoverTools(connectorId: string): Promise<MCPToolSchema[]> {
  const entry = clientPool.get(connectorId);
  if (!entry) throw new Error(`MCP client not connected: ${connectorId}`);

  const result = await entry.client.listTools();

  const tools: MCPToolSchema[] = (result.tools ?? []).map((t) => ({
    name: t.name,
    description: t.description ?? "",
    inputSchema: (t.inputSchema ?? {}) as Record<string, unknown>,
  }));

  entry.tools = tools;
  return tools;
}

/**
 * Execute a tool call on a connected MCP server.
 */
export async function callTool(
  connectorId: string,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs = 30_000,
): Promise<MCPToolResult> {
  const requestId = `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();

  const entry = clientPool.get(connectorId);
  if (!entry) {
    return {
      requestId,
      status: "error",
      error: { code: "not_connected", message: `MCP client not connected: ${connectorId}`, retryable: true },
      durationMs: Date.now() - start,
    };
  }

  try {
    const result = await Promise.race([
      entry.client.callTool({ name: toolName, arguments: args }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("MCP_TIMEOUT")), timeoutMs),
      ),
    ]);

    const content = (result.content as Array<{ type: string; text?: string; data?: string; mimeType?: string }>) ?? [];

    return {
      requestId,
      status: result.isError ? "error" : "success",
      content: content.map((c) => ({
        type: (c.type === "text" ? "text" : c.type === "image" ? "image" : "resource") as "text" | "image" | "resource",
        text: c.text,
        data: c.data,
        mimeType: c.mimeType,
      })),
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = message === "MCP_TIMEOUT";

    return {
      requestId,
      status: isTimeout ? "timeout" : "error",
      error: {
        code: isTimeout ? "timeout" : "tool_error",
        message,
        retryable: isTimeout,
      },
      durationMs: Date.now() - start,
    };
  }
}

/**
 * List resources from a connected MCP server.
 */
export async function listResources(connectorId: string) {
  const entry = clientPool.get(connectorId);
  if (!entry) throw new Error(`MCP client not connected: ${connectorId}`);
  return entry.client.listResources();
}

/**
 * Read a resource from a connected MCP server.
 */
export async function readResource(connectorId: string, uri: string) {
  const entry = clientPool.get(connectorId);
  if (!entry) throw new Error(`MCP client not connected: ${connectorId}`);
  return entry.client.readResource({ uri });
}

/**
 * Get a connected client entry from the pool.
 */
export function getClientEntry(connectorId: string): MCPClientEntry | undefined {
  return clientPool.get(connectorId);
}

/**
 * Check if a client is currently connected.
 */
export function isConnected(connectorId: string): boolean {
  return clientPool.has(connectorId);
}

/**
 * Get all connected client IDs.
 */
export function getConnectedIds(): string[] {
  return Array.from(clientPool.keys());
}
