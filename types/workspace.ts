export type WorkspaceColor =
  | "cyan"
  | "purple"
  | "green"
  | "orange"
  | "pink"
  | "blue";

export type WorkspaceIcon =
  | "folder"
  | "rocket"
  | "zap"
  | "star"
  | "target"
  | "globe"
  | "code"
  | "layers";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: WorkspaceColor;
  icon: WorkspaceIcon;
  status: "active" | "archived";
  /** MCP connector IDs installed in this Workspace */
  mcpConnectorIds?: string[];
  createdAt: string;
  updatedAt: string;
}
