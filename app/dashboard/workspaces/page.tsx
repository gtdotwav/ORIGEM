"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { Layers, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSessionStore } from "@/stores/session-store";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { CardSkeleton, MetricSkeleton } from "@/components/shared/cosmic-skeleton";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { WorkspaceCreateDialog } from "@/components/workspace/workspace-create-dialog";
import type { Workspace } from "@/types/workspace";

function WorkspacesPageFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
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
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const archiveWorkspace = useWorkspaceStore((s) => s.archiveWorkspace);
  const removeWorkspace = useWorkspaceStore((s) => s.removeWorkspace);
  const sessions = useSessionStore((s) => s.sessions);

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

  const getSessionCount = (wsId: string) =>
    sessions.filter((s) => s.workspaceId === wsId).length;

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

  const handleArchive = (id: string) => {
    archiveWorkspace(id);
    toast.success("Workspace arquivado");
  };

  const handleDelete = (id: string) => {
    removeWorkspace(id);
    toast.success("Workspace excluido");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-blue/20 bg-neon-blue/5">
            <Layers className="h-5 w-5 text-neon-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Workspaces</h1>
            <p className="mt-1 text-sm text-white/50">
              Organize sessoes e projetos em espacos de trabalho
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/control"
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-white/50 transition-all hover:border-white/[0.15] hover:text-white/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Controle
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neon-blue/30 bg-neon-blue/10 px-3 py-2 text-xs font-medium text-neon-blue transition-all hover:border-neon-blue/60 hover:bg-neon-blue/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo workspace
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-white/35">
            Total workspaces
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {activeWorkspaces.length}
          </p>
          {archivedWorkspaces.length > 0 && (
            <p className="text-xs text-white/35">
              +{archivedWorkspaces.length} arquivados
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-white/35">
            Sessoes organizadas
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {assignedCount}
          </p>
          <p className="text-xs text-white/35">
            de {sessions.length} total
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-neutral-900/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-white/35">
            Workspace ativo
          </p>
          <p className="mt-1 text-sm font-medium text-white/80">
            {activeWsName ?? "Nenhum"}
          </p>
          {activeWorkspaceId && (
            <button
              type="button"
              onClick={() => setActiveWorkspace(null)}
              className="mt-1 text-xs text-neon-cyan hover:text-neon-cyan/80"
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
          description="Crie seu primeiro workspace para organizar sessoes e projetos em espacos de trabalho dedicados."
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeWorkspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                sessionCount={getSessionCount(ws.id)}
                lastActivity={getLastActivity(ws.id)}
                onEdit={handleEdit}
                onActivate={handleActivate}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {archivedWorkspaces.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-white/30">
                Arquivados
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {archivedWorkspaces.map((ws) => (
                  <WorkspaceCard
                    key={ws.id}
                    workspace={ws}
                    sessionCount={getSessionCount(ws.id)}
                    lastActivity={getLastActivity(ws.id)}
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
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-white/30">
            Sem workspace ({unassignedSessions.length})
          </h3>
          <div className="space-y-1.5">
            {unassignedSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/70">
                    {session.title}
                  </p>
                  <p className="text-[10px] text-white/30">
                    {new Date(session.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Link
                  href={`/dashboard/chat/${session.id}`}
                  className="ml-2 shrink-0 text-[10px] text-neon-cyan hover:text-neon-cyan/80"
                >
                  Abrir
                </Link>
              </div>
            ))}
            {unassignedSessions.length > 5 && (
              <p className="py-1 text-center text-[10px] text-white/25">
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
