import type { Node, Edge } from "@xyflow/react";

export type OrigemNodeType =
  | "input"
  | "context"
  | "agent"
  | "output"
  | "preview"
  | "image"
  | "thought"
  | "spawn"
  | "group"
  | "chat-session";

export type OrigemEdgeType = "flow" | "branch" | "group" | "spawn" | "smoothstep";

export interface InputNodeData {
  type: "input";
  text: string;
  sessionId: string;
  [key: string]: unknown;
}

export interface ContextNodeData {
  type: "context";
  decompositionId: string;
  tokenCount: number;
  primaryIntent: string;
  complexity: number;
  sentiment: number;
  [key: string]: unknown;
}

export interface AgentNodeData {
  type: "agent";
  agentId: string;
  name: string;
  role: string;
  templateId: string;
  status: "idle" | "thinking" | "working" | "done" | "error";
  accentColor: string;
  icon: string;
  provider: string;
  model: string;
  outputCount: number;
  progress?: number;
  [key: string]: unknown;
}

export interface OutputNodeData {
  type: "output";
  outputId: string;
  outputType: "text" | "code" | "html" | "image" | "thought" | "spawn";
  preview: string;
  language?: string;
  [key: string]: unknown;
}

export interface GroupNodeData {
  type: "group";
  groupId: string;
  name: string;
  agentCount: number;
  strategy: string;
  [key: string]: unknown;
}

export interface ChatSessionNodeData {
  type: "chat-session";
  sessionId: string;
  title: string;
  messageCount: number;
  status: "active" | "completed" | "archived";
  lastUpdated: string;
  [key: string]: unknown;
}

export type OrigemNodeData =
  | InputNodeData
  | ContextNodeData
  | AgentNodeData
  | OutputNodeData
  | GroupNodeData
  | ChatSessionNodeData;

export type OrigemNode = Node<OrigemNodeData>;
export type OrigemEdge = Edge & { type?: OrigemEdgeType };

export interface SerializedCanvasState {
  nodes: OrigemNode[];
  edges: OrigemEdge[];
  viewport: { x: number; y: number; zoom: number };
}
