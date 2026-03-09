import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Project, ProjectGoal, ProjectNote } from "@/types/project";
import { useSessionStore } from "@/stores/session-store";

interface ProjectState {
  projects: Project[];

  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  archiveProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  getProjectsByWorkspace: (workspaceId: string) => Project[];

  // Goals
  addGoal: (projectId: string, goal: ProjectGoal) => void;
  toggleGoal: (projectId: string, goalId: string) => void;
  removeGoal: (projectId: string, goalId: string) => void;

  // Notes
  addNote: (projectId: string, note: ProjectNote) => void;
  updateNote: (projectId: string, noteId: string, content: string) => void;
  removeNote: (projectId: string, noteId: string) => void;

  // Tags
  addTag: (projectId: string, tag: string) => void;
  removeTag: (projectId: string, tag: string) => void;
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

        // Goals
        addGoal: (projectId, goal) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId
                ? { ...p, goals: [...(p.goals ?? []), goal], updatedAt: new Date().toISOString() }
                : p
            ),
          })),

        toggleGoal: (projectId, goalId) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    goals: (p.goals ?? []).map((g) =>
                      g.id === goalId ? { ...g, done: !g.done } : g
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),

        removeGoal: (projectId, goalId) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    goals: (p.goals ?? []).filter((g) => g.id !== goalId),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),

        // Notes
        addNote: (projectId, note) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId
                ? { ...p, notes: [...(p.notes ?? []), note], updatedAt: new Date().toISOString() }
                : p
            ),
          })),

        updateNote: (projectId, noteId, content) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    notes: (p.notes ?? []).map((n) =>
                      n.id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),

        removeNote: (projectId, noteId) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    notes: (p.notes ?? []).filter((n) => n.id !== noteId),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),

        // Tags
        addTag: (projectId, tag) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId && !(p.tags ?? []).includes(tag)
                ? { ...p, tags: [...(p.tags ?? []), tag], updatedAt: new Date().toISOString() }
                : p
            ),
          })),

        removeTag: (projectId, tag) =>
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    tags: (p.tags ?? []).filter((t) => t !== tag),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),
      }),
      {
        name: "origem-projects",
        partialize: (state) => ({ projects: state.projects }),
      }
    ),
    { name: "project-store" }
  )
);
