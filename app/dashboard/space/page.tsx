"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Orbit,
  Plus,
  Maximize2,
  Clock,
  Layers,
  GitFork,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { createId, createSession } from "@/lib/chat-orchestrator";

function formatTime(date: Date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

interface CanvasView {
  id: string;
  title: string;
  updatedAt: Date;
  agentNames: string[];
  nodeCount: number;
  edgeCount: number;
}

export default function SpacePage() {
  const router = useRouter();
  const sessions = useWorkspaceFilteredSessions();
  const messages = useSessionStore((state) => state.messages);
  const addSession = useSessionStore((s) => s.addSession);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const agents = useAgentStore((state) => state.agents);
  const decompositions = useDecompositionStore((state) => state.decompositions);

  const handleNewCanvas = () => {
    const sessionId = createId("session");
    const session = createSession(sessionId, "Canvas em branco", activeWorkspaceId ?? undefined);
    addSession(session);
    setCurrentSession(sessionId);
    toast.success("Canvas criado!");
    router.push(`/dashboard/orchestra/${sessionId}`);
  };

  const canvases = useMemo<CanvasView[]>(() => {
    return [...sessions]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 12)
      .map((session) => {
        const sessionAgents = agents.filter(
          (a) => a.sessionId === session.id
        );
        const sessionMessages = messages.filter(
          (m) => m.sessionId === session.id
        );
        const decompositionIds = new Set<string>();
        for (const msg of sessionMessages) {
          if (msg.decompositionId) decompositionIds.add(msg.decompositionId);
        }

        const contextCount = decompositionIds.size;
        const nodeCount = 1 + contextCount + sessionAgents.length;
        const edgeCount = contextCount + sessionAgents.length;

        return {
          id: session.id,
          title: session.title,
          updatedAt: session.updatedAt,
          agentNames: sessionAgents
            .map((a) => a.name)
            .slice(0, 4),
          nodeCount,
          edgeCount,
        };
      });
  }, [sessions, messages, agents, decompositions]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.04]">
            <Orbit className="h-5 w-5 text-fuchsia-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Space</h1>
            <p className="mt-1 text-sm text-foreground/50">
              Canvas infinito para orquestracao visual — nodes, agentes e
              fluxos em tempo real
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNewCanvas}
          className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-2.5 text-sm text-fuchsia-200 transition-all hover:border-fuchsia-300/50 hover:bg-fuchsia-300/20 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Novo Canvas
        </button>
      </div>

      {/* New canvas hero */}
      <button
        type="button"
        onClick={handleNewCanvas}
        className="group mb-6 flex w-full items-center justify-center rounded-2xl border border-dashed border-foreground/[0.08] bg-card/40 py-14 backdrop-blur-sm transition-all hover:border-fuchsia-300/25 hover:bg-fuchsia-300/[0.03]"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] transition-all group-hover:border-fuchsia-300/25 group-hover:bg-fuchsia-300/10">
            <Orbit className="h-7 w-7 text-foreground/20 transition-colors group-hover:text-fuchsia-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground/50 transition-colors group-hover:text-foreground/80">
              Criar canvas em branco
            </p>
            <p className="mt-1 text-xs text-foreground/25">
              Comece com um canvas vazio e adicione nodes manualmente
            </p>
          </div>
        </div>
      </button>

      {/* Recent canvases */}
      {canvases.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground/50">
              Sessoes recentes no canvas
            </h2>
            <span className="text-[10px] text-foreground/20">
              {canvases.length} sessoes
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {canvases.map((canvas) => (
              <Link
                key={canvas.id}
                href={`/dashboard/orchestra/${canvas.id}`}
                className="group rounded-2xl border border-foreground/[0.08] bg-card/70 p-5 backdrop-blur-xl transition-all hover:border-fuchsia-300/20 hover:bg-card/80"
              >
                {/* Canvas preview placeholder */}
                <div className="mb-4 flex h-28 items-center justify-center rounded-xl border border-foreground/[0.04] bg-foreground/[0.02]">
                  <div className="flex items-center gap-3 text-foreground/15">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-5 w-14 rounded border border-neon-cyan/20 bg-neon-cyan/10" />
                      <div className="h-px w-px" />
                      <div className="flex gap-2">
                        <div className="h-4 w-4 rounded-full border border-green-400/20 bg-green-400/10" />
                        <div className="h-4 w-4 rounded-full border border-purple-400/20 bg-purple-400/10" />
                        {canvas.agentNames.length > 2 && (
                          <div className="h-4 w-4 rounded-full border border-orange-400/20 bg-orange-400/10" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title + expand */}
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-foreground/90">
                    {canvas.title}
                  </h3>
                  <Maximize2 className="h-3.5 w-3.5 text-foreground/15 transition-colors group-hover:text-foreground/40" />
                </div>

                {/* Agent pills */}
                <div className="mb-3 flex flex-wrap gap-1">
                  {canvas.agentNames.length > 0 ? (
                    canvas.agentNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[9px] text-foreground/40"
                      >
                        <Bot className="h-2.5 w-2.5" />
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[9px] text-foreground/25">
                      sem agentes
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 border-t border-foreground/[0.05] pt-3">
                  <span className="flex items-center gap-1 text-[10px] text-foreground/25">
                    <Layers className="h-3 w-3" />
                    {canvas.nodeCount} nodes
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-foreground/25">
                    <GitFork className="h-3 w-3" />
                    {canvas.edgeCount} edges
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-foreground/20">
                    <Clock className="h-3 w-3" />
                    {formatTime(canvas.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {canvases.length === 0 && (
        <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-6 backdrop-blur-xl">
          <p className="text-sm text-foreground/65">
            Nenhuma sessao disponivel. Inicie uma conversa no chat para criar
            seu primeiro canvas.
          </p>
          <div className="mt-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
            >
              Ir para Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
