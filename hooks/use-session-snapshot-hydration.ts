"use client";

import { useEffect, useRef, useState } from "react";
import { hydrateSessionSnapshot } from "@/lib/chat-backend-client";

interface UseSessionSnapshotHydrationOptions {
  sessionId: string | null | undefined;
  enabled: boolean;
  logLabel: string;
  deferStateUpdate?: boolean;
}

export function useSessionSnapshotHydration({
  sessionId,
  enabled,
  logLabel,
  deferStateUpdate = true,
}: UseSessionSnapshotHydrationOptions) {
  const [isHydrating, setIsHydrating] = useState(false);
  const hydratedSessionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionId || !enabled) {
      return;
    }

    if (hydratedSessionIdsRef.current.has(sessionId)) {
      return;
    }

    let cancelled = false;

    const setHydrating = (value: boolean) => {
      if (cancelled) {
        return;
      }

      if (deferStateUpdate) {
        queueMicrotask(() => {
          if (cancelled) {
            return;
          }

          setIsHydrating(value);
        });
        return;
      }

      setIsHydrating(value);
    };

    hydratedSessionIdsRef.current.add(sessionId);
    setHydrating(true);

    void hydrateSessionSnapshot(sessionId)
      .catch((error) => {
        console.error(`Failed to hydrate session on ${logLabel}`, error);
      })
      .finally(() => {
        setHydrating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deferStateUpdate, enabled, logLabel, sessionId]);

  return {
    isHydrating,
  };
}
