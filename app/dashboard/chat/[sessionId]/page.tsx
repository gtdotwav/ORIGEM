"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  GripVertical,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
} from "lucide-react";
import { JourneyConnectorCard } from "@/components/chat/journey-connector-card";
import { RealtimeDistributionBubble } from "@/components/chat/realtime-distribution-bubble";
import {
  ensureSessionRecord,
  hydrateSessionSnapshot,
  persistSessionSnapshot,
} from "@/lib/chat-backend-client";
import { cn } from "@/lib/utils";
import {
  createMessage,
  createSession,
  runChatOrchestration,
  toSessionTitle,
} from "@/lib/chat-orchestrator";
import { useAgentStore } from "@/stores/agent-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import type { RuntimeLanguage, RuntimeTask } from "@/types/runtime";

const STAGE_LABELS: Record<string, string> = {
  idle: "Aguardando",
  intake: "Intake",
  decomposing: "Decompondo",
  routing: "Roteando",
  spawning: "Delegando",
  executing: "Executando",
  branching: "Ajustando",
  aggregating: "Agregando",
  complete: "Concluido",
  error: "Erro",
};

const LANGUAGE_OPTIONS: { value: RuntimeLanguage; label: string }[] = [
  { value: "pt-BR", label: "Portugues" },
  { value: "en-US", label: "English" },
  { value: "es-ES", label: "Espanol" },
];

function shouldRenderDistribution(metadata: Record<string, unknown> | undefined) {
  return metadata?.includeDistribution === true;
}

function isNoteMessage(metadata: Record<string, unknown> | undefined) {
  return metadata?.note === true;
}

function isJourneySystemMessage(metadata: Record<string, unknown> | undefined) {
  return metadata?.journeyStep === true;
}

function shouldRenderJourney(metadata: Record<string, unknown> | undefined) {
  return metadata?.includeJourney === true;
}

function formatMessageTime(date: Date) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTaskStatusLabel(status: RuntimeTask["status"]) {
  if (status === "running") {
    return "Em execucao";
  }
  if (status === "done") {
    return "Concluida";
  }
  if (status === "blocked") {
    return "Bloqueada";
  }

  return "Pendente";
}

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [input, setInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hydratedSessionIdRef = useRef<string | null>(null);

  const sessions = useSessionStore((s) => s.sessions);
  const messages = useSessionStore((s) => s.messages);
  const addSession = useSessionStore((s) => s.addSession);
  const addMessage = useSessionStore((s) => s.addMessage);
  const updateSession = useSessionStore((s) => s.updateSession);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);

  const stage = usePipelineStore((s) => s.stage);
  const progress = usePipelineStore((s) => s.progress);

  const runtime = useRuntimeStore((s) => s.sessions[sessionId]);
  const ensureSessionRuntime = useRuntimeStore((s) => s.ensureSession);
  const setLanguage = useRuntimeStore((s) => s.setLanguage);
  const reorderTasks = useRuntimeStore((s) => s.reorderTasks);
  const addRuntimeNote = useRuntimeStore((s) => s.addNote);
  const agents = useAgentStore((s) => s.agents);
  const groups = useAgentStore((s) => s.groups);

  const selectedLanguage = runtime?.language ?? "pt-BR";

  const persistSnapshotQuietly = () => {
    void persistSessionSnapshot(sessionId).catch((error) => {
      console.error("Failed to persist session snapshot", error);
    });
  };

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

  const latestAssistantMessageId = useMemo(() => {
    const reversed = [...sessionMessages].reverse();
    return reversed.find((message) => message.role === "assistant")?.id ?? null;
  }, [sessionMessages]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    if (hydratedSessionIdRef.current === sessionId) {
      return;
    }

    setCurrentSession(sessionId);
    ensureSessionRuntime(sessionId);

    const hasSession = sessions.some((session) => session.id === sessionId);
    if (!hasSession) {
      const created = createSession(sessionId, `Sessao ${sessionId.slice(0, 8)}`);
      addSession(created);
      void ensureSessionRecord(sessionId, created.title).catch((error) => {
        console.error("Failed to create backend session record", error);
      });
    }

    const hasLocalMessages = messages.some(
      (message) => message.sessionId === sessionId
    );
    const localRuntime = useRuntimeStore.getState().sessions[sessionId];
    const hasLocalRuntimeState =
      Boolean(localRuntime?.runId) ||
      Boolean(localRuntime?.isRunning) ||
      Boolean(localRuntime?.tasks.length);
    const hasLocalAgents = agents.some((agent) => agent.sessionId === sessionId);
    const hasLocalGroups = groups.some((group) => group.sessionId === sessionId);

    hydratedSessionIdRef.current = sessionId;

    if (
      hasLocalMessages ||
      hasLocalRuntimeState ||
      hasLocalAgents ||
      hasLocalGroups
    ) {
      return;
    }

    void hydrateSessionSnapshot(sessionId).catch((error) => {
      console.error("Failed to hydrate session snapshot", error);
      hydratedSessionIdRef.current = null;
    });
  }, [
    sessionId,
    sessions,
    messages,
    agents,
    groups,
    setCurrentSession,
    addSession,
    ensureSessionRuntime,
  ]);

  useEffect(() => {
    if (!sessionId || !runtime?.isRunning) {
      return;
    }

    const timer = setInterval(() => {
      persistSnapshotQuietly();
    }, 900);

    return () => clearInterval(timer);
  }, [sessionId, runtime?.isRunning]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [sessionMessages.length, isSending, stage, runtime?.overallProgress]);

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
      await runChatOrchestration(sessionId, text, {
        language: selectedLanguage,
      });
      persistSnapshotQuietly();
    } finally {
      setIsSending(false);
    }
  };

  const sendNote = () => {
    const note = noteInput.trim();
    if (!note || !sessionId) {
      return;
    }

    const runningTask = runtime?.tasks.find((task) => task.status === "running");
    addRuntimeNote(sessionId, note, runningTask?.id);

    addMessage(
      createMessage(sessionId, "system", `Nota enviada: ${note}`, {
        note: true,
      })
    );

    setNoteInput("");
    persistSnapshotQuietly();
  };

  const liveProgress = runtime?.overallProgress ?? progress;
  const showLiveRuntimeBubble = Boolean(runtime?.isRunning) && !isSending;

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
            style={{ width: `${liveProgress}%` }}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="min-h-0 rounded-2xl border border-white/[0.08] bg-neutral-900/70 backdrop-blur-xl">
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
              {sessionMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Sparkles className="h-5 w-5 text-neon-cyan/80" />
                  <p className="text-sm text-white/55">
                    Envie sua primeira mensagem para disparar delegacao de contexto, projeto, agentes e grupos.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionMessages.map((message) => {
                    const isUser = message.role === "user";
                    const isNote = message.role === "system" && isNoteMessage(message.metadata);
                    const isJourneyStepUpdate =
                      message.role === "system" && isJourneySystemMessage(message.metadata);

                    if (isNote) {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <div className="max-w-[88%] rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2">
                            <p className="text-xs text-amber-100/90">{message.content}</p>
                            <span className="mt-1 block text-[10px] text-amber-100/55">
                              {formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isJourneyStepUpdate) {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <div className="max-w-[88%] rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2">
                            <p className="text-xs text-cyan-100/90">{message.content}</p>
                            <span className="mt-1 block text-[10px] text-cyan-100/55">
                              {formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    }

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
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                          {!isUser && shouldRenderDistribution(message.metadata) && (
                            <RealtimeDistributionBubble sessionId={sessionId} />
                          )}
                          {!isUser &&
                            shouldRenderJourney(message.metadata) &&
                            latestAssistantMessageId === message.id && (
                              <JourneyConnectorCard
                                sessionId={sessionId}
                                onStepOpen={(step) => {
                                  addMessage(
                                    createMessage(
                                      sessionId,
                                      "system",
                                      `Etapa aberta: ${step.label}. Revise essa fase e volte ao chat para continuar a proxima conexao.`,
                                      {
                                        journeyStep: true,
                                      }
                                    )
                                  );
                                  persistSnapshotQuietly();
                                }}
                              />
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
                      <div className="max-w-[88%] rounded-2xl border border-white/[0.09] bg-black/35 px-4 py-3">
                        <div className="inline-flex items-center gap-2 text-xs text-white/65">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" />
                          Processando e delegando em tempo real...
                        </div>
                        <RealtimeDistributionBubble
                          sessionId={sessionId}
                          showTaskList={false}
                        />
                      </div>
                    </div>
                  )}

                  {showLiveRuntimeBubble && (
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl border border-white/[0.09] bg-black/35 px-4 py-3">
                        <div className="inline-flex items-center gap-2 text-xs text-white/65">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" />
                          Distribuicao em execucao...
                        </div>
                        <RealtimeDistributionBubble
                          sessionId={sessionId}
                          showTaskList={false}
                        />
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

        <aside className="min-h-0 rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Controle da Execucao
              </p>
              <p className="mt-1 text-sm text-white/65">
                Ajuste linguagem, prioridade e notas durante o processamento.
              </p>
            </div>

            <div className="mb-3 rounded-xl border border-white/[0.08] bg-black/30 p-3">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/35">
                Linguagem da resposta
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) =>
                  {
                    setLanguage(sessionId, e.target.value as RuntimeLanguage);
                    persistSnapshotQuietly();
                  }}
                className="w-full rounded-md border border-white/[0.08] bg-neutral-900 px-2 py-1.5 text-xs text-white outline-none"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 min-h-0 flex-1 rounded-xl border border-white/[0.08] bg-black/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide text-white/35">
                  Prioridade das funcoes (drag and drop)
                </p>
                <span className="text-[10px] text-white/30">
                  {runtime?.tasks.length ?? 0} itens
                </span>
              </div>

              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                {runtime?.tasks.length ? (
                  runtime.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDragEnd={() => setDraggedTaskId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!draggedTaskId) {
                          return;
                        }
                        reorderTasks(sessionId, draggedTaskId, task.id);
                        setDraggedTaskId(null);
                        persistSnapshotQuietly();
                      }}
                      className="cursor-grab rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 text-white/30" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] text-white/80">
                            {task.priority}. {task.title}
                          </p>
                          <p className="text-[10px] text-white/40">
                            {task.agentName} · {getTaskStatusLabel(task.status)} · {task.progress}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/40">
                    As funcoes delegadas aparecerao aqui assim que voce enviar a mensagem.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/35">
                Notas para execucao
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Ex: priorize seguranca e responda com exemplos"
                className="h-20 w-full resize-none rounded-md border border-white/[0.08] bg-neutral-900 px-2 py-1.5 text-xs text-white placeholder:text-white/25 outline-none"
              />
              <button
                type="button"
                onClick={sendNote}
                disabled={!noteInput.trim()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300/25 bg-amber-300/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 transition-all hover:border-amber-300/45 hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Enviar nota
              </button>

              {runtime?.notes.length ? (
                <div className="mt-2 space-y-1.5 border-t border-white/[0.06] pt-2">
                  {runtime.notes
                    .slice(-3)
                    .reverse()
                    .map((note) => (
                      <div
                        key={note.id}
                        className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1"
                      >
                        <p className="text-[11px] text-white/70">{note.text}</p>
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
