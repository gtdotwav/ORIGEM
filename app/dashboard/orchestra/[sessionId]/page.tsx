"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Brain,
  FolderKanban,
  GitBranch,
  Loader2,
  Orbit,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { MetricSkeleton, CardSkeleton } from "@/components/shared/cosmic-skeleton";
import {
  hydrateSessionSnapshot,
  persistSessionSnapshot,
} from "@/lib/chat-backend-client";
import { createMessage, runChatOrchestration } from "@/lib/chat-orchestrator";
import {
  getContextDirections,
  getJourneyStepHref,
  getSelectedContext,
  getSessionContexts,
} from "@/lib/session-journey";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";
import type { PipelineStage } from "@/types/pipeline";
import type { RuntimeLanguage } from "@/types/runtime";

const STAGE_LABELS: Record<PipelineStage, string> = {
  idle: "Aguardando",
  intake: "Intake",
  decomposing: "Decomposicao",
  routing: "Roteamento",
  spawning: "Delegacao",
  executing: "Execucao",
  branching: "Ajustes",
  aggregating: "Agregacao",
  complete: "Concluido",
  error: "Erro",
};

const STATUS_STYLE = {
  pending: "text-foreground/50 border-foreground/[0.12] bg-foreground/[0.05]",
  running: "text-amber-200 border-amber-300/30 bg-amber-300/10",
  done: "text-green-200 border-green-300/30 bg-green-300/10",
  blocked: "text-red-200 border-red-300/30 bg-red-300/10",
} as const;

function OrchestraPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const queryContextId = searchParams.get("contextId");

  const [isHydrating, setIsHydrating] = useState(false);
  const [isRunningOrchestra, setIsRunningOrchestra] = useState(false);
  const hydratedSessionIdsRef = useRef<Set<string>>(new Set());

  const sessions = useWorkspaceFilteredSessions();
  const messages = useSessionStore((state) => state.messages);
  const addMessage = useSessionStore((state) => state.addMessage);

  const decompositions = useDecompositionStore((state) => state.decompositions);
  const activeDecompositionId = useDecompositionStore(
    (state) => state.activeDecompositionId
  );

  const agents = useAgentStore((state) => state.agents);
  const groups = useAgentStore((state) => state.groups);

  const runtimeSessions = useRuntimeStore((state) => state.sessions);
  const markJourneyStepVisited = useRuntimeStore(
    (state) => state.markJourneyStepVisited
  );

  const pipelineStage = usePipelineStore((state) => state.stage);
  const pipelineProgress = usePipelineStore((state) => state.progress);

  const targetSession = useMemo(
    () => sessions.find((session) => session.id === sessionId) ?? null,
    [sessions, sessionId]
  );

  const contexts = useMemo(
    () =>
      getSessionContexts(
        sessionId,
        messages,
        decompositions,
        activeDecompositionId
      ),
    [sessionId, messages, decompositions, activeDecompositionId]
  );

  const selectedContext = useMemo(
    () => getSelectedContext(contexts, queryContextId),
    [contexts, queryContextId]
  );

  const contextDirections = useMemo(
    () =>
      getContextDirections(messages, sessionId, {
        contextId: selectedContext?.id,
      }).slice(0, 8),
    [messages, selectedContext?.id, sessionId]
  );

  const runtime = runtimeSessions[sessionId];
  const runtimeTasks = useMemo(
    () => [...(runtime?.tasks ?? [])].sort((a, b) => a.priority - b.priority),
    [runtime?.tasks]
  );

  const sessionAgents = useMemo(
    () => agents.filter((agent) => agent.sessionId === sessionId),
    [agents, sessionId]
  );

  const sessionGroups = useMemo(
    () => groups.filter((group) => group.sessionId === sessionId),
    [groups, sessionId]
  );

  const checkpointMessages = useMemo(
    () =>
      messages
        .filter(
          (message) =>
            message.sessionId === sessionId &&
            message.role === "system" &&
            message.metadata?.checkpoint === true
        )
        .slice(-8)
        .reverse(),
    [messages, sessionId]
  );

  const shouldHydrate =
    !isHydrating &&
    !targetSession &&
    contexts.length === 0 &&
    runtimeTasks.length === 0 &&
    sessionAgents.length === 0;

  useEffect(() => {
    if (!sessionId || !shouldHydrate) {
      return;
    }

    if (hydratedSessionIdsRef.current.has(sessionId)) {
      return;
    }

    hydratedSessionIdsRef.current.add(sessionId);
    setIsHydrating(true);

    void hydrateSessionSnapshot(sessionId)
      .catch((error) => {
        console.error("Failed to hydrate session on orchestra page", error);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [sessionId, shouldHydrate, isHydrating]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    markJourneyStepVisited(sessionId, "orchestra");
  }, [markJourneyStepVisited, sessionId]);

  const overallProgress = runtime?.overallProgress ?? pipelineProgress;
  const language = (runtime?.language ?? "pt-BR") as RuntimeLanguage;

  const distribution = useMemo(() => {
    const aggregate = {
      contexts: contexts.length > 0 ? 100 : 0,
      projects: 0,
      agents: 0,
      groups: 0,
    };

    const byFunction = {
      projects: runtimeTasks.filter((task) => task.functionKey === "projects"),
      agents: runtimeTasks.filter((task) => task.functionKey === "agents"),
      groups: runtimeTasks.filter((task) => task.functionKey === "groups"),
    };

    for (const [key, tasks] of Object.entries(byFunction)) {
      if (tasks.length === 0) {
        continue;
      }
      aggregate[key as keyof typeof aggregate] = Math.round(
        tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
      );
    }

    return aggregate;
  }, [contexts.length, runtimeTasks]);

  const orchestrationPrompt = useMemo(() => {
    const contextLine = selectedContext?.inputText ?? targetSession?.title ?? "continuar execucao";
    const directionLines = contextDirections
      .slice(0, 4)
      .map((direction) => `- ${direction.text}`)
      .join("\n");

    return [
      `Continuar a orquestracao completa da sessao com foco no contexto: ${contextLine}.`,
      directionLines
        ? `Direcoes registradas:\n${directionLines}`
        : "Sem direcoes extras; manter plano atual por prioridade.",
      "Entregar estado final coeso em contexto -> agentes -> projeto -> grupos -> fluxos -> orquestra.",
    ].join("\n\n");
  }, [contextDirections, selectedContext?.inputText, targetSession?.title]);

  const runOrchestraNow = async () => {
    if (!sessionId || isRunningOrchestra) {
      return;
    }

    setIsRunningOrchestra(true);

    addMessage(
      createMessage(sessionId, "user", orchestrationPrompt, {
        orchestraPrompt: true,
        decompositionId: selectedContext?.id,
      })
    );

    try {
      await runChatOrchestration(sessionId, orchestrationPrompt, {
        language,
      });
      persistSessionSnapshot(sessionId).catch((err) =>
        console.warn("[snapshot] persist failed (non-blocking):", err)
      );
    } finally {
      setIsRunningOrchestra(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.04]">
            <Orbit className="h-5 w-5 text-fuchsia-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Orquestra Final</h1>
            <p className="mt-1 text-sm text-foreground/50">
              Contexto, agentes, projetos, grupos e fluxos trabalhando em conjunto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={getJourneyStepHref("flows", sessionId, selectedContext?.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.24] hover:bg-foreground/[0.08]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Fluxos
          </Link>
          <button
            type="button"
            onClick={() => void runOrchestraNow()}
            disabled={isRunningOrchestra}
            className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isRunningOrchestra ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isRunningOrchestra ? "Executando..." : "Rodar Orquestra Agora"}
          </button>
        </div>
      </div>

      {isHydrating ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-foreground/[0.08] bg-card/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-foreground/40">
                Estado da orquestracao
              </p>
              <span className="text-xs text-foreground/60">
                {STAGE_LABELS[pipelineStage]} · {overallProgress}%
              </span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
              <div
                className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2">
                <p className="text-[11px] text-cyan-100/70">Contextos</p>
                <p className="text-lg font-semibold text-cyan-100">{contexts.length}</p>
                <p className="text-[11px] text-cyan-100/70">{distribution.contexts}%</p>
              </div>
              <div className="rounded-lg border border-blue-300/20 bg-blue-300/10 px-3 py-2">
                <p className="text-[11px] text-blue-100/70">Projetos</p>
                <p className="text-lg font-semibold text-blue-100">{targetSession ? 1 : 0}</p>
                <p className="text-[11px] text-blue-100/70">{distribution.projects}%</p>
              </div>
              <div className="rounded-lg border border-green-300/20 bg-green-300/10 px-3 py-2">
                <p className="text-[11px] text-green-100/70">Agentes</p>
                <p className="text-lg font-semibold text-green-100">{sessionAgents.length}</p>
                <p className="text-[11px] text-green-100/70">{distribution.agents}%</p>
              </div>
              <div className="rounded-lg border border-orange-300/20 bg-orange-300/10 px-3 py-2">
                <p className="text-[11px] text-orange-100/70">Grupos</p>
                <p className="text-lg font-semibold text-orange-100">{sessionGroups.length}</p>
                <p className="text-[11px] text-orange-100/70">{distribution.groups}%</p>
              </div>
            </div>
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
            <section className="space-y-3">
              <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4">
                <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-foreground/80">
                  <Brain className="h-4 w-4 text-cyan-300" />
                  Contexto ativo
                </div>
                {selectedContext ? (
                  <>
                    <p className="text-sm text-foreground/85">{selectedContext.inputText}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedContext.context.domains.map((domain) => (
                        <span
                          key={domain.domain}
                          className="rounded-full border border-foreground/[0.12] bg-foreground/[0.05] px-2 py-0.5 text-[11px] text-foreground/70"
                        >
                          {domain.domain}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-foreground/50">Sem contexto selecionado.</p>
                )}
              </div>

              <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4">
                <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-foreground/80">
                  <Sparkles className="h-4 w-4 text-amber-200" />
                  Direcoes coletadas
                </div>
                {contextDirections.length === 0 ? (
                  <p className="text-sm text-foreground/50">Sem direcoes contextuais registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {contextDirections.map((direction) => (
                      <div
                        key={direction.id}
                        className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-2.5 py-2"
                      >
                        <p className="text-xs text-amber-100/90">{direction.text}</p>
                        <p className="mt-1 text-[10px] text-amber-100/60">
                          {direction.routeTargets.join(" · ") || "geral"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4">
                <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-foreground/80">
                  <FolderKanban className="h-4 w-4 text-blue-300" />
                  Plano de projeto e execucao
                </div>
                {runtimeTasks.length === 0 ? (
                  <p className="text-sm text-foreground/50">Sem tarefas orquestradas ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {runtimeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-foreground/[0.08] bg-black/25 px-3 py-2"
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground/85">
                            {task.priority}. {task.title}
                          </p>
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-[10px] ${STATUS_STYLE[task.status]}`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/45">{task.agentName}</p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                          <div
                            className="h-full rounded-full bg-neon-cyan/70"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4">
                  <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-foreground/80">
                    <Bot className="h-4 w-4 text-green-300" />
                    Agentes
                  </div>
                  <div className="space-y-1.5">
                    {sessionAgents.length === 0 ? (
                      <p className="text-xs text-foreground/50">Sem agentes registrados.</p>
                    ) : (
                      sessionAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className="rounded-lg border border-foreground/[0.08] bg-black/25 px-2.5 py-2"
                        >
                          <p className="text-xs text-foreground/80">{agent.name}</p>
                          <p className="text-[11px] text-foreground/45">{agent.role}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4">
                  <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-foreground/80">
                    <Users className="h-4 w-4 text-orange-300" />
                    Grupos
                  </div>
                  <div className="space-y-1.5">
                    {sessionGroups.length === 0 ? (
                      <p className="text-xs text-foreground/50">Sem grupos registrados.</p>
                    ) : (
                      sessionGroups.map((group) => (
                        <div
                          key={group.id}
                          className="rounded-lg border border-foreground/[0.08] bg-black/25 px-2.5 py-2"
                        >
                          <p className="text-xs text-foreground/80">{group.name}</p>
                          <p className="text-[11px] text-foreground/45">{group.strategy}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-foreground/80">
              <GitBranch className="h-4 w-4 text-neon-cyan" />
              Trilha de checkpoints da orquestra
            </div>
            {checkpointMessages.length === 0 ? (
              <p className="text-sm text-foreground/50">Sem checkpoints registrados ainda.</p>
            ) : (
              <div className="space-y-2">
                {checkpointMessages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-foreground/[0.08] bg-black/25 px-3 py-2"
                  >
                    <p className="text-xs text-foreground/80">{message.content}</p>
                    <p className="mt-1 text-[10px] text-foreground/40">
                      {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default OrchestraPage;
