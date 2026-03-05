"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Atom,
  Bot,
  Brain,
  FolderKanban,
  GitBranch,
  Loader2,
  Orbit,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { persistSessionSnapshot } from "@/lib/chat-backend-client";
import {
  createId,
  createMessage,
  createSession,
  runChatOrchestration,
} from "@/lib/chat-orchestrator";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";

const SUGGESTIONS = [
  "Criar fluxo multiagente com consenso",
  "Definir contexto e delegar em paralelo",
  "Montar plano didatico Contexto -> Fluxo",
  "Unificar outputs x, y, z no pipeline",
];

const STAGE_LABELS: Record<string, string> = {
  idle: "Aguardando",
  intake: "Intake",
  decomposing: "Decompondo",
  routing: "Roteando",
  spawning: "Delegando",
  executing: "Executando",
  branching: "Ajustando",
  aggregating: "Agregando",
  complete: "Concluido",
  error: "Erro",
};

interface ProviderSummaryResponse {
  providers: Array<{
    provider: string;
    hasApiKey: boolean;
    selectedModel: string;
    keyHint: string | null;
    updatedAt: number;
  }>;
}

function formatSessionTime(value: Date) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardControlPage() {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [providerConnectedCount, setProviderConnectedCount] = useState(0);
  const [providerTotalCount, setProviderTotalCount] = useState(0);
  const [sessionPage, setSessionPage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const sessions = useWorkspaceFilteredSessions();
  const messages = useSessionStore((state) => state.messages);
  const addSession = useSessionStore((state) => state.addSession);
  const addMessage = useSessionStore((state) => state.addMessage);
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);

  const runtimes = useRuntimeStore((state) => state.sessions);
  const pipelineStage = usePipelineStore((state) => state.stage);
  const pipelineProgress = usePipelineStore((state) => state.progress);
  const resetPipeline = usePipelineStore((state) => state.reset);

  const decompositions = useDecompositionStore((state) => state.decompositions);
  const agents = useAgentStore((state) => state.agents);
  const groups = useAgentStore((state) => state.groups);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let alive = true;

    const loadProviders = async () => {
      try {
        const response = await fetch("/api/settings/providers", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok || !alive) {
          return;
        }

        const data = (await response.json()) as ProviderSummaryResponse;
        const connected = data.providers.filter((provider) => provider.hasApiKey).length;

        setProviderConnectedCount(connected);
        setProviderTotalCount(data.providers.length);
      } catch (error) {
        console.error("Failed to load providers summary", error);
      }
    };

    void loadProviders();

    return () => {
      alive = false;
    };
  }, []);

  const latestSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [sessions]
  );

  const activeSessionCount = useMemo(
    () => sessions.filter((session) => session.status === "active").length,
    [sessions]
  );

  const runtimeList = useMemo(() => Object.values(runtimes), [runtimes]);
  const runningRuntimes = useMemo(
    () => runtimeList.filter((runtime) => runtime.isRunning),
    [runtimeList]
  );

  const totalNotes = useMemo(
    () => runtimeList.reduce((acc, runtime) => acc + runtime.notes.length, 0),
    [runtimeList]
  );

  const totalRuntimeTasks = useMemo(
    () => runtimeList.reduce((acc, runtime) => acc + runtime.tasks.length, 0),
    [runtimeList]
  );

  const latestSessionId = latestSessions[0]?.id ?? null;

  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(latestSessions.length / PAGE_SIZE);

  const startSessionFromDashboard = async () => {
    const text = input.trim();
    if (!text || sending) {
      return;
    }

    const sessionId = createId("session");
    const session = createSession(sessionId, text);

    addSession(session);
    setCurrentSession(sessionId);
    addMessage(createMessage(sessionId, "user", text));
    setInput("");
    setSending(true);

    router.push(`/dashboard/chat/${sessionId}`);

    try {
      await runChatOrchestration(sessionId, text);
      persistSessionSnapshot(sessionId).catch((err) =>
        console.warn("[snapshot] persist failed (non-blocking):", err)
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 md:px-6">
      <div className="mb-5 rounded-2xl border border-foreground/[0.08] bg-card/70 p-5 backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-foreground/35">
              Dashboard Control Center
            </p>
            <h1 className="text-2xl font-semibold text-foreground/90">
              Controle operacional completo da engrenagem
            </h1>
            <p className="mt-1 text-sm text-foreground/55">
              Dispare sessoes, monitore delegacao em tempo real e avance
              {" "}Contexto {"->"} Agentes {"->"} Projetos {"->"} Grupos {"->"} Fluxos {"->"} Orquestra.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg border border-foreground/[0.10] bg-black/35 px-2.5 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.2] hover:bg-foreground/[0.08]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Principal
            </Link>
            <div className="rounded-xl border border-foreground/[0.08] bg-black/30 px-3 py-2 text-xs text-foreground/65">
              Pipeline global: {STAGE_LABELS[pipelineStage] ?? pipelineStage}
            </div>
          </div>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
          <div
            className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
            style={{ width: `${pipelineProgress}%` }}
          />
        </div>

        <div className="rounded-xl border border-foreground/[0.08] bg-black/30 p-3">
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-foreground/70">
            <Sparkles className="h-4 w-4 text-neon-cyan" />
            Iniciar nova sessão controlada
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Digite a instrução mestre para acionar todas as funcionalidades..."
              className="min-w-[260px] flex-1 rounded-lg border border-foreground/[0.08] bg-card px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 outline-none"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void startSessionFromDashboard();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void startSessionFromDashboard()}
              disabled={!input.trim() || sending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? "Executando..." : "Disparar"}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-3 py-1 text-[11px] text-foreground/55 transition-all hover:border-foreground/20 hover:bg-foreground/[0.08] hover:text-foreground/75"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-wide text-foreground/35">Sessoes</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{sessions.length}</p>
          <p className="text-xs text-foreground/45">{activeSessionCount} ativas</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-wide text-foreground/35">Contextos</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {Object.keys(decompositions).length}
          </p>
          <p className="text-xs text-foreground/45">decomposicoes registradas</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-wide text-foreground/35">Agentes e Grupos</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {agents.length} / {groups.length}
          </p>
          <p className="text-xs text-foreground/45">instancias da sessao global</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-wide text-foreground/35">Runtime</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{runningRuntimes.length}</p>
          <p className="text-xs text-foreground/45">
            execucoes ao vivo · {totalRuntimeTasks} tarefas · {totalNotes} notas
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
        <section className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/65">
              Sessoes e Comandos
            </h2>
            {latestSessionId ? (
              <Link
                href={`/dashboard/chat/${latestSessionId}`}
                className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-cyan/80"
              >
                Abrir ultima sessao
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>

          {latestSessions.length === 0 ? (
            <CosmicEmptyState
              icon={Sparkles}
              title="Nenhuma sessao ativa"
              description="Crie uma nova sessao no dashboard para iniciar a orquestracao."
              neonColor="cyan"
              action={{ label: "Ir ao dashboard", href: "/dashboard" }}
            />
          ) : (
            <>
            <div className="space-y-2.5">
              {latestSessions.slice(sessionPage * PAGE_SIZE, (sessionPage + 1) * PAGE_SIZE).map((session) => {
                const sessionMessages = messages.filter(
                  (message) => message.sessionId === session.id
                );
                const runtime = runtimes[session.id];
                const sessionProgress = runtime?.overallProgress ?? 0;
                const running = Boolean(runtime?.isRunning);

                return (
                  <div
                    key={session.id}
                    className="rounded-xl border border-foreground/[0.08] bg-black/25 p-3"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground/85">{session.title}</p>
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
                        style={{ width: `${sessionProgress}%` }}
                      />
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-foreground/45">
                      <span>{sessionMessages.length} mensagens</span>
                      <span>•</span>
                      <span>{runtime?.tasks.length ?? 0} tarefas</span>
                      <span>•</span>
                      <span>{runtime?.notes.length ?? 0} notas</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/chat/${session.id}`}
                        className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-[11px] font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
                      >
                        Chat
                      </Link>
                      <Link
                        href={`/dashboard/contexts?sessionId=${encodeURIComponent(session.id)}`}
                        className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[11px] text-cyan-200 transition-all hover:border-cyan-300/45 hover:bg-cyan-300/20"
                      >
                        Contextos
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
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-foreground/35">
                <button type="button" disabled={sessionPage === 0} onClick={() => setSessionPage(p => p - 1)}
                  className="transition-colors hover:text-foreground/60 disabled:opacity-30">Anterior</button>
                <span>{sessionPage + 1} / {totalPages}</span>
                <button type="button" disabled={sessionPage >= totalPages - 1} onClick={() => setSessionPage(p => p + 1)}
                  className="transition-colors hover:text-foreground/60 disabled:opacity-30">Proxima</button>
              </div>
            )}
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/65">
              Modulos de Controle
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard/contexts" className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-2 text-[11px] text-cyan-200 transition-all hover:border-cyan-300/40 hover:bg-cyan-300/15">
                <div className="mb-1 inline-flex items-center gap-1">
                  <Brain className="h-3.5 w-3.5" />
                  Contextos
                </div>
              </Link>
              <Link href="/dashboard/agents" className="rounded-lg border border-blue-300/20 bg-blue-300/10 px-2.5 py-2 text-[11px] text-blue-200 transition-all hover:border-blue-300/40 hover:bg-blue-300/15">
                <div className="mb-1 inline-flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5" />
                  Agentes
                </div>
              </Link>
              <Link href="/dashboard/projects" className="rounded-lg border border-indigo-300/20 bg-indigo-300/10 px-2.5 py-2 text-[11px] text-indigo-200 transition-all hover:border-indigo-300/40 hover:bg-indigo-300/15">
                <div className="mb-1 inline-flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5" />
                  Projetos
                </div>
              </Link>
              <Link href="/dashboard/groups" className="rounded-lg border border-green-300/20 bg-green-300/10 px-2.5 py-2 text-[11px] text-green-200 transition-all hover:border-green-300/40 hover:bg-green-300/15">
                <div className="mb-1 inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Grupos
                </div>
              </Link>
              <Link href="/dashboard/flows" className="rounded-lg border border-orange-300/20 bg-orange-300/10 px-2.5 py-2 text-[11px] text-orange-200 transition-all hover:border-orange-300/40 hover:bg-orange-300/15">
                <div className="mb-1 inline-flex items-center gap-1">
                  <GitBranch className="h-3.5 w-3.5" />
                  Fluxos
                </div>
              </Link>
              <Link href={latestSessionId ? `/dashboard/orchestra/${latestSessionId}` : "/dashboard/space"} className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/10 px-2.5 py-2 text-[11px] text-fuchsia-200 transition-all hover:border-fuchsia-300/40 hover:bg-fuchsia-300/15">
                <div className="mb-1 inline-flex items-center gap-1">
                  <Orbit className="h-3.5 w-3.5" />
                  Orquestra
                </div>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/65">
              Infra e Estado
            </h2>
            <div className="space-y-2 text-xs text-foreground/60">
              <div className="flex items-center justify-between rounded-lg border border-foreground/[0.06] bg-black/25 px-2.5 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <Atom className="h-3.5 w-3.5 text-neon-cyan" />
                  Pipeline
                </span>
                <span>{STAGE_LABELS[pipelineStage] ?? pipelineStage}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-foreground/[0.06] bg-black/25 px-2.5 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-green-300" />
                  Providers conectados
                </span>
                <span>
                  {providerConnectedCount}/{providerTotalCount || 0}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={resetPipeline}
              className="mt-3 w-full rounded-lg border border-foreground/[0.10] bg-foreground/[0.05] px-3 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.2] hover:bg-foreground/[0.08]"
            >
              Resetar Pipeline Global
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
