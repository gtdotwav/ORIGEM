"use client";

import Link from "next/link";
import { Fragment, Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Loader2,
} from "lucide-react";
import { OperationLensHeader } from "@/components/dashboard/operation-lens-header";
import { PipelineSkeleton, TaskRowSkeleton } from "@/components/shared/cosmic-skeleton";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import {
  getContextDirections,
  getJourneyStepHref,
  getLatestSessionId,
  getSelectedContext,
  getSessionContexts,
} from "@/lib/session-journey";
import { useSessionSnapshotHydration } from "@/hooks/use-session-snapshot-hydration";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";
import type { PipelineEvent, PipelineStage } from "@/types/pipeline";

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

const PIPELINE_ORDER: PipelineStage[] = [
  "intake",
  "decomposing",
  "routing",
  "spawning",
  "executing",
  "branching",
  "aggregating",
  "complete",
];

const STATUS_STYLE = {
  pending: "text-foreground/50 border-foreground/[0.12] bg-foreground/[0.05]",
  running: "text-amber-200 border-amber-300/30 bg-amber-300/10",
  done: "text-green-200 border-green-300/30 bg-green-300/10",
  blocked: "text-red-200 border-red-300/30 bg-red-300/10",
} as const;

function getEventSessionId(event: PipelineEvent): string | null {
  if (!event.data || typeof event.data !== "object") {
    return null;
  }

  const value = (event.data as Record<string, unknown>).sessionId;
  return typeof value === "string" ? value : null;
}

function getEventRunId(event: PipelineEvent): string | null {
  if (!event.data || typeof event.data !== "object") {
    return null;
  }

  const value = (event.data as Record<string, unknown>).runId;
  return typeof value === "string" ? value : null;
}

function eventLabel(event: PipelineEvent) {
  if (event.type === "stage_change") {
    const stage =
      event.data && typeof event.data === "object"
        ? (event.data as Record<string, unknown>).stage
        : null;

    if (typeof stage === "string") {
      return `Mudanca de estagio: ${stage}`;
    }

    return "Mudanca de estagio";
  }

  if (event.type === "routing") {
    return "Roteamento e estrategia de grupo";
  }

  if (event.type === "decomposition") {
    return "Decomposicao de contexto concluida";
  }

  if (event.type === "agent_output") {
    return "Output de agente registrado";
  }

  if (event.type === "pipeline_complete") {
    return "Execucao consolidada";
  }

  return event.type;
}

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FlowsPageContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");
  const queryContextId = searchParams.get("contextId");

  const sessions = useWorkspaceFilteredSessions();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const messages = useSessionStore((state) => state.messages);

  const decompositions = useDecompositionStore((state) => state.decompositions);
  const activeDecompositionId = useDecompositionStore(
    (state) => state.activeDecompositionId
  );

  const runtimeSessions = useRuntimeStore((state) => state.sessions);
  const markJourneyStepVisited = useRuntimeStore(
    (state) => state.markJourneyStepVisited
  );

  const pipelineStage = usePipelineStore((state) => state.stage);
  const pipelineProgress = usePipelineStore((state) => state.progress);
  const pipelineEvents = usePipelineStore((state) => state.events);

  const latestSessionId = useMemo(() => getLatestSessionId(sessions), [sessions]);
  const targetSessionId = querySessionId ?? currentSessionId ?? latestSessionId;
  const targetSession = useMemo(
    () =>
      targetSessionId
        ? sessions.find((session) => session.id === targetSessionId) ?? null
        : null,
    [sessions, targetSessionId]
  );

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

  const runtime = targetSessionId ? runtimeSessions[targetSessionId] : undefined;
  const runtimeTasks = useMemo(
    () => [...(runtime?.tasks ?? [])].sort((a, b) => a.priority - b.priority),
    [runtime?.tasks]
  );

  const flowDirections = useMemo(
    () =>
      getContextDirections(messages, targetSessionId, {
        contextId: selectedContext?.id,
        target: "flows",
      }).slice(0, 6),
    [messages, selectedContext?.id, targetSessionId]
  );

  const relevantEvents = (() => {
    if (!targetSessionId) {
      return [];
    }

    return [...pipelineEvents]
      .filter((event) => {
        const eventSessionId = getEventSessionId(event);
        if (eventSessionId) {
          return eventSessionId === targetSessionId;
        }

        const eventRunId = getEventRunId(event);
        if (eventRunId && runtime?.runId) {
          return eventRunId === runtime.runId;
        }

        return false;
      })
      .slice(-10)
      .reverse();
  })();

  const shouldHydrate =
    Boolean(targetSessionId) &&
    runtimeTasks.length === 0 &&
    contexts.length === 0;
  const { isHydrating } = useSessionSnapshotHydration({
    sessionId: targetSessionId,
    enabled: shouldHydrate,
    logLabel: "flows page",
  });

  useEffect(() => {
    if (!targetSessionId) {
      return;
    }

    markJourneyStepVisited(targetSessionId, "flows");
  }, [markJourneyStepVisited, targetSessionId]);

  const progress = runtime?.overallProgress ?? pipelineProgress;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <OperationLensHeader
        icon={GitBranch}
        iconClassName="text-orange-300"
        title="Fluxos em tempo real"
        description="Esta leitura mostra a execucao viva da mesma sessao, conectando contexto, grupos, tarefas e checkpoints do runtime."
        supportingCopy="Fluxo nao e um modulo isolado. Ele e a trilha operacional do que a inteligencia decidiu, delegou e esta consolidando agora."
        sessionTitle={targetSession?.title ?? null}
        updatedAtLabel={
          targetSession ? formatDateTime(targetSession.updatedAt) : null
        }
        meta={[
          { label: "Progresso", value: `${progress}%` },
          { label: "Tarefas", value: `${runtimeTasks.length}` },
          { label: "Eventos", value: `${relevantEvents.length}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {targetSessionId ? (
              <Link
                href={getJourneyStepHref(
                  "groups",
                  targetSessionId,
                  selectedContext?.id
                )}
                className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.24] hover:bg-foreground/[0.08]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Grupos
              </Link>
            ) : null}
            {targetSessionId ? (
              <Link
                href={getJourneyStepHref(
                  "orchestra",
                  targetSessionId,
                  selectedContext?.id
                )}
                className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
              >
                Ir para Orquestra
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        }
      />

      {isHydrating ? (
        <div className="rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-6 backdrop-blur-2xl">
          <div className="inline-flex items-center gap-2 text-sm text-foreground/70">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Carregando fluxo da sessao...
          </div>
        </div>
      ) : !targetSessionId ? (
        <CosmicEmptyState
          icon={GitBranch}
          title="Nenhum fluxo ativo"
          description="Fluxos aparecem quando tarefas entram em execucao no runtime."
          neonColor="orange"
        />
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-4 backdrop-blur-2xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-foreground/40">
                Estado do fluxo
              </p>
              <span className="text-xs text-foreground/60">
                {STAGE_LABELS[pipelineStage]} · {progress}%
              </span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
              <div
                className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {PIPELINE_ORDER.map((stage, i) => {
                const reached = PIPELINE_ORDER.indexOf(stage) <= PIPELINE_ORDER.indexOf(pipelineStage);
                const isCurrent = stage === pipelineStage;
                return (
                  <Fragment key={stage}>
                    {i > 0 && (
                      <div className={`h-0.5 w-6 shrink-0 transition-colors ${reached ? "bg-neon-cyan/50" : "bg-foreground/[0.08]"}`} />
                    )}
                    <div className={`flex flex-col items-center gap-1 shrink-0 transition-transform ${isCurrent ? "scale-110" : ""}`}>
                      <div className={`h-3 w-3 rounded-full border-2 transition-colors ${reached ? "border-neon-cyan bg-neon-cyan/30" : "border-foreground/20 bg-transparent"
                        } ${isCurrent ? "ring-2 ring-neon-cyan/20" : ""}`} />
                      <span className={`text-[9px] whitespace-nowrap ${reached ? "text-neon-cyan" : "text-foreground/35"}`}>
                        {STAGE_LABELS[stage]}
                      </span>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
            <section className="rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-4 backdrop-blur-2xl">
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-foreground/40">
                Funcoes em execucao
              </p>
              {runtimeTasks.length === 0 ? (
                <p className="text-sm text-foreground/50">Nenhuma tarefa ativa para esta sessao.</p>
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
                      <p className="text-xs text-foreground/45">Agente: {task.agentName}</p>
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
            </section>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-4 backdrop-blur-2xl">
                <p className="text-xs uppercase tracking-[0.14em] text-foreground/40">
                  Direcoes para fluxo
                </p>
                {flowDirections.length === 0 ? (
                  <p className="mt-2 text-xs text-foreground/50">
                    Nenhuma direcao de fluxo recebida no contexto atual.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {flowDirections.map((direction) => (
                      <div
                        key={direction.id}
                        className="rounded-lg border border-orange-300/20 bg-orange-300/10 px-2.5 py-2"
                      >
                        <p className="text-xs text-orange-100/90">{direction.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-4 backdrop-blur-2xl">
                <p className="text-xs uppercase tracking-[0.14em] text-foreground/40">
                  Eventos recentes
                </p>
                {relevantEvents.length === 0 ? (
                  <p className="mt-2 text-xs text-foreground/50">Sem eventos de execucao ainda.</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {relevantEvents.map((event, index) => (
                      <div
                        key={`${event.type}-${event.timestamp}-${index}`}
                        className="rounded-lg border border-foreground/[0.08] bg-black/25 px-2.5 py-2"
                      >
                        <p className="text-xs text-foreground/75">{eventLabel(event)}</p>
                        <p className="mt-0.5 text-[10px] text-foreground/40">
                          {new Date(event.timestamp).toLocaleTimeString("pt-BR", {
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
            </aside>
          </div>

          <div className="rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 p-3">
            <div className="inline-flex items-center gap-1.5 text-sm text-neon-cyan">
              <CheckCircle2 className="h-4 w-4" />
              Proxima etapa recomendada
            </div>
            <p className="mt-1 text-xs text-foreground/70">
              Entrar na Orquestra para visualizar contexto, agentes, projeto e plano operando juntos.
            </p>
            <div className="mt-2">
              <Link
                href={getJourneyStepHref("orchestra", targetSessionId, selectedContext?.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
              >
                Abrir Orquestra
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FlowsPageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PipelineSkeleton />
      <div className="mt-3 space-y-2">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}

export default function FlowsPage() {
  return (
    <Suspense fallback={<FlowsPageFallback />}>
      <FlowsPageContent />
    </Suspense>
  );
}
