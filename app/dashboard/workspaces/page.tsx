"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Plus, FolderKanban, MessageSquare, Filter, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSessionStore } from "@/stores/session-store";
import { useProjectStore } from "@/stores/project-store";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { CardSkeleton, MetricSkeleton } from "@/components/shared/cosmic-skeleton";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { WorkspaceCreateDialog } from "@/components/workspace/workspace-create-dialog";
import { useClientMounted } from "@/hooks/use-client-mounted";
import type { Workspace } from "@/types/workspace";

function WorkspacesPageFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

function WorkspacesContent() {
  const mounted = useClientMounted();
  const router = useRouter();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const archiveWorkspace = useWorkspaceStore((s) => s.archiveWorkspace);
  const removeWorkspace = useWorkspaceStore((s) => s.removeWorkspace);
  const sessions = useSessionStore((s) => s.sessions);
  const allProjects = useProjectStore((s) => s.projects);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workspace | null>(null);

  const activeWorkspaces = useMemo(
    () => workspaces.filter((w) => w.status === "active"),
    [workspaces]
  );

  const archivedWorkspaces = useMemo(
    () => workspaces.filter((w) => w.status === "archived"),
    [workspaces]
  );

  const unassignedSessions = useMemo(
    () => sessions.filter((s) => !s.workspaceId),
    [sessions]
  );

  const assignedCount = useMemo(
    () => sessions.filter((s) => s.workspaceId).length,
    [sessions]
  );

  const totalProjects = useMemo(
    () => allProjects.filter((p) => p.status === "active").length,
    [allProjects]
  );

  const getSessionCount = (wsId: string) =>
    sessions.filter((s) => s.workspaceId === wsId).length;

  const getProjectCount = (wsId: string) =>
    allProjects.filter((p) => p.workspaceId === wsId && p.status === "active").length;

  const getLastActivity = (wsId: string) => {
    const wsSessions = sessions.filter((s) => s.workspaceId === wsId);
    if (wsSessions.length === 0) return null;
    return wsSessions.reduce<Date>((latest, s) => {
      const d = new Date(s.updatedAt);
      return d > latest ? d : latest;
    }, new Date(0));
  };

  const activeWsName = workspaces.find(
    (w) => w.id === activeWorkspaceId
  )?.name;

  const handleEdit = (ws: Workspace) => {
    setEditTarget(ws);
    setDialogOpen(true);
  };

  const handleActivate = (id: string) => {
    setActiveWorkspace(id);
    const ws = workspaces.find((w) => w.id === id);
    if (ws) toast.success(`Workspace "${ws.name}" ativado como filtro`);
  };

  const handleOpenWorkspace = (id: string) => {
    const ws = workspaces.find((workspace) => workspace.id === id);
    setActiveWorkspace(id);

    if (ws) {
      toast.success(`Abrindo workspace "${ws.name}"`);
    }
  };

  const handleArchive = (id: string) => {
    archiveWorkspace(id);
    toast.success("Workspace arquivado");
  };

  const handleDelete = (id: string) => {
    removeWorkspace(id);
    toast.success("Workspace excluido");
  };

  if (!mounted) {
    return <WorkspacesPageFallback />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero Header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-neon-blue/15 bg-gradient-to-br from-neon-blue/8 via-transparent to-neon-purple/5 p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon-blue/5 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neon-blue/25 bg-neon-blue/10">
              <Layers className="h-6 w-6 text-neon-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workspaces</h1>
              <p className="mt-1 text-sm text-foreground/45">
                Espacos de trabalho para organizar projetos e sessoes
              </p>
            </div>
          </div>
          <button
            data-tour="workspaces-create"
            type="button"
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neon-blue/30 bg-neon-blue/10 px-4 py-2.5 text-xs font-semibold text-neon-blue transition-all hover:border-neon-blue/60 hover:bg-neon-blue/20 hover:shadow-lg hover:shadow-neon-blue/10"
          >
            <Plus className="h-4 w-4" />
            Novo workspace
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-3.5 backdrop-blur-2xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neon-blue/20 bg-neon-blue/10">
              <Layers className="h-3 w-3 text-neon-blue" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/50">
              Workspaces
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {activeWorkspaces.length}
          </p>
          {archivedWorkspaces.length > 0 && (
            <p className="mt-0.5 text-[10px] text-foreground/25">
              +{archivedWorkspaces.length} arquivados
            </p>
          )}
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-3.5 backdrop-blur-2xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neon-purple/20 bg-neon-purple/10">
              <FolderKanban className="h-3 w-3 text-neon-purple" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/50">
              Projetos
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalProjects}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-3.5 backdrop-blur-2xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neon-cyan/20 bg-neon-cyan/10">
              <MessageSquare className="h-3 w-3 text-neon-cyan" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/50">
              Sessoes
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">{assignedCount}</p>
          <p className="mt-0.5 text-[10px] text-foreground/25">
            de {sessions.length} total
          </p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-card/76 shadow-2xl shadow-black/45 p-3.5 backdrop-blur-2xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neon-green/20 bg-neon-green/10">
              <Filter className="h-3 w-3 text-neon-green" />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-foreground/50">
              Filtro ativo
            </p>
          </div>
          <p className="truncate text-sm font-semibold text-foreground/80">
            {activeWsName ?? "Nenhum"}
          </p>
          {activeWorkspaceId && (
            <button
              type="button"
              onClick={() => setActiveWorkspace(null)}
              className="mt-1 text-[10px] text-neon-cyan hover:text-neon-cyan/80"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Workspace Grid */}
      {activeWorkspaces.length === 0 && archivedWorkspaces.length === 0 ? (
        <CosmicEmptyState
          icon={Layers}
          title="Nenhum workspace criado"
          description="Crie seu primeiro workspace para organizar projetos e sessoes em espacos dedicados."
          neonColor="blue"
          action={{
            label: "Criar workspace",
            onClick: () => {
              setEditTarget(null);
              setDialogOpen(true);
            },
          }}
        />
      ) : (
        <>
          <div
            data-tour="workspaces-grid"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {activeWorkspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                sessionCount={getSessionCount(ws.id)}
                projectCount={getProjectCount(ws.id)}
                lastActivity={getLastActivity(ws.id)}
                onOpen={handleOpenWorkspace}
                onEdit={handleEdit}
                onActivate={handleActivate}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {archivedWorkspaces.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">
                Arquivados ({archivedWorkspaces.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {archivedWorkspaces.map((ws) => (
                  <WorkspaceCard
                    key={ws.id}
                    workspace={ws}
                    sessionCount={getSessionCount(ws.id)}
                    projectCount={getProjectCount(ws.id)}
                    lastActivity={getLastActivity(ws.id)}
                    onOpen={handleOpenWorkspace}
                    onEdit={handleEdit}
                    onActivate={handleActivate}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Unassigned Sessions */}
      {unassignedSessions.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/25">
            Sem workspace ({unassignedSessions.length})
          </h3>
          <div className="space-y-1.5">
            {unassignedSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="group/s flex items-center justify-between rounded-xl border border-foreground/[0.06] bg-black/20 px-3.5 py-2.5 transition-all hover:border-foreground/[0.10] hover:bg-black/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground/60 group-hover/s:text-foreground/80">
                    {session.title}
                  </p>
                  <p className="text-[10px] text-foreground/25">
                    {new Date(session.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Link
                  href={`/dashboard/chat/${session.id}`}
                  className="ml-2 inline-flex shrink-0 items-center gap-0.5 text-[10px] text-neon-cyan hover:text-neon-cyan/80"
                >
                  Abrir
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
            {unassignedSessions.length > 5 && (
              <p className="py-1 text-center text-[10px] text-foreground/20">
                +{unassignedSessions.length - 5} sessoes sem workspace
              </p>
            )}
          </div>
        </div>
      )}

      <WorkspaceCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editWorkspace={editTarget}
        onCreated={(workspace) => {
          setActiveWorkspace(workspace.id);
          toast.success(`Workspace "${workspace.name}" criado`);
          router.push(`/dashboard/workspaces/${workspace.id}`);
        }}
      />
    </div>
  );
}

export default function WorkspacesPage() {
  return (
    <Suspense fallback={<WorkspacesPageFallback />}>
      <WorkspacesContent />
    </Suspense>
  );
}
