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
import type { Message } from "@/types/session";

const MAX_SNAPSHOT_MESSAGES = 40;
const MAX_MESSAGE_CONTENT_LENGTH = 6_000;
const MAX_AGENT_OUTPUTS = 10;
const MAX_OUTPUT_CONTENT_LENGTH = 4_000;
const MAX_PIPELINE_EVENTS = 80;
const MAX_METADATA_DEPTH = 3;
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_ITEMS = 16;
const MAX_METADATA_STRING_LENGTH = 1_800;
const lastPersistedSnapshotBodies = new Map<string, string>();
const pendingSnapshotBodies = new Map<string, string>();
let snapshotPersistChain: Promise<void> = Promise.resolve();

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

function reviveDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  return new Date().toISOString();
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

function compactText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

function compactUnknown(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    return compactText(value, MAX_METADATA_STRING_LENGTH);
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === undefined
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_METADATA_ITEMS)
      .map((item) => compactUnknown(item, depth + 1));
  }

  if (typeof value === "object") {
    if (depth >= MAX_METADATA_DEPTH) {
      return "[omitted]";
    }

    const entries = Object.entries(value as Record<string, unknown>).slice(
      0,
      MAX_METADATA_KEYS
    );

    return Object.fromEntries(
      entries.map(([key, entryValue]) => {
        if (key === "imageAttachment" && entryValue && typeof entryValue === "object") {
          const attachment = entryValue as Record<string, unknown>;
          return [
            key,
            {
              ...attachment,
              dataUrl: undefined,
              omittedFromSnapshot: true,
            },
          ];
        }

        return [key, compactUnknown(entryValue, depth + 1)];
      })
    );
  }

  return String(value);
}

function pickMessagesForSnapshot(messages: Message[]) {
  const importantMessages = messages.filter(
    (message) =>
      message.metadata?.contextChat === true ||
      message.metadata?.checkpoint === true ||
      message.metadata?.includeJourney === true ||
      message.metadata?.journeyStep === true
  );
  const conversationalMessages = messages.filter((message) => message.role !== "system");
  const recentMessages = messages.slice(-8);
  const deduped = new Map<string, Message>();

  for (const message of [
    ...importantMessages.slice(-16),
    ...conversationalMessages.slice(-24),
    ...recentMessages,
  ]) {
    deduped.set(message.id, message);
  }

  return Array.from(deduped.values())
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    )
    .slice(-MAX_SNAPSHOT_MESSAGES)
    .map((message) => ({
      ...message,
      content: compactText(message.content, MAX_MESSAGE_CONTENT_LENGTH),
      metadata:
        message.metadata && typeof message.metadata === "object"
          ? (compactUnknown(message.metadata) as Record<string, unknown>)
          : message.metadata,
    }));
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

  const rawSessionMessages = sessionState.messages.filter(
    (message) => message.sessionId === sessionId
  );
  const sessionMessages = pickMessagesForSnapshot(rawSessionMessages);

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

  const scopedDecompositions = Array.from(decompositionIds).reduce<
    Record<string, (typeof decompositionState.decompositions)[string]>
  >((acc, decompositionId) => {
    const result = decompositionState.decompositions[decompositionId];
    if (result) {
      acc[decompositionId] = result;
    }
    return acc;
  }, {});

  return {
    session: {
      ...session,
      metadata:
        session.metadata && typeof session.metadata === "object"
          ? (compactUnknown(session.metadata) as Record<string, unknown>)
          : session.metadata,
    },
    messages: sessionMessages,
    runtime: normalizeRuntime(sessionId, runtimeState.sessions[sessionId]),
    agents: agentState.agents
      .filter((agent) => agent.sessionId === sessionId)
      .map((agent) => ({
        ...agent,
        systemPrompt: compactText(agent.systemPrompt, MAX_OUTPUT_CONTENT_LENGTH),
        config:
          agent.config && typeof agent.config === "object"
            ? (compactUnknown(agent.config) as Record<string, unknown>)
            : agent.config,
        outputs: agent.outputs.slice(-MAX_AGENT_OUTPUTS).map((output) => ({
          ...output,
          content: compactText(output.content, MAX_OUTPUT_CONTENT_LENGTH),
          metadata:
            output.metadata && typeof output.metadata === "object"
              ? (compactUnknown(output.metadata) as Record<string, unknown>)
              : output.metadata,
        })),
      })),
    groups: agentState.groups.filter((group) => group.sessionId === sessionId),
    decompositions: scopedDecompositions,
    pipeline: {
      stage: pipelineState.stage,
      progress: pipelineState.progress,
      events: pipelineState.events.slice(-MAX_PIPELINE_EVENTS).map((event) => ({
        ...event,
        data: compactUnknown(event.data),
      })),
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

  const body = JSON.stringify({ snapshot });
  const pendingBody = pendingSnapshotBodies.get(sessionId);
  const lastPersistedBody = lastPersistedSnapshotBodies.get(sessionId);

  if (pendingBody === body || lastPersistedBody === body) {
    return snapshotPersistChain;
  }

  pendingSnapshotBodies.set(sessionId, body);

  const flushPromise = snapshotPersistChain.then(async () => {
    let firstError: Error | null = null;

    while (pendingSnapshotBodies.size > 0) {
      const nextEntry = pendingSnapshotBodies.entries().next().value as
        | [string, string]
        | undefined;
      if (!nextEntry) {
        break;
      }

      const [nextSessionId, nextBody] = nextEntry;
      pendingSnapshotBodies.delete(nextSessionId);

      if (lastPersistedSnapshotBodies.get(nextSessionId) === nextBody) {
        continue;
      }

      try {
        const response = await fetch(`/api/chat/sessions/${nextSessionId}/snapshot`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: nextBody,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          if (errorBody?.issues) {
            console.error("[snapshot] Validation issues:", errorBody.issues);
          }

          throw new Error(`Failed to persist snapshot (${response.status})`);
        }

        lastPersistedSnapshotBodies.set(nextSessionId, nextBody);
      } catch (error) {
        if (!firstError) {
          firstError =
            error instanceof Error
              ? error
              : new Error("Failed to persist snapshot");
        }
      }
    }

    if (firstError) {
      throw firstError;
    }
  });

  snapshotPersistChain = flushPromise.catch(() => {});
  await flushPromise;
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
