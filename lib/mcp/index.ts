/* ------------------------------------------------------------------ */
/*  ORIGEM MCP — Public API                                            */
/* ------------------------------------------------------------------ */

// Client
export {
  connectMCP,
  disconnectMCP,
  discoverTools,
  callTool,
  listResources,
  readResource,
  isConnected,
  getConnectedIds,
} from "./client";

// Connector Manager (high-level)
export {
  installConnector,
  uninstallConnector,
  executeTool,
  refreshConnectorTools,
  healthCheck,
  getSpaceTools,
} from "./connector-manager";

// Tool Adapter
export {
  mcpToolToAITool,
  mcpToolsToAITools,
  parseMCPToolCall,
  isMCPToolCall,
} from "./tool-adapter";

// Tool Executor (enhanced generateText with MCP loop)
export { executeWithTools } from "./tool-executor";

// Store
export { getMCPStore } from "./store";
