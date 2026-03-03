"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  FolderKanban,
  ListChecks,
  MessageSquare,
  Users,
} from "lucide-react";
import { useRuntimeStore } from "@/stores/runtime-store";

interface RealtimeDistributionBubbleProps {
  sessionId: string;
  showTaskList?: boolean;
}

const FUNCTION_META = [
  {
    key: "contexts",
    label: "Contextos",
    color: "bg-cyan-400/70",
    textColor: "text-cyan-300",
    icon: ListChecks,
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

const STATUS_STYLES = {
  pending: "text-white/45 border-white/[0.10] bg-white/[0.03]",
  running: "text-amber-300 border-amber-300/30 bg-amber-300/10",
  done: "text-green-300 border-green-300/30 bg-green-300/10",
  blocked: "text-red-300 border-red-300/30 bg-red-300/10",
} as const;

export function RealtimeDistributionBubble({
  sessionId,
  showTaskList = true,
}: RealtimeDistributionBubbleProps) {
  const runtime = useRuntimeStore((state) => state.sessions[sessionId]);
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

  const functionProgress = useMemo(() => {
    const zeroState = {
      contexts: 0,
      projects: 0,
      agents: 0,
      groups: 0,
    };

    if (!runtime || runtime.tasks.length === 0) {
      return zeroState;
    }

    const aggregate = { ...zeroState };

    for (const fn of FUNCTION_META) {
      const relatedTasks = runtime.tasks.filter((task) => task.functionKey === fn.key);
      if (relatedTasks.length === 0) {
        continue;
      }

      const avg =
        relatedTasks.reduce((sum, task) => sum + task.progress, 0) /
        relatedTasks.length;

      aggregate[fn.key] = Math.round(avg);
    }

    return aggregate;
  }, [runtime]);

  const notes = runtime?.notes ?? [];

  if (!runtime || (!runtime.distributionReady && runtime.tasks.length === 0)) {
    return (
      <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/35 p-3 backdrop-blur-md">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
          <Activity className="h-3 w-3 text-neon-cyan animate-pulse" />
          Distribuicao em preparacao
        </div>
        <p className="mt-2 text-xs text-white/45">
          Aguarde a primeira delegacao de funcoes para visualizar o progresso em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/35 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
          <Activity className="h-3 w-3 text-neon-cyan animate-pulse" />
          Distribuicao em tempo real
        </div>
        <span className="text-[10px] text-white/35">{clock || "--:--:--"}</span>
      </div>

      <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
          style={{ width: `${runtime.overallProgress}%` }}
        />
      </div>

      <div className="space-y-2">
        {FUNCTION_META.map((item) => {
          const percent = functionProgress[item.key];
          return (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className={`inline-flex items-center gap-1.5 ${item.textColor}`}>
                  <item.icon className="h-3 w-3" />
                  {item.label}
                </span>
                <span className="text-white/55">{percent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-300`}
                  style={{ width: `${Math.max(percent, 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {showTaskList && runtime.tasks.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {runtime.tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-white/80">
                    {task.priority}. {task.title}
                  </p>
                  <p className="text-[10px] text-white/35">Agente: {task.agentName}</p>
                </div>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[9px] uppercase ${
                    STATUS_STYLES[task.status]
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5">
          <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/45">
            <MessageSquare className="h-3 w-3" />
            Notas enviadas
          </div>
          <p className="text-[11px] text-white/65">
            {notes[notes.length - 1]?.text}
          </p>
        </div>
      )}
    </div>
  );
}
