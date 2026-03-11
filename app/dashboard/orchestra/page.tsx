"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Orbit, ArrowRight, Clock, Play } from "lucide-react";
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
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.04]">
          <Orbit className="h-5 w-5 text-neon-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orquestra</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Visão unificada da execução — contexto, agentes, projetos, grupos e fluxos trabalhando em conjunto.
          </p>
        </div>
      </div>

      {orchestrableSessions.length === 0 ? (
        <CosmicEmptyState
          icon={Orbit}
          title="Nenhuma sessão disponível"
          description="Inicie uma conversa no modo Ecossistema para orquestrar agentes e ver o resultado aqui."
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
