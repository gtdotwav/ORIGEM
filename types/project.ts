import type { WorkspaceColor, WorkspaceIcon } from "@/types/workspace";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: WorkspaceColor;
  icon: WorkspaceIcon;
  workspaceId: string;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
