"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  Gauge,
  Loader2,
  Search,
  Send,
  Tags,
  Target,
} from "lucide-react";
import { ContextSkeleton } from "@/components/shared/cosmic-skeleton";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { toast } from "sonner";
import {
  hydrateSessionSnapshot,
  persistSessionSnapshot,
} from "@/lib/chat-backend-client";
import { createMessage } from "@/lib/chat-orchestrator";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";
import type {
  DecompositionResult,
  Intent,
  TaskRoutingResult,
} from "@/types/decomposition";
import type { Message } from "@/types/session";
import type { RuntimeFunctionKey } from "@/types/runtime";

type ConnectionKey =
  | "agents"
  | "projects"
  | "groups"
  | "flows"
  | "orchestra";

const INTENT_COLORS: Record<Intent, string> = {
  create: "text-green-400 bg-green-400/10 border-green-400/20",
  analyze: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  design: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  transform: "text-amber-300 bg-amber-300/10 border-amber-300/20",
  question: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  explore: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  fix: "text-red-400 bg-red-400/10 border-red-400/20",
  compare: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  summarize: "text-white/70 bg-white/[0.08] border-white/20",
  execute: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20",
};

const CONNECTION_META: Record<
  ConnectionKey,
  {
    label: string;
    description: string;
    className: string;
    href: (sessionId: string, contextId: string) => string;
  }
> = {
  agents: {
    label: "Agentes",
    description: "Delegar direcao por agente especialista.",
    className: "text-cyan-300 border-cyan-300/30 bg-cyan-300/10",
    href: (sessionId, contextId) =>
      `/dashboard/agents?sessionId=${encodeURIComponent(
        sessionId
      )}&contextId=${encodeURIComponent(contextId)}`,
  },
  projects: {
    label: "Projetos",
    description: "Traduzir contexto em objetivo executavel.",
    className: "text-blue-300 border-blue-300/30 bg-blue-300/10",
    href: (sessionId, contextId) =>
      `/dashboard/projects?sessionId=${encodeURIComponent(
        sessionId
      )}&contextId=${encodeURIComponent(contextId)}`,
  },
  groups: {
    label: "Grupos",
    description: "Definir consenso/paralelo/sequencial.",
    className: "text-green-300 border-green-300/30 bg-green-300/10",
    href: (sessionId, contextId) =>
      `/dashboard/groups?sessionId=${encodeURIComponent(
        sessionId
      )}&contextId=${encodeURIComponent(contextId)}`,
  },
  flows: {
    label: "Fluxos",
    description: "Orquestrar x, y, z e consolidar pipeline.",
    className: "text-orange-300 border-orange-300/30 bg-orange-300/10",
    href: (sessionId, contextId) =>
      `/dashboard/flows?sessionId=${encodeURIComponent(
        sessionId
      )}&contextId=${encodeURIComponent(contextId)}`,
  },
  orchestra: {
    label: "Orquestra",
    description: "Rodar engrenagem visual com conexoes finais.",
    className: "text-fuchsia-300 border-fuchsia-300/30 bg-fuchsia-300/10",
    href: (sessionId, contextId) =>
      `/dashboard/orchestra/${encodeURIComponent(
        sessionId
      )}?contextId=${encodeURIComponent(contextId)}`,
  },
};

function getMetadataDecompositionId(
  metadata: Record<string, unknown> | undefined
): string | null {
  const decompositionId = metadata?.decompositionId;
  return typeof decompositionId === "string" ? decompositionId : null;
}

function formatIntent(intent: Intent) {
  return intent.replace(/_/g, " ");
}

function formatMessageTime(date: Date) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatExecutionStrategy(strategy: TaskRoutingResult["executionStrategy"]) {
  if (strategy === "consensus") {
    return "consenso";
  }
  if (strategy === "parallel") {
    return "paralelo";
  }
  if (strategy === "sequential") {
    return "sequencial";
  }
  return "pipeline";
}

function detectConnectionTargets(text: string): ConnectionKey[] {
  const normalized = text.toLowerCase();
  const targets: ConnectionKey[] = [];

  if (/agente|agent|critic|designer|builder|planner/.test(normalized)) {
    targets.push("agents");
  }
  if (/projeto|project|roadmap|objetivo/.test(normalized)) {
    targets.push("projects");
  }
  if (/grupo|group|consenso|consensus|paralelo|sequencial/.test(normalized)) {
    targets.push("groups");
  }
  if (/fluxo|flow|pipeline|integrar|juntar|agregar/.test(normalized)) {
    targets.push("flows");
  }
  if (/orquestra|orchestra|canvas/.test(normalized)) {
    targets.push("orchestra");
  }

  if (targets.length === 0) {
    return ["agents", "projects", "groups", "flows"];
  }

  return Array.from(new Set(targets));
}

function detectPreferredStrategy(text: string): "consensus" | "parallel" | "sequential" | null {
  const normalized = text.toLowerCase();

  if (/consenso|consensus|votacao|votação/.test(normalized)) {
    return "consensus";
  }

  if (/paralelo|parallel/.test(normalized)) {
    return "parallel";
  }

  if (/sequencial|sequential|cadeia/.test(normalized)) {
    return "sequential";
  }

  return null;
}

function detectFunctionPriorityOrder(text: string): RuntimeFunctionKey[] {
  const normalized = text.toLowerCase();
  const matches: Array<{ key: RuntimeFunctionKey; index: number }> = [
    {
      key: "contexts",
      index: normalized.search(/contexto|context|semantico|semântico/),
    },
    {
      key: "projects",
      index: normalized.search(/projeto|project|roadmap|objetivo/),
    },
    {
      key: "agents",
      index: normalized.search(/agente|agent|deleg/),
    },
    {
      key: "groups",
      index: normalized.search(/grupo|group|consenso|paralelo|sequencial/),
    },
    {
      key: "aggregation",
      index: normalized.search(/agrega|sintese|síntese|orquestra|final/),
    },
  ]
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index);

  return Array.from(new Set(matches.map((match) => match.key)));
}

function getConnectionsForContext(result: DecompositionResult): ConnectionKey[] {
  const base: ConnectionKey[] = ["agents", "projects", "groups", "flows"];

  if (result.taskRouting.executionStrategy === "consensus") {
    base.unshift("groups");
  }

  return Array.from(new Set([...base, "orchestra"]));
}

function buildContextRoutingMessage(
  result: DecompositionResult,
  instruction: string,
  targets: ConnectionKey[]
) {
  const agents =
    result.taskRouting.requiredAgents
      .map((requirement) => requirement.templateId)
      .slice(0, 5)
      .join(", ") || "sem sugestoes";

  const steps = targets.map((target) => CONNECTION_META[target].label).join(" -> ");

  return [
    `Direcao contextual registrada para este contexto.`,
    `Instrucao recebida: "${instruction}"`,
    `Roteamento ativo: ${steps}.`,
    `Agentes alvo sugeridos: ${agents}.`,
    `Estrategia de grupos: ${formatExecutionStrategy(
      result.taskRouting.executionStrategy
    )}.`,
    `Nos fluxos, consolide entregas x, y, z antes da agregacao final.`,
  ].join("\n\n");
}

function PolarityBar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[10px] text-white/30">{label}</span>
      <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-blue-400/60 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 text-right text-[10px] text-white/40">
        {percent}%
      </span>
    </div>
  );
}

function matchesSearch(result: DecompositionResult, search: string) {
  if (!search.trim()) {
    return true;
  }

  const normalized = search.toLowerCase().trim();
  const domainList = result.context.domains.map((domain) => domain.domain);

  return (
    result.inputText.toLowerCase().includes(normalized) ||
    result.intent.primary.toLowerCase().includes(normalized) ||
    domainList.some((domain) => domain.toLowerCase().includes(normalized))
  );
}

function getContextMessages(
  messages: Message[],
  sessionId: string,
  contextId: string
) {
  return messages
    .filter((message) => {
      if (message.sessionId !== sessionId) {
        return false;
      }

      if (message.decompositionId === contextId) {
        return true;
      }

      return getMetadataDecompositionId(message.metadata) === contextId;
    })
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

function ContextsPageContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get("sessionId");
  const [search, setSearch] = useState("");
  const [isHydrating, setIsHydrating] = useState(false);
  const [expandedContextId, setExpandedContextId] = useState<string | null>(null);
  const [contextInstruction, setContextInstruction] = useState("");
  const hydratedSessionIdsRef = useRef<Set<string>>(new Set());

  const sessions = useWorkspaceFilteredSessions();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const messages = useSessionStore((state) => state.messages);
  const addMessage = useSessionStore((state) => state.addMessage);
  const decompositions = useDecompositionStore((state) => state.decompositions);
  const activeDecompositionId = useDecompositionStore(
    (state) => state.activeDecompositionId
  );
  const groups = useAgentStore((state) => state.groups);
  const updateGroup = useAgentStore((state) => state.updateGroup);
  const addRuntimeNote = useRuntimeStore((state) => state.addNote);
  const applyFunctionPriorities = useRuntimeStore(
    (state) => state.applyFunctionPriorities
  );
  const markJourneyStepVisited = useRuntimeStore(
    (state) => state.markJourneyStepVisited
  );

  const targetSessionId = querySessionId ?? currentSessionId ?? null;
  const targetSession = targetSessionId
    ? sessions.find((session) => session.id === targetSessionId) ?? null
    : null;

  const contextResults = useMemo(() => {
    let results: DecompositionResult[] = [];

    if (targetSessionId) {
      const decompositionIds = new Set<string>();
      const sessionMessages = messages.filter(
        (message) => message.sessionId === targetSessionId
      );

      for (const message of sessionMessages) {
        if (message.decompositionId) {
          decompositionIds.add(message.decompositionId);
        }

        const metadataDecompositionId = getMetadataDecompositionId(
          message.metadata
        );
        if (metadataDecompositionId) {
          decompositionIds.add(metadataDecompositionId);
        }
      }

      results = Array.from(decompositionIds)
        .map((decompositionId) => decompositions[decompositionId])
        .filter((result): result is DecompositionResult => Boolean(result));
    } else {
      results = Object.values(decompositions);
    }

    if (results.length === 0 && activeDecompositionId && !targetSessionId) {
      const active = decompositions[activeDecompositionId];
      if (active) {
        results = [active];
      }
    }

    return results
      .filter((result) => matchesSearch(result, search))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [
    targetSessionId,
    messages,
    decompositions,
    activeDecompositionId,
    search,
  ]);

  const expandedContext = useMemo(
    () =>
      contextResults.find((context) => context.id === expandedContextId) ?? null,
    [contextResults, expandedContextId]
  );

  const contextThread = useMemo(() => {
    if (!targetSessionId || !expandedContext) {
      return [];
    }

    return getContextMessages(messages, targetSessionId, expandedContext.id);
  }, [messages, targetSessionId, expandedContext]);

  useEffect(() => {
    if (!targetSessionId || contextResults.length > 0 || isHydrating) {
      return;
    }

    if (hydratedSessionIdsRef.current.has(targetSessionId)) {
      return;
    }

    hydratedSessionIdsRef.current.add(targetSessionId);
    setIsHydrating(true);

    void hydrateSessionSnapshot(targetSessionId)
      .catch((error) => {
        console.error("Failed to hydrate session snapshot on contexts page", error);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [targetSessionId, contextResults.length, isHydrating]);

  useEffect(() => {
    if (!contextResults.length) {
      setExpandedContextId(null);
      return;
    }

    setExpandedContextId((previous) => {
      if (previous && contextResults.some((result) => result.id === previous)) {
        return previous;
      }
      return contextResults[0].id;
    });
  }, [contextResults]);

  useEffect(() => {
    if (!targetSessionId || contextResults.length === 0) {
      return;
    }

    markJourneyStepVisited(targetSessionId, "contexts");
  }, [contextResults.length, markJourneyStepVisited, targetSessionId]);

  const handleSendContextInstruction = () => {
    if (!targetSessionId || !expandedContext) {
      return;
    }

    const text = contextInstruction.trim();
    if (!text) {
      return;
    }

    const targets = detectConnectionTargets(text);
    const preferredStrategy = detectPreferredStrategy(text);
    const functionPriorityOrder = detectFunctionPriorityOrder(text);
    const appliedAdjustments: string[] = [];

    addMessage(
      createMessage(targetSessionId, "user", text, {
        contextChat: true,
        decompositionId: expandedContext.id,
        routeTargets: targets,
      })
    );

    addMessage(
      createMessage(
        targetSessionId,
        "assistant",
        buildContextRoutingMessage(expandedContext, text, targets),
        {
          contextChat: true,
          contextRouting: true,
          decompositionId: expandedContext.id,
          routeTargets: targets,
        }
      )
    );

    if (preferredStrategy) {
      const sessionGroups = groups.filter(
        (group) => group.sessionId === targetSessionId
      );

      if (sessionGroups.length > 0) {
        for (const group of sessionGroups) {
          updateGroup(group.id, { strategy: preferredStrategy });
        }
        appliedAdjustments.push(
          `estrategia de grupo atualizada para ${preferredStrategy}`
        );
      }
    }

    if (functionPriorityOrder.length > 0) {
      applyFunctionPriorities(targetSessionId, functionPriorityOrder);
      appliedAdjustments.push(
        `ordem de funcoes aplicada: ${functionPriorityOrder.join(" -> ")}`
      );
    }

    if (appliedAdjustments.length > 0) {
      addMessage(
        createMessage(
          targetSessionId,
          "system",
          `Ajustes aplicados no plano: ${appliedAdjustments.join(" | ")}.`,
          {
            contextChat: true,
            contextRouting: true,
            contextAdjustment: true,
            decompositionId: expandedContext.id,
            routeTargets: targets,
          }
        )
      );
    }

    addRuntimeNote(
      targetSessionId,
      `[Contexto ${expandedContext.id.slice(0, 8)}] ${text}`
    );

    setContextInstruction("");
    toast.success("Direcao contextual enviada.");
    void persistSessionSnapshot(targetSessionId).catch((error) => {
      console.error("Failed to persist context instruction", error);
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
              <Brain className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Contextos</h1>
              <p className="mt-1 text-sm text-white/40">
                Clique em um contexto para expandir e conversar dentro do plano.
              </p>
              {targetSession ? (
                <p className="mt-1 text-xs text-white/35">
                  Sessao ativa: {targetSession.title}
                </p>
              ) : null}
            </div>
          </div>

          {targetSessionId ? (
            <Link
              href={`/dashboard/chat/${targetSessionId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10 hover:text-neon-cyan"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para chat
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-neutral-900/70 px-4 py-3 backdrop-blur-xl">
        <Search className="h-4 w-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por texto, intencao ou dominio..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
        />
        {search.trim() && (
          <span className="shrink-0 text-xs text-white/35">
            {contextResults.length} resultado{contextResults.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isHydrating ? (
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 text-sm text-white/65">
            <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
            Carregando contexto da sessao...
          </div>
        </div>
      ) : contextResults.length === 0 ? (
        <CosmicEmptyState
          icon={Brain}
          title="Nenhum contexto encontrado"
          description="Envie uma mensagem no chat para iniciar decomposicao e delegacao de funcoes."
          neonColor="cyan"
          action={
            targetSessionId
              ? { label: "Ir para o chat", href: `/dashboard/chat/${targetSessionId}` }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {contextResults.map((result) => {
            const isExpanded = expandedContextId === result.id;
            const connections = getConnectionsForContext(result);
            const suggestedAgents = result.taskRouting.requiredAgents
              .map((requirement) => requirement.templateId)
              .slice(0, 4);

            return (
              <div
                key={result.id}
                className={`rounded-2xl border bg-neutral-900/70 p-5 backdrop-blur-xl transition-all ${
                  isExpanded
                    ? "border-neon-cyan/35 bg-neutral-900/80"
                    : "border-white/[0.08] hover:border-white/[0.14] hover:bg-neutral-900/80"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="flex-1 text-sm font-medium text-white/90">
                    &ldquo;{result.inputText}&rdquo;
                  </p>
                  <span className="shrink-0 text-[10px] text-white/25">
                    {new Date(result.timestamp).toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase ${
                      INTENT_COLORS[result.intent.primary]
                    }`}
                  >
                    <Target className="h-3 w-3" />
                    {formatIntent(result.intent.primary)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                    <Gauge className="h-3 w-3" />
                    {Math.round(result.intent.confidence * 100)}% confianca
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                    {result.tokens.length} tokens
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                    estrategia:{" "}
                    {formatExecutionStrategy(result.taskRouting.executionStrategy)}
                  </span>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tags className="h-3 w-3 text-white/25" />
                    {result.context.domains.map((domain) => (
                      <span
                        key={`${result.id}-${domain.domain}`}
                        className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/40"
                      >
                        {domain.domain}
                      </span>
                    ))}
                  </div>

                  <div className="w-full max-w-60 space-y-1">
                    <PolarityBar
                      label="Complexidade"
                      value={result.polarity.complexity}
                    />
                    <PolarityBar label="Urgencia" value={result.polarity.urgency} />
                    <PolarityBar label="Certeza" value={result.polarity.certainty} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                  <p className="text-xs text-white/45">
                    Agentes sugeridos:{" "}
                    {suggestedAgents.length ? suggestedAgents.join(", ") : "sem sugestoes"}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedContextId((previous) =>
                        previous === result.id ? null : result.id
                      )
                    }
                    className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
                  >
                    {isExpanded ? "Fechar chat do contexto" : "Abrir chat do contexto"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/30 p-3">
                    <div className="mb-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                        Conexoes seguintes deste contexto
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        Continue dando direcao aqui e avance para as etapas conectadas.
                      </p>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {connections.map((connection) => {
                        const meta = CONNECTION_META[connection];
                        const href = targetSessionId
                          ? meta.href(targetSessionId, result.id)
                          : "#";

                        return (
                          <Link
                            key={`${result.id}-${connection}`}
                            href={href}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] transition-all hover:opacity-90 ${meta.className}`}
                          >
                            {meta.label}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="mb-3 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
                      {contextThread.length === 0 ? (
                        <p className="text-xs text-white/45">
                          Ainda nao ha conversa especifica deste contexto.
                        </p>
                      ) : (
                        contextThread.map((message) => {
                          const isUser = message.role === "user";

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[92%] rounded-xl border px-2.5 py-2 ${
                                  isUser
                                    ? "border-neon-cyan/35 bg-neon-cyan/10 text-white"
                                    : "border-white/[0.08] bg-white/[0.03] text-white/80"
                                }`}
                              >
                                <p className="whitespace-pre-wrap text-[11px] leading-relaxed">
                                  {message.content}
                                </p>
                                <span className="mt-1 block text-[10px] text-white/35">
                                  {formatMessageTime(message.createdAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="rounded-lg border border-white/[0.08] bg-black/30 p-2">
                      <textarea
                        value={contextInstruction}
                        onChange={(event) => setContextInstruction(event.target.value)}
                        placeholder="Ex: no consenso, o Critic valida risco e o Builder executa no projeto X. Depois, no fluxo, junte x,y,z."
                        className="h-20 w-full resize-none bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] text-white/35">
                          Esta instrucao entra no plano da sessao e segue para agentes/grupos/fluxos.
                        </p>
                        <button
                          type="button"
                          onClick={handleSendContextInstruction}
                          disabled={!contextInstruction.trim() || !targetSessionId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Enviar direcao
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContextsPageFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex items-start gap-3">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-white/[0.04]" />
          <div className="h-3 w-72 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
      <ContextSkeleton />
    </div>
  );
}

export default function ContextsPage() {
  return (
    <Suspense fallback={<ContextsPageFallback />}>
      <ContextsPageContent />
    </Suspense>
  );
}
