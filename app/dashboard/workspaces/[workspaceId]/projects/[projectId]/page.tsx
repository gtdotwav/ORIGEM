"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Archive,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/stores/project-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import {
  WORKSPACE_ICONS,
  WORKSPACE_COLORS,
} from "@/components/workspace/workspace-card";
import { ProjectCreateDialog } from "@/components/workspace/project-create-dialog";
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
  const projectId = params.projectId as string;

  const project = useProjectStore((s) => s.getProject(projectId));
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const workspace = useWorkspaceStore((s) => s.getWorkspace(workspaceId));
  const sessions = useSessionStore((s) => s.sessions);
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
    return {
      sessionCount: projectSessions.length,
      messageCount: msgCount,
      agentCount,
      overallProgress: progressCount > 0 ? Math.round(progressSum / progressCount) : 0,
    };
  }, [projectSessions, messages, agents, runtimes]);

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

  const handleAssignSession = (sessionId: string) => {
    updateSession(sessionId, { projectId });
    toast.success("Sessao adicionada ao projeto");
  };

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
            <h1 className="text-2xl font-semibold text-foreground">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-foreground/50">
                {project.description}
              </p>
            )}
            <p className="mt-1 text-xs text-foreground/30">
              Workspace: {workspace.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/workspaces/${workspaceId}`}
            className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.08] px-3 py-2 text-xs text-foreground/50 transition-all hover:border-foreground/[0.15] hover:text-foreground/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Workspace
          </Link>
          <button
            type="button"
            onClick={() => setEditDialogOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.08] px-3 py-2 text-xs text-foreground/50 transition-all hover:border-foreground/[0.15] hover:text-foreground/70"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-foreground/35">
            Sessoes
          </p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {stats.sessionCount}
          </p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-foreground/35">
            Mensagens
          </p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {stats.messageCount}
          </p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-foreground/35">
            Agentes
          </p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {stats.agentCount}
          </p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-wide text-foreground/35">
            Progresso medio
          </p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {stats.overallProgress}%
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        {/* Sessions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/65">
              Sessoes do Projeto
            </h2>
            <button
              type="button"
              onClick={() => setAssignOpen(!assignOpen)}
              className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-cyan/80"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar sessoes
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
            <CosmicEmptyState
              icon={Archive}
              title="Nenhuma sessao neste projeto"
              description="Adicione sessoes do workspace para comecar a organizar."
              neonColor="blue"
              action={{
                label: "Adicionar sessoes",
                onClick: () => setAssignOpen(true),
              }}
            />
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
                    className="rounded-xl border border-foreground/[0.08] bg-black/25 p-3"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground/85">
                          {session.title}
                        </p>
                        <p className="text-[11px] text-foreground/40">
                          Atualizada em {formatSessionTime(session.updatedAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
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

                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-foreground/45">
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

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/65">
              Acoes
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setAssignOpen(true)}
                className="w-full rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-2 text-left text-xs text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
              >
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
                  className="w-full rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] px-3 py-2 text-left text-xs text-foreground/40 transition-all hover:border-foreground/[0.12] hover:text-foreground/60"
                >
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
