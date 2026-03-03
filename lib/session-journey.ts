import type { DecompositionResult } from "@/types/decomposition";
import type { Session, Message } from "@/types/session";

export type RouteTargetKey =
  | "agents"
  | "projects"
  | "groups"
  | "flows"
  | "orchestra";

export type JourneyRouteStep =
  | "contexts"
  | "agents"
  | "projects"
  | "groups"
  | "flows"
  | "orchestra";

const ROUTE_TARGET_SET = new Set<RouteTargetKey>([
  "agents",
  "projects",
  "groups",
  "flows",
  "orchestra",
]);

interface ContextDirectionOptions {
  contextId?: string | null;
  target?: RouteTargetKey;
}

export interface ContextDirection {
  id: string;
  text: string;
  contextId: string | null;
  routeTargets: RouteTargetKey[];
  createdAt: Date;
}

function isRouteTargetKey(value: string): value is RouteTargetKey {
  return ROUTE_TARGET_SET.has(value as RouteTargetKey);
}

function readRouteTargets(metadata?: Record<string, unknown>): RouteTargetKey[] {
  const rawTargets = metadata?.routeTargets;
  if (!Array.isArray(rawTargets)) {
    return [];
  }

  return rawTargets
    .filter((target): target is string => typeof target === "string")
    .filter(isRouteTargetKey);
}

export function getMetadataDecompositionId(
  metadata: Record<string, unknown> | undefined
): string | null {
  const decompositionId = metadata?.decompositionId;
  return typeof decompositionId === "string" ? decompositionId : null;
}

export function getLatestSessionId(sessions: Session[]): string | null {
  if (sessions.length === 0) {
    return null;
  }

  return [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0]?.id ?? null;
}

export function getSessionContexts(
  sessionId: string | null,
  messages: Message[],
  decompositions: Record<string, DecompositionResult>,
  activeDecompositionId: string | null = null
): DecompositionResult[] {
  if (!sessionId) {
    if (activeDecompositionId && decompositions[activeDecompositionId]) {
      return [decompositions[activeDecompositionId]];
    }
    return [];
  }

  const decompositionIds = new Set<string>();

  for (const message of messages) {
    if (message.sessionId !== sessionId) {
      continue;
    }

    if (message.decompositionId) {
      decompositionIds.add(message.decompositionId);
    }

    const metadataDecompositionId = getMetadataDecompositionId(message.metadata);
    if (metadataDecompositionId) {
      decompositionIds.add(metadataDecompositionId);
    }
  }

  if (decompositionIds.size === 0 && activeDecompositionId) {
    decompositionIds.add(activeDecompositionId);
  }

  return Array.from(decompositionIds)
    .map((decompositionId) => decompositions[decompositionId])
    .filter((context): context is DecompositionResult => Boolean(context))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getSelectedContext(
  contexts: DecompositionResult[],
  contextId: string | null
) {
  if (contexts.length === 0) {
    return null;
  }

  if (!contextId) {
    return contexts[0];
  }

  return contexts.find((context) => context.id === contextId) ?? contexts[0];
}

export function getContextDirections(
  messages: Message[],
  sessionId: string | null,
  options?: ContextDirectionOptions
): ContextDirection[] {
  if (!sessionId) {
    return [];
  }

  const contextId = options?.contextId ?? null;
  const target = options?.target;

  return messages
    .filter((message) => {
      if (message.sessionId !== sessionId || message.role !== "user") {
        return false;
      }

      if (message.metadata?.contextChat !== true) {
        return false;
      }

      const messageContextId =
        message.decompositionId ?? getMetadataDecompositionId(message.metadata);

      if (contextId && messageContextId !== contextId) {
        return false;
      }

      const routeTargets = readRouteTargets(message.metadata);
      if (target && !routeTargets.includes(target)) {
        return false;
      }

      return true;
    })
    .map((message) => ({
      id: message.id,
      text: message.content,
      contextId:
        message.decompositionId ?? getMetadataDecompositionId(message.metadata),
      routeTargets: readRouteTargets(message.metadata),
      createdAt: new Date(message.createdAt),
    }))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

function withContextQuery(baseHref: string, contextId?: string | null) {
  if (!contextId) {
    return baseHref;
  }

  return `${baseHref}&contextId=${encodeURIComponent(contextId)}`;
}

export function getJourneyStepHref(
  step: JourneyRouteStep,
  sessionId: string,
  contextId?: string | null
) {
  if (step === "orchestra") {
    const base = `/dashboard/orchestra/${encodeURIComponent(sessionId)}`;
    if (!contextId) {
      return base;
    }
    return `${base}?contextId=${encodeURIComponent(contextId)}`;
  }

  const base = `/dashboard/${step}?sessionId=${encodeURIComponent(sessionId)}`;
  return withContextQuery(base, contextId);
}
