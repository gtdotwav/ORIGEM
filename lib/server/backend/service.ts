import {
  SessionCreateSchema,
  SnapshotUpsertSchema,
  type SessionSnapshotInput,
} from "@/lib/server/backend/schemas";
import { createEmptySnapshot } from "@/lib/server/backend/factory";
import { getSnapshotStore } from "@/lib/server/backend/store";
import type {
  SessionSnapshot,
  SessionSnapshotRecord,
} from "@/lib/server/backend/types";

function parseDateInput(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "string") {
    return new Date(value);
  }

  return new Date();
}

function normalizeSnapshot(snapshot: SessionSnapshotInput): SessionSnapshot {
  return {
    ...snapshot,
    session: {
      ...snapshot.session,
      createdAt: parseDateInput(snapshot.session.createdAt),
      updatedAt: parseDateInput(snapshot.session.updatedAt),
    },
    messages: snapshot.messages.map((message) => ({
      ...message,
      createdAt: parseDateInput(message.createdAt),
    })),
    agents: snapshot.agents.map((agent) => ({
      ...agent,
      createdAt: parseDateInput(agent.createdAt),
      updatedAt: parseDateInput(agent.updatedAt),
      outputs: agent.outputs.map((output) => ({
        ...output,
        createdAt: parseDateInput(output.createdAt),
      })),
    })),
    groups: snapshot.groups.map((group) => ({
      ...group,
      createdAt: parseDateInput(group.createdAt),
    })),
    pipeline: {
      ...snapshot.pipeline,
      events: snapshot.pipeline.events.map((event) => ({
        ...event,
        data: event.data ?? null,
      })),
    },
  };
}

export async function listSessionRecords(): Promise<SessionSnapshotRecord[]> {
  const store = getSnapshotStore();
  return store.listRecords();
}

export async function getSessionRecord(sessionId: string) {
  const store = getSnapshotStore();
  return store.getRecord(sessionId);
}

export async function upsertSessionSnapshot(input: unknown) {
  const parsed = SnapshotUpsertSchema.parse(input);
  const normalized = normalizeSnapshot(parsed.snapshot);
  const store = getSnapshotStore();
  return store.upsertSnapshot(normalized.session.id, normalized);
}

export async function createSessionRecord(input: unknown) {
  const parsed = SessionCreateSchema.parse(input);
  const store = getSnapshotStore();
  const existing = await store.getRecord(parsed.sessionId);

  if (existing) {
    return existing;
  }

  const snapshot = createEmptySnapshot(parsed.sessionId, parsed.title);
  return store.upsertSnapshot(parsed.sessionId, snapshot);
}

export async function deleteSessionRecord(sessionId: string) {
  const store = getSnapshotStore();
  await store.deleteRecord(sessionId);
}
