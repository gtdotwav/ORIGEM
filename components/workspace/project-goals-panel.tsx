"use client";

import { useState } from "react";
import { Check, Plus, Trash2, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";
import { createId } from "@/lib/chat-orchestrator";
import { cn } from "@/lib/utils";
import type { ProjectGoal } from "@/types/project";

interface ProjectGoalsPanelProps {
  projectId: string;
  goals: ProjectGoal[];
}

export function ProjectGoalsPanel({ projectId, goals }: ProjectGoalsPanelProps) {
  const addGoal = useProjectStore((s) => s.addGoal);
  const toggleGoal = useProjectStore((s) => s.toggleGoal);
  const removeGoal = useProjectStore((s) => s.removeGoal);
  const [input, setInput] = useState("");

  const doneCount = goals.filter((g) => g.done).length;
  const progress = goals.length > 0 ? Math.round((doneCount / goals.length) * 100) : 0;

  const handleAdd = () => {
    const title = input.trim();
    if (!title) return;
    addGoal(projectId, {
      id: createId("goal"),
      title,
      done: false,
      createdAt: new Date().toISOString(),
    });
    setInput("");
  };

  return (
    <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-foreground/40">
          <Target className="h-3.5 w-3.5" />
          Objetivos
        </div>
        {goals.length > 0 && (
          <span className="text-[10px] text-foreground/30">
            {doneCount}/{goals.length} concluidos
          </span>
        )}
      </div>

      {/* Progress bar */}
      {goals.length > 0 && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
          <div
            className="h-full rounded-full bg-neon-green/60 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Goals list */}
      <div className="space-y-1.5">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="group/goal flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all hover:bg-foreground/[0.03]"
          >
            <button
              type="button"
              onClick={() => toggleGoal(projectId, goal.id)}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                goal.done
                  ? "border-neon-green/40 bg-neon-green/15 text-neon-green"
                  : "border-foreground/[0.12] bg-foreground/[0.03] text-transparent hover:border-foreground/[0.25]"
              )}
            >
              <Check className="h-3 w-3" />
            </button>
            <span
              className={cn(
                "flex-1 text-xs transition-all",
                goal.done ? "text-foreground/30 line-through" : "text-foreground/70"
              )}
            >
              {goal.title}
            </span>
            <button
              type="button"
              onClick={() => removeGoal(projectId, goal.id)}
              className="text-foreground/15 opacity-0 transition-all hover:text-red-400 group-hover/goal:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add goal */}
      <div className="mt-3 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Novo objetivo..."
          className="h-8 border-foreground/[0.06] bg-foreground/[0.03] text-xs text-foreground/80 placeholder:text-foreground/20"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/20 disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
