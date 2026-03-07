"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/stores/session-store";
import type { Session } from "@/types/session";

interface SessionListResponse {
  sessions: Array<{
    id: string;
    title: string;
    status: Session["status"];
    metadata?: Record<string, unknown>;
    createdAt?: string | number;
    updatedAtRaw?: string | number;
    updatedAt: number;
    version: number;
  }>;
}

function reviveDate(value: string | number | undefined, fallback: number): string {
  if (value === undefined) {
    return new Date(fallback).toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date(value).toISOString();
}

export function BackendSessionBootstrap() {
  const setSessions = useSessionStore((state) => state.setSessions);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const response = await fetch("/api/chat/sessions", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok || !alive) {
          return;
        }

        const data = (await response.json()) as SessionListResponse;

        const backendSessions: Session[] = data.sessions.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          metadata: item.metadata,
          createdAt: reviveDate(item.createdAt, item.updatedAt),
          updatedAt: reviveDate(item.updatedAtRaw, item.updatedAt),
        }));

        const localSessions = useSessionStore.getState().sessions;
        const mergedById = new Map<string, Session>();

        for (const localSession of localSessions) {
          mergedById.set(localSession.id, localSession);
        }

        for (const backendSession of backendSessions) {
          const current = mergedById.get(backendSession.id);
          if (!current) {
            mergedById.set(backendSession.id, backendSession);
            continue;
          }

          const backendUpdatedAt = new Date(backendSession.updatedAt).getTime();
          const localUpdatedAt = new Date(current.updatedAt).getTime();
          if (backendUpdatedAt >= localUpdatedAt) {
            mergedById.set(backendSession.id, backendSession);
          }
        }

        setSessions(
          Array.from(mergedById.values()).sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        );
      } catch (error) {
        console.error("Failed to bootstrap backend sessions", error);
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, [setSessions]);

  return null;
}
