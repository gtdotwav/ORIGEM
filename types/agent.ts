import type { ProviderName } from "./provider";

export type AgentStatus = "idle" | "thinking" | "working" | "done" | "error";

export type OutputType =
  | "text"
  | "code"
  | "html"
  | "image"
  | "thought"
  | "spawn";

export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  systemPromptTemplate: string;
  preferredProvider: ProviderName;
  preferredModel: string;
  capabilities: string[];
  outputTypes: OutputType[];
  canSpawnAgents: boolean;
}

export interface AgentInstance {
  id: string;
  sessionId: string;
  templateId: string;
  name: string;
  role: string;
  status: AgentStatus;
  provider: ProviderName;
  model: string;
  systemPrompt: string;
  groupId?: string;
  canvasNodeId?: string;
  config?: Record<string, unknown>;
  outputs: AgentOutput[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentOutput {
  id: string;
  agentId: string;
  sessionId: string;
  type: OutputType;
  content: string;
  metadata?: Record<string, unknown>;
  canvasNodeId?: string;
  parentOutputId?: string;
  createdAt: Date;
}

export interface AgentGroup {
  id: string;
  sessionId: string;
  name: string;
  strategy: "parallel" | "sequential" | "consensus";
  agentIds: string[];
  canvasNodeId?: string;
  createdAt: Date;
}
