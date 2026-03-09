import type { WorkspaceColor, WorkspaceIcon } from "@/types/workspace";

export type ProjectPriority = "low" | "medium" | "high" | "critical";

export interface ProjectGoal {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface ProjectNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: WorkspaceColor;
  icon: WorkspaceIcon;
  workspaceId: string;
  status: "active" | "archived";
  priority: ProjectPriority;
  tags: string[];
  deadline: string | null;
  goals: ProjectGoal[];
  notes: ProjectNote[];
  createdAt: string;
  updatedAt: string;
}
