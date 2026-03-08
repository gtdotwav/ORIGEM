import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  AgentInstance,
  AgentOutput,
  AgentGroup,
} from "@/types/agent";

const MAX_OUTPUTS_PER_AGENT = 50;

interface AgentState {
  agents: AgentInstance[];
  groups: AgentGroup[];
  activeAgentId: string | null;

  setAgents: (agents: AgentInstance[]) => void;
  addAgent: (agent: AgentInstance) => void;
  updateAgent: (id: string, updates: Partial<AgentInstance>) => void;
  removeAgent: (id: string) => void;
  addOutput: (agentId: string, output: AgentOutput) => void;
  setGroups: (groups: AgentGroup[]) => void;
  addGroup: (group: AgentGroup) => void;
  updateGroup: (id: string, updates: Partial<AgentGroup>) => void;
  setActiveAgent: (id: string | null) => void;
  getAgent: (id: string) => AgentInstance | undefined;
  clear: () => void;
}

export const useAgentStore = create<AgentState>()(
  devtools(
    persist(
      (set, get) => ({
        agents: [],
        groups: [],
        activeAgentId: null,

        setAgents: (agents) => set({ agents }),
        addAgent: (agent) =>
          set((s) => ({ agents: [...s.agents, agent] })),
        updateAgent: (id, updates) =>
          set((s) => ({
            agents: s.agents.map((a) =>
              a.id === id ? { ...a, ...updates } : a
            ),
          })),
        removeAgent: (id) =>
          set((s) => ({
            agents: s.agents.filter((a) => a.id !== id),
            activeAgentId: s.activeAgentId === id ? null : s.activeAgentId,
          })),
        addOutput: (agentId, output) =>
          set((s) => ({
            agents: s.agents.map((a) => {
              if (a.id !== agentId) return a;
              const updated = [...a.outputs, output];
              return {
                ...a,
                outputs:
                  updated.length > MAX_OUTPUTS_PER_AGENT
                    ? updated.slice(-MAX_OUTPUTS_PER_AGENT)
                    : updated,
              };
            }),
          })),
        setGroups: (groups) => set({ groups }),
        addGroup: (group) =>
          set((s) => ({ groups: [...s.groups, group] })),
        updateGroup: (id, updates) =>
          set((s) => ({
            groups: s.groups.map((group) =>
              group.id === id ? { ...group, ...updates } : group
            ),
          })),
        setActiveAgent: (id) => set({ activeAgentId: id }),
        getAgent: (id) => get().agents.find((a) => a.id === id),
        clear: () =>
          set({ agents: [], groups: [], activeAgentId: null }),
      }),
      {
        name: "origem-agents",
        partialize: (state) => ({
          agents: state.agents,
          groups: state.groups,
          activeAgentId: state.activeAgentId,
        }),
      }
    ),
    { name: "agent-store" }
  )
);
