"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  FolderKanban,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { CardSkeleton, TaskRowSkeleton } from "@/components/shared/cosmic-skeleton";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { ProjectCard } from "@/components/workspace/project-card";
import { ProjectCreateDialog } from "@/components/workspace/project-create-dialog";
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
import { useProjectStore } from "@/stores/project-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";
import type { Project } from "@/types/project";

function formatExecutionStrategy(strategy: string | undefined) {
  if (strategy === "consensus") {
    return "consenso";
  }
  if (strategy === "parallel") {
    return "paralelo";
  }
  if (strategy === "sequential") {
    return "sequencial";
  }
  if (strategy === "pipeline") {
    return "pipeline";
  }

  return "nao definido";
}

function formatSessionTime(value: Date) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");
  const queryContextId = searchParams.get("contextId");

  const [isHydrating, setIsHydrating] = useState(false);
  const hydratedSessionIdsRef = useRef<Set<string>>(new Set());
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editProjectTarget, setEditProjectTarget] = useState<Project | null>(null);

  const sessions = useWorkspaceFilteredSessions();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const messages = useSessionStore((state) => state.messages);

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const allSessions = useSessionStore((s) => s.sessions);
  const wsProjects = useProjectStore((s) =>
    activeWorkspaceId ? s.getProjectsByWorkspace(activeWorkspaceId) : []
  );
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const activeProjects = useMemo(
    () => wsProjects.filter((p) => p.status === "active"),
    [wsProjects]
  );
  const getProjectSessionCount = (projId: string) =>
    allSessions.filter((s) => s.projectId === projId).length;
  const getProjectLastActivity = (projId: string) => {
    const projSessions = allSessions.filter((s) => s.projectId === projId);
    if (projSessions.length === 0) return null;
    return projSessions.reduce<Date>((latest, s) => {
      const d = new Date(s.updatedAt);
      return d > latest ? d : latest;
    }, new Date(0));
  };

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

  const runtime = targetSessionId ? runtimeSessions[targetSessionId] : undefined;
  const runtimeTasks = useMemo(
    () => [...(runtime?.tasks ?? [])].sort((a, b) => a.priority - b.priority),
    [runtime?.tasks]
  );

  const sessionGroups = useMemo(
    () =>
      targetSessionId
        ? groups.filter((group) => group.sessionId === targetSessionId)
        : [],
    [groups, targetSessionId]
  );

  const sessionAgents = useMemo(
    () =>
      targetSessionId
        ? agents.filter((agent) => agent.sessionId === targetSessionId)
        : [],
    [agents, targetSessionId]
  );

  const projectDirections = useMemo(
    () =>
      getContextDirections(messages, targetSessionId, {
        contextId: selectedContext?.id,
        target: "projects",
      }).slice(0, 5),
    [messages, selectedContext?.id, targetSessionId]
  );

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
        console.error("Failed to hydrate session on projects page", error);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [shouldHydrate, targetSessionId, isHydrating]);

  useEffect(() => {
    if (!targetSessionId) {
      return;
    }

    markJourneyStepVisited(targetSessionId, "projects");
  }, [markJourneyStepVisited, targetSessionId]);

  const projectObjective =
    selectedContext?.inputText ??
    targetSession?.title ??
    "Definir objetivo principal do projeto a partir do contexto";

  const projectDomains = selectedContext?.context.domains ?? [];
  const projectStrategy =
    sessionGroups[0]?.strategy ?? selectedContext?.taskRouting.executionStrategy;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <FolderKanban className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Projetos Conectados</h1>
            <p className="mt-1 text-sm text-white/50">
              Objetivo, plano de execucao e donos alinhados pelo contexto.
            </p>
            {targetSession ? (
              <p className="mt-1 text-xs text-white/35">
                Sessao: {targetSession.title} · {formatSessionTime(targetSession.updatedAt)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {targetSessionId ? (
            <Link
              href={getJourneyStepHref(
                "agents",
                targetSessionId,
                selectedContext?.id
              )}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-xs text-white/70 transition-all hover:border-white/[0.24] hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Agentes
            </Link>
          ) : null}
          {targetSessionId ? (
            <Link
              href={getJourneyStepHref(
                "groups",
                targetSessionId,
                selectedContext?.id
              )}
              className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
            >
              Ir para Grupos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      {/* Workspace Projects Grid */}
      {activeWorkspaceId && activeProjects.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white/65">
              <FolderKanban className="h-4 w-4" />
              Projetos do Workspace
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditProjectTarget(null);
                setProjectDialogOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-cyan/80"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo projeto
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((proj) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                sessionCount={getProjectSessionCount(proj.id)}
                lastActivity={getProjectLastActivity(proj.id)}
                onEdit={(p) => {
                  setEditProjectTarget(p);
                  setProjectDialogOpen(true);
                }}
                onArchive={(id) => {
                  archiveProject(id);
                  toast.success("Projeto arquivado");
                }}
                onDelete={(id) => {
                  removeProject(id);
                  toast.success("Projeto excluido");
                }}
              />
            ))}
          </div>
          <ProjectCreateDialog
            open={projectDialogOpen}
            onOpenChange={setProjectDialogOpen}
            workspaceId={activeWorkspaceId}
            editProject={editProjectTarget}
          />
        </div>
      )}

      {isHydrating ? (
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Carregando projeto da sessao...
          </div>
        </div>
      ) : !targetSessionId ? (
        <CosmicEmptyState
          icon={FolderKanban}
          title="Nenhum projeto ativo"
          description="Projetos sao criados automaticamente apos a delegacao de agentes no chat."
          neonColor="cyan"
        />
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-neon-cyan">
              <Target className="h-3.5 w-3.5" />
              Objetivo principal
            </div>
            <p className="text-sm text-white/85">{projectObjective}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-md border border-neon-cyan/20 bg-neon-cyan/5 px-2 py-0.5 text-[11px] text-white/85">
                estrategia: {formatExecutionStrategy(projectStrategy)}
              </span>
              <span className="rounded-md border border-neon-cyan/20 bg-neon-cyan/5 px-2 py-0.5 text-[11px] text-white/85">
                agentes envolvidos: {sessionAgents.length}
              </span>
              <span className="rounded-md border border-neon-cyan/20 bg-neon-cyan/5 px-2 py-0.5 text-[11px] text-white/85">
                tarefas: {runtimeTasks.length}
              </span>
            </div>
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
            <section className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
              <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-white/80">
                <Rocket className="h-4 w-4 text-neon-cyan" />
                Plano executavel do projeto
              </div>
              {runtimeTasks.length === 0 ? (
                <p className="text-sm text-white/50">
                  Ainda nao ha tarefas delegadas para este projeto.
                </p>
              ) : (
                <div className="space-y-2">
                  {runtimeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm text-white/85">
                          {task.priority}. {task.title}
                        </p>
                        <span className="text-xs text-white/55">{task.progress}%</span>
                      </div>
                      <p className="text-xs text-white/45">Responsavel: {task.agentName}</p>
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
              <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.14em] text-white/40">
                  Dominios do contexto
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {projectDomains.length === 0 ? (
                    <span className="text-xs text-white/45">Sem dominios classificados</span>
                  ) : (
                    projectDomains.map((domain) => (
                      <span
                        key={domain.domain}
                        className="rounded-full border border-white/[0.12] bg-white/[0.05] px-2 py-1 text-[11px] text-white/70"
                      >
                        {domain.domain}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.14em] text-white/40">
                  Direcoes para projeto
                </p>
                {projectDirections.length === 0 ? (
                  <p className="mt-2 text-xs text-white/50">
                    Nenhuma direcao adicional recebida para projetos.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {projectDirections.map((direction) => (
                      <div
                        key={direction.id}
                        className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-2.5 py-2"
                      >
                        <p className="text-xs text-white/85">{direction.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>

          <div className="rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 p-3">
            <div className="inline-flex items-center gap-1.5 text-sm text-neon-cyan">
              <Sparkles className="h-4 w-4" />
              Proxima etapa recomendada
            </div>
            <p className="mt-1 text-xs text-white/70">
              Organizar colaboracao entre agentes em grupos (consenso, paralelo ou sequencial).
            </p>
            <div className="mt-2">
              <Link
                href={getJourneyStepHref("groups", targetSessionId, selectedContext?.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
              >
                Abrir Grupos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectsPageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <CardSkeleton />
      <div className="mt-3 space-y-2">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageFallback />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
