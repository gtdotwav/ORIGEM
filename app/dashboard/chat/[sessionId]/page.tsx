"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Copy,
  Loader2,
  Send,
  Blocks,
  Brain,
  Zap,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { JourneyConnectorCard } from "@/components/chat/journey-connector-card";
import { AgentTaskCards } from "@/components/chat/agent-task-cards";
import { ChatControlsMenu } from "@/components/chat/chat-controls-menu";
import { ChatSessionMenu } from "@/components/chat/chat-session-menu";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { CriticAnnotations } from "@/components/chat/critic-annotations";
import { LeftToolbar } from "@/components/layout/left-toolbar";
import { useClientMounted } from "@/hooks/use-client-mounted";
import {
  ensureSessionRecord,
  hydrateSessionSnapshot,
  persistSessionSnapshot,
} from "@/lib/chat-backend-client";
import {
  buildCalendarPromptContext,
  mergeCalendarMetadata,
} from "@/lib/chat/calendar-context";
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
import { useWorkspaceStore } from "@/stores/workspace-store";

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

function formatMessageTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const mounted = useClientMounted();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);

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
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const selectedLanguage = runtime?.language ?? "pt-BR";

  const persistSnapshotQuietly = useCallback(() => {
    void persistSessionSnapshot(sessionId).catch((error) => {
      console.error("Failed to persist session snapshot", error);
    });
  }, [sessionId]);

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === sessionId),
    [sessions, sessionId]
  );

  const currentWorkspaceId = useMemo(() => {
    if (typeof currentSession?.workspaceId === "string" && currentSession.workspaceId.length > 0) {
      return currentSession.workspaceId;
    }

    const metadataWorkspaceId = currentSession?.metadata?.workspaceId;
    if (typeof metadataWorkspaceId === "string" && metadataWorkspaceId.length > 0) {
      return metadataWorkspaceId;
    }

    return activeWorkspaceId ?? undefined;
  }, [activeWorkspaceId, currentSession]);

  const currentWorkspaceName = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === currentWorkspaceId)?.name,
    [currentWorkspaceId, workspaces]
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
    for (let i = sessionMessages.length - 1; i >= 0; i--) {
      if (sessionMessages[i].role === "assistant") return sessionMessages[i].id;
    }
    return null;
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
      const created = createSession(
        sessionId,
        `Sessao ${sessionId.slice(0, 8)}`,
        activeWorkspaceId ?? undefined
      );
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
    activeWorkspaceId,
  ]);

  useEffect(() => {
    if (!sessionId || !runtime?.isRunning) {
      return;
    }

    const timer = setInterval(() => {
      persistSnapshotQuietly();
    }, 5_000);

    return () => clearInterval(timer);
  }, [sessionId, runtime?.isRunning, persistSnapshotQuietly]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [sessionMessages.length, isSending, stage, runtime?.overallProgress, streamingContent]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !sessionId || isSending) {
      return;
    }

    if (!currentSession) {
      addSession(createSession(sessionId, text, activeWorkspaceId ?? undefined));
    } else {
      const updates: Parameters<typeof updateSession>[1] = {
        updatedAt: new Date().toISOString(),
        title:
          currentSession.title.startsWith("Sessao ")
            ? toSessionTitle(text)
            : currentSession.title,
      };

      if (!currentSession.workspaceId && activeWorkspaceId) {
        updates.workspaceId = activeWorkspaceId;
      }

      updateSession(sessionId, updates);
    }

    const calendarContext = buildCalendarPromptContext(text);

    addMessage(
      createMessage(
        sessionId,
        "user",
        text,
        mergeCalendarMetadata(undefined, calendarContext)
      )
    );
    setInput("");
    setIsSending(true);

    try {
      if (chatMode === "ecosystem") {
        await runChatOrchestration(sessionId, text, {
          language: selectedLanguage,
          calendarContext,
        });
      } else {
        setStreamingContent("");
        await runSimpleChat(sessionId, text, {
          calendarContext,
          onStreamChunk: (content) => setStreamingContent(content),
        });
        setStreamingContent(null);
      }
      persistSnapshotQuietly();
    } catch (error) {
      setStreamingContent(null);
      const detail = error instanceof Error ? error.message : "";
      toast.error(detail ? `Erro: ${detail}` : "Erro ao processar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const liveProgress = runtime?.overallProgress ?? progress;
  const showLiveRuntimeBubble = Boolean(runtime?.isRunning) && !isSending;

  if (!mounted) {
    return <div className="mx-auto min-h-[calc(100vh-130px)] w-full max-w-4xl px-4 pb-[8.5rem] pt-2 md:px-6 md:pb-6 md:pt-4" />;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-130px)] w-full max-w-4xl flex-col px-4 pb-[8.5rem] pt-2 md:h-[calc(100vh-130px)] md:px-6 md:pb-6 md:pt-4">

      <div className="mb-3 rounded-[24px] border border-foreground/[0.08] bg-card/74 p-4 shadow-2xl backdrop-blur-xl md:mb-4 md:rounded-[28px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/42">
              Sessao de Chat
            </p>
            <h1 className="text-lg font-semibold text-foreground/90">
              {currentSession?.title ?? `Sessao ${sessionId?.slice(0, 8)}`}
            </h1>
            <p className="mt-1 text-[11px] text-foreground/34">
              {currentWorkspaceName
                ? `Workspace: ${currentWorkspaceName}`
                : "Sem workspace associado"}
            </p>
          </div>
          <ChatSessionMenu
            sessionId={sessionId}
            stageLabel={STAGE_LABELS[stage] ?? stage}
            progress={liveProgress}
            workspaceName={currentWorkspaceName}
          />
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
          <div
            className="h-full rounded-full bg-foreground/[0.72] transition-all duration-300"
            style={{ width: `${liveProgress}%` }}
          />
        </div>
      </div>

      {/* Chat area — full width */}
      <section className="min-h-[28rem] flex-1 rounded-[24px] border border-foreground/[0.08] bg-card/72 shadow-2xl backdrop-blur-xl md:min-h-0 md:rounded-[28px]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {sessionMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Blocks className="h-5 w-5 text-foreground/42" />
                <p className="text-sm text-foreground/60">
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
                        <div className="max-w-[94%] rounded-xl border border-foreground/[0.09] bg-foreground/[0.05] px-3 py-2 sm:max-w-[88%]">
                          <p className="text-xs text-foreground/84">{message.content}</p>
                          <span className="mt-1 block text-[10px] text-foreground/45">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (isJourneyStepUpdate) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="max-w-[94%] rounded-xl border border-foreground/[0.09] bg-foreground/[0.05] px-3 py-2 sm:max-w-[88%]">
                          <p className="text-xs text-foreground/84">{message.content}</p>
                          <span className="mt-1 block text-[10px] text-foreground/45">
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
                          "group relative max-w-[94%] rounded-2xl border px-4 py-3 sm:max-w-[88%]",
                          isUser
                            ? "border-foreground/[0.12] bg-foreground/[0.08] text-foreground/92"
                            : "border-foreground/[0.09] bg-black/28 text-foreground/85"
                        )}
                      >
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content).then(
                                () => toast.success("Copiado!"),
                                () => toast.error("Falha ao copiar")
                              );
                            }}
                            aria-label="Copiar mensagem"
                            className="absolute right-2 top-2 rounded-md p-1 text-foreground/20 opacity-0 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50 group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {imageAttachment ? (
                          <div className="mb-2 overflow-hidden rounded-xl border border-foreground/[0.12] bg-black/20">
                            <div className="relative h-64 w-full">
                              <Image
                                src={imageAttachment.dataUrl}
                                alt={imageAttachment.name}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, 720px"
                                className="object-cover"
                              />
                            </div>
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

                {isSending && streamingContent !== null && streamingContent.length > 0 && (
                  <div className="flex w-full animate-message-in justify-start">
                    <div className="group relative max-w-[94%] rounded-2xl border border-foreground/[0.09] bg-black/28 px-4 py-3 text-foreground/85 sm:max-w-[88%]">
                      <MarkdownRenderer content={streamingContent} />
                      <span className="mt-2 inline-block h-4 w-1 animate-pulse bg-foreground/[0.72]" />
                    </div>
                  </div>
                )}

                {isSending && streamingContent === null && (
                  <div className="flex justify-start">
                    <div className="max-w-[94%] rounded-2xl border border-foreground/[0.09] bg-black/28 px-4 py-3 sm:max-w-[88%]">
                      <div className="inline-flex items-center gap-2 text-xs text-foreground/65">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/72" />
                        Processando e delegando em tempo real...
                      </div>
                      <AgentTaskCards sessionId={sessionId} />
                    </div>
                  </div>
                )}

                {showLiveRuntimeBubble && (
                  <div className="flex justify-start">
                    <div className="max-w-[94%] rounded-2xl border border-foreground/[0.09] bg-black/28 px-4 py-3 sm:max-w-[88%]">
                      <div className="inline-flex items-center gap-2 text-xs text-foreground/65">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/72" />
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
            <div className="mb-2 flex items-center justify-between">
              {/* Context Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:pb-0">
                <button type="button" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-foreground/75 transition-colors hover:bg-foreground/[0.06]">
                  <Brain className="h-3.5 w-3.5 text-neon-purple" />
                  Contexto
                </button>
                <button type="button" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-foreground/75 transition-colors hover:bg-foreground/[0.06]">
                  <Zap className="h-3.5 w-3.5 text-neon-orange" />
                  Skill
                </button>
                <button type="button" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-foreground/75 transition-colors hover:bg-foreground/[0.06]">
                  <Sparkles className="h-3.5 w-3.5 text-neon-cyan" />
                  Modelo
                </button>
                <button type="button" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-foreground/75 transition-colors hover:bg-foreground/[0.06]">
                  <Wrench className="h-3.5 w-3.5 text-foreground/50" />
                  Ferramentas
                </button>
              </div>

              <ChatControlsMenu workspaceName={currentWorkspaceName} />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-black/30 p-2">
              <AIVoiceInput
                onStop={(dur) => {
                  if (dur > 0) setInput((prev) => `[Audio: ${dur}s] ${prev}`);
                }}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.10] bg-foreground/[0.08] px-2.5 py-1.5 text-xs font-medium text-foreground/82 transition-colors hover:border-foreground/[0.16] hover:bg-foreground/[0.12] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <LeftToolbar currentSessionId={sessionId} />
    </div>
  );
}
