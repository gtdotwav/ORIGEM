"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useRuntimeStore } from "@/stores/runtime-store";
import { AGENT_PERSONAS, AGENT_PERSONA_ICONS, selectPersonasForIntent } from "@/config/agent-personas";
import type { AgentPersona } from "@/types/agent-task";
import type { RuntimeTask } from "@/types/runtime";
import type { Intent } from "@/types/decomposition";

interface AgentTaskCardsProps {
  sessionId: string;
  intent?: Intent;
}

const COLOR_MAP: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  cyan:   { text: "text-neon-cyan",   bg: "bg-neon-cyan/10",   border: "border-neon-cyan/25", dot: "bg-neon-cyan" },
  purple: { text: "text-neon-purple", bg: "bg-neon-purple/10", border: "border-neon-purple/25", dot: "bg-neon-purple" },
  green:  { text: "text-neon-green",  bg: "bg-neon-green/10",  border: "border-neon-green/25", dot: "bg-neon-green" },
  orange: { text: "text-neon-orange", bg: "bg-neon-orange/10", border: "border-neon-orange/25", dot: "bg-neon-orange" },
  pink:   { text: "text-neon-pink",   bg: "bg-neon-pink/10",   border: "border-neon-pink/25", dot: "bg-neon-pink" },
  blue:   { text: "text-neon-blue",   bg: "bg-neon-blue/10",   border: "border-neon-blue/25", dot: "bg-neon-blue" },
};

const STATUS_LABELS: Record<string, string> = {
  waiting: "aguardando",
  thinking: "pensando",
  active: "ativo",
  done: "concluido",
  error: "erro",
  pending: "pendente",
  running: "executando",
};

function derivePersonaStatus(tasks: RuntimeTask[]): "waiting" | "thinking" | "active" | "done" {
  if (tasks.every((t) => t.status === "done")) return "done";
  if (tasks.some((t) => t.status === "running")) return "active";
  if (tasks.some((t) => t.status === "pending")) return "thinking";
  return "waiting";
}

function derivePersonaProgress(tasks: RuntimeTask[]): number {
  if (tasks.length === 0) return 0;
  return Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length);
}

interface PersonaGroup {
  persona: AgentPersona;
  tasks: RuntimeTask[];
  status: "waiting" | "thinking" | "active" | "done";
  progress: number;
}

export function AgentTaskCards({ sessionId, intent }: AgentTaskCardsProps) {
  const runtime = useRuntimeStore((state) => state.sessions[sessionId]);
  const [clock, setClock] = useState("");
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("pt-BR", { hour12: false }));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const personaGroups = useMemo((): PersonaGroup[] => {
    if (!runtime || runtime.tasks.length === 0) return [];

    const personas = intent
      ? selectPersonasForIntent(intent)
      : AGENT_PERSONAS.slice(0, 4);

    // Distribute tasks round-robin across selected personas
    const groups: Map<string, RuntimeTask[]> = new Map();
    for (const p of personas) groups.set(p.id, []);

    runtime.tasks.forEach((task, i) => {
      const persona = personas[i % personas.length];
      groups.get(persona.id)?.push(task);
    });

    return personas.map((persona) => {
      const tasks = groups.get(persona.id) ?? [];
      return {
        persona,
        tasks,
        status: derivePersonaStatus(tasks),
        progress: derivePersonaProgress(tasks),
      };
    });
  }, [runtime, intent]);

  const toggleCard = (id: string) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!runtime || (!runtime.distributionReady && runtime.tasks.length === 0)) {
    return (
      <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/35 p-3 backdrop-blur-md">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
          <Activity className="h-3 w-3 animate-pulse text-neon-cyan" />
          Preparando agentes...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/35 p-3 backdrop-blur-md">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
          <Activity className="h-3 w-3 animate-pulse text-neon-cyan" />
          Agentes em acao
        </div>
        <span className="text-[10px] text-white/35">{clock || "--:--:--"}</span>
      </div>

      {/* Overall progress */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-neon-cyan/70 transition-all duration-300"
          style={{ width: `${runtime.overallProgress}%` }}
        />
      </div>

      {/* Agent cards */}
      <div className="space-y-1.5">
        {personaGroups.map(({ persona, tasks, status, progress }) => {
          const colors = COLOR_MAP[persona.color] ?? COLOR_MAP.cyan;
          const isOpen = openCards.has(persona.id);

          return (
            <Collapsible
              key={persona.id}
              open={isOpen}
              onOpenChange={() => toggleCard(persona.id)}
            >
              <div
                className={cn(
                  "rounded-lg border bg-white/[0.02] transition-all",
                  isOpen ? colors.border : "border-white/[0.06]"
                )}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left"
                  >
                    {/* Icon */}
                    {(() => {
                      const Icon = AGENT_PERSONA_ICONS[persona.id];
                      return Icon ? <Icon className="h-4 w-4 shrink-0" /> : null;
                    })()}

                    {/* Name + role */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-white/80">
                        {persona.name}
                      </p>
                      <p className="text-[10px] text-white/30">{persona.role}</p>
                    </div>

                    {/* Status badge */}
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[9px] uppercase",
                        status === "done"
                          ? "border-green-300/30 bg-green-300/10 text-green-300"
                          : status === "active"
                          ? "border-amber-300/30 bg-amber-300/10 text-amber-300"
                          : status === "thinking"
                          ? `${colors.border} ${colors.bg} ${colors.text}`
                          : "border-white/[0.10] bg-white/[0.03] text-white/45"
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </span>

                    {/* Mini progress */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-10 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            colors.dot
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[9px] text-white/40">
                        {progress}%
                      </span>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 text-white/25 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-white/[0.04] px-2.5 pb-2 pt-1.5">
                    {tasks.length === 0 ? (
                      <p className="text-[10px] text-white/25">
                        Nenhuma tarefa atribuida
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-2 py-0.5"
                          >
                            {/* Status dot */}
                            <div className="mt-1 flex-shrink-0">
                              <div
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  task.status === "done"
                                    ? "bg-green-400"
                                    : task.status === "running"
                                    ? "bg-amber-400 animate-pulse"
                                    : "bg-white/20"
                                )}
                              />
                            </div>

                            {/* Task info */}
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-white/60">
                                {task.title}
                              </p>
                              {task.notes.length > 0 && (
                                <p className="text-[9px] text-white/30">
                                  {task.notes[task.notes.length - 1]}
                                </p>
                              )}
                            </div>

                            {/* Progress */}
                            <span className="text-[9px] text-white/30">
                              {task.progress}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
