import type { DecompositionResult } from "@/types/decomposition";
import type { Session, Message } from "@/types/session";
import type { SessionRuntime } from "@/types/runtime";
import type { AgentInstance, AgentGroup } from "@/types/agent";
import type { PipelineEvent, PipelineStage } from "@/types/pipeline";
import type { ProviderName } from "@/types/provider";

export interface PipelineSnapshot {
  stage: PipelineStage;
  progress: number;
  events: PipelineEvent[];
  error: string | null;
  startedAt: number | null;
  completedAt: number | null;
}

export interface SessionSnapshot {
  session: Session;
  messages: Message[];
  runtime: SessionRuntime;
  agents: AgentInstance[];
  groups: AgentGroup[];
  decompositions: Record<string, DecompositionResult>;
  pipeline: PipelineSnapshot;
}

export interface SessionSnapshotRecord {
  sessionId: string;
  version: number;
  snapshot: SessionSnapshot;
  updatedAt: number;
}

export interface ProviderSecretRecord {
  provider: ProviderName;
  apiKey: string;
  selectedModel: string;
  updatedAt: number;
}

export interface BackendDatabaseShape {
  records: Record<string, SessionSnapshotRecord>;
  providers: Partial<Record<ProviderName, ProviderSecretRecord>>;
}
