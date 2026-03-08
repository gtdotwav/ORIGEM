import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ProviderConfig, ProviderName } from "@/types/provider";

interface ProviderState {
  providers: ProviderConfig[];
  activeProvider: ProviderName | null;
  isTestingConnection: boolean;
  testResults: Record<
    string,
    "success" | "error" | "testing" | null
  >;

  setProviders: (providers: ProviderConfig[]) => void;
  addProvider: (provider: ProviderConfig) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  removeProvider: (id: string) => void;
  setActiveProvider: (name: ProviderName | null) => void;
  setTestResult: (
    providerId: string,
    result: "success" | "error" | "testing" | null
  ) => void;
  setTestingConnection: (testing: boolean) => void;
}

export const useProviderStore = create<ProviderState>()(
  devtools(
    persist(
      (set) => ({
        providers: [],
        activeProvider: null,
        isTestingConnection: false,
        testResults: {},

        setProviders: (providers) => set({ providers }),
        addProvider: (provider) =>
          set((s) => ({ providers: [...s.providers, provider] })),
        updateProvider: (id, updates) =>
          set((s) => ({
            providers: s.providers.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          })),
        removeProvider: (id) =>
          set((s) => ({
            providers: s.providers.filter((p) => p.id !== id),
          })),
        setActiveProvider: (name) => set({ activeProvider: name }),
        setTestResult: (providerId, result) =>
          set((s) => ({
            testResults: { ...s.testResults, [providerId]: result },
          })),
        setTestingConnection: (testing) =>
          set({ isTestingConnection: testing }),
      }),
      {
        name: "origem-providers",
        partialize: (state) => ({
          providers: state.providers,
          activeProvider: state.activeProvider,
        }),
      }
    ),
    { name: "provider-store" }
  )
);
