import type { PipelineSnapshot, SessionSnapshot } from "@/lib/server/backend/types";
import type { Session } from "@/types/session";
import type { SessionRuntime } from "@/types/runtime";

function toSessionTitle(prompt: string) {
  const compact = prompt.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "Nova sessao";
  }
  if (compact.length <= 52) {
    return compact;
  }
  return `${compact.slice(0, 49)}...`;
}

export function createBackendSession(sessionId: string, title: string): Session {
  const now = new Date().toISOString();

  return {
    id: sessionId,
    title: toSessionTitle(title),
    status: "active",
    metadata: {
      source: "chat",
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultRuntime(sessionId: string): SessionRuntime {
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

export function createDefaultPipelineSnapshot(): PipelineSnapshot {
  return {
    stage: "idle",
    progress: 0,
    events: [],
    error: null,
    startedAt: null,
    completedAt: null,
  };
}

export function createEmptySnapshot(
  sessionId: string,
  title: string
): SessionSnapshot {
  return {
    session: createBackendSession(sessionId, title),
    messages: [],
    runtime: createDefaultRuntime(sessionId),
    agents: [],
    groups: [],
    decompositions: {},
    pipeline: createDefaultPipelineSnapshot(),
  };
}
