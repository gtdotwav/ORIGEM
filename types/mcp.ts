/* ------------------------------------------------------------------ */
/*  ORIGEM MCP — Type definitions                                      */
/* ------------------------------------------------------------------ */

export type MCPTransport = "stdio" | "sse" | "streamable-http";

export type MCPServerCategory =
  | "data"
  | "commerce"
  | "dev"
  | "comms"
  | "media"
  | "productivity"
  | "custom";

export type MCPConnectorStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error";

export type MCPServerTrust = "official" | "partner" | "community";

/* ─── Auth ─── */

export interface MCPAuthRequirement {
  key: string;
  label: string;
  type: "api_key" | "oauth2" | "token" | "url";
  description: string;
  placeholder?: string;
  required: boolean;
}

/* ─── Server Definition (catalog/registry) ─── */

export interface MCPServerDefinition {
  id: string;
  name: string;
  description: string;
  category: MCPServerCategory;
  transport: MCPTransport;
  command?: string;
  args?: string[];
  url?: string;
  requiredAuth: MCPAuthRequirement[];
  icon: string;
  trust: MCPServerTrust;
  documentationUrl?: string;
}

/* ─── Discovered Tool (from tools/list) ─── */

export interface MCPToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/* ─── Connector (installed in a Workspace) ─── */

export interface MCPConnector {
  id: string;
  workspaceId: string;
  /** @deprecated legacy persisted field */
  spaceId?: string;
  serverId: string;
  serverName: string;
  transport: MCPTransport;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  status: MCPConnectorStatus;
  tools: MCPToolSchema[];
  permissions: MCPPermission;
  installedAt: string;
  lastHealthCheck: string | null;
  error?: string;
}

/* ─── Permissions ─── */

export interface MCPPermission {
  allowedTools: string[] | "*";
  maxCallsPerMinute: number;
  requireApproval: boolean;
}

export const DEFAULT_MCP_PERMISSION: MCPPermission = {
  allowedTools: "*",
  maxCallsPerMinute: 30,
  requireApproval: false,
};

/* ─── Tool Execution ─── */

export interface MCPToolRequest {
  requestId: string;
  workspaceId: string;
  /** @deprecated legacy request field */
  spaceId?: string;
  sessionId: string;
  agentId?: string;
  connectorId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  timeout?: number;
}

export interface MCPToolResult {
  requestId: string;
  status: "success" | "error" | "timeout";
  content?: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  durationMs: number;
}

/* ─── Audit ─── */

export interface MCPAuditEntry {
  id: string;
  timestamp: string;
  workspaceId: string;
  /** @deprecated legacy persisted field */
  spaceId?: string;
  sessionId: string;
  agentId?: string;
  connectorId: string;
  serverId: string;
  toolName: string;
  status: "success" | "error" | "timeout" | "denied";
  durationMs: number;
  resultSummary: string;
}

/* ─── Credential Storage ─── */

export interface MCPCredentialRecord {
  connectorId: string;
  workspaceId: string;
  /** @deprecated legacy persisted field */
  spaceId?: string;
  serverId: string;
  credentials: string; // encrypted JSON
  updatedAt: number;
}

/* ─── Database extension ─── */

export interface MCPDatabaseShape {
  connectors: Record<string, MCPConnector>;
  credentials: Record<string, MCPCredentialRecord>;
  audit: MCPAuditEntry[];
}
