"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { RealtimeDistributionBubble } from "@/components/chat/realtime-distribution-bubble";
import { cn } from "@/lib/utils";
import {
  createMessage,
  createSession,
  runChatOrchestration,
  toSessionTitle,
} from "@/lib/chat-orchestrator";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useSessionStore } from "@/stores/session-store";

const STAGE_LABELS: Record<string, string> = {
  idle: "Aguardando",
  intake: "Intake",
  decomposing: "Decompondo",
  routing: "Roteando",
  spawning: "Criando agentes",
  executing: "Executando",
  branching: "Ramificando",
  aggregating: "Agregando",
  complete: "Concluido",
  error: "Erro",
};

function shouldRenderDistribution(
  metadata: Record<string, unknown> | undefined
) {
  return metadata?.includeDistribution === true;
}

function formatMessageTime(date: Date) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessions = useSessionStore((s) => s.sessions);
  const messages = useSessionStore((s) => s.messages);
  const addSession = useSessionStore((s) => s.addSession);
  const addMessage = useSessionStore((s) => s.addMessage);
  const updateSession = useSessionStore((s) => s.updateSession);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);

  const stage = usePipelineStore((s) => s.stage);
  const progress = usePipelineStore((s) => s.progress);
  const contextCount = useDecompositionStore(
    (s) => Object.keys(s.decompositions).length
  );
  const projectCount = useSessionStore((s) => s.sessions.length);
  const agentCount = useAgentStore((s) => s.agents.length);
  const groupCount = useAgentStore((s) => s.groups.length);

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === sessionId),
    [sessions, sessionId]
  );

  const sessionMessages = useMemo(
    () =>
      messages
        .filter((message) => message.sessionId === sessionId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        ),
    [messages, sessionId]
  );

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    setCurrentSession(sessionId);

    const hasSession = sessions.some((session) => session.id === sessionId);
    if (!hasSession) {
      addSession(createSession(sessionId, `Sessao ${sessionId.slice(0, 8)}`));
    }
  }, [sessionId, sessions, setCurrentSession, addSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [sessionMessages.length, isSending, stage]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !sessionId || isSending) {
      return;
    }

    if (!currentSession) {
      addSession(createSession(sessionId, text));
    } else {
      updateSession(sessionId, {
        updatedAt: new Date(),
        title:
          currentSession.title.startsWith("Sessao ")
            ? toSessionTitle(text)
            : currentSession.title,
      });
    }

    addMessage(createMessage(sessionId, "user", text));
    setInput("");
    setIsSending(true);

    try {
      await runChatOrchestration(sessionId, text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-130px)] w-full max-w-6xl flex-col px-4 pb-6 pt-4 md:px-6">
      <div className="mb-4 rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
              Chat Session
            </p>
            <h1 className="text-lg font-semibold text-white/90">
              {currentSession?.title ?? `Sessao ${sessionId?.slice(0, 8)}`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1 text-xs text-white/70">
              Pipeline: {STAGE_LABELS[stage] ?? stage}
            </span>
            <Link
              href={`/dashboard/orchestra/${sessionId}`}
              className="inline-flex items-center gap-1 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
            >
              Canvas
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <section className="min-h-0 rounded-2xl border border-white/[0.08] bg-neutral-900/70 backdrop-blur-xl">
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
              {sessionMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Sparkles className="h-5 w-5 text-neon-cyan/80" />
                  <p className="text-sm text-white/55">
                    Envie sua primeira mensagem para disparar o fluxo completo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionMessages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex w-full",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-2xl border px-4 py-3",
                            isUser
                              ? "border-neon-cyan/30 bg-neon-cyan/10 text-white"
                              : "border-white/[0.09] bg-black/35 text-white/85"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {!isUser &&
                            shouldRenderDistribution(message.metadata) && (
                              <RealtimeDistributionBubble />
                            )}
                          <span className="mt-2 block text-[10px] text-white/35">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {isSending && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-black/35 px-4 py-2.5 text-xs text-white/65">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" />
                        Processando contexto, agentes e grupos...
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form
              className="border-t border-white/[0.07] p-3 md:p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
            >
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 p-2.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem para acionar todas as funcionalidades..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="hidden min-h-0 rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl lg:flex lg:flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
            Estado Global
          </p>
          <p className="mt-1 text-sm text-white/65">
            Distribuicao sincronizada com o chat.
          </p>

          <div className="mt-4 space-y-2.5">
            <div className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white/70">
              Contextos: {contextCount}
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white/70">
              Projetos: {projectCount}
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white/70">
              Agentes: {agentCount}
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white/70">
              Grupos: {groupCount}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
