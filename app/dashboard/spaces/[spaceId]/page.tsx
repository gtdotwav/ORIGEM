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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Plus, PanelRightOpen, PanelRightClose } from "lucide-react";
import { SpacesSidebar } from "@/components/spaces/spaces-sidebar";
import GenerationCardNode from "@/components/spaces/generation-card-node";
import { ControlPanel } from "@/components/spaces/control-panel";
import { useSpacesStore } from "@/stores/spaces-store";
import { cn } from "@/lib/utils";

const NODE_TYPES = {
  generation: GenerationCardNode,
};

export default function SpaceCanvasPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(true);

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
  const selectedCardId = useSpacesStore((s) => s.selectedCardId);
  const selectCard = useSpacesStore((s) => s.selectCard);

  const space = useMemo(
    () => spaces.find((s) => s.id === spaceId),
    [spaces, spaceId]
  );

  useEffect(() => {
    if (!spaceId) return;
    const existing = spaces.find((s) => s.id === spaceId);
    if (!existing) {
      createSpace("Space sem titulo");
    }
    setActiveSpace(spaceId);
  }, [spaceId, spaces, setActiveSpace, createSpace]);

  // Auto-open panel when a card is selected
  useEffect(() => {
    if (selectedCardId && !panelOpen) setPanelOpen(true);
  }, [selectedCardId, panelOpen]);

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

  const handlePaneClick = useCallback(() => {
    selectCard(null);
  }, [selectCard]);

  const handleAddCard = () => {
    if (!spaceId) return;
    createCard(spaceId, "", { x: 300, y: 200 });
  };

  const spaceNodes = useMemo(
    () =>
      nodes.filter((n) => {
        const card = useSpacesStore
          .getState()
          .cards.find((c) => c.id === n.id);
        return card?.spaceId === spaceId;
      }),
    [nodes, spaceId]
  );

  const spaceEdges = useMemo(() => {
    const nodeIds = new Set(spaceNodes.map((n) => n.id));
    return edges.filter(
      (e) => nodeIds.has(e.source) || nodeIds.has(e.target)
    );
  }, [edges, spaceNodes]);

  return (
    <div className="fixed inset-0 z-50 flex bg-[oklch(0.09_0_0)]">
      {/* Left sidebar — compact tools */}
      <SpacesSidebar />

      {/* Center — Infinite Canvas */}
      <div className="relative flex-1">
        {/* Top bar — floating overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2.5">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/spaces")}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-medium text-white/50">
              {space?.name ?? "Space"}
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAddCard}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/70"
            >
              <Plus className="h-3 w-3" />
              Novo Card
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen(!panelOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition-all hover:bg-white/[0.06] hover:text-white/60"
            >
              {panelOpen ? (
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
          onMoveEnd={(_, viewport) => setViewport(viewport)}
          nodeTypes={NODE_TYPES}
          fitView
          minZoom={0.1}
          maxZoom={3}
          className="!bg-[oklch(0.09_0_0)]"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={32}
            size={0.6}
            className="!opacity-[0.12]"
          />
          <Controls
            showInteractive={false}
            className="!rounded-lg !border !border-white/[0.06] !bg-white/[0.03] !shadow-none [&>button]:!border-white/[0.04] [&>button]:!bg-transparent [&>button]:!text-white/25 [&>button:hover]:!bg-white/[0.06] [&>button:hover]:!text-white/50"
          />
          <MiniMap
            nodeStrokeWidth={2}
            className="!rounded-lg !border !border-white/[0.06] !bg-white/[0.03] !shadow-none"
            maskColor="rgba(0,0,0,0.5)"
          />
        </ReactFlow>

        {/* Empty state */}
        {spaceNodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                <Plus className="h-5 w-5 text-white/15" />
              </div>
              <p className="text-xs text-white/25">
                Crie um card para comecar
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Right control panel — collapsible */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <ControlPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
