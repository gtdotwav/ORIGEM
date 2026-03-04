export interface Session {
  id: string;
  title: string;
  status: "active" | "completed" | "archived";
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "system" | "assistant" | "agent";
  content: string;
  agentId?: string;
  decompositionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
