"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Filter,
  FolderKanban,
  MessageSquare,
  Pencil,
  Plus,
  Archive,
  Activity,
  Plug,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSessionStore } from "@/stores/session-store";
import { useProjectStore } from "@/stores/project-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useWorkspaceStats } from "@/hooks/use-workspace-stats";
import { createId, createSession } from "@/lib/chat-orchestrator";
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
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
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

function DetailContent() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const workspace = useWorkspaceStore((s) => s.getWorkspace(workspaceId));
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const archiveWorkspace = useWorkspaceStore((s) => s.archiveWorkspace);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const sessions = useSessionStore((s) => s.sessions);
  const addSession = useSessionStore((s) => s.addSession);
  const messages = useSessionStore((s) => s.messages);
  const runtimes = useRuntimeStore((s) => s.sessions);
  const stats = useWorkspaceStats(workspaceId);

  const wsProjects = useProjectStore((s) => s.getProjectsByWorkspace(workspaceId));
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const removeProject = useProjectStore((s) => s.removeProject);

  const [hydrated, setHydrated] = useState(() =>
    useWorkspaceStore.persist.hasHydrated()
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editProjectTarget, setEditProjectTarget] = useState<Project | null>(null);

  useEffect(() => {
    const unsub = useWorkspaceStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  const activeProjects = useMemo(
    () => wsProjects.filter((p) => p.status === "active"),
    [wsProjects]
  );

  const archivedProjects = useMemo(
    () => wsProjects.filter((p) => p.status === "archived"),
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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const p of wsProjects) {
      for (const tag of p.tags ?? []) tags.add(tag);
    }
    return Array.from(tags);
  }, [wsProjects]);

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

  const handleNewSession = () => {
    const sessionId = createId("session");
    const session = createSession(sessionId, `Nova sessao — ${workspace?.name ?? ""}`, workspaceId);
    addSession(session);
    router.push(`/dashboard/chat/${sessionId}`);
  };

  if (!workspace) {
    if (!hydrated) return <DetailFallback />;
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
      {/* Hero Header */}
      <div className={cn(
        "relative mb-6 overflow-hidden rounded-2xl border p-6",
        colors.border,
        "bg-gradient-to-br from-black/40 via-neutral-900/70 to-black/30"
      )}>
        <div className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-20",
          colors.bg
        )} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/dashboard/workspaces"
              className="mt-1.5 flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/35 transition-colors hover:text-foreground/60"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div
              className={cn(
                "flex h-13 w-13 items-center justify-center rounded-xl border",
                colors.border,
                colors.bg
              )}
            >
              <Icon className={cn("h-6 w-6", colors.text)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="mt-1 text-sm text-foreground/45">
                  {workspace.description}
                </p>
              )}
              {allTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {allTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 rounded-md border border-foreground/[0.06] bg-foreground/[0.03] px-1.5 py-0.5 text-[9px] text-foreground/35"
                    >
                      <Tag className="h-2 w-2" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditDialogOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.10] bg-foreground/[0.04] px-3 py-2 text-xs text-foreground/50 transition-all hover:border-foreground/[0.20] hover:text-foreground/70"
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
                  : "border-foreground/[0.10] bg-foreground/[0.04] text-foreground/50 hover:border-foreground/[0.20] hover:text-foreground/70"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {isActive ? "Filtro ativo" : "Ativar filtro"}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3.5 backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-md border", colors.border, colors.bg)}>
              <FolderKanban className={cn("h-3 w-3", colors.text)} />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/35">Projetos</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeProjects.length}</p>
          {archivedProjects.length > 0 && (
            <p className="mt-0.5 text-[10px] text-foreground/20">+{archivedProjects.length} arquivados</p>
          )}
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3.5 backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neon-cyan/20 bg-neon-cyan/10">
              <MessageSquare className="h-3 w-3 text-neon-cyan" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/35">Sessoes</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.sessionCount}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3.5 backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-foreground/[0.08] bg-foreground/[0.04]">
              <MessageSquare className="h-3 w-3 text-foreground/40" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/35">Mensagens</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.messageCount}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3.5 backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neon-green/20 bg-neon-green/10">
              <Activity className="h-3 w-3 text-neon-green" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/35">Progresso</p>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-foreground">{stats.overallProgress}%</p>
            <div className="mb-1.5 h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div
                className="h-full rounded-full bg-neon-green/60 transition-all"
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          {/* Projects */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                <FolderKanban className="h-3.5 w-3.5" />
                Projetos
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditProjectTarget(null);
                  setProjectDialogOpen(true);
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all",
                  colors.border, colors.bg, colors.text,
                  "hover:opacity-80"
                )}
              >
                <Plus className="h-3 w-3" />
                Novo projeto
              </button>
            </div>

            {activeProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-foreground/[0.08] bg-black/15 p-8 text-center">
                <div className={cn("mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border", colors.border, colors.bg, "opacity-50")}>
                  <FolderKanban className={cn("h-5 w-5", colors.text)} />
                </div>
                <p className="text-xs text-foreground/35">
                  Crie projetos para organizar as sessoes deste workspace
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditProjectTarget(null);
                    setProjectDialogOpen(true);
                  }}
                  className={cn(
                    "mt-3 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all hover:opacity-80",
                    colors.border, colors.bg, colors.text
                  )}
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

          {/* Loose Sessions */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                <MessageSquare className="h-3.5 w-3.5" />
                Sessoes avulsas
                {looseSessions.length > 0 && (
                  <span className="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-normal text-foreground/30">
                    {looseSessions.length}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setAssignDialogOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] text-neon-cyan hover:text-neon-cyan/80"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </button>
            </div>

            {looseSessions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-foreground/[0.06] bg-black/10 px-4 py-3 text-center text-[11px] text-foreground/25">
                Todas as sessoes estao em projetos ou nenhuma atribuida
              </p>
            ) : (
              <div className="space-y-2">
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
                      className="group/s rounded-xl border border-foreground/[0.06] bg-black/20 p-3 transition-all hover:border-foreground/[0.10] hover:bg-black/30"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground/80">
                            {session.title}
                          </p>
                          <p className="text-[10px] text-foreground/30">
                            {formatSessionTime(session.updatedAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] ${
                            running
                              ? "border border-amber-300/30 bg-amber-300/10 text-amber-200"
                              : "border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/40"
                          }`}
                        >
                          {running ? "Executando" : "Aguardando"}
                        </span>
                      </div>

                      <div className="mb-2 h-1 overflow-hidden rounded-full bg-foreground/[0.05]">
                        <div
                          className="h-full rounded-full bg-neon-cyan/50 transition-all"
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

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Acoes rapidas
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEditProjectTarget(null);
                  setProjectDialogOpen(true);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-all hover:opacity-80",
                  colors.border, "bg-gradient-to-r", colors.gradient
                )}
              >
                <FolderKanban className={cn("h-3.5 w-3.5", colors.text)} />
                <span className={colors.text}>Novo projeto</span>
              </button>
              <button
                type="button"
                onClick={handleNewSession}
                className="flex w-full items-center gap-2 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-2.5 text-left text-xs text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Nova sessao
              </button>
              <button
                type="button"
                onClick={() => setAssignDialogOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2.5 text-left text-xs text-foreground/55 transition-all hover:border-foreground/[0.15] hover:text-foreground/75"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar sessoes
              </button>
              {workspace.status === "active" && (
                <button
                  type="button"
                  onClick={() => {
                    archiveWorkspace(workspaceId);
                    toast.success("Workspace arquivado");
                    router.push("/dashboard/workspaces");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-foreground/[0.05] bg-foreground/[0.02] px-3 py-2.5 text-left text-xs text-foreground/30 transition-all hover:border-foreground/[0.10] hover:text-foreground/50"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Arquivar workspace
                </button>
              )}
            </div>
          </div>

          {/* MCP Connectors */}
          {(workspace.mcpConnectorIds ?? []).length > 0 && (
            <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                <Plug className="h-3 w-3" />
                MCP Connectors
              </div>
              <div className="space-y-1.5">
                {(workspace.mcpConnectorIds ?? []).map((connId) => (
                  <div
                    key={connId}
                    className="flex items-center gap-2 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2.5 py-2"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-neon-green" />
                    <span className="text-xs text-foreground/60">{connId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.lastActivity && (
            <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-wider text-foreground/30">
                Ultima atividade
              </p>
              <p className="mt-1.5 text-xs font-medium text-foreground/60">
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
