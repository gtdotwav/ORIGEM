"use client";

import { useState } from "react";
import {
  Brain,
  Eye,
  Layers,
  Lightbulb,
  Target,
  Shield,
  ChevronDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import type { CriticType } from "@/types/chat";

const CRITIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Eye,
  Layers,
  Lightbulb,
  Target,
};

const CRITIC_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  "neon-cyan":   { text: "text-neon-cyan",   bg: "bg-neon-cyan/10",   border: "border-neon-cyan/30" },
  "neon-green":  { text: "text-neon-green",  bg: "bg-neon-green/10",  border: "border-neon-green/30" },
  "neon-purple": { text: "text-neon-purple", bg: "bg-neon-purple/10", border: "border-neon-purple/30" },
  "neon-orange": { text: "text-neon-orange", bg: "bg-neon-orange/10", border: "border-neon-orange/30" },
  "neon-pink":   { text: "text-neon-pink",   bg: "bg-neon-pink/10",   border: "border-neon-pink/30" },
};

export function CriticPanel({ className }: { className?: string }) {
  const critics = useChatSettingsStore((s) => s.critics);
  const toggleCritic = useChatSettingsStore((s) => s.toggleCritic);
  const setCriticGuidance = useChatSettingsStore((s) => s.setCriticGuidance);
  const activeCount = critics.filter((c) => c.enabled).length;
  const [expandedCritic, setExpandedCritic] = useState<CriticType | null>(null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all",
            activeCount > 0
              ? "border-foreground/[0.12] bg-foreground/[0.08] text-foreground/78"
              : "border-foreground/[0.08] bg-foreground/[0.03] text-foreground/30 hover:bg-foreground/[0.06] hover:text-foreground/50",
            className
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          Critico
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/[0.10] px-1 text-[10px] font-bold text-foreground/76">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 border-foreground/[0.08] bg-card/95 p-3 shadow-2xl backdrop-blur-xl"
        align="end"
        sideOffset={8}
      >
        <p className="mb-3 text-xs font-semibold text-foreground/50">
          Selecione os criticos ativos
        </p>
        <div className="space-y-1.5">
          {critics.map((critic) => {
            const Icon = CRITIC_ICONS[critic.icon] ?? Shield;
            const colors = CRITIC_COLORS[critic.color] ?? CRITIC_COLORS["neon-cyan"];
            const isExpanded = expandedCritic === critic.type;

            return (
              <div key={critic.type} className="rounded-lg border border-foreground/[0.06] bg-foreground/[0.02]">
                <button
                  type="button"
                  onClick={() => toggleCritic(critic.type)}
                  className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left"
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                      critic.enabled ? colors.bg : "bg-foreground/[0.04]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3 w-3 transition-colors",
                        critic.enabled ? colors.text : "text-foreground/30"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        critic.enabled ? "text-foreground/90" : "text-foreground/50"
                      )}
                    >
                      {critic.label}
                    </p>
                    <p className="text-[10px] text-foreground/25">
                      {critic.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded-sm border-2 transition-colors",
                      critic.enabled
                        ? `${colors.border} ${colors.bg}`
                        : "border-foreground/15"
                    )}
                  />
                </button>

                {critic.enabled && (
                  <div className="border-t border-foreground/[0.04] px-2.5 pb-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCritic(isExpanded ? null : critic.type)
                      }
                      className="flex items-center gap-1 text-[10px] text-foreground/30 hover:text-foreground/50"
                    >
                      <ChevronDown
                        className={cn(
                          "h-2.5 w-2.5 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                      Orientacao
                    </button>
                    {isExpanded && (
                      <input
                        type="text"
                        value={critic.guidance}
                        onChange={(e) =>
                          setCriticGuidance(critic.type, e.target.value)
                        }
                        placeholder="Ex: foque em dados numericos..."
                        className="mt-1 w-full rounded-md border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1.5 text-[11px] text-foreground/70 placeholder:text-foreground/20 outline-none focus:border-foreground/15"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
