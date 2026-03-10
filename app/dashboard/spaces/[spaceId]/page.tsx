"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type OnConnect,
  type Connection,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  PanOnScrollMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Plus, PanelRightOpen, PanelRightClose, Orbit } from "lucide-react";
import { SpacesSidebar } from "@/components/spaces/spaces-sidebar";
import GenerationCardNode from "@/components/spaces/generation-card-node";
import TextNode from "@/components/spaces/text-node";
import SpaceConnectionEdge from "@/components/spaces/space-connection-edge";
import { ControlPanel } from "@/components/spaces/control-panel";
import { SpaceContextMenu, useSpaceContextMenuItems } from "@/components/spaces/space-context-menu";
import { useSpacesStore } from "@/stores/spaces-store";

const NODE_TYPES = {
  generation: GenerationCardNode,
  text: TextNode,
};

const EDGE_TYPES = {
  flow: SpaceConnectionEdge,
  variation: SpaceConnectionEdge,
  upscale: SpaceConnectionEdge,
};

const EDGE_DEFAULTS = {
  style: { stroke: "rgba(255,255,255,0.24)", strokeWidth: 2.2 },
  animated: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "rgba(255,255,255,0.24)",
    width: 18,
    height: 18,
  },
};

export default function SpaceCanvasPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(true);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const spaces = useSpacesStore((s) => s.spaces);
  const setActiveSpace = useSpacesStore((s) => s.setActiveSpace);
  const createSpace = useSpacesStore((s) => s.createSpace);
  const nodes = useSpacesStore((s) => s.nodes);
  const edges = useSpacesStore((s) => s.edges);
  const onNodesChange = useSpacesStore((s) => s.onNodesChange);
  const onEdgesChange = useSpacesStore((s) => s.onEdgesChange);
  const addEdge = useSpacesStore((s) => s.addEdge);
  const setViewport = useSpacesStore((s) => s.setViewport);
  const createCard = useSpacesStore((s) => s.createCard);
  const addTextNode = useSpacesStore((s) => s.addTextNode);
  const selectedCardId = useSpacesStore((s) => s.selectedCardId);
  const selectCard = useSpacesStore((s) => s.selectCard);
  const viewport = useSpacesStore((s) => s.viewport);

  const space = useMemo(
    () => spaces.find((s) => s.id === spaceId),
    [spaces, spaceId]
  );

  useEffect(() => {
    if (!spaceId) return;
    const existing = spaces.find((s) => s.id === spaceId);
    if (!existing) {
      const createdId = createSpace("Space sem titulo");
      router.replace(`/dashboard/spaces/${createdId}`);
      return;
    }
    setActiveSpace(spaceId);
  }, [spaceId, spaces, setActiveSpace, createSpace, router]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge({
          id: `e-${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          type: "flow",
        });
      }
    },
    [addEdge]
  );

  const contextMenuItems = useSpaceContextMenuItems(createCard, addTextNode, spaceId);

  const handlePaneClick = useCallback(() => {
    selectCard(null);
    setContextMenuPos(null);
  }, [selectCard]);

  const handlePaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      setContextMenuPos({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const handleAddCard = () => {
    if (!spaceId) return;
    createCard(spaceId, "");
  };

  const cards = useSpacesStore((s) => s.cards);
  const isPanelVisible = panelOpen || Boolean(selectedCardId);

  const spaceNodes = useMemo(
    () =>
      nodes.filter((n) => {
        // Generation cards are tracked in the cards array
        const card = cards.find((c) => c.id === n.id);
        if (card) return card.spaceId === spaceId;
        // Text nodes store spaceId in their data
        return (n.data as Record<string, unknown>).spaceId === spaceId;
      }),
    [nodes, cards, spaceId]
  );

  const spaceEdges = useMemo(() => {
    const nodeIds = new Set(spaceNodes.map((n) => n.id));
    return edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({ ...e, ...EDGE_DEFAULTS }));
  }, [edges, spaceNodes]);

  return (
    <div className="fixed inset-0 z-50 flex bg-[oklch(0.08_0_0)]">
      {/* Left sidebar */}
      <SpacesSidebar />

      {/* Center — Infinite Canvas */}
      <div className="relative flex-1">
        {/* Top bar — floating glass overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/spaces")}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/42 backdrop-blur-xl transition-colors hover:border-white/[0.10] hover:text-white/70"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 backdrop-blur-xl">
              <Orbit className="h-3 w-3 text-white/34" />
              <span className="text-[12px] font-medium text-white/60">
                {space?.name ?? "Space"}
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 backdrop-blur-xl lg:flex">
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/24">
                Gestos
              </span>
              <span className="text-[11px] text-white/46">
                Pinça para zoom • dois dedos para navegar
              </span>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddCard}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/50 backdrop-blur-xl transition-colors hover:border-white/[0.10] hover:text-white/76"
            >
              <Plus className="h-3 w-3" />
              Novo Card
            </button>
            <button
              type="button"
              onClick={() => {
                if (isPanelVisible && selectedCardId) {
                  selectCard(null);
                  setPanelOpen(false);
                  return;
                }
                setPanelOpen((current) => !current);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/35 backdrop-blur-xl transition-colors hover:border-white/[0.10] hover:text-white/60"
            >
              {isPanelVisible ? (
                <PanelRightClose className="h-3.5 w-3.5" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={spaceNodes}
          edges={spaceEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={handlePaneContextMenu}
          onInit={(instance) => {
            void instance.setViewport(viewport, { duration: 0 });
          }}
          onMoveEnd={(_, viewport) => setViewport(viewport)}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          defaultEdgeOptions={EDGE_DEFAULTS}
          defaultViewport={viewport}
          minZoom={0.1}
          maxZoom={3}
          panOnScroll
          panOnScrollMode={PanOnScrollMode.Free}
          panOnDrag
          zoomOnScroll={false}
          zoomOnPinch
          selectionOnDrag={false}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{
            stroke: "rgba(255,255,255,0.34)",
            strokeWidth: 2.4,
          }}
          onlyRenderVisibleElements
          elevateEdgesOnSelect
          className="!bg-[oklch(0.08_0_0)]"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={30}
            size={0.6}
            className="!opacity-[0.08]"
          />
          <Controls
            showInteractive={false}
            position="bottom-left"
            className="!mb-4 !ml-4 !rounded-xl !border !border-white/[0.06] !bg-white/[0.03] !shadow-xl !backdrop-blur-xl [&>button]:!border-white/[0.04] [&>button]:!bg-transparent [&>button]:!text-white/30"
          />
          <MiniMap
            nodeStrokeWidth={2}
            position="bottom-right"
            className="!mb-4 !mr-4 !rounded-xl !border !border-white/[0.06] !bg-white/[0.03] !shadow-xl !backdrop-blur-xl"
            maskColor="rgba(0,0,0,0.6)"
            nodeColor="rgba(255,255,255,0.12)"
          />
        </ReactFlow>

        {/* Empty state */}
        {spaceNodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                <Plus className="h-6 w-6 text-white/12" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/25">
                  Canvas vazio
                </p>
                <p className="mt-1 text-[11px] text-white/15">
                  Crie um card para comecar a gerar
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Right control panel — collapsible */}
      <AnimatePresence>
        {isPanelVisible && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <ControlPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-click context menu */}
      <SpaceContextMenu
        items={contextMenuItems}
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
      />
    </div>
  );
}
