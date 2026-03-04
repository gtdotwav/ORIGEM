"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Filter,
  FolderKanban,
  Pencil,
  Plus,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSessionStore } from "@/stores/session-store";
import { useProjectStore } from "@/stores/project-store";
import { useAgentStore } from "@/stores/agent-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useWorkspaceStats } from "@/hooks/use-workspace-stats";
import {
  WORKSPACE_ICONS,
  WORKSPACE_COLORS,
} from "@/components/workspace/workspace-card";
import { WorkspaceCreateDialog } from "@/components/workspace/workspace-create-dialog";
import { WorkspaceSessionAssignDialog } from "@/components/workspace/workspace-session-assign-dialog";
import { ProjectCard } from "@/components/workspace/project-card";
import { ProjectCreateDialog } from "@/components/workspace/project-create-dialog";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { MetricSkeleton, CardSkeleton } from "@/components/shared/cosmic-skeleton";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

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

function formatSessionTime(value: Date) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailContent() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const workspace = useWorkspaceStore((s) => s.getWorkspace(workspaceId));
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const archiveWorkspace = useWorkspaceStore((s) => s.archiveWorkspace);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const sessions = useSessionStore((s) => s.sessions);
  const messages = useSessionStore((s) => s.messages);
  const runtimes = useRuntimeStore((s) => s.sessions);
  const stats = useWorkspaceStats(workspaceId);

  const wsProjects = useProjectStore((s) => s.getProjectsByWorkspace(workspaceId));
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const removeProject = useProjectStore((s) => s.removeProject);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editProjectTarget, setEditProjectTarget] = useState<Project | null>(null);

  const activeProjects = useMemo(
    () => wsProjects.filter((p) => p.status === "active"),
    [wsProjects]
  );

  const wsSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.workspaceId === workspaceId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [sessions, workspaceId]
  );

  const looseSessions = useMemo(
    () => wsSessions.filter((s) => !s.projectId),
    [wsSessions]
  );

  const getProjectSessionCount = (projId: string) =>
    sessions.filter((s) => s.projectId === projId).length;

  const getProjectLastActivity = (projId: string) => {
    const projSessions = sessions.filter((s) => s.projectId === projId);
    if (projSessions.length === 0) return null;
    return projSessions.reduce<Date>((latest, s) => {
      const d = new Date(s.updatedAt);
      return d > latest ? d : latest;
    }, new Date(0));
  };

  const handleEditProject = (project: Project) => {
    setEditProjectTarget(project);
    setProjectDialogOpen(true);
  };

  const handleArchiveProject = (id: string) => {
    archiveProject(id);
    toast.success("Projeto arquivado");
  };

  const handleDeleteProject = (id: string) => {
    removeProject(id);
    toast.success("Projeto excluido");
  };

  if (!workspace) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <CosmicEmptyState
          icon={Archive}
          title="Workspace nao encontrado"
          description="Este workspace pode ter sido excluido ou o ID e invalido."
          neonColor="orange"
          action={{ label: "Voltar", href: "/dashboard/workspaces" }}
        />
      </div>
    );
  }

  const colors = WORKSPACE_COLORS[workspace.color];
  const Icon = WORKSPACE_ICONS[workspace.icon];
  const isActive = activeWorkspaceId === workspaceId;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border",
              colors.border,
              colors.bg
            )}
          >
            <Icon className={cn("h-5 w-5", colors.text)} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {workspace.name}
            </h1>
            {workspace.description && (
              <p className="mt-1 text-sm text-white/50">
                {workspace.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/workspaces"
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-white/50 transition-all hover:border-white/[0.15] hover:text-white/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Workspaces
          </Link>
          <button
            type="button"
            onClick={() => setEditDialogOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-white/50 transition-all hover:border-white/[0.15] hover:text-white/70"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              if (isActive) {
                setActiveWorkspace(null);
                toast.success("Filtro de workspace removido");
              } else {
                setActiveWorkspace(workspaceId);
                toast.success(
                  `Workspace "${workspace.name}" ativado como filtro`
                );
              }
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
              isActive
                ? `${colors.border} ${colors.bg} ${colors.text}`
                : "border-white/[0.08] text-white/50 hover:border-white/[0.15] hover:text-white/70"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            {isActive ? "Filtro ativo" : "Ativar filtro"}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-white/35">
            Projetos
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {activeProjects.length}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-white/35">
            Sessoes
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {stats.sessionCount}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-white/35">
            Mensagens
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {stats.messageCount}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-white/35">
            Progresso medio
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {stats.overallProgress}%
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-6">
          {/* Projects */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white/65">
                <FolderKanban className="h-4 w-4" />
                Projetos
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

            {activeProjects.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-black/15 p-4 text-center">
                <FolderKanban className="mx-auto mb-2 h-6 w-6 text-white/20" />
                <p className="text-xs text-white/40">
                  Crie projetos para organizar as sessoes deste workspace.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditProjectTarget(null);
                    setProjectDialogOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 px-3 py-1.5 text-[11px] text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/20"
                >
                  <Plus className="h-3 w-3" />
                  Criar projeto
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeProjects.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    project={proj}
                    sessionCount={getProjectSessionCount(proj.id)}
                    lastActivity={getProjectLastActivity(proj.id)}
                    onEdit={handleEditProject}
                    onArchive={handleArchiveProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Loose Sessions (not in any project) */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/65">
                Sessoes avulsas
              </h2>
              <button
                type="button"
                onClick={() => setAssignDialogOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-cyan/80"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar sessoes
              </button>
            </div>

            {looseSessions.length === 0 ? (
              <p className="rounded-xl border border-white/[0.06] bg-black/15 px-4 py-3 text-center text-xs text-white/35">
                Todas as sessoes estao em projetos ou nenhuma sessao atribuida.
              </p>
            ) : (
              <div className="space-y-2.5">
                {looseSessions.map((session) => {
                  const sessionMessages = messages.filter(
                    (m) => m.sessionId === session.id
                  );
                  const runtime = runtimes[session.id];
                  const progress = runtime?.overallProgress ?? 0;
                  const running = Boolean(runtime?.isRunning);

                  return (
                    <div
                      key={session.id}
                      className="rounded-xl border border-white/[0.08] bg-black/25 p-3"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-white/85">
                            {session.title}
                          </p>
                          <p className="text-[11px] text-white/40">
                            Atualizada em {formatSessionTime(session.updatedAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${
                            running
                              ? "border border-amber-300/30 bg-amber-300/10 text-amber-200"
                              : "border border-white/[0.10] bg-white/[0.05] text-white/55"
                          }`}
                        >
                          {running ? "Em execucao" : "Aguardando"}
                        </span>
                      </div>

                      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-neon-cyan/70 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
                        <span>{sessionMessages.length} mensagens</span>
                        <span>·</span>
                        <span>{runtime?.tasks.length ?? 0} tarefas</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/chat/${session.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-[11px] font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
                        >
                          Chat
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <Link
                          href={`/dashboard/orchestra/${session.id}`}
                          className="rounded-lg border border-fuchsia-300/25 bg-fuchsia-300/10 px-2.5 py-1 text-[11px] text-fuchsia-200 transition-all hover:border-fuchsia-300/45 hover:bg-fuchsia-300/20"
                        >
                          Orquestra
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/65">
              Acoes
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEditProjectTarget(null);
                  setProjectDialogOpen(true);
                }}
                className="w-full rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-2 text-left text-xs text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
              >
                Novo projeto
              </button>
              <button
                type="button"
                onClick={() => setAssignDialogOpen(true)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-left text-xs text-white/60 transition-all hover:border-white/[0.15] hover:text-white/80"
              >
                Adicionar sessoes
              </button>
              <Link
                href="/dashboard"
                className="block w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-left text-xs text-white/60 transition-all hover:border-white/[0.15] hover:text-white/80"
              >
                Criar nova sessao
              </Link>
              {workspace.status === "active" && (
                <button
                  type="button"
                  onClick={() => {
                    archiveWorkspace(workspaceId);
                    toast.success("Workspace arquivado");
                    router.push("/dashboard/workspaces");
                  }}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-xs text-white/40 transition-all hover:border-white/[0.12] hover:text-white/60"
                >
                  Arquivar workspace
                </button>
              )}
            </div>
          </div>

          {stats.lastActivity && (
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-wide text-white/35">
                Ultima atividade
              </p>
              <p className="mt-1 text-xs text-white/60">
                {formatSessionTime(stats.lastActivity)}
              </p>
            </div>
          )}
        </aside>
      </div>

      <WorkspaceCreateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editWorkspace={workspace}
      />

      <WorkspaceSessionAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        workspaceId={workspaceId}
        workspaceName={workspace.name}
      />

      <ProjectCreateDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        workspaceId={workspaceId}
        editProject={editProjectTarget}
      />
    </div>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <Suspense fallback={<DetailFallback />}>
      <DetailContent />
    </Suspense>
  );
}
