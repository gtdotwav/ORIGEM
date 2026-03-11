"use client";

import { getContextDirections, getSelectedContext, getSessionContexts } from "@/lib/session-journey";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import type { DecompositionResult } from "@/types/decomposition";
import type { Session, Message } from "@/types/session";
import type { AgentGroup, AgentInstance } from "@/types/agent";
import type { SessionRuntime } from "@/types/runtime";

export type SessionHandoffTarget = "chat" | "code" | "slides";

export interface SessionHandoffPayload {
  sessionId: string;
  target: SessionHandoffTarget;
  source: "orchestra";
  generatedAt: string;
  sessionTitle: string;
  workspaceId: string | null;
  projectId: string | null;
  contextId: string | null;
  summary: string;
  codePrompt: string;
  slidesPrompt: string;
}

interface SessionHandoffState {
  sessions: Session[];
  messages: Message[];
  decompositions: Record<string, DecompositionResult>;
  activeDecompositionId: string | null;
  runtime: SessionRuntime | undefined;
  agents: AgentInstance[];
  groups: AgentGroup[];
}

interface BuildSessionHandoffOptions {
  sessionId: string;
  target: SessionHandoffTarget;
  contextId?: string | null;
}

function compactText(value: string, maxLength = 560) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function joinLines(lines: Array<string | null | undefined>) {
  return lines.filter(Boolean).join("\n");
}

function buildStateSnapshot(sessionId: string): SessionHandoffState {
  const sessionStore = useSessionStore.getState();
  const decompositionStore = useDecompositionStore.getState();
  const runtimeStore = useRuntimeStore.getState();
  const agentStore = useAgentStore.getState();

  return {
    sessions: sessionStore.sessions,
    messages: sessionStore.messages,
    decompositions: decompositionStore.decompositions,
    activeDecompositionId: decompositionStore.activeDecompositionId,
    runtime: runtimeStore.sessions[sessionId],
    agents: agentStore.agents,
    groups: agentStore.groups,
  };
}

function buildSummary(state: SessionHandoffState, options: BuildSessionHandoffOptions) {
  const session = state.sessions.find((item) => item.id === options.sessionId);
  if (!session) {
    return null;
  }

  const contexts = getSessionContexts(
    options.sessionId,
    state.messages,
    state.decompositions,
    state.activeDecompositionId
  );
  const selectedContext = getSelectedContext(contexts, options.contextId ?? null);
  const directions = getContextDirections(state.messages, options.sessionId, {
    contextId: selectedContext?.id ?? options.contextId ?? null,
  }).slice(0, 6);
  const runtimeTasks = [...(state.runtime?.tasks ?? [])]
    .sort((left, right) => left.priority - right.priority)
    .slice(0, 8);
  const sessionAgents = state.agents.filter((agent) => agent.sessionId === options.sessionId);
  const sessionGroups = state.groups.filter((group) => group.sessionId === options.sessionId);
  const assistantMessages = state.messages
    .filter(
      (message) =>
        message.sessionId === options.sessionId &&
        message.role === "assistant" &&
        message.metadata?.includeJourney === true
    )
    .slice(-2);
  const checkpointMessages = state.messages
    .filter(
      (message) =>
        message.sessionId === options.sessionId &&
        message.role === "system" &&
        message.metadata?.checkpoint === true
    )
    .slice(-6);

  const taskLines = runtimeTasks.map(
    (task) =>
      `${task.priority}. ${task.title} - ${task.status} (${task.progress}%) com ${task.agentName}`
  );
  const directionLines = directions.map((direction) => `- ${compactText(direction.text, 180)}`);
  const groupLines = sessionGroups.map(
    (group) => `- ${group.name} (${group.strategy})`
  );
  const agentLines = sessionAgents.slice(0, 6).map((agent) => {
    const latestOutput = agent.outputs[agent.outputs.length - 1];
    if (!latestOutput) {
      return `- ${agent.name}: ${agent.role}`;
    }

    return `- ${agent.name}: ${compactText(latestOutput.content, 220)}`;
  });
  const checkpointLines = checkpointMessages.map((message) => `- ${compactText(message.content, 180)}`);
  const finalSummaryLines = assistantMessages.map((message) => compactText(message.content, 720));

  const summary = [
    `Sessao base: ${session.title}`,
    selectedContext
      ? joinLines([
          `Contexto principal: ${compactText(selectedContext.inputText, 720)}`,
          selectedContext.context.domains.length > 0
            ? `Dominios: ${selectedContext.context.domains
                .map((domain) => domain.domain)
                .join(", ")}`
            : null,
          selectedContext.context.entities.length > 0
            ? `Entidades: ${selectedContext.context.entities
                .slice(0, 5)
                .map((entity) => entity.name)
                .join(", ")}`
            : null,
          `Formato desejado: ${selectedContext.context.outputFormat}`,
          `Estrategia da decomposicao: ${selectedContext.taskRouting.executionStrategy}`,
        ])
      : null,
    directionLines.length > 0
      ? `Direcoes coletadas ate aqui:\n${directionLines.join("\n")}`
      : null,
    taskLines.length > 0
      ? `Plano operacional em andamento:\n${taskLines.join("\n")}`
      : null,
    agentLines.length > 0
      ? `Aprendizados recentes dos agentes:\n${agentLines.join("\n")}`
      : null,
    groupLines.length > 0
      ? `Grupos de execucao:\n${groupLines.join("\n")}`
      : null,
    checkpointLines.length > 0
      ? `Checkpoints da orquestra:\n${checkpointLines.join("\n")}`
      : null,
    finalSummaryLines.length > 0
      ? `Sintese mais recente:\n${finalSummaryLines.join("\n\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    session,
    selectedContext,
    summary: compactText(summary, 6800),
  };
}

function inferCodeSurface(payload: { sessionTitle: string; summary: string }) {
  const normalized = `${payload.sessionTitle} ${payload.summary}`.toLowerCase();

  if (/(dashboard|painel|analytics|admin)/.test(normalized)) {
    return "dashboard";
  }

  if (/(landing|lp|marketing|site|homepage)/.test(normalized)) {
    return "landing-page";
  }

  if (/(componente|component|card|widget|section)/.test(normalized)) {
    return "component";
  }

  return "web-app";
}

export function buildSessionHandoff(options: BuildSessionHandoffOptions) {
  const state = buildStateSnapshot(options.sessionId);
  const summary = buildSummary(state, options);
  if (!summary) {
    return null;
  }

  const workspaceId =
    summary.session.workspaceId ??
    (typeof summary.session.metadata?.workspaceId === "string"
      ? summary.session.metadata.workspaceId
      : null);
  const projectId =
    summary.session.projectId ??
    (typeof summary.session.metadata?.projectId === "string"
      ? summary.session.metadata.projectId
      : null);

  const payload: SessionHandoffPayload = {
    sessionId: options.sessionId,
    target: options.target,
    source: "orchestra",
    generatedAt: new Date().toISOString(),
    sessionTitle: summary.session.title,
    workspaceId,
    projectId,
    contextId: summary.selectedContext?.id ?? options.contextId ?? null,
    summary: summary.summary,
    codePrompt: [
      `Continue no editor de codigo a partir da sessao "${summary.session.title}".`,
      "Nao recomecar a analise do zero. Use o contexto abaixo como fonte de verdade para arquitetura, prioridades, fluxos e comportamento esperado.",
      summary.summary,
      `Superficie sugerida: ${inferCodeSurface({
        sessionTitle: summary.session.title,
        summary: summary.summary,
      })}.`,
    ].join("\n\n"),
    slidesPrompt: [
      `Crie uma apresentacao a partir da sessao "${summary.session.title}".`,
      "Transforme o que a orquestra consolidou em narrativa executiva clara, com contexto, estrategia, execucao, riscos e proximos passos.",
      summary.summary,
    ].join("\n\n"),
  };

  return payload;
}

export function getStoredSessionHandoff(sessionId: string) {
  const session = useSessionStore
    .getState()
    .sessions.find((item) => item.id === sessionId);
  const raw = session?.metadata?.sessionHandoff;

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const payload = raw as Partial<SessionHandoffPayload>;
  if (
    payload.sessionId !== sessionId ||
    payload.source !== "orchestra" ||
    typeof payload.summary !== "string"
  ) {
    return null;
  }

  return payload as SessionHandoffPayload;
}

export function persistSessionHandoff(options: BuildSessionHandoffOptions) {
  const payload = buildSessionHandoff(options);
  if (!payload) {
    return null;
  }

  const sessionStore = useSessionStore.getState();
  const session = sessionStore.sessions.find((item) => item.id === options.sessionId);
  if (!session) {
    return payload;
  }

  sessionStore.updateSession(options.sessionId, {
    metadata: {
      ...(session.metadata ?? {}),
      sessionHandoff: payload,
      workspaceId:
        session.workspaceId ??
        (typeof session.metadata?.workspaceId === "string"
          ? session.metadata.workspaceId
          : undefined),
      projectId:
        session.projectId ??
        (typeof session.metadata?.projectId === "string"
          ? session.metadata.projectId
          : undefined),
    },
    updatedAt: new Date().toISOString(),
  });

  return payload;
}
