"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { ChatSessionNode } from "@/components/canvas/chat-session-node";
import { useChatFlowStore } from "@/stores/chat-flow-store";
import { useSessionStore } from "@/stores/session-store";
import { CANVAS_CONFIG } from "@/config/canvas";
import type { ChatSessionNodeData } from "@/types/canvas";

const NODE_TYPES = { "chat-session": ChatSessionNode };

export default function CanvasPage() {
  const flows = useChatFlowStore((s) => s.flows);
  const activeFlowId = useChatFlowStore((s) => s.activeFlowId);
  const createFlow = useChatFlowStore((s) => s.createFlow);
  const removeFlow = useChatFlowStore((s) => s.removeFlow);
  const setActiveFlow = useChatFlowStore((s) => s.setActiveFlow);
  const addSessionNode = useChatFlowStore((s) => s.addSessionNode);
  const addEdge = useChatFlowStore((s) => s.addEdge);
  const onNodesChange = useChatFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useChatFlowStore((s) => s.onEdgesChange);
  const updateViewport = useChatFlowStore((s) => s.updateViewport);

  const sessions = useSessionStore((s) => s.sessions);
  const messages = useSessionStore((s) => s.messages);

  const [pickerOpen, setPickerOpen] = useState(false);

  const activeFlow = useMemo(
    () => flows.find((f) => f.id === activeFlowId),
    [flows, activeFlowId]
  );

  const addedSessionIds = useMemo(() => {
    if (!activeFlow) return new Set<string>();
    return new Set(
      activeFlow.nodes.map((n) => (n.data as ChatSessionNodeData).sessionId)
    );
  }, [activeFlow]);

  const availableSessions = useMemo(
    () => sessions.filter((s) => !addedSessionIds.has(s.id)),
    [sessions, addedSessionIds]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!activeFlowId || !connection.source || !connection.target) return;
      const edge: Edge = {
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: "smoothstep",
        animated: true,
        style: { stroke: "oklch(0.78 0.15 195 / 0.5)", strokeWidth: 2 },
      };
      addEdge(activeFlowId, edge);
    },
    [activeFlowId, addEdge]
  );

  const handleAddSession = (sessionId: string) => {
    if (!activeFlowId) return;
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const msgCount = messages.filter((m) => m.sessionId === sessionId).length;
    addSessionNode(activeFlowId, sessionId, session.title, msgCount, session.status);
    setPickerOpen(false);
    toast.success("Sessao adicionada ao canvas");
  };

  const handleCreateFlow = () => {
    const id = createFlow(`Canvas ${flows.length + 1}`);
    setActiveFlow(id);
    toast.success("Novo canvas criado");
  };

  // No active flow — show flow list / create button
  if (!activeFlow) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors hover:text-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">Canvas de Fluxos</h1>
            <p className="mt-0.5 text-xs text-white/40">
              Conecte sessoes de chat em fluxos visuais
            </p>
          </div>
        </div>

        {flows.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/[0.10] bg-neutral-900/50 py-16 text-center backdrop-blur-xl">
            <Workflow className="mb-3 h-10 w-10 text-neon-purple/40" />
            <p className="text-sm text-white/50">Nenhum canvas criado</p>
            <p className="mt-1 text-xs text-white/25">
              Crie um canvas para conectar seus chats em fluxos
            </p>
            <button
              type="button"
              onClick={handleCreateFlow}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-neon-purple/30 bg-neon-purple/10 px-4 py-2 text-xs font-medium text-neon-purple transition-all hover:border-neon-purple/50 hover:bg-neon-purple/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar Canvas
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {flows.map((flow) => (
              <button
                key={flow.id}
                type="button"
                onClick={() => setActiveFlow(flow.id)}
                className="group flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 text-left backdrop-blur-xl transition-all hover:border-neon-purple/20 hover:bg-neutral-900/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-purple/10">
                    <Workflow className="h-4 w-4 text-neon-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{flow.name}</p>
                    <p className="text-[10px] text-white/30">
                      {flow.nodes.length} sessoes · {flow.edges.length} conexoes
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFlow(flow.id);
                    toast.success("Canvas removido");
                  }}
                  className="rounded-md p-1.5 text-white/20 opacity-0 transition-all hover:bg-white/[0.06] hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}

            <button
              type="button"
              onClick={handleCreateFlow}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-neon-purple/30 bg-neon-purple/10 px-4 py-2 text-xs font-medium text-neon-purple transition-all hover:border-neon-purple/50 hover:bg-neon-purple/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Canvas
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active flow — show React Flow canvas
  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-neutral-950/80 px-4 py-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveFlow(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors hover:text-white/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-neon-purple" />
            <span className="text-sm font-medium text-white/80">
              {activeFlow.name}
            </span>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/30">
              {activeFlow.nodes.length} sessoes
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen(!pickerOpen)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Sessao
          </button>

          {pickerOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/[0.08] bg-neutral-950/95 p-2 shadow-2xl backdrop-blur-xl">
              <p className="mb-1.5 px-2 text-[10px] uppercase tracking-wide text-white/30">
                Sessoes disponiveis
              </p>
              {availableSessions.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-white/30">
                  Todas as sessoes ja foram adicionadas
                </p>
              ) : (
                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                  {availableSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => handleAddSession(session.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
                    >
                      <span className="truncate text-xs text-white/70">
                        {session.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* React Flow canvas */}
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={activeFlow.nodes}
          edges={activeFlow.edges}
          onNodesChange={(changes) => onNodesChange(activeFlow.id, changes)}
          onEdgesChange={(changes) => onEdgesChange(activeFlow.id, changes)}
          onConnect={handleConnect}
          onMoveEnd={(_, viewport) => updateViewport(activeFlow.id, viewport)}
          nodeTypes={NODE_TYPES}
          defaultViewport={activeFlow.viewport}
          minZoom={CANVAS_CONFIG.minZoom}
          maxZoom={CANVAS_CONFIG.maxZoom}
          snapToGrid
          snapGrid={CANVAS_CONFIG.snapGrid}
          fitView
          proOptions={{ hideAttribution: true }}
          className="origem-flow"
        >
          <Background gap={20} size={1} color="oklch(1 0 0 / 0.04)" />
          <Controls
            showInteractive={false}
            className="!rounded-xl !border-white/[0.08] !bg-neutral-900/80 !shadow-xl backdrop-blur-xl [&>button]:!border-white/[0.06] [&>button]:!bg-transparent [&>button]:!text-white/40 [&>button:hover]:!bg-white/[0.06] [&>button:hover]:!text-white/70"
          />
          <MiniMap
            className="!rounded-xl !border-white/[0.08] !bg-neutral-900/80 backdrop-blur-xl"
            nodeColor="oklch(0.78 0.15 195 / 0.3)"
            maskColor="oklch(0 0 0 / 0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
