import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type TourContextId = "dashboard" | "code" | "spaces" | "workspaces";

interface TourState {
  hasCompletedTour: boolean;
  completedContexts: Partial<Record<TourContextId, boolean>>;
  currentStep: number;
  isActive: boolean;
  activeContext: TourContextId | null;

  /* Invite context */
  cameFromInvite: boolean;
  inviteCode: string | null;

  startTour: (context?: TourContextId) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  setInviteContext: (code: string) => void;
}

export const useTourStore = create<TourState>()(
  devtools(
    persist(
      (set) => ({
        hasCompletedTour: false,
        completedContexts: {},
        currentStep: 0,
        isActive: false,
        activeContext: null,
        cameFromInvite: false,
        inviteCode: null,

        startTour: (context = "dashboard") =>
          set({ isActive: true, currentStep: 0, activeContext: context }),
        nextStep: () =>
          set((s) => ({ currentStep: s.currentStep + 1 })),
        prevStep: () =>
          set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
        skipTour: () =>
          set((s) => {
            const context = s.activeContext ?? "dashboard";

            return {
              isActive: false,
              hasCompletedTour:
                context === "dashboard" ? true : s.hasCompletedTour,
              currentStep: 0,
              activeContext: null,
              completedContexts: {
                ...s.completedContexts,
                [context]: true,
              },
            };
          }),
        completeTour: () =>
          set((s) => {
            const context = s.activeContext ?? "dashboard";

            return {
              isActive: false,
              hasCompletedTour:
                context === "dashboard" ? true : s.hasCompletedTour,
              currentStep: 0,
              activeContext: null,
              completedContexts: {
                ...s.completedContexts,
                [context]: true,
              },
            };
          }),
        resetTour: () =>
          set({
            isActive: false,
            hasCompletedTour: false,
            completedContexts: {},
            currentStep: 0,
            activeContext: null,
          }),
        setInviteContext: (code) =>
          set({ cameFromInvite: true, inviteCode: code }),
      }),
      { name: "origem-tour" }
    ),
    { name: "TourStore" }
  )
);
