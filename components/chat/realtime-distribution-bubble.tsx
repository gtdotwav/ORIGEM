"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  Bot,
  FolderKanban,
  Users,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useDecompositionStore } from "@/stores/decomposition-store";
import { useSessionStore } from "@/stores/session-store";

const METRICS = [
  {
    key: "contexts",
    label: "Contextos",
    color: "bg-cyan-400/70",
    textColor: "text-cyan-300",
    icon: Brain,
  },
  {
    key: "projects",
    label: "Projetos",
    color: "bg-blue-400/70",
    textColor: "text-blue-300",
    icon: FolderKanban,
  },
  {
    key: "agents",
    label: "Agentes",
    color: "bg-green-400/70",
    textColor: "text-green-300",
    icon: Bot,
  },
  {
    key: "groups",
    label: "Grupos",
    color: "bg-orange-400/70",
    textColor: "text-orange-300",
    icon: Users,
  },
] as const;

export function RealtimeDistributionBubble() {
  const contextCount = useDecompositionStore(
    (state) => Object.keys(state.decompositions).length
  );
  const projectCount = useSessionStore((state) => state.sessions.length);
  const agentCount = useAgentStore((state) => state.agents.length);
  const groupCount = useAgentStore((state) => state.groups.length);

  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString("pt-BR", {
          hour12: false,
        })
      );
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const values = useMemo(
    () => ({
      contexts: contextCount,
      projects: projectCount,
      agents: agentCount,
      groups: groupCount,
    }),
    [contextCount, projectCount, agentCount, groupCount]
  );

  const total = Math.max(
    1,
    values.contexts + values.projects + values.agents + values.groups
  );

  return (
    <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/35 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
          <Activity className="h-3 w-3 text-neon-cyan animate-pulse" />
          Distribuicao em tempo real
        </div>
        <span className="text-[10px] text-white/35">{clock || "--:--:--"}</span>
      </div>

      <div className="space-y-2">
        {METRICS.map((metric) => {
          const value = values[metric.key];
          const percent = Math.round((value / total) * 100);

          return (
            <div key={metric.key}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className={`inline-flex items-center gap-1.5 ${metric.textColor}`}>
                  <metric.icon className="h-3 w-3" />
                  {metric.label}
                </span>
                <span className="text-white/55">
                  {value} ({percent}%)
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className={`h-full rounded-full ${metric.color} transition-all duration-300`}
                  style={{ width: `${Math.max(percent, value > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
