import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type {
  MCPConnector,
  MCPServerDefinition,
  MCPToolSchema,
  MCPAuditEntry,
} from "@/types/mcp";

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Store — client-side state for MCP connectors            */
/* ------------------------------------------------------------------ */

interface MCPState {
  /* ─── Data ─── */
  registry: MCPServerDefinition[];
  connectors: MCPConnector[];
  audit: MCPAuditEntry[];
  registryLoaded: boolean;

  /* ─── UI state ─── */
  installing: boolean;
  installingServerId: string | null;

  /* ─── Actions ─── */
  setRegistry: (servers: MCPServerDefinition[]) => void;
  setConnectors: (connectors: MCPConnector[]) => void;
  addConnector: (connector: MCPConnector) => void;
  updateConnector: (id: string, updates: Partial<MCPConnector>) => void;
  removeConnector: (id: string) => void;
  setAudit: (entries: MCPAuditEntry[]) => void;
  setInstalling: (installing: boolean, serverId?: string | null) => void;

  /* ─── Derived ─── */
  getConnectorsForWorkspace: (workspaceId: string) => MCPConnector[];
  getToolsForWorkspace: (workspaceId: string) => Array<MCPToolSchema & { connectorId: string; serverName: string }>;
  getServerDef: (serverId: string) => MCPServerDefinition | undefined;
  isServerInstalled: (workspaceId: string, serverId: string) => boolean;
}

export const useMCPStore = create<MCPState>()(
  devtools(
    persist(
      (set, get) => ({
        registry: [],
        connectors: [],
        audit: [],
        registryLoaded: false,
        installing: false,
        installingServerId: null,

        setRegistry: (servers) => set({ registry: servers, registryLoaded: true }),
        setConnectors: (connectors) => set({ connectors }),
        addConnector: (connector) =>
          set((s) => ({ connectors: [...s.connectors, connector] })),
        updateConnector: (id, updates) =>
          set((s) => ({
            connectors: s.connectors.map((c) =>
              c.id === id ? { ...c, ...updates } : c,
            ),
          })),
        removeConnector: (id) =>
          set((s) => ({
            connectors: s.connectors.filter((c) => c.id !== id),
          })),
        setAudit: (entries) => set({ audit: entries }),
        setInstalling: (installing, serverId) =>
          set({ installing, installingServerId: serverId ?? null }),

        getConnectorsForWorkspace: (workspaceId) =>
          get().connectors.filter((connector) => connector.workspaceId === workspaceId),

        getToolsForWorkspace: (workspaceId) => {
          const connectors = get().connectors.filter(
            (connector) =>
              connector.workspaceId === workspaceId &&
              connector.status === "connected",
          );
          const tools: Array<MCPToolSchema & { connectorId: string; serverName: string }> = [];
          for (const c of connectors) {
            for (const t of c.tools) {
              tools.push({ ...t, connectorId: c.id, serverName: c.serverName });
            }
          }
          return tools;
        },

        getServerDef: (serverId) =>
          get().registry.find((s) => s.id === serverId),

        isServerInstalled: (workspaceId, serverId) =>
          get().connectors.some(
            (connector) =>
              connector.workspaceId === workspaceId &&
              connector.serverId === serverId,
          ),
      }),
      {
        name: "origem-mcp",
        partialize: (state) => ({
          connectors: state.connectors,
        }),
      },
    ),
    { name: "mcp-store" },
  ),
);
