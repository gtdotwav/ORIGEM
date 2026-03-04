import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type AgeRange = "4-6" | "7-9" | "10-12";

interface KidsState {
  ageRange: AgeRange;
  timeLimit: number; // minutos, 0 = sem limite
  enabledSections: string[];
  stars: number;
  completedChallenges: string[];
  parentalPin: string; // 4 digitos

  setAgeRange: (range: AgeRange) => void;
  setTimeLimit: (minutes: number) => void;
  toggleSection: (section: string) => void;
  setEnabledSections: (sections: string[]) => void;
  addStars: (amount: number) => void;
  completeChallenge: (id: string) => void;
  setParentalPin: (pin: string) => void;
}

const ALL_SECTIONS = ["videos", "games", "art", "stories", "companion", "challenges"];

export const useKidsStore = create<KidsState>()(
  devtools(
    persist(
      (set) => ({
        ageRange: "7-9",
        timeLimit: 60,
        enabledSections: ALL_SECTIONS,
        stars: 0,
        completedChallenges: [],
        parentalPin: "1234",

        setAgeRange: (range) => set({ ageRange: range }),

        setTimeLimit: (minutes) => set({ timeLimit: minutes }),

        toggleSection: (section) =>
          set((s) => ({
            enabledSections: s.enabledSections.includes(section)
              ? s.enabledSections.filter((sec) => sec !== section)
              : [...s.enabledSections, section],
          })),

        setEnabledSections: (sections) => set({ enabledSections: sections }),

        addStars: (amount) =>
          set((s) => ({ stars: s.stars + amount })),

        completeChallenge: (id) =>
          set((s) => ({
            completedChallenges: s.completedChallenges.includes(id)
              ? s.completedChallenges
              : [...s.completedChallenges, id],
          })),

        setParentalPin: (pin) => set({ parentalPin: pin }),
      }),
      {
        name: "origem-kids",
        partialize: (state) => ({
          ageRange: state.ageRange,
          timeLimit: state.timeLimit,
          enabledSections: state.enabledSections,
          stars: state.stars,
          completedChallenges: state.completedChallenges,
          parentalPin: state.parentalPin,
        }),
      }
    ),
    { name: "kids-store" }
  )
);
