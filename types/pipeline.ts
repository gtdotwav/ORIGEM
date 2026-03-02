export type PipelineStage =
  | "idle"
  | "intake"
  | "decomposing"
  | "routing"
  | "spawning"
  | "executing"
  | "branching"
  | "aggregating"
  | "complete"
  | "error";

export interface PipelineState {
  sessionId: string;
  stage: PipelineStage;
  progress: number;
  currentAgentId?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface PipelineEvent {
  type:
    | "stage_change"
    | "decomposition"
    | "routing"
    | "agent_spawned"
    | "agent_status"
    | "agent_output"
    | "group_complete"
    | "pipeline_complete"
    | "error";
  data: unknown;
  timestamp: number;
}
