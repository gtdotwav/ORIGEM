"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Loader2,
  Blocks,
} from "lucide-react";
import { OperationLensHeader } from "@/components/dashboard/operation-lens-header";
import { MetricSkeleton, CardSkeleton } from "@/components/shared/cosmic-skeleton";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import {
  getContextDirections,
  getJourneyStepHref,
  getLatestSessionId,
  getSelectedContext,
  getSessionContexts,
} from "@/lib/session-journey";
import { useSessionSnapshotHydration } from "@/hooks/use-session-snapshot-hydration";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";

const STATUS_META = {
  idle: "text-foreground/55 border-foreground/[0.15] bg-foreground/[0.06]",
  thinking: "text-cyan-200 border-cyan-300/30 bg-cyan-300/10",
  working: "text-amber-200 border-amber-300/30 bg-amber-300/10",
  done: "text-green-200 border-green-300/30 bg-green-300/10",
  error: "text-red-200 border-red-300/30 bg-red-300/10",
} as const;

const FUNCTION_LABEL: Record<string, string> = {
  contexts: "Contextos",
  projects: "Projetos",
  agents: "Agentes",
  groups: "Grupos",
  aggregation: "Agregacao final",
};

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AgentsPageContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");
  const queryContextId = searchParams.get("contextId");

  const [expandedOutputId, setExpandedOutputId] = useState<string | null>(null);

  const sessions = useWorkspaceFilteredSessions();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const messages = useSessionStore((state) => state.messages);

  const decompositions = useDecompositionStore((state) => state.decompositions);
  const activeDecompositionId = useDecompositionStore(
    (state) => state.activeDecompositionId
  );

  const agents = useAgentStore((state) => state.agents);
  const runtimeSessions = useRuntimeStore((state) => state.sessions);
  const markJourneyStepVisited = useRuntimeStore(
    (state) => state.markJourneyStepVisited
  );

  const latestSessionId = useMemo(() => getLatestSessionId(sessions), [sessions]);
  const targetSessionId = querySessionId ?? currentSessionId ?? latestSessionId;

  const targetSession = useMemo(() => {
    if (!targetSessionId) {
      return null;
    }

    return sessions.find((session) => session.id === targetSessionId) ?? null;
  }, [sessions, targetSessionId]);

  const contexts = useMemo(
    () =>
      getSessionContexts(
        targetSessionId,
        messages,
        decompositions,
        activeDecompositionId
      ),
    [targetSessionId, messages, decompositions, activeDecompositionId]
  );

  const selectedContext = useMemo(
    () => getSelectedContext(contexts, queryContextId),
    [contexts, queryContextId]
  );

  const sessionAgents = useMemo(
    () =>
      targetSessionId
        ? agents
          .filter((agent) => agent.sessionId === targetSessionId)
          .sort((a, b) => {
            const left = Number(a.config?.priority ?? Number.MAX_SAFE_INTEGER);
            const right = Number(b.config?.priority ?? Number.MAX_SAFE_INTEGER);
            return left - right;
          })
        : [],
    [agents, targetSessionId]
  );

  const runtime = targetSessionId ? runtimeSessions[targetSessionId] : undefined;
  const runtimeTasks = runtime?.tasks ?? [];

  const contextDirections = useMemo(
    () =>
      getContextDirections(messages, targetSessionId, {
        contextId: selectedContext?.id,
        target: "agents",
      }).slice(0, 5),
    [messages, selectedContext?.id, targetSessionId]
  );

  const shouldHydrate =
    Boolean(targetSessionId) &&
    sessionAgents.length === 0 &&
    runtimeTasks.length === 0 &&
    contexts.length === 0;
  const { isHydrating } = useSessionSnapshotHydration({
    sessionId: targetSessionId,
    enabled: shouldHydrate,
    logLabel: "agents page",
  });

  useEffect(() => {
    if (!targetSessionId) {
      return;
    }

    markJourneyStepVisited(targetSessionId, "agents");
  }, [markJourneyStepVisited, targetSessionId]);

  const activeAgentCount = sessionAgents.filter(
    (agent) => agent.status === "thinking" || agent.status === "working"
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <OperationLensHeader
        icon={Bot}
        iconClassName="text-cyan-300"
        title="Agentes conectados"
        description="Esta visao mostra como a mesma sessao distribuiu papeis, funcoes e progresso entre agentes especializados."
        supportingCopy="A delegacao aqui nao e independente: ela deriva do contexto ativo e alimenta diretamente projetos, grupos e fluxo."
        sessionTitle={targetSession?.title ?? null}
        updatedAtLabel={
          targetSession ? formatDateTime(targetSession.updatedAt) : null
        }
        meta={[
          { label: "Agentes", value: `${sessionAgents.length}` },
          { label: "Funcoes", value: `${runtimeTasks.length}` },
          { label: "Direcoes", value: `${contextDirections.length}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {targetSessionId ? (
              <Link
                href={getJourneyStepHref(
                  "contexts",
                  targetSessionId,
                  selectedContext?.id
                )}
                className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.24] hover:bg-foreground/[0.08]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Contexto
              </Link>
            ) : null}
            {targetSessionId ? (
              <Link
                href={getJourneyStepHref(
                  "projects",
                  targetSessionId,
                  selectedContext?.id
                )}
                className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
              >
                Ir para Projetos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-3 backdrop-blur-2xl">
          <p className="text-[11px] uppercase tracking-wide text-foreground/50">Agentes</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{sessionAgents.length}</p>
          <p className="text-xs text-foreground/45">{activeAgentCount} em execucao</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-3 backdrop-blur-2xl">
          <p className="text-[11px] uppercase tracking-wide text-foreground/50">Funcoes delegadas</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {new Set(runtimeTasks.map((task) => task.functionKey)).size}
          </p>
          <p className="text-xs text-foreground/45">{runtimeTasks.length} tarefas mapeadas</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-3 backdrop-blur-2xl">
          <p className="text-[11px] uppercase tracking-wide text-foreground/50">Direcoes de contexto</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{contextDirections.length}</p>
          <p className="text-xs text-foreground/45">
            {selectedContext ? `contexto ${selectedContext.id.slice(0, 8)}` : "geral"}
          </p>
        </div>
      </div>

      {isHydrating ? (
        <div className="rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-6 backdrop-blur-2xl">
          <div className="inline-flex items-center gap-2 text-sm text-foreground/70">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Carregando estado de agentes da sessao...
          </div>
        </div>
      ) : !targetSessionId ? (
        <div className="rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-6 text-sm backdrop-blur-2xl text-foreground/65">
          Nenhuma sessao ativa encontrada. Inicie pelo chat para delegar os agentes.
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-4 backdrop-blur-2xl">
            <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-foreground/40">
              <Brain className="h-3.5 w-3.5" />
              Direcoes vindas do contexto
            </div>
            {contextDirections.length === 0 ? (
              <p className="text-sm text-foreground/50">
                Sem direcao manual para agentes neste contexto ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {contextDirections.map((direction) => (
                  <div
                    key={direction.id}
                    className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2"
                  >
                    <p className="text-sm text-cyan-100/90">{direction.text}</p>
                    <p className="mt-1 text-[11px] text-cyan-100/60">
                      {direction.routeTargets.join(" · ")} ·{" "}
                      {new Date(direction.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {sessionAgents.length === 0 ? (
            <CosmicEmptyState
              icon={Bot}
              title="Nenhum agente ativo"
              description="Envie uma mensagem no chat para disparar delegacao de agentes."
              action={{
                label: "Voltar ao chat",
                href: `/dashboard/chat/${targetSessionId}`,
              }}
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {sessionAgents.map((agent) => {
                const assignedTasks = runtimeTasks
                  .filter((task) => task.agentId === agent.id)
                  .sort((a, b) => a.priority - b.priority);
                const avgProgress =
                  assignedTasks.length === 0
                    ? agent.status === "done"
                      ? 100
                      : 0
                    : Math.round(
                      assignedTasks.reduce((sum, task) => sum + task.progress, 0) /
                      assignedTasks.length
                    );
                const latestOutput = agent.outputs[agent.outputs.length - 1];

                return (
                  <div
                    key={agent.id}
                    className="rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-4 backdrop-blur-2xl"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-foreground/90">{agent.name}</p>
                        <p className="text-xs text-foreground/45">{agent.role}</p>
                      </div>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs ${STATUS_META[agent.status]}`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
                      <div
                        className="h-full rounded-full bg-neon-cyan/70 transition-all"
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>

                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {assignedTasks.length === 0 ? (
                        <span className="rounded-md border border-foreground/[0.10] bg-foreground/[0.04] px-2 py-1 text-[11px] text-foreground/45">
                          sem funcao atribuida
                        </span>
                      ) : (
                        assignedTasks.map((task) => (
                          <span
                            key={task.id}
                            className="rounded-md border border-foreground/[0.10] bg-foreground/[0.04] px-2 py-1 text-[11px] text-foreground/65"
                          >
                            {FUNCTION_LABEL[task.functionKey] ?? task.functionKey} · {task.progress}%
                          </span>
                        ))
                      )}
                    </div>

                    <div className="grid gap-1 text-xs text-foreground/55">
                      <p>
                        Modelo: {agent.model} · Provider: {agent.provider}
                      </p>
                      <p>Outputs: {agent.outputs.length}</p>
                      {latestOutput ? (
                        <div className="text-foreground/45">
                          <p>
                            Ultimo output:{" "}
                            {expandedOutputId === agent.id
                              ? latestOutput.content
                              : latestOutput.content.slice(0, 200)}
                            {!expandedOutputId || expandedOutputId !== agent.id
                              ? latestOutput.content.length > 200
                                ? "..."
                                : ""
                              : ""}
                          </p>
                          {latestOutput.content.length > 200 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOutputId((prev) =>
                                  prev === agent.id ? null : agent.id
                                )
                              }
                              className="mt-1 text-[11px] text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                            >
                              {expandedOutputId === agent.id ? "Ver menos" : "Ver mais"}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 p-3">
            <div className="inline-flex items-center gap-1.5 text-sm text-neon-cyan">
              <Blocks className="h-4 w-4" />
              Proxima etapa recomendada
            </div>
            <p className="mt-1 text-xs text-foreground/70">
              Consolidar o plano em projeto executavel com base na delegacao atual.
            </p>
            <div className="mt-2">
              <Link
                href={getJourneyStepHref(
                  "projects",
                  targetSessionId,
                  selectedContext?.id
                )}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
              >
                Abrir Projetos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {runtime?.isRunning ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-green-300/25 bg-green-300/10 px-2.5 py-1.5 text-xs text-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              A orquestracao continua ativa em tempo real.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function AgentsPageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-foreground/[0.04]" />
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded bg-foreground/[0.04]" />
          <div className="h-3 w-64 animate-pulse rounded bg-foreground/[0.04]" />
        </div>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<AgentsPageFallback />}>
      <AgentsPageContent />
    </Suspense>
  );
}
