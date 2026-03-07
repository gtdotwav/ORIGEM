import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Project } from "@/types/project";
import { useSessionStore } from "@/stores/session-store";

interface ProjectState {
  projects: Project[];

  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  archiveProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  getProjectsByWorkspace: (workspaceId: string) => Project[];
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        projects: [],

        addProject: (project) =>
          set((s) => ({ projects: [project, ...s.projects] })),

        updateProject: (id, updates) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
            ),
          })),

        removeProject: (id) => {
          set((s) => ({
            projects: s.projects.filter((p) => p.id !== id),
          }));
          const { sessions, updateSession } = useSessionStore.getState();
          for (const session of sessions) {
            if (session.projectId === id) {
              updateSession(session.id, { projectId: undefined });
            }
          }
        },

        archiveProject: (id) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === id
                ? { ...p, status: "archived" as const, updatedAt: new Date().toISOString() }
                : p
            ),
          })),

        getProject: (id) => get().projects.find((p) => p.id === id),

        getProjectsByWorkspace: (workspaceId) =>
          get().projects.filter((p) => p.workspaceId === workspaceId),
      }),
      {
        name: "origem-projects",
        partialize: (state) => ({ projects: state.projects }),
      }
    ),
    { name: "project-store" }
  )
);
