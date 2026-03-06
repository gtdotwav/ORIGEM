"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  Copy,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { JourneyConnectorCard } from "@/components/chat/journey-connector-card";
import { AgentTaskCards } from "@/components/chat/agent-task-cards";
import { LLMSelector } from "@/components/chat/llm-selector";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { CriticPanel } from "@/components/chat/critic-panel";
import { CriticAnnotations } from "@/components/chat/critic-annotations";
import { LeftToolbar } from "@/components/layout/left-toolbar";
import { ChatModeToggle } from "@/components/apps/chat-mode-toggle";
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
  runSimpleChat,
  toSessionTitle,
} from "@/lib/chat-orchestrator";
import { useAgentStore } from "@/stores/agent-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { usePersonaStore } from "@/stores/persona-store";

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

interface ImageAttachmentMetadata {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

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

function getImageAttachment(
  metadata: Record<string, unknown> | undefined
): ImageAttachmentMetadata | null {
  const rawAttachment = metadata?.imageAttachment;

  if (!rawAttachment || typeof rawAttachment !== "object") {
    return null;
  }

  const attachment = rawAttachment as Partial<ImageAttachmentMetadata>;
  if (
    typeof attachment.name !== "string" ||
    typeof attachment.type !== "string" ||
    typeof attachment.size !== "number" ||
    typeof attachment.dataUrl !== "string"
  ) {
    return null;
  }

  return attachment as ImageAttachmentMetadata;
}

function formatMessageTime(date: Date) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);

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
  const agents = useAgentStore((s) => s.agents);
  const groups = useAgentStore((s) => s.groups);
  const chatMode = usePersonaStore((s) => s.chatMode);

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
      if (chatMode === "ecosystem") {
        await runChatOrchestration(sessionId, text, {
          language: selectedLanguage,
        });
      } else {
        await runSimpleChat(sessionId, text);
      }
      persistSnapshotQuietly();
    } catch {
      toast.error("Erro ao processar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const liveProgress = runtime?.overallProgress ?? progress;
  const showLiveRuntimeBubble = Boolean(runtime?.isRunning) && !isSending;

  return (
    <div className="mx-auto flex h-[calc(100vh-130px)] w-full max-w-4xl flex-col px-4 pb-6 pt-4 md:px-6">
      <LeftToolbar currentSessionId={sessionId} />

      {/* Header with glow */}
      <div className="relative mb-4">
        <div className="pointer-events-none absolute -inset-6 rounded-[32px] border border-neon-cyan/6 bg-neon-cyan/3 blur-xl" />
        <div className="relative rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/30">
                Sessao de Chat
              </p>
              <h1 className="text-lg font-semibold text-foreground/90">
                {currentSession?.title ?? `Sessao ${sessionId?.slice(0, 8)}`}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-foreground/[0.09] bg-foreground/[0.04] px-3 py-1 text-xs text-foreground/70">
                Etapa: {STAGE_LABELS[stage] ?? stage}
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

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
            <div
              className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
              style={{ width: `${liveProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chat area — full width */}
      <section className="min-h-0 flex-1 rounded-2xl border border-foreground/[0.08] bg-card/70 shadow-2xl backdrop-blur-xl">
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {sessionMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Sparkles className="h-5 w-5 text-neon-cyan/80" />
                <p className="text-sm text-foreground/55">
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
                  const imageAttachment = getImageAttachment(message.metadata);

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
                        "flex w-full animate-message-in",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "group relative max-w-[88%] rounded-2xl border px-4 py-3",
                          isUser
                            ? "border-neon-cyan/30 bg-neon-cyan/10 text-foreground"
                            : "border-foreground/[0.09] bg-black/35 text-foreground/85"
                        )}
                      >
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(message.content);
                              toast.success("Copiado!");
                            }}
                            className="absolute right-2 top-2 rounded-md p-1 text-foreground/20 opacity-0 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50 group-hover:opacity-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {imageAttachment ? (
                          <div className="mb-2 overflow-hidden rounded-xl border border-foreground/[0.12] bg-black/20">
                            <img
                              src={imageAttachment.dataUrl}
                              alt={imageAttachment.name}
                              className="max-h-64 w-full object-cover"
                            />
                            <div className="px-2.5 py-1.5 text-[10px] text-foreground/60">
                              {imageAttachment.name}
                            </div>
                          </div>
                        ) : null}
                        {isUser ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}
                        {!isUser &&
                          Array.isArray(
                            (message.metadata as Record<string, unknown> | undefined)
                              ?.criticResults
                          ) && (
                            <CriticAnnotations
                              results={
                                (message.metadata as Record<string, unknown>)
                                  .criticResults as import("@/types/chat").CriticResult[]
                              }
                            />
                          )}
                        {!isUser && shouldRenderDistribution(message.metadata) && (
                          <AgentTaskCards
                            sessionId={sessionId}
                            intent={
                              (message.metadata as Record<string, unknown>)
                                ?.intent as import("@/types/decomposition").Intent | undefined
                            }
                          />
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
                        <span className="mt-2 block text-[10px] text-foreground/35">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-2xl border border-foreground/[0.09] bg-black/35 px-4 py-3">
                      <div className="inline-flex items-center gap-2 text-xs text-foreground/65">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" />
                        Processando e delegando em tempo real...
                      </div>
                      <AgentTaskCards sessionId={sessionId} />
                    </div>
                  </div>
                )}

                {showLiveRuntimeBubble && (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-2xl border border-foreground/[0.09] bg-black/35 px-4 py-3">
                      <div className="inline-flex items-center gap-2 text-xs text-foreground/65">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" />
                        Distribuicao em execucao...
                      </div>
                      <AgentTaskCards sessionId={sessionId} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            className="border-t border-foreground/[0.07] p-3 md:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            {/* Expanded tools row */}
            {toolsExpanded && (
              <div className="mb-2 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <LLMSelector />
                <ChatModeToggle />
              </div>
            )}

            {/* Main input row */}
            <div className="flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-black/30 p-2.5">
              {toolsExpanded && (
                <AIVoiceInput
                  onStop={(dur) => {
                    if (dur > 0) setInput((prev) => `[Audio: ${dur}s] ${prev}`);
                  }}
                />
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none"
              />
              {toolsExpanded && <CriticPanel />}
              <button
                type="button"
                onClick={() => setToolsExpanded(!toolsExpanded)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", toolsExpanded && "rotate-180")} />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar
              </button>
            </div>

            {/* Mode indicator */}
            <div className="mt-1.5 px-1">
              <span className="text-[10px] text-foreground/25">
                {chatMode === "ecosystem" ? "agent ∞" : "chat direto"}
              </span>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
