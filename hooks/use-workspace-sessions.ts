import { useMemo } from "react";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function useWorkspaceFilteredSessions() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  return useMemo(() => {
    if (!activeWorkspaceId) return sessions;
    return sessions.filter((s) => s.workspaceId === activeWorkspaceId);
  }, [sessions, activeWorkspaceId]);
}
