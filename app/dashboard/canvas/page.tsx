"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "@xyflow/react";
import type { OrigemEdge, OrigemNode, AgentNodeData } from "@/types/canvas";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  FolderKanban,
  Loader2,
  Workflow,
} from "lucide-react";
import { ExecutionMapNode } from "@/components/canvas/execution-map-node";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { useProjectStore } from "@/stores/project-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceFilteredSessions } from "@/hooks/use-workspace-sessions";
import { CANVAS_CONFIG } from "@/config/canvas";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { useSessionSnapshotHydration } from "@/hooks/use-session-snapshot-hydration";
import { getSelectedContext, getSessionContexts } from "@/lib/session-journey";
import type { RuntimeTaskStatus } from "@/types/runtime";

const NODE_TYPES = {
  input: ExecutionMapNode,
  context: ExecutionMapNode,
  project: ExecutionMapNode,
  group: ExecutionMapNode,
  agent: ExecutionMapNode,
  output: ExecutionMapNode,
};

function trimText(value: string | undefined, max = 180) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 3)}...`;
}

function formatDate(value: string | number | undefined) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function mapTaskStatus(status: RuntimeTaskStatus): AgentNodeData["status"] {
  if (status === "running") return "working";
  if (status === "done") return "done";
  if (status === "blocked") return "error";
  return "idle";
}

function buildEdge(
  id: string,
  source: string,
  target: string,
  label: string,
  animated = false
): OrigemEdge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated,
    label,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "oklch(1 0 0 / 0.22)",
      width: 18,
      height: 18,
    },
    labelStyle: {
      fontSize: 10,
      fill: "oklch(0.86 0 0 / 0.72)",
      fontWeight: 600,
    },
    labelBgStyle: {
      fill: "oklch(0.12 0 0 / 0.92)",
      stroke: "oklch(1 0 0 / 0.08)",
    },
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 999,
    style: {
      stroke: "oklch(1 0 0 / 0.22)",
      strokeWidth: 2,
    },
  };
}

export default function CanvasPage() {
  const mounted = useClientMounted();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessions = useWorkspaceFilteredSessions();
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const messages = useSessionStore((s) => s.messages);
  const decompositions = useDecompositionStore((s) => s.decompositions);
  const activeDecompositionId = useDecompositionStore((s) => s.activeDecompositionId);
  const agents = useAgentStore((s) => s.agents);
  const groups = useAgentStore((s) => s.groups);
  const projects = useProjectStore((s) => s.projects);
  const runtimeSessions = useRuntimeStore((s) => s.sessions);

  const querySessionId = searchParams.get("sessionId");
  const queryContextId = searchParams.get("contextId");

  const orderedSessions = useMemo(
    () =>
      [...sessions].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      ),
    [sessions]
  );

  const activeSession =
    orderedSessions.find((session) => session.id === querySessionId) ??
    orderedSessions.find((session) => session.id === currentSessionId) ??
    orderedSessions[0] ??
    null;

  const sessionMessages = useMemo(
    () =>
      activeSession
        ? messages
            .filter((message) => message.sessionId === activeSession.id)
            .sort(
              (left, right) =>
                new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
            )
        : [],
    [activeSession, messages]
  );

  const contexts = useMemo(
    () =>
      getSessionContexts(
        activeSession?.id ?? null,
        messages,
        decompositions,
        activeDecompositionId
      ),
    [activeDecompositionId, activeSession?.id, decompositions, messages]
  );

  const selectedContext = useMemo(
    () => getSelectedContext(contexts, queryContextId),
    [contexts, queryContextId]
  );

  const sessionAgents = useMemo(
    () =>
      activeSession
        ? agents.filter((agent) => agent.sessionId === activeSession.id)
        : [],
    [activeSession, agents]
  );

  const sessionGroups = useMemo(
    () =>
      activeSession
        ? groups.filter((group) => group.sessionId === activeSession.id)
        : [],
    [activeSession, groups]
  );

  const runtime = activeSession ? runtimeSessions[activeSession.id] : undefined;
  const runtimeTasks = useMemo(
    () => [...(runtime?.tasks ?? [])].sort((left, right) => left.priority - right.priority),
    [runtime?.tasks]
  );

  const project =
    activeSession?.projectId
      ? projects.find((item) => item.id === activeSession.projectId) ?? null
      : null;

  const latestUserPrompt = useMemo(
    () =>
      [...sessionMessages]
        .reverse()
        .find((message) => message.role === "user"),
    [sessionMessages]
  );

  const latestSummary = useMemo(
    () =>
      [...sessionMessages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" ||
            (message.role === "system" && message.metadata?.checkpoint === true)
        ),
    [sessionMessages]
  );

  const checkpointCount = useMemo(
    () =>
      sessionMessages.filter(
        (message) =>
          message.role === "system" && message.metadata?.checkpoint === true
      ).length,
    [sessionMessages]
  );

  const shouldHydrate =
    Boolean(activeSession?.id) &&
    sessionMessages.length === 0 &&
    contexts.length === 0 &&
    runtimeTasks.length === 0 &&
    sessionAgents.length === 0;

  const { isHydrating } = useSessionSnapshotHydration({
    sessionId: activeSession?.id,
    enabled: shouldHydrate,
    logLabel: "canvas page",
  });

  const stageLabel = (() => {
    if (runtime?.isRunning) return "Executando";
    if (runtimeTasks.some((task) => task.status === "blocked")) return "Bloqueado";
    if (runtimeTasks.length > 0 && runtimeTasks.every((task) => task.status === "done")) {
      return "Concluido";
    }
    if (runtime?.distributionReady) return "Planejado";
    if (selectedContext) return "Contextualizado";
    return "Aguardando";
  })();

  const progress = (() => {
    if (typeof runtime?.overallProgress === "number") {
      return runtime.overallProgress;
    }
    if (runtimeTasks.length === 0) {
      return selectedContext ? 18 : 0;
    }
    return Math.round(
      runtimeTasks.reduce((total, task) => total + task.progress, 0) / runtimeTasks.length
    );
  })();

  const graph = useMemo(() => {
    if (!activeSession) {
      return { nodes: [] as OrigemNode[], edges: [] as OrigemEdge[] };
    }

    const executionStrategy =
      selectedContext?.taskRouting.executionStrategy ??
      sessionGroups[0]?.strategy ??
      "pipeline";
    const taskSeed =
      runtimeTasks.length > 0
        ? runtimeTasks.map((task) => {
            const linkedAgent = sessionAgents.find((agent) => agent.id === task.agentId);
            return {
              id: task.id,
              groupId: linkedAgent?.groupId,
              name: task.agentName,
              role: task.functionKey,
              status: mapTaskStatus(task.status),
              progress: task.progress,
              provider: linkedAgent?.provider ?? "runtime",
              model: linkedAgent?.model ?? "workflow",
              outputCount: linkedAgent?.outputs.length ?? 0,
              description: task.title,
              chip: task.status,
            };
          })
        : sessionAgents.length > 0
          ? sessionAgents.map((agent) => ({
              id: agent.id,
              groupId: agent.groupId,
              name: agent.name,
              role: agent.role,
              status: agent.status,
              progress:
                agent.outputs.length > 0
                  ? Math.min(100, agent.outputs.length * 20)
                  : agent.status === "done"
                    ? 100
                    : 0,
              provider: agent.provider,
              model: agent.model,
              outputCount: agent.outputs.length,
              description: trimText(agent.systemPrompt, 120),
              chip: agent.status,
            }))
          : [
              {
                id: "placeholder-agent",
                groupId: undefined,
                name: "Fila de execucao",
                role: "delegacao pendente",
                status: "idle" as const,
                progress: 0,
                provider: "runtime",
                model: "pendente",
                outputCount: 0,
                description: "Ainda nao ha agentes ou tarefas distribuidas para esta sessao.",
                chip: "pendente",
              },
            ];

    const groupSeed =
      sessionGroups.length > 0
        ? sessionGroups.map((group) => ({
            id: group.id,
            name: group.name,
            strategy: group.strategy,
            agentIds: group.agentIds,
          }))
        : [
            {
              id: "synthetic-group",
              name: executionStrategy === "parallel" ? "Execucao paralela" : "Fluxo principal",
              strategy: executionStrategy,
              agentIds: taskSeed.map((task) => task.id),
            },
          ];

    const normalizedTasks = taskSeed.map((task, index) => {
      const fallbackGroupId = groupSeed[index % groupSeed.length]?.id ?? "synthetic-group";
      const validGroupId = groupSeed.some((group) => group.id === task.groupId)
        ? task.groupId
        : fallbackGroupId;

      return {
        ...task,
        groupId: validGroupId as string,
      };
    });

    const groupPositions = groupSeed.map((group, index) => ({
      ...group,
      x: 960,
      y:
        groupSeed.length === 1
          ? 240
          : 120 + index * 220,
    }));

    const agentPositions = normalizedTasks.map((task) => {
      const matchingGroup = groupPositions.find((group) => group.id === task.groupId) ?? groupPositions[0];
      const tasksInGroup = normalizedTasks.filter((item) => item.groupId === matchingGroup.id);
      const groupIndex = tasksInGroup.findIndex((item) => item.id === task.id);
      const offset = (groupIndex - (tasksInGroup.length - 1) / 2) * 170;

      return {
        ...task,
        x: 1320,
        y: matchingGroup.y + offset,
      };
    });

    const outputY =
      agentPositions.length > 0
        ? Math.round(
            agentPositions.reduce((total, agent) => total + agent.y, 0) / agentPositions.length
          )
        : 240;

    const nodes: OrigemNode[] = [
      {
        id: "input-node",
        type: "input",
        position: { x: 0, y: 240 },
        data: {
          type: "input",
          sessionId: activeSession.id,
          text: latestUserPrompt?.content ?? activeSession.title,
          title: "Entrada do usuario",
          subtitle: activeSession.title || "Sessao ativa",
          status: activeSession.status,
          description: trimText(
            latestUserPrompt?.content ??
              "Nenhuma mensagem do usuario foi registrada ainda para esta sessao."
          ),
          chips: [
            activeSession.status,
            `${sessionMessages.length} msgs`,
          ],
          stats: [
            { label: "Sessao", value: activeSession.id.slice(0, 8) },
            { label: "Atualizado", value: formatDate(activeSession.updatedAt) },
          ],
        },
      },
      {
        id: "context-node",
        type: "context",
        position: { x: 320, y: 240 },
        data: {
          type: "context",
          decompositionId: selectedContext?.id ?? "pending-context",
          tokenCount: selectedContext?.tokens.length ?? 0,
          primaryIntent: selectedContext?.intent.primary ?? "pending",
          complexity: selectedContext?.polarity.complexity ?? 0,
          sentiment: selectedContext?.polarity.sentiment ?? 0,
          title: "Contexto semantico",
          subtitle: selectedContext?.intent.primary ?? "sem decomposicao",
          description: trimText(
            selectedContext
              ? selectedContext.context.requiredKnowledge[0] ??
                  selectedContext.inputText
              : "A sessao ainda nao consolidou uma decomposicao ativa."
          ),
          chips:
            selectedContext?.context.domains
              .slice(0, 3)
              .map((domain) => domain.domain) ?? ["aguardando"],
          stats: [
            {
              label: "Tokens",
              value: String(selectedContext?.tokens.length ?? 0),
            },
            {
              label: "Complexidade",
              value: String(selectedContext?.polarity.complexity ?? 0),
            },
            {
              label: "Agentes sugeridos",
              value: String(selectedContext?.taskRouting.requiredAgents.length ?? 0),
            },
          ],
        },
      },
      {
        id: "project-node",
        type: "project",
        position: { x: 640, y: 240 },
        data: {
          type: "project",
          projectId: project?.id ?? "synthetic-project",
          name: project?.name ?? "Plano executavel",
          goalCount: project?.goals.length ?? runtimeTasks.length,
          priority: project?.priority ?? executionStrategy,
          title: project?.name ?? "Plano executavel",
          subtitle: project?.priority ?? executionStrategy,
          description: trimText(
            project?.description ||
              (runtimeTasks.length > 0
                ? `${runtimeTasks.length} tarefas foram organizadas para esta execucao.`
                : "Ainda nao ha projeto persistido; o canvas esta mostrando o plano derivado da sessao.")
          ),
          chips: [
            project?.status ?? "draft",
            `${runtimeTasks.length} tarefas`,
          ],
          stats: [
            {
              label: "Objetivos",
              value: String(project?.goals.length ?? 0),
            },
            {
              label: "Notas",
              value: String(project?.notes.length ?? 0),
            },
            {
              label: "Prazo",
              value: project?.deadline ? formatDate(project.deadline) : "--",
            },
          ],
        },
      },
      ...groupPositions.map<OrigemNode>((group) => {
        const connectedTasks = normalizedTasks.filter((task) => task.groupId === group.id);
        const groupProgress =
          connectedTasks.length > 0
            ? Math.round(
                connectedTasks.reduce((total, task) => total + task.progress, 0) /
                  connectedTasks.length
              )
            : 0;

        return {
          id: group.id,
          type: "group",
          position: { x: group.x, y: group.y },
          data: {
            type: "group",
            groupId: group.id,
            name: group.name,
            agentCount: connectedTasks.length,
            strategy: group.strategy,
            title: group.name,
            subtitle: group.strategy,
            description:
              connectedTasks.length > 0
                ? `${connectedTasks.length} agentes ou tarefas ligados a este grupo.`
                : "Grupo criado sem tarefas ligadas no momento.",
            chips: [group.strategy, `${connectedTasks.length} ligados`],
            stats: [
              { label: "Conectados", value: String(connectedTasks.length) },
              { label: "Progresso", value: `${groupProgress}%` },
              { label: "Origem", value: sessionGroups.length > 0 ? "store" : "sintetico" },
            ],
          },
        };
      }),
      ...agentPositions.map<OrigemNode>((agent) => ({
        id: `agent-${agent.id}`,
        type: "agent",
        position: { x: agent.x, y: agent.y },
        data: {
          type: "agent",
          agentId: agent.id,
          name: agent.name,
          role: agent.role,
          templateId: agent.role,
          status: agent.status,
          accentColor: "cyan",
          icon: "bot",
          provider: agent.provider,
          model: agent.model,
          outputCount: agent.outputCount,
          progress: agent.progress,
          title: agent.name,
          subtitle: agent.role,
          description: agent.description,
          chips: [agent.chip, agent.model],
          stats: [
            { label: "Progresso", value: `${agent.progress}%` },
            { label: "Outputs", value: String(agent.outputCount) },
            { label: "Provider", value: agent.provider },
          ],
        },
      })),
      {
        id: "output-node",
        type: "output",
        position: { x: 1660, y: outputY },
        data: {
          type: "output",
          outputId: `${activeSession.id}-aggregation`,
          outputType: "text",
          preview:
            trimText(latestSummary?.content, 160) ||
            "A agregacao final ainda nao produziu um resumo persistido.",
          title: "Agregacao final",
          subtitle: stageLabel,
          description:
            trimText(latestSummary?.content, 160) ||
            "O canvas consolida checkpoints, progresso e estado final da sessao.",
          chips: [
            runtime?.isRunning ? "ao vivo" : "snapshot",
            `${checkpointCount} checkpoints`,
          ],
          stats: [
            { label: "Progresso", value: `${progress}%` },
            { label: "Checkpoints", value: String(checkpointCount) },
            { label: "Atualizado", value: formatDate(activeSession.updatedAt) },
          ],
        },
      },
    ];

    const edges: OrigemEdge[] = [
      buildEdge("edge-input-context", "input-node", "context-node", "entrada"),
      buildEdge("edge-context-project", "context-node", "project-node", "decomposicao"),
      ...groupPositions.map((group) =>
        buildEdge(
          `edge-project-${group.id}`,
          "project-node",
          group.id,
          sessionGroups.length > 1 ? "ramificacao" : "plano",
          runtime?.isRunning === true && progress < 100
        )
      ),
      ...agentPositions.map((agent) =>
        buildEdge(
          `edge-${agent.groupId}-${agent.id}`,
          agent.groupId,
          `agent-${agent.id}`,
          agent.role,
          agent.status === "working"
        )
      ),
      ...agentPositions.map((agent) =>
        buildEdge(
          `edge-agent-output-${agent.id}`,
          `agent-${agent.id}`,
          "output-node",
          "agregacao",
          agent.status === "working"
        )
      ),
    ];

    return { nodes, edges };
  }, [
    activeSession,
    checkpointCount,
    latestSummary,
    latestUserPrompt,
    progress,
    project,
    runtime,
    runtimeTasks,
    selectedContext,
    sessionAgents,
    sessionGroups,
    sessionMessages.length,
    stageLabel,
  ]);

  const handleSessionChange = (sessionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sessionId", sessionId);
    params.delete("contextId");
    router.replace(`/dashboard/canvas?${params.toString()}`);
  };

  if (!mounted) {
    return <div className="min-h-[calc(100vh-80px)]" />;
  }

  if (!activeSession) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/40 transition-colors hover:text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Canvas de Orquestracao</h1>
            <p className="mt-0.5 text-xs text-foreground/40">
              Visualize a cadeia da execucao. Spaces continua separado para geracao visual.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-foreground/[0.10] bg-card/50 py-16 text-center backdrop-blur-xl">
          <Workflow className="mx-auto mb-3 h-10 w-10 text-neon-purple/40" />
          <p className="text-sm text-foreground/50">Nenhuma sessao disponivel</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-foreground/25">
            Abra ou crie uma sessao no chat para gerar a cadeia visual de contexto, projeto, grupos, agentes e agregacao.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] min-h-0">
      <aside className="flex w-[360px] shrink-0 flex-col border-r border-foreground/[0.06] bg-card/76 p-4 backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/dashboard"
              className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/40 transition-colors hover:text-foreground/70"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Canvas de Orquestracao
              </h1>
              <p className="mt-1 text-xs text-foreground/40">
                Cadeia visual da sessao atual. Nao e o Spaces.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/30">
            Sessao
          </label>
          <select
            value={activeSession.id}
            onChange={(event) => handleSessionChange(event.target.value)}
            className="w-full rounded-2xl border border-foreground/[0.08] bg-background/60 px-3 py-3 text-sm text-foreground/80 outline-none transition-colors hover:border-foreground/[0.14] focus:border-neon-cyan/40"
          >
            {orderedSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title || "Sessao sem titulo"}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 space-y-3 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-foreground/[0.08] bg-background/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/30">
              Entrada
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground/76">
              {trimText(
                latestUserPrompt?.content ??
                  activeSession.title ??
                  "Sem entrada do usuario registrada."
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-foreground/[0.08] bg-background/40 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-foreground/30">
                <Brain className="h-3.5 w-3.5 text-neon-purple/80" />
                Contexto
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground/88">
                {contexts.length}
              </p>
              <p className="mt-1 text-[11px] text-foreground/40">
                {selectedContext?.intent.primary ?? "sem decomposicao"}
              </p>
            </div>

            <div className="rounded-2xl border border-foreground/[0.08] bg-background/40 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-foreground/30">
                <FolderKanban className="h-3.5 w-3.5 text-neon-green/80" />
                Projeto
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground/88">
                {project ? 1 : 0}
              </p>
              <p className="mt-1 text-[11px] text-foreground/40">
                {project?.name ?? "plano derivado"}
              </p>
            </div>

            <div className="rounded-2xl border border-foreground/[0.08] bg-background/40 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-foreground/30">
                <Workflow className="h-3.5 w-3.5 text-neon-orange/80" />
                Grupos
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground/88">
                {Math.max(sessionGroups.length, 1)}
              </p>
              <p className="mt-1 text-[11px] text-foreground/40">
                {selectedContext?.taskRouting.executionStrategy ?? "pipeline"}
              </p>
            </div>

            <div className="rounded-2xl border border-foreground/[0.08] bg-background/40 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-foreground/30">
                <Bot className="h-3.5 w-3.5 text-neon-blue/80" />
                Agentes
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground/88">
                {Math.max(runtimeTasks.length, sessionAgents.length, 1)}
              </p>
              <p className="mt-1 text-[11px] text-foreground/40">
                {progress}% de progresso
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/6 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neon-cyan/72">
              Escopo
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground/68">
              Esta tela mostra a cadeia de execucao da sessao: entrada, contexto, projeto, grupos, agentes e agregacao. O Spaces permanece dedicado a geracao visual.
            </p>
          </div>

          <div className="rounded-2xl border border-foreground/[0.08] bg-background/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/30">
                  Estado
                </p>
                <p className="mt-2 text-base font-medium text-foreground/84">
                  {stageLabel}
                </p>
              </div>
              <span className="rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-3 py-1 text-[11px] text-foreground/56">
                {progress}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div
                className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-foreground/44">
              Ultimo resumo:{" "}
              {trimText(
                latestSummary?.content ??
                  "Nenhum checkpoint ou resposta agregada persistida ate agora.",
                110
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/chat/${encodeURIComponent(activeSession.id)}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-foreground/[0.10] bg-foreground/[0.04] px-3 py-2 text-xs text-foreground/70 transition-all hover:border-foreground/[0.18] hover:bg-foreground/[0.06]"
            >
              Voltar ao chat
            </Link>
            <Link
              href={`/dashboard/orchestra/${encodeURIComponent(activeSession.id)}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neon-cyan/30 bg-neon-cyan/12 px-3 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/18"
            >
              Abrir Orquestra
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-h-0 flex-1">
        <div className="flex items-center justify-between border-b border-foreground/[0.06] bg-card/70 px-4 py-3 backdrop-blur-xl">
          <div>
            <p className="text-sm font-medium text-foreground/84">
              {activeSession.title || "Sessao sem titulo"}
            </p>
            <p className="mt-0.5 text-xs text-foreground/36">
              Atualizado em {formatDate(activeSession.updatedAt)}
            </p>
          </div>
          <div className="rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-3 py-1 text-[11px] text-foreground/56">
            {graph.nodes.length} blocos | {graph.edges.length} conexoes
          </div>
        </div>

        {isHydrating ? (
          <div className="flex h-full items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.08] bg-card/70 px-4 py-2 text-sm text-foreground/65">
              <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
              Hidratando sessao para montar o canvas...
            </div>
          </div>
        ) : (
          <ReactFlow
            key={activeSession.id}
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={NODE_TYPES}
            defaultViewport={CANVAS_CONFIG.defaultViewport}
            minZoom={CANVAS_CONFIG.minZoom}
            maxZoom={CANVAS_CONFIG.maxZoom}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            className="origem-flow"
          >
            <Background gap={20} size={1} color="oklch(1 0 0 / 0.04)" />
            <Controls
              showInteractive={false}
              className="!rounded-xl !border-foreground/[0.08] !bg-card/80 !shadow-xl backdrop-blur-xl [&>button]:!border-foreground/[0.06] [&>button]:!bg-transparent [&>button]:!text-foreground/40 [&>button:hover]:!bg-foreground/[0.06] [&>button:hover]:!text-foreground/70"
            />
            <MiniMap
              className="!rounded-xl !border-foreground/[0.08] !bg-card/80 backdrop-blur-xl"
              nodeColor="oklch(0.78 0.15 195 / 0.3)"
              maskColor="oklch(0 0 0 / 0.72)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
