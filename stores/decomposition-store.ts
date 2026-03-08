import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { DecompositionResult } from "@/types/decomposition";

interface DecompositionState {
  decompositions: Record<string, DecompositionResult>;
  activeDecompositionId: string | null;
  isDecomposing: boolean;

  addDecomposition: (result: DecompositionResult) => void;
  setActiveDecomposition: (id: string | null) => void;
  setDecomposing: (decomposing: boolean) => void;
  getDecomposition: (id: string) => DecompositionResult | undefined;
  clear: () => void;
}

export const useDecompositionStore = create<DecompositionState>()(
  devtools(
    persist(
      (set, get) => ({
        decompositions: {},
        activeDecompositionId: null,
        isDecomposing: false,

        addDecomposition: (result) =>
          set((s) => ({
            decompositions: { ...s.decompositions, [result.id]: result },
            activeDecompositionId: result.id,
          })),
        setActiveDecomposition: (id) =>
          set({ activeDecompositionId: id }),
        setDecomposing: (decomposing) =>
          set({ isDecomposing: decomposing }),
        getDecomposition: (id) => get().decompositions[id],
        clear: () =>
          set({ decompositions: {}, activeDecompositionId: null }),
      }),
      {
        name: "origem-decompositions",
        partialize: (state) => ({
          decompositions: state.decompositions,
          activeDecompositionId: state.activeDecompositionId,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) state.isDecomposing = false;
        },
      }
    ),
    { name: "decomposition-store" }
  )
);
