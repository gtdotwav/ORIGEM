"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Archive,
  Calendar,
  MessageSquare,
  Plus,
  Tag,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/stores/project-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { createId, createSession } from "@/lib/chat-orchestrator";
import {
  WORKSPACE_ICONS,
  WORKSPACE_COLORS,
} from "@/components/workspace/workspace-card";
import { ProjectCreateDialog } from "@/components/workspace/project-create-dialog";
import { ProjectGoalsPanel } from "@/components/workspace/project-goals-panel";
import { ProjectNotesPanel } from "@/components/workspace/project-notes-panel";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { MetricSkeleton, CardSkeleton } from "@/components/shared/cosmic-skeleton";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-foreground/40 border-foreground/[0.08] bg-foreground/[0.03]" },
  medium: { label: "Media", color: "text-neon-cyan border-neon-cyan/25 bg-neon-cyan/8" },
  high: { label: "Alta", color: "text-neon-orange border-neon-orange/25 bg-neon-orange/8" },
  critical: { label: "Critica", color: "text-red-400 border-red-400/25 bg-red-400/8" },
};

function DetailFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
      <div className="space-y-2.5">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

function formatSessionTime(value: string | Date) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null;
  const date = new Date(deadline);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  const formatted = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (days < 0) return { text: `${formatted} (atrasado)`, urgent: true };
  if (days <= 3) return { text: `${formatted} (${days}d restantes)`, urgent: true };
  if (days <= 7) return { text: `${formatted} (${days}d)`, urgent: false };
  return { text: formatted, urgent: false };
}

function DetailContent() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const project = useProjectStore((s) => s.getProject(projectId));
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const workspace = useWorkspaceStore((s) => s.getWorkspace(workspaceId));
  const sessions = useSessionStore((s) => s.sessions);
  const addSession = useSessionStore((s) => s.addSession);
  const updateSession = useSessionStore((s) => s.updateSession);
  const messages = useSessionStore((s) => s.messages);
  const agents = useAgentStore((s) => s.agents);
  const runtimes = useRuntimeStore((s) => s.sessions);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const projectSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.projectId === projectId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [sessions, projectId]
  );

  const availableSessions = useMemo(
    () =>
      sessions.filter(
        (s) => s.workspaceId === workspaceId && !s.projectId
      ),
    [sessions, workspaceId]
  );

  const stats = useMemo(() => {
    const sessionIds = new Set(projectSessions.map((s) => s.id));
    const msgCount = messages.filter((m) => sessionIds.has(m.sessionId)).length;
    const agentCount = agents.filter((a) => sessionIds.has(a.sessionId)).length;
    let progressSum = 0;
    let progressCount = 0;
    for (const s of projectSessions) {
      const rt = runtimes[s.id];
      if (rt) {
        progressSum += rt.overallProgress ?? 0;
        progressCount++;
      }
    }
    const goalsTotal = (project?.goals ?? []).length;
    const goalsDone = (project?.goals ?? []).filter((g) => g.done).length;
    return {
      sessionCount: projectSessions.length,
      messageCount: msgCount,
      agentCount,
      overallProgress: progressCount > 0 ? Math.round(progressSum / progressCount) : 0,
      goalsTotal,
      goalsDone,
      goalsProgress: goalsTotal > 0 ? Math.round((goalsDone / goalsTotal) * 100) : 0,
    };
  }, [projectSessions, messages, agents, runtimes, project?.goals]);

  if (!project || !workspace) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <CosmicEmptyState
          icon={Archive}
          title="Projeto nao encontrado"
          description="Este projeto pode ter sido excluido ou o ID e invalido."
          neonColor="orange"
          action={{ label: "Voltar", href: `/dashboard/workspaces/${workspaceId}` }}
        />
      </div>
    );
  }

  const colors = WORKSPACE_COLORS[project.color];
  const Icon = WORKSPACE_ICONS[project.icon];
  const priority = PRIORITY_LABELS[project.priority ?? "medium"];
  const deadlineInfo = formatDeadline(project.deadline ?? null);

  const handleAssignSession = (sessionId: string) => {
    updateSession(sessionId, { projectId });
    toast.success("Sessao adicionada ao projeto");
  };

  const handleNewSession = () => {
    const sessionId = createId("session");
    const session = createSession(sessionId, `Nova sessao — ${project.name}`, workspaceId);
    addSession({ ...session, projectId });
    router.push(`/dashboard/chat/${sessionId}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className={cn(
        "relative mb-6 overflow-hidden rounded-2xl border p-5",
        colors.border,
        "bg-gradient-to-br from-black/40 via-neutral-900/70 to-black/30"
      )}>
        <div className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-15",
          colors.bg
        )} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              href={`/dashboard/workspaces/${workspaceId}`}
              className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/35 transition-colors hover:text-foreground/60"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl border",
                colors.border,
                colors.bg
              )}
            >
              <Icon className={cn("h-5 w-5", colors.text)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-1 text-sm text-foreground/45">
                  {project.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-foreground/30">
                  Workspace: {workspace.name}
                </span>
                <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-medium", priority.color)}>
                  {priority.label}
                </span>
                {deadlineInfo && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]",
                    deadlineInfo.urgent
                      ? "border-red-400/25 bg-red-400/8 text-red-400"
                      : "border-foreground/[0.08] bg-foreground/[0.03] text-foreground/40"
                  )}>
                    {deadlineInfo.urgent ? <AlertTriangle className="h-2.5 w-2.5" /> : <Calendar className="h-2.5 w-2.5" />}
                    {deadlineInfo.text}
                  </span>
                )}
                {(project.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 rounded-md border border-foreground/[0.08] bg-foreground/[0.03] px-1.5 py-0.5 text-[10px] text-foreground/40"
                  >
                    <Tag className="h-2 w-2" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditDialogOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.10] bg-foreground/[0.04] px-3 py-2 text-xs text-foreground/50 transition-all hover:border-foreground/[0.20] hover:text-foreground/70"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handleNewSession}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:opacity-80",
                colors.border, colors.bg, colors.text
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Nova sessao
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-neon-cyan/20 bg-neon-cyan/10">
              <MessageSquare className="h-2.5 w-2.5 text-neon-cyan" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/35">Sessoes</p>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.sessionCount}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-foreground/[0.08] bg-foreground/[0.04]">
              <MessageSquare className="h-2.5 w-2.5 text-foreground/40" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/35">Mensagens</p>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.messageCount}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-neon-orange/20 bg-neon-orange/10">
              <Clock className="h-2.5 w-2.5 text-neon-orange" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/35">Agentes</p>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.agentCount}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-neon-green/20 bg-neon-green/10">
              <ArrowUpRight className="h-2.5 w-2.5 text-neon-green" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/35">Objetivos</p>
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.goalsDone}/{stats.goalsTotal}
          </p>
          {stats.goalsTotal > 0 && (
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div
                className="h-full rounded-full bg-neon-green/60 transition-all"
                style={{ width: `${stats.goalsProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left column: Sessions */}
        <div className="space-y-5">
          {/* Sessions */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Sessoes do Projeto
              </h2>
              <button
                type="button"
                onClick={() => setAssignOpen(!assignOpen)}
                className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:text-neon-cyan/80"
              >
                <Plus className="h-3 w-3" />
                Adicionar existentes
              </button>
            </div>

            {assignOpen && availableSessions.length > 0 && (
              <div className="mb-4 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-3">
                <p className="mb-2 text-xs text-foreground/50">
                  Sessoes disponiveis neste workspace:
                </p>
                <div className="space-y-1.5">
                  {availableSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-foreground/[0.06] bg-black/20 px-3 py-2"
                    >
                      <p className="truncate text-xs text-foreground/70">
                        {session.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAssignSession(session.id)}
                        className="ml-2 shrink-0 rounded-md border border-neon-cyan/25 bg-neon-cyan/10 px-2 py-1 text-[10px] text-neon-cyan transition-all hover:bg-neon-cyan/20"
                      >
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projectSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-foreground/[0.08] bg-black/15 p-6 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-foreground/15" />
                <p className="text-xs text-foreground/30">
                  Nenhuma sessao neste projeto
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleNewSession}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all hover:opacity-80",
                      colors.border, colors.bg, colors.text
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    Nova sessao
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.08] px-3 py-1.5 text-[11px] text-foreground/40 hover:text-foreground/60"
                  >
                    Adicionar existentes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectSessions.map((session) => {
                  const sessionMessages = messages.filter(
                    (m) => m.sessionId === session.id
                  );
                  const runtime = runtimes[session.id];
                  const progress = runtime?.overallProgress ?? 0;
                  const running = Boolean(runtime?.isRunning);

                  return (
                    <div
                      key={session.id}
                      className="group/s rounded-xl border border-foreground/[0.08] bg-black/25 p-3 transition-all hover:border-foreground/[0.12]"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground/85">
                            {session.title}
                          </p>
                          <p className="text-[10px] text-foreground/30">
                            {formatSessionTime(session.updatedAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                            running
                              ? "border border-amber-300/30 bg-amber-300/10 text-amber-200"
                              : "border border-foreground/[0.10] bg-foreground/[0.05] text-foreground/55"
                          }`}
                        >
                          {running ? "Em execucao" : "Aguardando"}
                        </span>
                      </div>

                      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
                        <div
                          className="h-full rounded-full bg-neon-cyan/70 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-foreground/30">
                          <span>{sessionMessages.length} msgs</span>
                          <span>·</span>
                          <span>{runtime?.tasks.length ?? 0} tarefas</span>
                        </div>
                        <div className="flex gap-1.5 opacity-0 transition-opacity group-hover/s:opacity-100">
                          <Link
                            href={`/dashboard/chat/${session.id}`}
                            className="inline-flex items-center gap-0.5 rounded-md border border-neon-cyan/25 bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-medium text-neon-cyan transition-all hover:bg-neon-cyan/20"
                          >
                            Chat
                            <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                          <Link
                            href={`/dashboard/orchestra/${session.id}`}
                            className="rounded-md border border-fuchsia-300/20 bg-fuchsia-300/10 px-2 py-0.5 text-[10px] text-fuchsia-200 transition-all hover:bg-fuchsia-300/20"
                          >
                            Orquestra
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Goals, Notes, Actions */}
        <aside className="space-y-4">
          {/* Goals */}
          <ProjectGoalsPanel
            projectId={projectId}
            goals={project.goals ?? []}
          />

          {/* Notes */}
          <ProjectNotesPanel
            projectId={projectId}
            notes={project.notes ?? []}
          />

          {/* Actions */}
          <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Acoes
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleNewSession}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-all hover:opacity-80",
                  colors.border, "bg-gradient-to-r", colors.gradient
                )}
              >
                <Plus className={cn("h-3.5 w-3.5", colors.text)} />
                <span className={colors.text}>Nova sessao</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2.5 text-left text-xs text-foreground/55 transition-all hover:border-foreground/[0.15] hover:text-foreground/75"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar sessoes
              </button>
              {project.status === "active" && (
                <button
                  type="button"
                  onClick={() => {
                    archiveProject(projectId);
                    toast.success("Projeto arquivado");
                    router.push(`/dashboard/workspaces/${workspaceId}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-foreground/[0.05] bg-foreground/[0.02] px-3 py-2.5 text-left text-xs text-foreground/30 transition-all hover:border-foreground/[0.10] hover:text-foreground/50"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Arquivar projeto
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ProjectCreateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        workspaceId={workspaceId}
        editProject={project}
      />
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<DetailFallback />}>
      <DetailContent />
    </Suspense>
  );
}
