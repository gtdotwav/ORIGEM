"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Filter,
  Pencil,
  Plus,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useWorkspaceStats } from "@/hooks/use-workspace-stats";
import {
  WORKSPACE_ICONS,
  WORKSPACE_COLORS,
} from "@/components/workspace/workspace-card";
import { WorkspaceCreateDialog } from "@/components/workspace/workspace-create-dialog";
import { WorkspaceSessionAssignDialog } from "@/components/workspace/workspace-session-assign-dialog";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { MetricSkeleton, CardSkeleton } from "@/components/shared/cosmic-skeleton";
import { cn } from "@/lib/utils";

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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

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
            Agentes
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {stats.agentCount}
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
        {/* Sessions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/65">
              Sessoes
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

          {wsSessions.length === 0 ? (
            <CosmicEmptyState
              icon={Archive}
              title="Nenhuma sessao neste workspace"
              description="Adicione sessoes existentes ou crie uma nova sessao no dashboard."
              neonColor="blue"
              action={{
                label: "Adicionar sessoes",
                onClick: () => setAssignDialogOpen(true),
              }}
            />
          ) : (
            <div className="space-y-2.5">
              {wsSessions.map((session) => {
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
                      <span>•</span>
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

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/65">
              Acoes
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setAssignDialogOpen(true)}
                className="w-full rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-2 text-left text-xs text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
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
