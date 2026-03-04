"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  Loader2,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";
import { CardSkeleton } from "@/components/shared/cosmic-skeleton";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { hydrateSessionSnapshot } from "@/lib/chat-backend-client";
import {
  getContextDirections,
  getJourneyStepHref,
  getLatestSessionId,
  getSelectedContext,
  getSessionContexts,
} from "@/lib/session-journey";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";
import type { AgentGroup } from "@/types/agent";

type GroupStrategy = AgentGroup["strategy"];

const STRATEGY_META: Record<
  GroupStrategy,
  {
    label: string;
    className: string;
    Icon: typeof Vote;
    description: string;
  }
> = {
  parallel: {
    label: "Paralelo",
    className: "text-cyan-200 border-cyan-300/30 bg-cyan-300/10",
    Icon: Layers,
    description: "Executa agentes simultaneamente.",
  },
  sequential: {
    label: "Sequencial",
    className: "text-purple-200 border-purple-300/30 bg-purple-300/10",
    Icon: Sparkles,
    description: "Passa output de um agente para o seguinte.",
  },
  consensus: {
    label: "Consenso",
    className: "text-orange-200 border-orange-300/30 bg-orange-300/10",
    Icon: Vote,
    description: "Converge decisoes entre agentes antes do final.",
  },
};

interface GroupView {
  id: string;
  name: string;
  strategy: GroupStrategy;
  agentIds: string[];
  isVirtual: boolean;
}

function GroupsPageContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");
  const queryContextId = searchParams.get("contextId");

  const [isHydrating, setIsHydrating] = useState(false);
  const hydratedSessionIdsRef = useRef<Set<string>>(new Set());

  const sessions = useWorkspaceFilteredSessions();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const messages = useSessionStore((state) => state.messages);

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
  const runtimeTasks = runtime?.tasks ?? [];

  const sessionAgents = useMemo(
    () =>
      targetSessionId
        ? agents.filter((agent) => agent.sessionId === targetSessionId)
        : [],
    [agents, targetSessionId]
  );

  const sessionGroups = useMemo(
    () =>
      targetSessionId
        ? groups.filter((group) => group.sessionId === targetSessionId)
        : [],
    [groups, targetSessionId]
  );

  const groupDirections = useMemo(
    () =>
      getContextDirections(messages, targetSessionId, {
        contextId: selectedContext?.id,
        target: "groups",
      }).slice(0, 5),
    [messages, selectedContext?.id, targetSessionId]
  );

  const effectiveGroups = useMemo<GroupView[]>(() => {
    if (sessionGroups.length > 0) {
      return sessionGroups.map((group) => ({
        id: group.id,
        name: group.name,
        strategy: group.strategy,
        agentIds: group.agentIds,
        isVirtual: false,
      }));
    }

    if (!targetSessionId || runtimeTasks.length === 0) {
      return [];
    }

    const strategyFromContext = selectedContext?.taskRouting.executionStrategy;
    const strategy: GroupStrategy =
      strategyFromContext === "consensus"
        ? "consensus"
        : strategyFromContext === "parallel"
        ? "parallel"
        : "sequential";

    return [
      {
        id: `group-virtual-${targetSessionId}`,
        name: "Core Workflow",
        strategy,
        agentIds: Array.from(new Set(runtimeTasks.map((task) => task.agentId))),
        isVirtual: true,
      },
    ];
  }, [runtimeTasks, selectedContext?.taskRouting.executionStrategy, sessionGroups, targetSessionId]);

  const shouldHydrate =
    Boolean(targetSessionId) &&
    !isHydrating &&
    effectiveGroups.length === 0 &&
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
        console.error("Failed to hydrate session on groups page", error);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [shouldHydrate, targetSessionId, isHydrating]);

  useEffect(() => {
    if (!targetSessionId) {
      return;
    }

    markJourneyStepVisited(targetSessionId, "groups");
  }, [markJourneyStepVisited, targetSessionId]);

  const agentById = useMemo(
    () => new Map(sessionAgents.map((agent) => [agent.id, agent])),
    [sessionAgents]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <Users className="h-5 w-5 text-green-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Grupos de Execucao</h1>
            <p className="mt-1 text-sm text-white/50">
              Colaboracao de agentes organizada para cumprir o plano do projeto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {targetSessionId ? (
            <Link
              href={getJourneyStepHref(
                "projects",
                targetSessionId,
                selectedContext?.id
              )}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-xs text-white/70 transition-all hover:border-white/[0.24] hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Projetos
            </Link>
          ) : null}
          {targetSessionId ? (
            <Link
              href={getJourneyStepHref("flows", targetSessionId, selectedContext?.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
            >
              Ir para Fluxos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      {isHydrating ? (
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Carregando grupos da sessao...
          </div>
        </div>
      ) : !targetSessionId ? (
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 text-sm text-white/65">
          Nenhuma sessao ativa encontrada. Inicie no chat para montar grupos.
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">
              Direcoes para grupos
            </p>
            {groupDirections.length === 0 ? (
              <p className="mt-2 text-sm text-white/50">
                Sem direcoes adicionais para grupos neste contexto.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {groupDirections.map((direction) => (
                  <div
                    key={direction.id}
                    className="rounded-lg border border-green-300/20 bg-green-300/10 px-3 py-2"
                  >
                    <p className="text-sm text-green-100/90">{direction.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {effectiveGroups.length === 0 ? (
            <CosmicEmptyState
              icon={Users}
              title="Nenhum grupo ativo"
              description="Grupos sao criados automaticamente durante a orquestracao."
              neonColor="green"
            />
          ) : (
            <div className="space-y-3">
              {effectiveGroups.map((group) => {
                const meta = STRATEGY_META[group.strategy];
                const members = group.agentIds
                  .map((agentId) => agentById.get(agentId))
                  .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
                const relatedTasks = runtimeTasks.filter((task) =>
                  group.agentIds.includes(task.agentId)
                );

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-white/90">{group.name}</p>
                        <p className="text-xs text-white/45">
                          {group.isVirtual
                            ? "grupo sintetico gerado a partir das tarefas"
                            : "grupo registrado na sessao"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${meta.className}`}
                      >
                        <meta.Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>

                    <p className="mb-3 text-xs text-white/55">{meta.description}</p>

                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {members.length === 0 ? (
                        <span className="rounded-md border border-white/[0.12] bg-white/[0.05] px-2 py-1 text-xs text-white/45">
                          Sem membros mapeados
                        </span>
                      ) : (
                        members.map((member) => (
                          <span
                            key={member.id}
                            className="rounded-md border border-white/[0.12] bg-white/[0.05] px-2 py-1 text-xs text-white/70"
                          >
                            {member.name}
                          </span>
                        ))
                      )}
                    </div>

                    <div className="space-y-1.5 rounded-lg border border-white/[0.08] bg-black/25 p-2.5">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                        Funcoes cobertas
                      </p>
                      {relatedTasks.length === 0 ? (
                        <p className="text-xs text-white/45">Sem funcoes vinculadas ainda.</p>
                      ) : (
                        relatedTasks
                          .sort((a, b) => a.priority - b.priority)
                          .map((task) => (
                            <div key={task.id} className="text-xs text-white/70">
                              {task.priority}. {task.title} · {task.agentName} · {task.progress}%
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 p-3">
            <div className="inline-flex items-center gap-1.5 text-sm text-neon-cyan">
              <Sparkles className="h-4 w-4" />
              Proxima etapa recomendada
            </div>
            <p className="mt-1 text-xs text-white/70">
              Executar pipeline completo e acompanhar cada estagio da engrenagem em tempo real.
            </p>
            <div className="mt-2">
              <Link
                href={getJourneyStepHref("flows", targetSessionId, selectedContext?.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
              >
                Abrir Fluxos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function GroupsPageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<GroupsPageFallback />}>
      <GroupsPageContent />
    </Suspense>
  );
}
