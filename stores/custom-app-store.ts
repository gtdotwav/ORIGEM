import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { CustomApp } from "@/types/custom-app";

interface CustomAppState {
  apps: CustomApp[];
  addApp: (app: CustomApp) => void;
  updateApp: (id: string, updates: Partial<CustomApp>) => void;
  removeApp: (id: string) => void;
  getApp: (id: string) => CustomApp | undefined;
}

export const useCustomAppStore = create<CustomAppState>()(
  devtools(
    persist(
      (set, get) => ({
        apps: [],

        addApp: (app) =>
          set((s) => ({ apps: [...s.apps, app] })),

        updateApp: (id, updates) =>
          set((s) => ({
            apps: s.apps.map((a) =>
              a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
            ),
          })),

        removeApp: (id) =>
          set((s) => ({ apps: s.apps.filter((a) => a.id !== id) })),

        getApp: (id) => get().apps.find((a) => a.id === id),
      }),
      {
        name: "origem-custom-apps",
        partialize: (state) => ({ apps: state.apps }),
      }
    ),
    { name: "custom-app-store" }
  )
);
