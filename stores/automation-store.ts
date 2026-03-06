import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { calculateNextRun } from "@/lib/cron";

export type AutomationActionType =
  | "run-agent"
  | "generate-content"
  | "send-notification"
  | "send-email"
  | "trigger-webhook"
  | "run-api"
  | "run-script"
  | "data-sync"
  | "analytics-report"
  | "backup";

export type AutomationStatus = "active" | "paused" | "error";

export interface AutomationJob {
  id: string;
  calendarEventId?: string;
  name: string;
  description: string;
  cronExpression: string;
  actionType: AutomationActionType;
  payload: Record<string, unknown>;
  active: boolean;
  status: AutomationStatus;
  lastRunAt: string | null;
  nextRunAt: string;
  runCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobLog {
  id: string;
  jobId: string;
  executionTime: string;
  durationMs: number;
  status: "success" | "error";
  result?: string;
  errorMessage?: string;
}

interface AutomationState {
  jobs: AutomationJob[];
  logs: JobLog[];

  addJob: (job: Omit<AutomationJob, "id" | "createdAt" | "updatedAt" | "lastRunAt" | "nextRunAt" | "runCount" | "status">) => string;
  updateJob: (id: string, updates: Partial<AutomationJob>) => void;
  removeJob: (id: string) => void;
  toggleJob: (id: string) => void;
  getJobsForEvent: (eventId: string) => AutomationJob[];

  addLog: (log: Omit<JobLog, "id">) => void;
  getLogsForJob: (jobId: string) => JobLog[];
}

let counter = 0;
function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${++counter}`;
}

export const useAutomationStore = create<AutomationState>()(
  devtools(
    persist(
      (set, get) => ({
        jobs: [],
        logs: [],

        addJob: (input) => {
          const id = genId("job");
          const now = new Date().toISOString();
          const nextRunAt = calculateNextRun(input.cronExpression).toISOString();
          const job: AutomationJob = {
            ...input,
            id,
            status: "active",
            lastRunAt: null,
            nextRunAt,
            runCount: 0,
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({ jobs: [...s.jobs, job] }));
          return id;
        },

        updateJob: (id, updates) =>
          set((s) => ({
            jobs: s.jobs.map((j) =>
              j.id === id
                ? {
                    ...j,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                    ...(updates.cronExpression
                      ? { nextRunAt: calculateNextRun(updates.cronExpression).toISOString() }
                      : {}),
                  }
                : j
            ),
          })),

        removeJob: (id) =>
          set((s) => ({
            jobs: s.jobs.filter((j) => j.id !== id),
            logs: s.logs.filter((l) => l.jobId !== id),
          })),

        toggleJob: (id) =>
          set((s) => ({
            jobs: s.jobs.map((j) =>
              j.id === id
                ? {
                    ...j,
                    active: !j.active,
                    status: !j.active ? "active" : "paused",
                    updatedAt: new Date().toISOString(),
                  }
                : j
            ),
          })),

        getJobsForEvent: (eventId) => get().jobs.filter((j) => j.calendarEventId === eventId),

        addLog: (input) => {
          const log: JobLog = { ...input, id: genId("log") };
          set((s) => ({ logs: [...s.logs.slice(-499), log] }));
        },

        getLogsForJob: (jobId) => get().logs.filter((l) => l.jobId === jobId),
      }),
      {
        name: "origem-automations",
        partialize: (state) => ({ jobs: state.jobs, logs: state.logs }),
      }
    ),
    { name: "automation-store" }
  )
);
