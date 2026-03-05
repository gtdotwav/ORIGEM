"use client";

import { useEffect, useMemo, useCallback } from "react";
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
import { ArrowLeft, Plus, Maximize2 } from "lucide-react";
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

  // Ensure space exists and is active
  useEffect(() => {
    if (!spaceId) return;
    const existing = spaces.find((s) => s.id === spaceId);
    if (!existing) {
      createSpace("Space sem titulo");
    }
    setActiveSpace(spaceId);
  }, [spaceId, spaces, setActiveSpace, createSpace]);

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
    () => nodes.filter((n) => {
      const card = useSpacesStore.getState().cards.find((c) => c.id === n.id);
      return card?.spaceId === spaceId;
    }),
    [nodes, spaceId]
  );

  const spaceEdges = useMemo(() => {
    const nodeIds = new Set(spaceNodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.source) || nodeIds.has(e.target));
  }, [edges, spaceNodes]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Left sidebar */}
      <SpacesSidebar />

      {/* Center — Infinite Canvas */}
      <div className="relative flex-1">
        {/* Top bar overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/spaces")}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-foreground/[0.06] bg-[oklch(0.15_0_0)] text-foreground/40 transition-all hover:bg-[oklch(0.18_0_0)] hover:text-foreground/60"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="rounded-xl border border-foreground/[0.06] bg-[oklch(0.15_0_0)] px-3 py-1.5">
              <h2 className="text-xs font-semibold text-foreground/60">
                {space?.name ?? "Space"}
              </h2>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddCard}
              className="flex items-center gap-1.5 rounded-xl border border-foreground/[0.08] bg-[oklch(0.15_0_0)] px-3 py-1.5 text-xs text-foreground/50 transition-all hover:border-foreground/[0.12] hover:bg-[oklch(0.18_0_0)] hover:text-foreground/70"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Card
            </button>
          </div>
        </div>

        {/* React Flow Canvas — plain static background */}
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
          className="!bg-[oklch(0.11_0_0)]"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={0.8}
            className="!opacity-20"
          />
          <Controls
            showInteractive={false}
            className="!rounded-xl !border !border-foreground/[0.06] !bg-[oklch(0.15_0_0)] !shadow-md [&>button]:!border-foreground/[0.05] [&>button]:!bg-transparent [&>button]:!text-foreground/35 [&>button:hover]:!bg-foreground/[0.06] [&>button:hover]:!text-foreground/55"
          />
          <MiniMap
            nodeStrokeWidth={3}
            className="!rounded-xl !border !border-foreground/[0.06] !bg-[oklch(0.13_0_0)] !shadow-md"
            maskColor="rgba(0,0,0,0.4)"
          />
        </ReactFlow>

        {/* Empty state — plain, no glow */}
        {spaceNodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04]">
                <Maximize2 className="h-6 w-6 text-foreground/15" />
              </div>
              <div className="text-center">
                <p className="text-sm text-foreground/35">Canvas vazio</p>
                <p className="mt-1 text-xs text-foreground/18">
                  Clique em &quot;Novo Card&quot; ou use o botao + na sidebar
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right control panel */}
      <ControlPanel />
    </div>
  );
}
