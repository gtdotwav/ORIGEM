import { create } from "zustand";
import { devtools } from "zustand/middleware";
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
    { name: "decomposition-store" }
  )
);
