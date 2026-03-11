"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Bot,
  Brain,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrigemNode, OrigemNodeType } from "@/types/canvas";

type StatItem = {
  label: string;
  value: string;
};

const TYPE_PRESET: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    border: string;
    iconBg: string;
    iconColor: string;
    badge: string;
    defaultTitle: string;
  }
> = {
  input: {
    icon: MessageSquare,
    border: "border-neon-cyan/28",
    iconBg: "bg-neon-cyan/10",
    iconColor: "text-neon-cyan",
    badge: "bg-neon-cyan/10 text-neon-cyan/90",
    defaultTitle: "Entrada",
  },
  context: {
    icon: Brain,
    border: "border-neon-purple/28",
    iconBg: "bg-neon-purple/10",
    iconColor: "text-neon-purple",
    badge: "bg-neon-purple/10 text-neon-purple/90",
    defaultTitle: "Contexto",
  },
  project: {
    icon: FolderKanban,
    border: "border-neon-green/28",
    iconBg: "bg-neon-green/10",
    iconColor: "text-neon-green",
    badge: "bg-neon-green/10 text-neon-green/90",
    defaultTitle: "Projeto",
  },
  group: {
    icon: Users,
    border: "border-neon-orange/28",
    iconBg: "bg-neon-orange/10",
    iconColor: "text-neon-orange",
    badge: "bg-neon-orange/10 text-neon-orange/90",
    defaultTitle: "Grupo",
  },
  agent: {
    icon: Bot,
    border: "border-neon-blue/28",
    iconBg: "bg-neon-blue/10",
    iconColor: "text-neon-blue",
    badge: "bg-neon-blue/10 text-neon-blue/90",
    defaultTitle: "Agente",
  },
  output: {
    icon: Sparkles,
    border: "border-fuchsia-400/28",
    iconBg: "bg-fuchsia-400/10",
    iconColor: "text-fuchsia-200",
    badge: "bg-fuchsia-400/10 text-fuchsia-100",
    defaultTitle: "Agregacao",
  },
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-neon-cyan",
  completed: "bg-neon-green",
  archived: "bg-foreground/25",
  idle: "bg-foreground/25",
  thinking: "bg-neon-purple",
  working: "bg-amber-300",
  done: "bg-neon-green",
  error: "bg-red-400",
};

function readStats(value: unknown): StatItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const label = (item as { label?: unknown }).label;
      const statValue = (item as { value?: unknown }).value;

      if (typeof label !== "string" || typeof statValue !== "string") {
        return null;
      }

      return { label, value: statValue };
    })
    .filter((item): item is StatItem => Boolean(item));
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function ExecutionMapNodeInner({ data, selected }: NodeProps<OrigemNode>) {
  const raw = data as Record<string, unknown>;
  const type = (typeof raw.type === "string" ? raw.type : "output") as OrigemNodeType;
  const preset = TYPE_PRESET[type] ?? TYPE_PRESET.output;
  const Icon = preset.icon;

  const title =
    typeof raw.title === "string" && raw.title.length > 0
      ? raw.title
      : preset.defaultTitle;
  const subtitle =
    typeof raw.subtitle === "string" && raw.subtitle.length > 0
      ? raw.subtitle
      : null;
  const description =
    typeof raw.description === "string" && raw.description.length > 0
      ? raw.description
      : typeof raw.preview === "string" && raw.preview.length > 0
        ? raw.preview
        : null;
  const status =
    typeof raw.status === "string" && raw.status.length > 0
      ? raw.status
      : null;
  const stats = readStats(raw.stats);
  const chips = readStringList(raw.chips).slice(0, 4);
  const showTarget = type !== "input";
  const showSource = type !== "output";

  return (
    <div
      className={cn(
        "w-[280px] rounded-[24px] border bg-card/86 p-4 shadow-[0_22px_44px_-28px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all",
        preset.border,
        selected
          ? "ring-1 ring-white/14 shadow-[0_26px_52px_-24px_rgba(0,0,0,0.92)]"
          : "hover:border-white/20"
      )}
    >
      {showTarget ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-white/20 !bg-white/70"
        />
      ) : null}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10",
            preset.iconBg
          )}
        >
          <Icon className={cn("h-5 w-5", preset.iconColor)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-foreground/92">
                {title}
              </p>
              {subtitle ? (
                <p className="mt-0.5 truncate text-[11px] text-foreground/42">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <span
              className={cn(
                "inline-flex shrink-0 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em]",
                preset.badge
              )}
            >
              {type}
            </span>
          </div>

          {status ? (
            <div className="mt-2 inline-flex items-center gap-2 text-[10px] text-foreground/50">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  STATUS_TONE[status] ?? STATUS_TONE.idle
                )}
              />
              <span>{status}</span>
            </div>
          ) : null}
        </div>
      </div>

      {description ? (
        <p className="mt-3 text-[11px] leading-5 text-foreground/58">
          {description}
        </p>
      ) : null}

      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip, index) => (
            <span
              key={`${chip}-${index}`}
              className="rounded-full border border-white/8 bg-white/4 px-2 py-1 text-[10px] text-foreground/48"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {stats.length > 0 ? (
        <div className="mt-3 grid gap-2 border-t border-white/8 pt-3">
          {stats.slice(0, 3).map((stat) => (
            <div
              key={`${stat.label}-${stat.value}`}
              className="flex items-center justify-between gap-3 text-[11px]"
            >
              <span className="text-foreground/36">{stat.label}</span>
              <span className="truncate text-right text-foreground/76">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {showSource ? (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-white/20 !bg-white/70"
        />
      ) : null}
    </div>
  );
}

export const ExecutionMapNode = memo(ExecutionMapNodeInner);
