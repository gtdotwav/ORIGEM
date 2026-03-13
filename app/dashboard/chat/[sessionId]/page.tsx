"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  Copy,
  Loader2,
  Send,
  Blocks,
  CalendarDays,
  FolderKanban,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { JourneyConnectorCard } from "@/components/chat/journey-connector-card";
import { AgentTaskCards } from "@/components/chat/agent-task-cards";
import { ChatControlsMenu } from "@/components/chat/chat-controls-menu";
import { ChatSessionMenu } from "@/components/chat/chat-session-menu";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { WorkspaceReadinessStrip } from "@/components/dashboard/workspace-readiness-strip";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { CriticAnnotations } from "@/components/chat/critic-annotations";
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
  const sessionAgentCount = useMemo(
    () => agents.filter((agent) => agent.sessionId === sessionId).length,
    [agents, sessionId]
  );
  const sessionGroupCount = useMemo(
    () => groups.filter((group) => group.sessionId === sessionId).length,
    [groups, sessionId]
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
      const lastAssistantMessage = sessionMessages.length > 0 
        ? sessionMessages.slice().reverse().find((m) => m.role === "assistant")
        : undefined;
      
      const isConfirming360 = 
        lastAssistantMessage?.metadata?.is360Offer && 
        /^(sim|quero|pode|yes|claro|com certeza|bora|vamos|manda|faz)/i.test(text);

      if (isConfirming360) {
        const originalPrompt = (lastAssistantMessage?.metadata?.originalPrompt as string) || text;
        await runChatOrchestration(sessionId, originalPrompt, {
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
    return <div className="mx-auto min-h-[calc(100vh-130px)] w-full max-w-7xl px-4 pb-[8.5rem] pt-2 md:px-6 md:pb-6 md:pt-4" />;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-130px)] w-full max-w-7xl flex-col px-4 pb-[8.5rem] pt-2 md:h-[calc(100vh-130px)] md:px-6 md:pb-6 md:pt-4">

      <div className="relative mb-3 overflow-hidden rounded-[34px] border border-white/[0.06] bg-[radial-gradient(circle_at_top_left,rgba(208,186,143,0.10),transparent_30%),linear-gradient(180deg,rgba(15,15,16,0.95),rgba(7,7,8,0.99))] p-4 shadow-[0_34px_120px_-46px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl md:mb-4 md:p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(208,186,143,0.28)] to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(208,186,143,0.16)] bg-[rgba(208,186,143,0.08)]">
              <Image src="/logo.png" alt="ORIGEM" width={20} height={20} className="opacity-85" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/34">
                Sessao ativa
              </p>
              <h1 className="text-[1.6rem] font-semibold tracking-[-0.04em] text-foreground/92">
                {currentSession?.title ?? `Sessao ${sessionId?.slice(0, 8)}`}
              </h1>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-foreground/42">
                Contexto, runtime, ferramentas e execucao seguem alinhados na mesma superficie.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ChatControlsMenu
              workspaceName={currentWorkspaceName}
              currentSessionId={sessionId}
            />
            <ChatSessionMenu
              sessionId={sessionId}
              stageLabel={STAGE_LABELS[stage] ?? stage}
              progress={liveProgress}
              workspaceName={currentWorkspaceName}
            />
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(244,234,212,1),rgba(216,196,160,1))] transition-all duration-300"
            style={{ width: `${liveProgress}%` }}
          />
        </div>

        <WorkspaceReadinessStrip
          workspaceId={currentWorkspaceId ?? null}
          workspaceName={currentWorkspaceName}
          compact
          className="mt-4"
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <section className="min-h-[28rem] flex-1 rounded-[30px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(14,14,15,0.92),rgba(8,8,9,0.98))] shadow-[0_34px_120px_-48px_rgba(0,0,0,0.96),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl md:min-h-0 md:rounded-[34px]">
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
              {sessionMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Blocks className="h-5 w-5 text-foreground/42" />
                  <p className="text-sm text-foreground/60">
                    Envie sua primeira mensagem para acionar analise, execucao e ferramentas do workspace a partir do mesmo contexto.
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
                            "group relative max-w-[94%] rounded-[20px] border px-5 py-4 sm:max-w-[85%] shadow-sm backdrop-blur-md transition-all",
                            isUser
                              ? "border-[rgba(208,186,143,0.18)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-[#f4ead4] shadow-[0_16px_34px_-24px_rgba(208,186,143,0.55)]"
                              : "border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))] text-white/90 shadow-black/20"
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
                      <div className="group relative max-w-[94%] rounded-[20px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))] px-5 py-4 text-white/90 shadow-sm shadow-black/20 backdrop-blur-md sm:max-w-[85%]">
                        <MarkdownRenderer content={streamingContent} />
                        <span className="mt-2 inline-block h-[18px] w-1.5 animate-pulse rounded-full bg-[#e9d8b2]/70" />
                      </div>
                    </div>
                  )}

                  {isSending && streamingContent === null && (
                    <div className="flex justify-start">
                      <div className="max-w-[94%] rounded-[20px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-5 py-4 backdrop-blur-md sm:max-w-[85%]">
                        <div className="inline-flex items-center gap-2.5 text-[13px] text-white/60">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/72" />
                          Processando e delegando em tempo real...
                        </div>
                        <AgentTaskCards sessionId={sessionId} />
                      </div>
                    </div>
                  )}

                  {showLiveRuntimeBubble && (
                    <div className="flex justify-start">
                      <div className="max-w-[94%] rounded-2xl border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-4 py-3 sm:max-w-[88%]">
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
              className="border-t border-white/[0.06] p-3 md:p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/34">
                  Continuar operacao
                </p>
                <span className="text-[11px] text-foreground/34">
                  {showLiveRuntimeBubble
                  ? `${STAGE_LABELS[stage] ?? stage} / ${Math.round(liveProgress)}%`
                    : "Runtime em espera"}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-[20px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-2">
                <AIVoiceInput
                  onStop={(dur) => {
                    if (dur > 0) setInput((prev) => `[Audio: ${dur}s] ${prev}`);
                  }}
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Descreva a proxima decisao, analise ou execucao..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(208,186,143,0.2)] bg-[linear-gradient(180deg,#f4ead4,#d8c4a0)] px-3 py-2 text-xs font-medium text-black transition-colors hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="hidden xl:flex xl:flex-col xl:gap-4">
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-[radial-gradient(circle_at_top_left,rgba(208,186,143,0.09),transparent_32%),linear-gradient(180deg,rgba(14,14,15,0.95),rgba(8,8,9,0.98))] p-5 shadow-[0_34px_100px_-44px_rgba(0,0,0,0.94),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(208,186,143,0.24)] to-transparent" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
                  Panorama da sessao
                </p>
                <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.05em] text-white">
                  Continuidade visivel
                </h2>
                <p className="mt-2 text-sm leading-7 text-white/48">
                  Acompanhe progresso, agentes e proximos pontos de apoio sem sair da sessao.
                </p>
              </div>
              <div className="rounded-full border border-[rgba(208,186,143,0.16)] bg-[rgba(208,186,143,0.08)] p-3 text-[#ead7b1]">
                <Workflow className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">
                  Mensagens
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {sessionMessages.length}
                </p>
                <p className="text-[11px] text-white/42">Historico desta sessao</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">
                    Agentes
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{sessionAgentCount}</p>
                  <p className="text-[11px] text-white/42">Atores acionados na sessao</p>
                </div>
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">
                    Progresso
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {Math.round(liveProgress)}%
                  </p>
                  <p className="text-[11px] text-white/42">
                    {sessionGroupCount} grupo{sessionGroupCount === 1 ? "" : "s"} ativo{sessionGroupCount === 1 ? "" : "s"} na sessao
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <Link
                href="/dashboard/calendar"
                className="inline-flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white/70 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Ver agenda
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/workspaces"
                className="inline-flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white/70 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Abrir workspace
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <CalendarWidget variant="panel" />
        </aside>
      </div>
    </div>
  );
}
