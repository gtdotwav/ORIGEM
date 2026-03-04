import { useMemo } from "react";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { useRuntimeStore } from "@/stores/runtime-store";

export function useWorkspaceStats(workspaceId: string) {
  const sessions = useSessionStore((s) => s.sessions);
  const messages = useSessionStore((s) => s.messages);
  const agents = useAgentStore((s) => s.agents);
  const runtimeSessions = useRuntimeStore((s) => s.sessions);

  return useMemo(() => {
    const wsSessions = sessions.filter((s) => s.workspaceId === workspaceId);
    const sessionIds = new Set(wsSessions.map((s) => s.id));

    const messageCount = messages.filter((m) =>
      sessionIds.has(m.sessionId)
    ).length;

    const agentCount = agents.filter((a) =>
      sessionIds.has(a.sessionId)
    ).length;

    let progressSum = 0;
    let progressCount = 0;
    for (const sid of sessionIds) {
      const runtime = runtimeSessions[sid];
      if (runtime) {
        progressSum += runtime.overallProgress;
        progressCount++;
      }
    }

    const lastActivity = wsSessions.reduce<Date | null>((latest, s) => {
      const d = new Date(s.updatedAt);
      return !latest || d > latest ? d : latest;
    }, null);

    return {
      sessionCount: wsSessions.length,
      messageCount,
      agentCount,
      overallProgress: progressCount > 0 ? Math.round(progressSum / progressCount) : 0,
      lastActivity,
    };
  }, [sessions, messages, agents, runtimeSessions, workspaceId]);
}
