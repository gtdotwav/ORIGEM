import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface TourState {
  hasCompletedTour: boolean;
  currentStep: number;
  isActive: boolean;

  /* Invite context */
  cameFromInvite: boolean;
  inviteCode: string | null;

  startTour: () => void;
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
        currentStep: 0,
        isActive: false,
        cameFromInvite: false,
        inviteCode: null,

        startTour: () => set({ isActive: true, currentStep: 0 }),
        nextStep: () =>
          set((s) => ({ currentStep: s.currentStep + 1 })),
        prevStep: () =>
          set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
        skipTour: () =>
          set({ isActive: false, hasCompletedTour: true, currentStep: 0 }),
        completeTour: () =>
          set({ isActive: false, hasCompletedTour: true, currentStep: 0 }),
        resetTour: () =>
          set({ isActive: false, hasCompletedTour: false, currentStep: 0 }),
        setInviteContext: (code) =>
          set({ cameFromInvite: true, inviteCode: code }),
      }),
      { name: "origem-tour" }
    ),
    { name: "TourStore" }
  )
);
