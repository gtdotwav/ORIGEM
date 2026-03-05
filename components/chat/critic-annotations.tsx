"use client";

import { useState } from "react";
import {
  Brain,
  Eye,
  Layers,
  Lightbulb,
  Target,
  ChevronDown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CriticResult } from "@/types/chat";

const CRITIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  logica: Brain,
  clareza: Eye,
  profundidade: Layers,
  criatividade: Lightbulb,
  precisao: Target,
};

const CRITIC_LABELS: Record<string, string> = {
  logica: "Logica",
  clareza: "Clareza",
  profundidade: "Profundidade",
  criatividade: "Criatividade",
  precisao: "Precisao",
};

const VERDICT_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  approved: {
    label: "Aprovado",
    color: "text-neon-green",
    bg: "bg-neon-green/10",
  },
  revised: {
    label: "Revisado",
    color: "text-neon-cyan",
    bg: "bg-neon-cyan/10",
  },
  flagged: {
    label: "Sinalizado",
    color: "text-neon-orange",
    bg: "bg-neon-orange/10",
  },
};

interface CriticAnnotationsProps {
  results: CriticResult[];
  className?: string;
}

export function CriticAnnotations({
  results,
  className,
}: CriticAnnotationsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!results || results.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-2 rounded-lg border border-foreground/[0.06] bg-foreground/[0.02]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Shield className="h-3 w-3 text-neon-pink/60" />
        <span className="text-[11px] font-medium text-foreground/50">
          Revisado por {results.length} critico
          {results.length > 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {results.map((r) => {
            const vs = VERDICT_STYLES[r.verdict] ?? VERDICT_STYLES.approved;
            return (
              <span
                key={r.criticType}
                className={cn(
                  "rounded px-1 py-0.5 text-[9px] font-medium",
                  vs.bg,
                  vs.color
                )}
              >
                {CRITIC_LABELS[r.criticType] ?? r.criticType}
              </span>
            );
          })}
          <ChevronDown
            className={cn(
              "ml-1 h-3 w-3 text-foreground/25 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-foreground/[0.04] px-3 pb-3 pt-2">
          {results.map((result) => {
            const Icon =
              CRITIC_ICONS[result.criticType] ?? Shield;
            const vs =
              VERDICT_STYLES[result.verdict] ?? VERDICT_STYLES.approved;

            return (
              <div
                key={result.criticType}
                className="rounded-md border border-foreground/[0.04] bg-foreground/[0.02] p-2.5"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <Icon className="h-3 w-3 text-foreground/40" />
                  <span className="text-[11px] font-medium text-foreground/60">
                    {CRITIC_LABELS[result.criticType] ?? result.criticType}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-medium",
                      vs.bg,
                      vs.color
                    )}
                  >
                    {vs.label}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-foreground/40">
                  {result.annotation.length > 300
                    ? result.annotation.slice(0, 300) + "..."
                    : result.annotation}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
