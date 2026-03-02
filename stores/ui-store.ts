import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  rightPanelOpen: boolean;
  rightPanelContent: "inspector" | "agent-config" | "output-preview" | null;
  selectedNodeId: string | null;
  commandPaletteOpen: boolean;
  activeView: "chat" | "orchestra" | "settings" | "dashboard";

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setRightPanel: (content: UIState["rightPanelContent"]) => void;
  closeRightPanel: () => void;
  setSelectedNode: (nodeId: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveView: (view: UIState["activeView"]) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      sidebarWidth: 260,
      rightPanelOpen: false,
      rightPanelContent: null,
      selectedNodeId: null,
      commandPaletteOpen: false,
      activeView: "dashboard",

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setRightPanel: (content) =>
        set({ rightPanelOpen: true, rightPanelContent: content }),
      closeRightPanel: () =>
        set({ rightPanelOpen: false, rightPanelContent: null }),
      setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setActiveView: (view) => set({ activeView: view }),
    }),
    { name: "ui-store" }
  )
);
