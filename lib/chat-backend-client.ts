"use client";

import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSessionStore } from "@/stores/session-store";
import type {
  SessionSnapshot,
  SessionSnapshotRecord,
} from "@/lib/server/backend/types";
import type { SessionRuntime } from "@/types/runtime";

export async function ensureSessionRecord(
  sessionId: string,
  title: string
): Promise<void> {
  const response = await fetch("/api/chat/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session record (${response.status})`);
  }
}

function reviveDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number" || typeof value === "string") {
    return new Date(value);
  }

  return new Date();
}

function normalizeRuntime(sessionId: string, runtime?: SessionRuntime): SessionRuntime {
  if (runtime) {
    return runtime;
  }

  return {
    sessionId,
    runId: null,
    language: "pt-BR",
    distributionReady: false,
    isRunning: false,
    tasks: [],
    notes: [],
    journeyCursor: 0,
    journeyVisited: [],
    overallProgress: 0,
    updatedAt: Date.now(),
  };
}

function toSerializableSnapshot(sessionId: string): SessionSnapshot | null {
  const sessionState = useSessionStore.getState();
  const runtimeState = useRuntimeStore.getState();
  const agentState = useAgentStore.getState();
  const decompositionState = useDecompositionStore.getState();
  const pipelineState = usePipelineStore.getState();

  const session = sessionState.sessions.find((item) => item.id === sessionId);
  if (!session) {
    return null;
  }

  const sessionMessages = sessionState.messages.filter(
    (message) => message.sessionId === sessionId
  );

  const decompositionIds = new Set<string>();

  for (const message of sessionMessages) {
    if (message.decompositionId) {
      decompositionIds.add(message.decompositionId);
    }

    const metadataDecompositionId = message.metadata?.decompositionId;
    if (typeof metadataDecompositionId === "string") {
      decompositionIds.add(metadataDecompositionId);
    }
  }

  if (decompositionState.activeDecompositionId) {
    decompositionIds.add(decompositionState.activeDecompositionId);
  }

  const scopedDecompositions =
    decompositionIds.size > 0
      ? Array.from(decompositionIds).reduce<Record<string, (typeof decompositionState.decompositions)[string]>>(
          (acc, decompositionId) => {
            const result = decompositionState.decompositions[decompositionId];
            if (result) {
              acc[decompositionId] = result;
            }
            return acc;
          },
          {}
        )
      : decompositionState.decompositions;

  return {
    session,
    messages: sessionMessages,
    runtime: normalizeRuntime(sessionId, runtimeState.sessions[sessionId]),
    agents: agentState.agents.filter((agent) => agent.sessionId === sessionId),
    groups: agentState.groups.filter((group) => group.sessionId === sessionId),
    decompositions: scopedDecompositions,
    pipeline: {
      stage: pipelineState.stage,
      progress: pipelineState.progress,
      events: pipelineState.events,
      error: pipelineState.error,
      startedAt: pipelineState.startedAt,
      completedAt: pipelineState.completedAt,
    },
  };
}

function applySessionRecord(record: SessionSnapshotRecord) {
  const snapshot = record.snapshot;
  const sessionId = snapshot.session.id;

  const sessionState = useSessionStore.getState();
  const runtimeState = useRuntimeStore.getState();
  const agentState = useAgentStore.getState();

  const normalizedSession = {
    ...snapshot.session,
    createdAt: reviveDate(snapshot.session.createdAt),
    updatedAt: reviveDate(snapshot.session.updatedAt),
  };

  const normalizedMessages = snapshot.messages.map((message) => ({
    ...message,
    createdAt: reviveDate(message.createdAt),
  }));

  const normalizedAgents = snapshot.agents.map((agent) => ({
    ...agent,
    createdAt: reviveDate(agent.createdAt),
    updatedAt: reviveDate(agent.updatedAt),
    outputs: agent.outputs.map((output) => ({
      ...output,
      createdAt: reviveDate(output.createdAt),
    })),
  }));

  const normalizedGroups = snapshot.groups.map((group) => ({
    ...group,
    createdAt: reviveDate(group.createdAt),
  }));

  const nextSessions = [
    normalizedSession,
    ...sessionState.sessions.filter((item) => item.id !== sessionId),
  ].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const nextMessages = [
    ...sessionState.messages.filter((message) => message.sessionId !== sessionId),
    ...normalizedMessages,
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sessionState.setSessions(nextSessions);
  sessionState.setMessages(nextMessages);
  sessionState.setCurrentSession(sessionId);

  useRuntimeStore.setState({
    sessions: {
      ...runtimeState.sessions,
      [sessionId]: normalizeRuntime(sessionId, snapshot.runtime),
    },
  });

  const agentsForOtherSessions = agentState.agents.filter(
    (agent) => agent.sessionId !== sessionId
  );
  const groupsForOtherSessions = agentState.groups.filter(
    (group) => group.sessionId !== sessionId
  );

  agentState.setAgents([...agentsForOtherSessions, ...normalizedAgents]);
  agentState.setGroups([...groupsForOtherSessions, ...normalizedGroups]);

  useDecompositionStore.setState((state) => ({
    decompositions: {
      ...state.decompositions,
      ...snapshot.decompositions,
    },
    activeDecompositionId:
      state.activeDecompositionId ??
      Object.keys(snapshot.decompositions)[0] ??
      null,
  }));

  usePipelineStore.setState({
    stage: snapshot.pipeline.stage,
    progress: snapshot.pipeline.progress,
    events: snapshot.pipeline.events,
    error: snapshot.pipeline.error,
    startedAt: snapshot.pipeline.startedAt,
    completedAt: snapshot.pipeline.completedAt,
  });
}

export async function persistSessionSnapshot(sessionId: string): Promise<void> {
  const snapshot = toSerializableSnapshot(sessionId);
  if (!snapshot) {
    return;
  }

  const response = await fetch(`/api/chat/sessions/${sessionId}/snapshot`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ snapshot }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    if (errorBody?.issues) {
      console.error("[snapshot] Validation issues:", errorBody.issues);
    }
    throw new Error(`Failed to persist snapshot (${response.status})`);
  }
}

export async function hydrateSessionSnapshot(
  sessionId: string
): Promise<SessionSnapshotRecord | null> {
  const response = await fetch(`/api/chat/sessions/${sessionId}/snapshot`, {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load snapshot (${response.status})`);
  }

  const record = (await response.json()) as SessionSnapshotRecord;
  applySessionRecord(record);
  return record;
}
