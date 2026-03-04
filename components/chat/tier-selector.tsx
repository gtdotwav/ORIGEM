"use client";

import { Zap, MessageSquare, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { TIER_ORDER, TOKEN_TIERS } from "@/config/token-tiers";
import type { TokenTier } from "@/types/chat";

const TIER_ICONS: Record<TokenTier, React.ComponentType<{ className?: string }>> = {
  short: Zap,
  medium: MessageSquare,
  max: Sparkles,
  ultra: Flame,
};

const TIER_COLOR_CLASSES: Record<string, { active: string; text: string; border: string; bg: string }> = {
  "neon-green":  { active: "text-neon-green",  text: "text-neon-green",  border: "border-neon-green/40",  bg: "bg-neon-green/15" },
  "neon-cyan":   { active: "text-neon-cyan",   text: "text-neon-cyan",   border: "border-neon-cyan/40",   bg: "bg-neon-cyan/15" },
  "neon-purple": { active: "text-neon-purple",  text: "text-neon-purple",  border: "border-neon-purple/40",  bg: "bg-neon-purple/15" },
  "neon-orange": { active: "text-neon-orange", text: "text-neon-orange", border: "border-neon-orange/40", bg: "bg-neon-orange/15" },
};

export function TierSelector({ className }: { className?: string }) {
  const selectedTier = useChatSettingsStore((s) => s.selectedTier);
  const setSelectedTier = useChatSettingsStore((s) => s.setSelectedTier);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {TIER_ORDER.map((tier) => {
        const config = TOKEN_TIERS[tier];
        const Icon = TIER_ICONS[tier];
        const colors = TIER_COLOR_CLASSES[config.color];
        const isActive = selectedTier === tier;

        return (
          <button
            key={tier}
            type="button"
            onClick={() => setSelectedTier(tier)}
            title={config.description}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all",
              isActive
                ? `${colors.border} ${colors.bg} ${colors.text}`
                : "border-white/[0.06] bg-white/[0.03] text-white/35 hover:bg-white/[0.06] hover:text-white/50"
            )}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
