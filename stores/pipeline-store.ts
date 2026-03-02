import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PipelineStage, PipelineEvent } from "@/types/pipeline";

interface PipelineStoreState {
  stage: PipelineStage;
  progress: number;
  events: PipelineEvent[];
  error: string | null;
  startedAt: number | null;
  completedAt: number | null;

  setStage: (stage: PipelineStage) => void;
  setProgress: (progress: number) => void;
  addEvent: (event: PipelineEvent) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePipelineStore = create<PipelineStoreState>()(
  devtools(
    (set) => ({
      stage: "idle",
      progress: 0,
      events: [],
      error: null,
      startedAt: null,
      completedAt: null,

      setStage: (stage) =>
        set((s) => ({
          stage,
          startedAt: stage === "intake" ? Date.now() : s.startedAt,
          completedAt:
            stage === "complete" ? Date.now() : s.completedAt,
        })),
      setProgress: (progress) => set({ progress }),
      addEvent: (event) =>
        set((s) => ({ events: [...s.events, event] })),
      setError: (error) =>
        set({ error, stage: error ? "error" : "idle" }),
      reset: () =>
        set({
          stage: "idle",
          progress: 0,
          events: [],
          error: null,
          startedAt: null,
          completedAt: null,
        }),
    }),
    { name: "pipeline-store" }
  )
);
