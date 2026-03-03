import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  AgentInstance,
  AgentOutput,
  AgentGroup,
} from "@/types/agent";

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
        })),
      addOutput: (agentId, output) =>
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId
              ? { ...a, outputs: [...a.outputs, output] }
              : a
          ),
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
    { name: "agent-store" }
  )
);
