import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Workspace } from "@/types/workspace";
import { useSessionStore } from "@/stores/session-store";
import { useProjectStore } from "@/stores/project-store";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;

  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  archiveWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string | null) => void;
  getWorkspace: (id: string) => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, get) => ({
        workspaces: [],
        activeWorkspaceId: null,

        addWorkspace: (workspace) =>
          set((s) => ({ workspaces: [workspace, ...s.workspaces] })),

        updateWorkspace: (id, updates) =>
          set((s) => ({
            workspaces: s.workspaces.map((w) =>
              w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w
            ),
          })),

        removeWorkspace: (id) => {
          set((s) => ({
            workspaces: s.workspaces.filter((w) => w.id !== id),
            activeWorkspaceId:
              s.activeWorkspaceId === id ? null : s.activeWorkspaceId,
          }));
          const { sessions, updateSession } = useSessionStore.getState();
          for (const session of sessions) {
            if (session.workspaceId === id) {
              updateSession(session.id, { workspaceId: undefined, projectId: undefined });
            }
          }
          const { projects, removeProject } = useProjectStore.getState();
          for (const project of projects) {
            if (project.workspaceId === id) {
              removeProject(project.id);
            }
          }
        },

        archiveWorkspace: (id) =>
          set((s) => ({
            workspaces: s.workspaces.map((w) =>
              w.id === id
                ? { ...w, status: "archived" as const, updatedAt: new Date() }
                : w
            ),
            activeWorkspaceId:
              s.activeWorkspaceId === id ? null : s.activeWorkspaceId,
          })),

        setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

        getWorkspace: (id) => get().workspaces.find((w) => w.id === id),
      }),
      {
        name: "origem-workspaces",
        partialize: (state) => ({
          workspaces: state.workspaces,
          activeWorkspaceId: state.activeWorkspaceId,
        }),
      }
    ),
    { name: "workspace-store" }
  )
);
