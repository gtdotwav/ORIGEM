import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Viewport,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import type {
  OrigemNode,
  OrigemEdge,
  SerializedCanvasState,
} from "@/types/canvas";

interface CanvasState {
  nodes: OrigemNode[];
  edges: OrigemEdge[];
  viewport: Viewport;

  setNodes: (nodes: OrigemNode[]) => void;
  setEdges: (edges: OrigemEdge[]) => void;
  addNode: (node: OrigemNode) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (
    nodeId: string,
    data: Record<string, unknown>
  ) => void;
  addEdge: (edge: OrigemEdge) => void;
  removeEdge: (edgeId: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setViewport: (viewport: Viewport) => void;
  clear: () => void;
  hydrate: (state: SerializedCanvasState) => void;
  serialize: () => SerializedCanvasState;
}

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set, get) => ({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
      removeNode: (nodeId) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== nodeId),
          edges: s.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        })),
      updateNodeData: (nodeId, data) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, ...data } }
              : n
          ),
        })),
      addEdge: (edge) => set((s) => ({ edges: [...s.edges, edge] })),
      removeEdge: (edgeId) =>
        set((s) => ({
          edges: s.edges.filter((e) => e.id !== edgeId),
        })),
      onNodesChange: (changes) => {
        set((s) => ({
          nodes: applyNodeChanges(changes, s.nodes) as OrigemNode[],
        }));
      },
      onEdgesChange: (changes) => {
        set((s) => ({
          edges: applyEdgeChanges(changes, s.edges) as OrigemEdge[],
        }));
      },
      setViewport: (viewport) => set({ viewport }),
      clear: () =>
        set({
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        }),
      hydrate: (state) =>
        set({
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport,
        }),
      serialize: () => ({
        nodes: get().nodes,
        edges: get().edges,
        viewport: get().viewport,
      }),
    }),
    { name: "flow-canvas-store" }
  )
);
