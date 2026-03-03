import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { JOURNEY_ORDER } from "@/lib/journey";
import type {
  JourneyStepKey,
  RuntimeFunctionKey,
  RuntimeLanguage,
  RuntimeNote,
  RuntimeTask,
  SessionRuntime,
} from "@/types/runtime";

interface RuntimeState {
  sessions: Record<string, SessionRuntime>;

  ensureSession: (sessionId: string) => void;
  resetSession: (sessionId: string) => void;
  setLanguage: (sessionId: string, language: RuntimeLanguage) => void;
  startRun: (
    sessionId: string,
    runId: string,
    tasks: RuntimeTask[],
    language: RuntimeLanguage
  ) => void;
  setDistributionReady: (sessionId: string, ready: boolean) => void;
  updateTask: (
    sessionId: string,
    taskId: string,
    updates: Partial<RuntimeTask>
  ) => void;
  reorderTasks: (
    sessionId: string,
    draggedTaskId: string,
    targetTaskId: string
  ) => void;
  applyFunctionPriorities: (
    sessionId: string,
    priorityOrder: RuntimeFunctionKey[]
  ) => void;
  addNote: (sessionId: string, text: string, taskId?: string) => RuntimeNote;
  markJourneyStepVisited: (
    sessionId: string,
    stepKey: JourneyStepKey
  ) => void;
  setOverallProgress: (sessionId: string, progress: number) => void;
  setRunning: (sessionId: string, running: boolean) => void;
  completeRun: (sessionId: string) => void;
  getSession: (sessionId: string) => SessionRuntime | undefined;
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function createDefaultSessionRuntime(sessionId: string): SessionRuntime {
  return {
    sessionId,
    runId: null,
    language: "pt-BR",
    distributionReady: false,
    isRunning: false,
    tasks: [],
    notes: [],
    journeyCursor: 0,
    journeyVisited: [],
    overallProgress: 0,
    updatedAt: Date.now(),
  };
}

export const useRuntimeStore = create<RuntimeState>()(
  devtools(
    persist(
      (set, get) => ({
      sessions: {},

      ensureSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions[sessionId]
            ? state.sessions
            : {
                ...state.sessions,
                [sessionId]: createDefaultSessionRuntime(sessionId),
              },
        })),

      resetSession: (sessionId) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: createDefaultSessionRuntime(sessionId),
          },
        })),

      setLanguage: (sessionId, language) =>
        set((state) => {
          const current =
            state.sessions[sessionId] ?? createDefaultSessionRuntime(sessionId);

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                language,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      startRun: (sessionId, runId, tasks, language) =>
        set((state) => {
          const current =
            state.sessions[sessionId] ?? createDefaultSessionRuntime(sessionId);

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                runId,
                language,
                tasks: tasks.map((task, index) => ({
                  ...task,
                  priority: index + 1,
                })),
                notes: [],
                distributionReady: true,
                isRunning: true,
                overallProgress: 0,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      setDistributionReady: (sessionId, ready) =>
        set((state) => {
          const current =
            state.sessions[sessionId] ?? createDefaultSessionRuntime(sessionId);

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                distributionReady: ready,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      updateTask: (sessionId, taskId, updates) =>
        set((state) => {
          const current = state.sessions[sessionId];
          if (!current) {
            return state;
          }

          const tasks = current.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          );

          const overallProgress =
            tasks.length === 0
              ? 0
              : Math.round(
                  tasks.reduce((sum, task) => sum + task.progress, 0) /
                    tasks.length
                );

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                tasks,
                overallProgress,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      reorderTasks: (sessionId, draggedTaskId, targetTaskId) =>
        set((state) => {
          const current = state.sessions[sessionId];
          if (!current || draggedTaskId === targetTaskId) {
            return state;
          }

          const tasks = [...current.tasks];
          const draggedIndex = tasks.findIndex((task) => task.id === draggedTaskId);
          const targetIndex = tasks.findIndex((task) => task.id === targetTaskId);

          if (draggedIndex === -1 || targetIndex === -1) {
            return state;
          }

          const [draggedTask] = tasks.splice(draggedIndex, 1);
          tasks.splice(targetIndex, 0, draggedTask);

          const normalized = tasks.map((task, index) => ({
            ...task,
            priority: index + 1,
          }));

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                tasks: normalized,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      applyFunctionPriorities: (sessionId, priorityOrder) =>
        set((state) => {
          const current = state.sessions[sessionId];
          if (!current || current.tasks.length === 0 || priorityOrder.length === 0) {
            return state;
          }

          const rankByFunction = new Map(
            priorityOrder.map((functionKey, index) => [functionKey, index])
          );
          const fallbackRankStart = priorityOrder.length + 1;

          const sorted = [...current.tasks].sort((left, right) => {
            const leftRank =
              rankByFunction.get(left.functionKey) ?? fallbackRankStart + left.priority;
            const rightRank =
              rankByFunction.get(right.functionKey) ?? fallbackRankStart + right.priority;

            if (leftRank !== rightRank) {
              return leftRank - rightRank;
            }

            return left.priority - right.priority;
          });

          const normalized = sorted.map((task, index) => ({
            ...task,
            priority: index + 1,
          }));

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                tasks: normalized,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      addNote: (sessionId, text, taskId) => {
        const note: RuntimeNote = {
          id: createLocalId("note"),
          text,
          taskId,
          createdAt: Date.now(),
        };

        set((state) => {
          const current =
            state.sessions[sessionId] ?? createDefaultSessionRuntime(sessionId);

          const tasks = taskId
            ? current.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, notes: [...task.notes, text] }
                  : task
              )
            : current.tasks;

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                tasks,
                notes: [...current.notes, note],
                updatedAt: Date.now(),
              },
            },
          };
        });

        return note;
      },

      markJourneyStepVisited: (sessionId, stepKey) =>
        set((state) => {
          const current =
            state.sessions[sessionId] ?? createDefaultSessionRuntime(sessionId);

          const visitedSet = new Set(current.journeyVisited);
          visitedSet.add(stepKey);

          let nextCursor = current.journeyCursor;
          while (
            nextCursor < JOURNEY_ORDER.length &&
            visitedSet.has(JOURNEY_ORDER[nextCursor])
          ) {
            nextCursor += 1;
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                journeyVisited: Array.from(visitedSet),
                journeyCursor: nextCursor,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      setOverallProgress: (sessionId, progress) =>
        set((state) => {
          const current = state.sessions[sessionId];
          if (!current) {
            return state;
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                overallProgress: Math.max(0, Math.min(100, progress)),
                updatedAt: Date.now(),
              },
            },
          };
        }),

      setRunning: (sessionId, running) =>
        set((state) => {
          const current =
            state.sessions[sessionId] ?? createDefaultSessionRuntime(sessionId);

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                isRunning: running,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      completeRun: (sessionId) =>
        set((state) => {
          const current = state.sessions[sessionId];
          if (!current) {
            return state;
          }

          const tasks: RuntimeTask[] = current.tasks.map(
            (task): RuntimeTask => ({
              ...task,
              progress: 100,
              status: task.status === "blocked" ? "blocked" : "done",
            })
          );

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                tasks,
                overallProgress: 100,
                isRunning: false,
                updatedAt: Date.now(),
              },
            },
          };
        }),

        getSession: (sessionId) => get().sessions[sessionId],
      }),
      {
        name: "runtime-store",
        partialize: (state) => ({
          sessions: state.sessions,
        }),
      }
    ),
    { name: "runtime-store-devtools" }
  )
);
