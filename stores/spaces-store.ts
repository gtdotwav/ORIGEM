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
  Space,
  GenerationCard,
  GenerationSettings,
  GenerationStatus,
  PromptBlock,
  SpacesNode,
  SpacesEdge,
  StylePreset,
} from "@/types/spaces";
import { DEFAULT_GENERATION_SETTINGS } from "@/types/spaces";

/* ------------------------------------------------------------------ */
/*  ORIGEM SPACES — Store                                             */
/* ------------------------------------------------------------------ */

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface SpacesState {
  /* Collections */
  spaces: Space[];
  cards: GenerationCard[];
  stylePresets: StylePreset[];

  /* Canvas state per space */
  nodes: SpacesNode[];
  edges: SpacesEdge[];
  viewport: Viewport;

  /* Active selections */
  activeSpaceId: string | null;
  selectedCardId: string | null;
  activeSettings: GenerationSettings;
  activePromptBlocks: PromptBlock;

  /* Space CRUD */
  createSpace: (name: string, description?: string) => string;
  deleteSpace: (spaceId: string) => void;
  renameSpace: (spaceId: string, name: string) => void;
  setActiveSpace: (spaceId: string | null) => void;

  /* Card CRUD */
  createCard: (spaceId: string, prompt: string, position?: { x: number; y: number }) => string;
  updateCard: (cardId: string, updates: Partial<GenerationCard>) => void;
  deleteCard: (cardId: string) => void;
  setCardStatus: (cardId: string, status: GenerationStatus) => void;
  setCardImages: (cardId: string, urls: string[]) => void;
  selectCard: (cardId: string | null) => void;
  duplicateCard: (cardId: string) => string | null;

  /* Settings */
  setActiveSettings: (settings: Partial<GenerationSettings>) => void;
  setActivePromptBlocks: (blocks: Partial<PromptBlock>) => void;

  /* Canvas (React Flow) */
  setNodes: (nodes: SpacesNode[]) => void;
  setEdges: (edges: SpacesEdge[]) => void;
  addNode: (node: SpacesNode) => void;
  removeNode: (nodeId: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addEdge: (edge: SpacesEdge) => void;
  setViewport: (viewport: Viewport) => void;
  clearCanvas: () => void;

  /* Style Presets */
  saveStylePreset: (name: string) => void;
  applyStylePreset: (presetId: string) => void;
  deleteStylePreset: (presetId: string) => void;
}

const EMPTY_PROMPT_BLOCKS: PromptBlock = {
  subject: "",
  composition: "",
  lighting: "",
  camera: "",
  style: "",
};

export const useSpacesStore = create<SpacesState>()(
  devtools(
    (set, get) => ({
      spaces: [],
      cards: [],
      stylePresets: [],
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      activeSpaceId: null,
      selectedCardId: null,
      activeSettings: { ...DEFAULT_GENERATION_SETTINGS },
      activePromptBlocks: { ...EMPTY_PROMPT_BLOCKS },

      /* ---- Space CRUD ---- */

      createSpace: (name, description = "") => {
        const id = uid("space");
        const now = Date.now();
        const space: Space = {
          id,
          name,
          description,
          cardIds: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ spaces: [...s.spaces, space], activeSpaceId: id }));
        return id;
      },

      deleteSpace: (spaceId) =>
        set((s) => ({
          spaces: s.spaces.filter((sp) => sp.id !== spaceId),
          cards: s.cards.filter((c) => c.spaceId !== spaceId),
          activeSpaceId: s.activeSpaceId === spaceId ? null : s.activeSpaceId,
        })),

      renameSpace: (spaceId, name) =>
        set((s) => ({
          spaces: s.spaces.map((sp) =>
            sp.id === spaceId ? { ...sp, name, updatedAt: Date.now() } : sp
          ),
        })),

      setActiveSpace: (spaceId) => set({ activeSpaceId: spaceId, selectedCardId: null }),

      /* ---- Card CRUD ---- */

      createCard: (spaceId, prompt, position) => {
        const id = uid("gen");
        const now = Date.now();
        const card: GenerationCard = {
          id,
          spaceId,
          prompt,
          promptBlocks: null,
          settings: { ...get().activeSettings },
          imageUrls: [],
          status: "idle",
          parentCardId: null,
          createdAt: now,
          updatedAt: now,
        };

        const node: SpacesNode = {
          id,
          type: "generation",
          position: position ?? { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
          data: {
            type: "generation",
            cardId: id,
            prompt,
            imageUrl: null,
            status: "idle",
            model: get().activeSettings.model,
          },
        };

        set((s) => ({
          cards: [...s.cards, card],
          nodes: [...s.nodes, node],
          spaces: s.spaces.map((sp) =>
            sp.id === spaceId
              ? { ...sp, cardIds: [...sp.cardIds, id], updatedAt: now }
              : sp
          ),
          selectedCardId: id,
        }));
        return id;
      },

      updateCard: (cardId, updates) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        })),

      deleteCard: (cardId) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== cardId),
          nodes: s.nodes.filter((n) => n.id !== cardId),
          edges: s.edges.filter((e) => e.source !== cardId && e.target !== cardId),
          spaces: s.spaces.map((sp) => ({
            ...sp,
            cardIds: sp.cardIds.filter((id) => id !== cardId),
          })),
          selectedCardId: s.selectedCardId === cardId ? null : s.selectedCardId,
        })),

      setCardStatus: (cardId, status) => {
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, status, updatedAt: Date.now() } : c
          ),
          nodes: s.nodes.map((n) =>
            n.id === cardId
              ? { ...n, data: { ...n.data, status } }
              : n
          ),
        }));
      },

      setCardImages: (cardId, urls) => {
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, imageUrls: urls, status: "done", updatedAt: Date.now() } : c
          ),
          nodes: s.nodes.map((n) =>
            n.id === cardId
              ? { ...n, data: { ...n.data, imageUrl: urls[0] ?? null, status: "done" } }
              : n
          ),
        }));
      },

      selectCard: (cardId) => {
        const card = cardId ? get().cards.find((c) => c.id === cardId) : null;
        set({
          selectedCardId: cardId,
          ...(card ? { activeSettings: { ...card.settings } } : {}),
        });
      },

      duplicateCard: (cardId) => {
        const original = get().cards.find((c) => c.id === cardId);
        if (!original) return null;
        const originalNode = get().nodes.find((n) => n.id === cardId);
        const position = originalNode
          ? { x: originalNode.position.x + 40, y: originalNode.position.y + 40 }
          : undefined;
        const newId = get().createCard(original.spaceId, original.prompt, position);
        get().updateCard(newId, {
          settings: { ...original.settings },
          promptBlocks: original.promptBlocks ? { ...original.promptBlocks } : null,
          parentCardId: cardId,
        });
        const edge: SpacesEdge = {
          id: `e-${cardId}-${newId}`,
          source: cardId,
          target: newId,
          type: "variation",
        };
        set((s) => ({ edges: [...s.edges, edge] }));
        return newId;
      },

      /* ---- Settings ---- */

      setActiveSettings: (settings) =>
        set((s) => ({
          activeSettings: { ...s.activeSettings, ...settings },
        })),

      setActivePromptBlocks: (blocks) =>
        set((s) => ({
          activePromptBlocks: { ...s.activePromptBlocks, ...blocks },
        })),

      /* ---- Canvas ---- */

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
      removeNode: (nodeId) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== nodeId),
          edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        })),
      onNodesChange: (changes) =>
        set((s) => ({
          nodes: applyNodeChanges(changes, s.nodes) as SpacesNode[],
        })),
      onEdgesChange: (changes) =>
        set((s) => ({
          edges: applyEdgeChanges(changes, s.edges) as SpacesEdge[],
        })),
      addEdge: (edge) => set((s) => ({ edges: [...s.edges, edge] })),
      setViewport: (viewport) => set({ viewport }),
      clearCanvas: () => set({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }),

      /* ---- Style Presets ---- */

      saveStylePreset: (name) => {
        const id = uid("style");
        const preset: StylePreset = {
          id,
          name,
          promptBlocks: { ...get().activePromptBlocks },
          settings: { ...get().activeSettings },
        };
        set((s) => ({ stylePresets: [...s.stylePresets, preset] }));
      },

      applyStylePreset: (presetId) => {
        const preset = get().stylePresets.find((p) => p.id === presetId);
        if (!preset) return;
        set({
          activePromptBlocks: { ...preset.promptBlocks },
          activeSettings: { ...get().activeSettings, ...preset.settings },
        });
      },

      deleteStylePreset: (presetId) =>
        set((s) => ({
          stylePresets: s.stylePresets.filter((p) => p.id !== presetId),
        })),
    }),
    { name: "spaces-store" }
  )
);
