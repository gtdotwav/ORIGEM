import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Viewport,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import type { OrigemNode, OrigemEdge, ChatSessionNodeData } from "@/types/canvas";

export interface ChatFlow {
  id: string;
  name: string;
  nodes: OrigemNode[];
  edges: OrigemEdge[];
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
}

interface ChatFlowState {
  flows: ChatFlow[];
  activeFlowId: string | null;

  createFlow: (name: string) => string;
  removeFlow: (id: string) => void;
  setActiveFlow: (id: string | null) => void;
  addSessionNode: (flowId: string, sessionId: string, title: string, messageCount: number, status: ChatSessionNodeData["status"]) => void;
  removeNode: (flowId: string, nodeId: string) => void;
  addEdge: (flowId: string, edge: OrigemEdge) => void;
  removeEdge: (flowId: string, edgeId: string) => void;
  onNodesChange: (flowId: string, changes: NodeChange[]) => void;
  onEdgesChange: (flowId: string, changes: EdgeChange[]) => void;
  updateViewport: (flowId: string, viewport: Viewport) => void;
}

let counter = 0;
function flowId() {
  counter += 1;
  return `flow-${Date.now()}-${counter}`;
}

function nodeId() {
  counter += 1;
  return `node-${Date.now()}-${counter}`;
}

export const useChatFlowStore = create<ChatFlowState>()(
  devtools(
    persist(
      (set, get) => ({
        flows: [],
        activeFlowId: null,

        createFlow: (name) => {
          const id = flowId();
          const now = new Date().toISOString();
          set((s) => ({
            flows: [
              ...s.flows,
              {
                id,
                name,
                nodes: [],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 0.8 },
                createdAt: now,
                updatedAt: now,
              },
            ],
            activeFlowId: id,
          }));
          return id;
        },

        removeFlow: (id) =>
          set((s) => ({
            flows: s.flows.filter((f) => f.id !== id),
            activeFlowId: s.activeFlowId === id ? null : s.activeFlowId,
          })),

        setActiveFlow: (id) => set({ activeFlowId: id }),

        addSessionNode: (fId, sessionId, title, messageCount, status) => {
          const flow = get().flows.find((f) => f.id === fId);
          if (!flow) return;

          const existing = flow.nodes.find(
            (n) => (n.data as ChatSessionNodeData).sessionId === sessionId
          );
          if (existing) return;

          const col = flow.nodes.length % 3;
          const row = Math.floor(flow.nodes.length / 3);

          const node: OrigemNode = {
            id: nodeId(),
            type: "chat-session",
            position: { x: col * 280, y: row * 180 },
            data: {
              type: "chat-session",
              sessionId,
              title,
              messageCount,
              status,
              lastUpdated: new Date().toISOString(),
            },
          };

          set((s) => ({
            flows: s.flows.map((f) =>
              f.id === fId
                ? { ...f, nodes: [...f.nodes, node], updatedAt: new Date().toISOString() }
                : f
            ),
          }));
        },

        removeNode: (fId, nId) =>
          set((s) => ({
            flows: s.flows.map((f) =>
              f.id === fId
                ? {
                    ...f,
                    nodes: f.nodes.filter((n) => n.id !== nId),
                    edges: f.edges.filter((e) => e.source !== nId && e.target !== nId),
                    updatedAt: new Date().toISOString(),
                  }
                : f
            ),
          })),

        addEdge: (fId, edge) =>
          set((s) => ({
            flows: s.flows.map((f) =>
              f.id === fId
                ? { ...f, edges: [...f.edges, edge], updatedAt: new Date().toISOString() }
                : f
            ),
          })),

        removeEdge: (fId, eId) =>
          set((s) => ({
            flows: s.flows.map((f) =>
              f.id === fId
                ? {
                    ...f,
                    edges: f.edges.filter((e) => e.id !== eId),
                    updatedAt: new Date().toISOString(),
                  }
                : f
            ),
          })),

        onNodesChange: (fId, changes) => {
          const flow = get().flows.find((f) => f.id === fId);
          if (!flow) return;
          set((s) => ({
            flows: s.flows.map((f) =>
              f.id === fId
                ? {
                    ...f,
                    nodes: applyNodeChanges(changes, f.nodes) as OrigemNode[],
                    updatedAt: new Date().toISOString(),
                  }
                : f
            ),
          }));
        },

        onEdgesChange: (fId, changes) => {
          const flow = get().flows.find((f) => f.id === fId);
          if (!flow) return;
          set((s) => ({
            flows: s.flows.map((f) =>
              f.id === fId
                ? {
                    ...f,
                    edges: applyEdgeChanges(changes, f.edges) as OrigemEdge[],
                    updatedAt: new Date().toISOString(),
                  }
                : f
            ),
          }));
        },

        updateViewport: (fId, viewport) =>
          set((s) => ({
            flows: s.flows.map((f) =>
              f.id === fId ? { ...f, viewport } : f
            ),
          })),
      }),
      { name: "origem-chat-flows" }
    ),
    { name: "chat-flow-store" }
  )
);
