"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  Bot,
  Clock,
  ExternalLink,
  FolderKanban,
  Loader2,
  MessageSquare,
  Plus,
  Rocket,
  Send,
  Target,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { OperationLensHeader } from "@/components/dashboard/operation-lens-header";
import { CardSkeleton, TaskRowSkeleton } from "@/components/shared/cosmic-skeleton";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { ProjectCard } from "@/components/workspace/project-card";
import { ProjectCreateDialog } from "@/components/workspace/project-create-dialog";
import {
  persistSessionSnapshot,
} from "@/lib/chat-backend-client";
import { createMessage } from "@/lib/chat-orchestrator";
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
import { useProjectStore } from "@/stores/project-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";
import type { Project } from "@/types/project";
import type { DecompositionResult } from "@/types/decomposition";
import type { Message } from "@/types/session";
import type { AgentInstance } from "@/types/agent";

function formatExecutionStrategy(strategy: string | undefined) {
  if (strategy === "consensus") return "consenso";
  if (strategy === "parallel") return "paralelo";
  if (strategy === "sequential") return "sequencial";
  if (strategy === "pipeline") return "orquestrado";
  return "nao definido";
}

function formatSessionTime(value: string | Date) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(date: string | Date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

/* ------------------------------------------------------------------ */
/*  Session Browser — shown when no session is selected or not found  */
/* ------------------------------------------------------------------ */
function SessionBrowser({
  sessions,
  messages,
}: {
  sessions: ReturnType<typeof useWorkspaceFilteredSessions>;
  messages: Message[];
}) {
  const sorted = useMemo(
    () =>
      [...sessions]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 12),
    [sessions]
  );

  if (sorted.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-foreground/50">
        <Clock className="h-3.5 w-3.5" />
        Sessoes recentes
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((session, i) => {
          const sessionMsgs = messages.filter(
            (m) => m.sessionId === session.id
          );
          const contextCount = new Set(
            sessionMsgs
              .map((m) => m.decompositionId)
              .filter(Boolean)
          ).size;

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <Link
                href={`/dashboard/projects?sessionId=${encodeURIComponent(session.id)}`}
                className="group flex flex-col gap-1.5 rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl transition-all hover:border-neon-cyan/30 hover:bg-card/90"
              >
                <p className="line-clamp-2 text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  {session.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-foreground/35">
                  <span>{relativeTime(session.updatedAt)}</span>
                  {contextCount > 0 && (
                    <>
                      <span className="h-0.5 w-0.5 rounded-full bg-foreground/20" />
                      <span>{contextCount} contexto{contextCount !== 1 ? "s" : ""}</span>
                    </>
                  )}
                  <span className="h-0.5 w-0.5 rounded-full bg-foreground/20" />
                  <span>{sessionMsgs.length} msgs</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Context Tabs                                                       */
/* ------------------------------------------------------------------ */
function ContextTabs({
  contexts,
  selectedId,
  sessionId,
}: {
  contexts: DecompositionResult[];
  selectedId: string | null;
  sessionId: string;
}) {
  if (contexts.length <= 1) return null;

  return (
    <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-1">
      {contexts.map((ctx, i) => {
        const active = ctx.id === selectedId;
        return (
          <Link
            key={ctx.id}
            href={`/dashboard/projects?sessionId=${encodeURIComponent(sessionId)}&contextId=${encodeURIComponent(ctx.id)}`}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-all ${active
              ? "bg-neon-cyan/15 font-medium text-neon-cyan"
              : "text-foreground/40 hover:bg-foreground/[0.04] hover:text-foreground/60"
              }`}
          >
            Contexto {i + 1}
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Agent Contributions                                                */
/* ------------------------------------------------------------------ */
function AgentContributions({
  agents,
  sessionId,
}: {
  agents: AgentInstance[];
  sessionId: string;
}) {
  const sessionAgents = useMemo(
    () => agents.filter((a) => a.sessionId === sessionId),
    [agents, sessionId]
  );

  if (sessionAgents.length === 0) return null;

  return (
    <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
      <div className="mb-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-foreground/40">
        <Bot className="h-3.5 w-3.5" />
        Agentes no projeto
      </div>
      <div className="space-y-2">
        {sessionAgents.map((agent) => {
          const latestOutput = agent.outputs[agent.outputs.length - 1];
          return (
            <div
              key={agent.id}
              className="rounded-lg border border-foreground/[0.08] bg-black/20 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground/80">{agent.name}</p>
                  <p className="text-[11px] text-foreground/40">{agent.role}</p>
                </div>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] ${agent.status === "done"
                    ? "border-green-300/30 bg-green-300/10 text-green-200"
                    : agent.status === "working" || agent.status === "thinking"
                      ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                      : "border-foreground/[0.15] bg-foreground/[0.06] text-foreground/55"
                    }`}
                >
                  {agent.status}
                </span>
              </div>
              {latestOutput && (
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-foreground/45">
                  {latestOutput.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Content                                                  */
/* ------------------------------------------------------------------ */
function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const querySessionId = searchParams.get("sessionId");
  const queryContextId = searchParams.get("contextId");

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editProjectTarget, setEditProjectTarget] = useState<Project | null>(null);
  const [contextInstruction, setContextInstruction] = useState("");

  const sessions = useWorkspaceFilteredSessions();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const messages = useSessionStore((state) => state.messages);
  const addMessage = useSessionStore((state) => state.addMessage);

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
  const addRuntimeNote = useRuntimeStore((state) => state.addNote);

  const latestSessionId = useMemo(() => getLatestSessionId(sessions), [sessions]);
  const targetSessionId = querySessionId ?? currentSessionId ?? latestSessionId;

  const targetSession = useMemo(() => {
    if (!targetSessionId) return null;
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
    runtimeTasks.length === 0 &&
    contexts.length === 0;
  const { isHydrating } = useSessionSnapshotHydration({
    sessionId: targetSessionId,
    enabled: shouldHydrate,
    logLabel: "projects page",
  });

  // Detect broken link: querySessionId provided but session not found
  const isBrokenLink = Boolean(querySessionId) && !targetSession && !isHydrating;

  useEffect(() => {
    if (!targetSessionId) return;
    markJourneyStepVisited(targetSessionId, "projects");
  }, [markJourneyStepVisited, targetSessionId]);

  const projectObjective =
    selectedContext?.inputText ??
    targetSession?.title ??
    "Definir objetivo principal do projeto a partir do contexto";

  const projectDomains = selectedContext?.context.domains ?? [];
  const projectStrategy =
    sessionGroups[0]?.strategy ?? selectedContext?.taskRouting.executionStrategy;

  const handleSendInstruction = () => {
    if (!targetSessionId || !selectedContext) return;
    const text = contextInstruction.trim();
    if (!text) return;

    addMessage(
      createMessage(targetSessionId, "user", text, {
        contextChat: true,
        decompositionId: selectedContext.id,
        routeTargets: ["projects"],
      })
    );

    addMessage(
      createMessage(
        targetSessionId,
        "assistant",
        `Direcao para projeto registrada: "${text}"\nContexto: ${selectedContext.id.slice(0, 8)} · Estrategia: ${formatExecutionStrategy(projectStrategy)}.`,
        {
          contextChat: true,
          contextRouting: true,
          decompositionId: selectedContext.id,
          routeTargets: ["projects"],
        }
      )
    );

    addRuntimeNote(
      targetSessionId,
      `[Projeto ${selectedContext.id.slice(0, 8)}] ${text}`
    );

    setContextInstruction("");
    toast.success("Direcao registrada no projeto.");
    void persistSessionSnapshot(targetSessionId).catch(() => { });
  };

  const hasSessionContent =
    targetSessionId && (contexts.length > 0 || runtimeTasks.length > 0 || sessionAgents.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <OperationLensHeader
          icon={FolderKanban}
          iconClassName="text-blue-300"
          title="Projetos"
          description="Esta camada traduz o contexto validado em objetivo, plano e follow-up para a mesma sessao de trabalho."
          supportingCopy="Projetos nao competem com o chat. Eles consolidam o que ja foi entendido e delegado para a operacao continuar com precisao."
          sessionTitle={targetSession?.title ?? null}
          updatedAtLabel={
            targetSession ? formatSessionTime(targetSession.updatedAt) : null
          }
          meta={[
            { label: "Contextos", value: `${contexts.length}` },
            { label: "Agentes", value: `${sessionAgents.length}` },
            { label: "Tarefas", value: `${runtimeTasks.length}` },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {targetSessionId && targetSession ? (
                <>
                  <Link
                    href={`/dashboard/chat/${targetSessionId}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.24] hover:bg-foreground/[0.08]"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </Link>
                  <Link
                    href={getJourneyStepHref("agents", targetSessionId, selectedContext?.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.24] hover:bg-foreground/[0.08]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Agentes
                  </Link>
                  <Link
                    href={getJourneyStepHref("groups", targetSessionId, selectedContext?.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
                  >
                    Grupos
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : null}
            </div>
          }
        />
      </motion.div>

      {/* Workspace Projects Grid */}
      {activeWorkspaceId && activeProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-foreground/65">
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
        </motion.div>
      )}

      {/* Broken link notice */}
      {isBrokenLink && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4"
        >
          <p className="text-sm font-medium text-amber-200/80">
            Sessao nao encontrada
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            O link que voce acessou refere-se a uma sessao que nao esta mais disponivel localmente.
            Selecione uma sessao recente abaixo ou inicie uma nova conversa.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/projects")}
              className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 py-1.5 text-xs text-foreground/70 transition-all hover:border-foreground/[0.24] hover:bg-foreground/[0.08]"
            >
              Ver todas as sessoes
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/20"
            >
              Nova conversa
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Session browser — shown when no session selected or broken link */}
      {(!targetSessionId || isBrokenLink) && (
        <SessionBrowser
          sessions={sessions}
          messages={messages}
        />
      )}

      {/* Loading state */}
      {isHydrating && (
        <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-6 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 text-sm text-foreground/70">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Carregando projeto da sessao...
          </div>
        </div>
      )}

      {/* Empty state — no sessions at all */}
      {!isHydrating && !targetSessionId && sessions.length === 0 && (
        <CosmicEmptyState
          icon={FolderKanban}
          title="Nenhum projeto ativo"
          description="Projetos sao criados automaticamente apos a delegacao de agentes no chat."
          neonColor="cyan"
          action={{ label: "Iniciar conversa", href: "/dashboard" }}
        />
      )}

      {/* Session content */}
      {!isHydrating && targetSession && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Context tabs */}
          <ContextTabs
            contexts={contexts}
            selectedId={selectedContext?.id ?? null}
            sessionId={targetSessionId ?? ""}
          />

          {/* Metrics row */}
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-wide text-foreground/35">Contextos</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{contexts.length}</p>
            </div>
            <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-wide text-foreground/35">Agentes</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{sessionAgents.length}</p>
            </div>
            <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-wide text-foreground/35">Tarefas</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{runtimeTasks.length}</p>
            </div>
            <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-wide text-foreground/35">Estrategia</p>
              <p className="mt-1 text-sm font-semibold text-foreground capitalize">
                {formatExecutionStrategy(projectStrategy)}
              </p>
            </div>
          </div>

          {/* Objective */}
          <div className="mb-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-neon-cyan">
              <Target className="h-3.5 w-3.5" />
              Objetivo principal
            </div>
            <p className="text-sm text-foreground/85">{projectObjective}</p>
          </div>

          {/* Main content grid */}
          <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
            {/* Left column: Execution plan + Agent contributions */}
            <div className="space-y-4">
              <section className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
                <div className="mb-2 inline-flex items-center gap-1.5 text-sm text-foreground/80">
                  <Rocket className="h-4 w-4 text-neon-cyan" />
                  Plano executavel
                </div>
                {runtimeTasks.length === 0 ? (
                  <p className="text-sm text-foreground/50">
                    Ainda nao ha tarefas delegadas para este projeto.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {runtimeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-foreground/[0.08] bg-black/25 px-3 py-2"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-sm text-foreground/85">
                            {task.priority}. {task.title}
                          </p>
                          <span className="text-xs text-foreground/55">{task.progress}%</span>
                        </div>
                        <p className="text-xs text-foreground/45">
                          Responsavel: {task.agentName}
                        </p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                          <div
                            className="h-full rounded-full bg-neon-cyan/70 transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Agent contributions */}
              <AgentContributions agents={agents} sessionId={targetSessionId ?? ""} />
            </div>

            {/* Right column: Domains, Directions, Instruction */}
            <aside className="space-y-3">
              <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.14em] text-foreground/40">
                  Dominios do contexto
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {projectDomains.length === 0 ? (
                    <span className="text-xs text-foreground/45">Sem dominios classificados</span>
                  ) : (
                    projectDomains.map((domain) => (
                      <span
                        key={domain.domain}
                        className="rounded-full border border-foreground/[0.12] bg-foreground/[0.05] px-2 py-1 text-[11px] text-foreground/70"
                      >
                        {domain.domain}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.14em] text-foreground/40">
                  Direcoes para projeto
                </p>
                {projectDirections.length === 0 ? (
                  <p className="mt-2 text-xs text-foreground/50">
                    Nenhuma direcao adicional recebida.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {projectDirections.map((direction) => (
                      <div
                        key={direction.id}
                        className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-2.5 py-2"
                      >
                        <p className="text-xs text-foreground/85">{direction.text}</p>
                        <p className="mt-1 text-[10px] text-foreground/35">
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

              {/* Context instruction input */}
              {selectedContext && (
                <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-foreground/40">
                    Adicionar direcao
                  </p>
                  <textarea
                    value={contextInstruction}
                    onChange={(e) => setContextInstruction(e.target.value)}
                    placeholder="Ex: priorizar entrega do MVP antes do design system..."
                    className="h-16 w-full resize-none rounded-lg border border-foreground/[0.06] bg-black/20 p-2 text-xs text-foreground placeholder:text-foreground/25 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendInstruction}
                    disabled={!contextInstruction.trim()}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-3 w-3" />
                    Enviar direcao
                  </button>
                </div>
              )}
            </aside>
          </div>

          {/* Next step */}
          <div className="rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 p-3">
            <div className="inline-flex items-center gap-1.5 text-sm text-neon-cyan">
              <Blocks className="h-4 w-4" />
              Proxima etapa recomendada
            </div>
            <p className="mt-1 text-xs text-foreground/70">
              Organizar colaboracao entre agentes em grupos (consenso, paralelo ou sequencial).
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Link
                href={getJourneyStepHref("groups", targetSessionId ?? "", selectedContext?.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
              >
                Abrir Grupos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={`/dashboard/chat/${targetSessionId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 py-1.5 text-xs text-foreground/60 transition-all hover:border-foreground/[0.24] hover:bg-foreground/[0.08]"
              >
                <MessageSquare className="h-3 w-3" />
                Continuar no chat
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Session selected but no content yet (after hydration) */}
      {!isHydrating && targetSession && !hasSessionContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4"
        >
          <CosmicEmptyState
            icon={FolderKanban}
            title="Projeto em construcao"
            description="Esta sessao ainda nao gerou contextos ou tarefas. Continue a conversa para que o projeto seja construido automaticamente."
            neonColor="cyan"
            action={{
              label: "Continuar no chat",
              href: `/dashboard/chat/${targetSessionId}`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

function ProjectsPageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-foreground/[0.04]" />
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-foreground/[0.04]" />
          <div className="h-3 w-72 animate-pulse rounded bg-foreground/[0.04]" />
        </div>
      </div>
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
