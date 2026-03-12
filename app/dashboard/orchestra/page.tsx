"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Orbit, ArrowRight, Clock, Play } from "lucide-react";
import { OperationLensHeader } from "@/components/dashboard/operation-lens-header";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";

export default function OrchestraHubPage() {
  const mounted = useClientMounted();
  const sessions = useWorkspaceFilteredSessions();
  const runtimeSessions = useRuntimeStore((s) => s.sessions);

  const orchestrableSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "active" || s.status === "completed")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 20),
    [sessions]
  );

  if (!mounted) {
    return <div className="mx-auto min-h-[70vh] max-w-4xl px-4 py-6 sm:px-6 sm:py-8" />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <OperationLensHeader
        icon={Orbit}
        iconClassName="text-neon-purple"
        title="Orquestra"
        description="Selecione uma sessao para abrir a leitura consolidada de contexto, tarefas, agentes, grupos e checkpoints."
        supportingCopy="A Orquestra e a visao de consolidacao da operacao. Ela nao substitui o chat; ela mostra tudo que a mesma sessao ja conectou."
        meta={[{ label: "Sessoes prontas", value: `${orchestrableSessions.length}` }]}
        actions={
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.24] hover:bg-foreground/[0.08]"
          >
            Voltar ao dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {orchestrableSessions.length === 0 ? (
        <CosmicEmptyState
          icon={Orbit}
          title="Nenhuma sessão disponível"
          description="Inicie ou retome uma sessao para consolidar contexto, tarefas e entregas aqui."
        />
      ) : (
        <div className="space-y-2">
          {orchestrableSessions.map((session) => {
            const runtime = runtimeSessions[session.id];
            const progress = runtime?.overallProgress ?? 0;
            const isRunning = runtime?.isRunning ?? false;

            return (
              <Link
                key={session.id}
                href={`/dashboard/orchestra/${session.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-foreground/[0.08] bg-card/70 px-4 py-3 transition-all hover:border-foreground/[0.16] hover:bg-card"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-foreground/[0.06] bg-foreground/[0.03]">
                  {isRunning ? (
                    <Play className="h-3.5 w-3.5 text-neon-cyan" />
                  ) : (
                    <Orbit className="h-3.5 w-3.5 text-foreground/30" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground/85">
                    {session.title || "Sessão sem título"}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-foreground/40">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(session.updatedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {progress > 0 && (
                      <span className="text-neon-cyan/70">{progress}%</span>
                    )}
                  </div>
                </div>

                {progress > 0 && (
                  <div className="hidden w-24 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
                      <div
                        className="h-full rounded-full bg-neon-cyan/60 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <ArrowRight className="h-4 w-4 shrink-0 text-foreground/20 transition-colors group-hover:text-foreground/50" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
