"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Loader2,
  Sparkles,
} from "lucide-react";
import { hydrateSessionSnapshot } from "@/lib/chat-backend-client";
import {
  getContextDirections,
  getJourneyStepHref,
  getLatestSessionId,
  getSelectedContext,
  getSessionContexts,
} from "@/lib/session-journey";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
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
  pending: "text-white/50 border-white/[0.12] bg-white/[0.05]",
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
    return "Pipeline finalizado";
  }

  return event.type;
}

function FlowsPageContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");
  const queryContextId = searchParams.get("contextId");

  const [isHydrating, setIsHydrating] = useState(false);
  const hydratedSessionIdsRef = useRef<Set<string>>(new Set());

  const sessions = useSessionStore((state) => state.sessions);
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

  const relevantEvents = useMemo(() => {
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
  }, [pipelineEvents, runtime?.runId, targetSessionId]);

  const shouldHydrate =
    Boolean(targetSessionId) &&
    !isHydrating &&
    runtimeTasks.length === 0 &&
    contexts.length === 0;

  useEffect(() => {
    if (!targetSessionId || !shouldHydrate) {
      return;
    }

    if (hydratedSessionIdsRef.current.has(targetSessionId)) {
      return;
    }

    hydratedSessionIdsRef.current.add(targetSessionId);
    setIsHydrating(true);

    void hydrateSessionSnapshot(targetSessionId)
      .catch((error) => {
        console.error("Failed to hydrate session on flows page", error);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [shouldHydrate, targetSessionId, isHydrating]);

  useEffect(() => {
    if (!targetSessionId) {
      return;
    }

    markJourneyStepVisited(targetSessionId, "flows");
  }, [markJourneyStepVisited, targetSessionId]);

  const progress = runtime?.overallProgress ?? pipelineProgress;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <GitBranch className="h-5 w-5 text-orange-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Fluxos em Tempo Real</h1>
            <p className="mt-1 text-sm text-white/50">
              Pipeline conectado a contexto, grupos e tarefas do runtime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {targetSessionId ? (
            <Link
              href={getJourneyStepHref(
                "groups",
                targetSessionId,
                selectedContext?.id
              )}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-xs text-white/70 transition-all hover:border-white/[0.24] hover:bg-white/[0.08]"
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
      </div>

      {isHydrating ? (
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6">
          <div className="inline-flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Carregando fluxo da sessao...
          </div>
        </div>
      ) : !targetSessionId ? (
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 text-sm text-white/65">
          Nenhuma sessao ativa encontrada. Inicie no chat para disparar pipeline.
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">
                Estado do pipeline
              </p>
              <span className="text-xs text-white/60">
                {STAGE_LABELS[pipelineStage]} · {progress}%
              </span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_ORDER.map((stage) => {
                const reached = PIPELINE_ORDER.indexOf(stage) <= PIPELINE_ORDER.indexOf(pipelineStage);
                return (
                  <span
                    key={stage}
                    className={`rounded-md border px-2 py-0.5 text-[11px] ${
                      reached
                        ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
                        : "border-white/[0.10] bg-white/[0.04] text-white/45"
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
            <section className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/40">
                Funcoes em execucao
              </p>
              {runtimeTasks.length === 0 ? (
                <p className="text-sm text-white/50">Nenhuma tarefa ativa para esta sessao.</p>
              ) : (
                <div className="space-y-2">
                  {runtimeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2"
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className="text-sm text-white/85">
                          {task.priority}. {task.title}
                        </p>
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[10px] ${STATUS_STYLE[task.status]}`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/45">Agente: {task.agentName}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
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
              <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/40">
                  Direcoes para fluxo
                </p>
                {flowDirections.length === 0 ? (
                  <p className="mt-2 text-xs text-white/50">
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

              <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/40">
                  Eventos recentes
                </p>
                {relevantEvents.length === 0 ? (
                  <p className="mt-2 text-xs text-white/50">Sem eventos no pipeline ainda.</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {relevantEvents.map((event, index) => (
                      <div
                        key={`${event.type}-${event.timestamp}-${index}`}
                        className="rounded-lg border border-white/[0.08] bg-black/25 px-2.5 py-2"
                      >
                        <p className="text-xs text-white/75">{eventLabel(event)}</p>
                        <p className="mt-0.5 text-[10px] text-white/40">
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
            <p className="mt-1 text-xs text-white/70">
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
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6">
        <div className="inline-flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
          Carregando fluxos...
        </div>
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
