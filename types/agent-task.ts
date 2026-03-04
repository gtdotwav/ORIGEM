export type AgentPersonaColor =
  | "cyan"
  | "purple"
  | "green"
  | "orange"
  | "pink"
  | "blue";

export interface AgentPersona {
  id: string;
  name: string;
  emoji: string;
  role: string;
  color: AgentPersonaColor;
  specialties: string[];
}

export type AgentTaskStatus =
  | "waiting"
  | "thinking"
  | "active"
  | "done"
  | "error";

export interface AgentSubtask {
  id: string;
  label: string;
  status: "pending" | "running" | "done";
  detail?: string;
  progress: number;
  timestamp: number;
}

export interface AgentTaskCard {
  id: string;
  personaId: string;
  status: AgentTaskStatus;
  subtasks: AgentSubtask[];
  startedAt?: number;
  completedAt?: number;
}
