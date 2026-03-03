export type RuntimeLanguage = "pt-BR" | "en-US" | "es-ES";

export type RuntimeFunctionKey =
  | "contexts"
  | "projects"
  | "agents"
  | "groups"
  | "aggregation";

export type RuntimeTaskStatus = "pending" | "running" | "done" | "blocked";

export interface RuntimeTask {
  id: string;
  title: string;
  functionKey: RuntimeFunctionKey;
  agentId: string;
  agentName: string;
  priority: number;
  status: RuntimeTaskStatus;
  progress: number;
  notes: string[];
}

export interface RuntimeNote {
  id: string;
  text: string;
  createdAt: number;
  taskId?: string;
}

export interface SessionRuntime {
  sessionId: string;
  runId: string | null;
  language: RuntimeLanguage;
  distributionReady: boolean;
  isRunning: boolean;
  tasks: RuntimeTask[];
  notes: RuntimeNote[];
  overallProgress: number;
  updatedAt: number;
}
