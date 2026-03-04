"use client";

import { useState } from "react";
import {
  Zap,
  MessageSquare,
  Sparkles,
  Flame,
  ChevronDown,
  Cpu,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { useConfiguredProviders } from "@/hooks/use-configured-providers";
import { PROVIDER_CATALOG } from "@/config/providers";
import { TOKEN_TIERS, TIER_ORDER } from "@/config/token-tiers";
import type { TokenTier } from "@/types/chat";
import type { ProviderName } from "@/types/provider";

const TIER_ICONS: Record<TokenTier, React.ComponentType<{ className?: string }>> = {
  short: Zap,
  medium: MessageSquare,
  max: Sparkles,
  ultra: Flame,
};

const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  "neon-green":  { text: "text-neon-green",  bg: "bg-neon-green/10",  border: "border-neon-green/30" },
  "neon-cyan":   { text: "text-neon-cyan",   bg: "bg-neon-cyan/10",   border: "border-neon-cyan/30" },
  "neon-purple": { text: "text-neon-purple", bg: "bg-neon-purple/10", border: "border-neon-purple/30" },
  "neon-orange": { text: "text-neon-orange", bg: "bg-neon-orange/10", border: "border-neon-orange/30" },
};

export function LLMSelector({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { providers: configuredProviders, loading } = useConfiguredProviders();

  const selectedTier = useChatSettingsStore((s) => s.selectedTier);
  const setSelectedTier = useChatSettingsStore((s) => s.setSelectedTier);
  const ecosystemConfig = useChatSettingsStore((s) => s.ecosystemConfig);
  const setEcosystemProvider = useChatSettingsStore((s) => s.setEcosystemProvider);
  const setEcosystemModel = useChatSettingsStore((s) => s.setEcosystemModel);

  const hasManualSelection = ecosystemConfig.provider !== null && ecosystemConfig.model !== "";

  // Find display info for current selection
  const currentTierConfig = TOKEN_TIERS[selectedTier];
  const tierColors = TIER_COLORS[currentTierConfig.color] ?? TIER_COLORS["neon-cyan"];

  let displayLabel = `Auto · ${currentTierConfig.label}`;
  let displayProvider: string | null = null;

  if (hasManualSelection) {
    const provMeta = PROVIDER_CATALOG.find((p) => p.name === ecosystemConfig.provider);
    const modelMeta = provMeta?.models.find((m) => m.id === ecosystemConfig.model);
    displayLabel = modelMeta?.name ?? ecosystemConfig.model;
    displayProvider = provMeta?.displayName ?? null;
  }

  function selectAuto() {
    setEcosystemProvider(null);
    setEcosystemModel("");
    setOpen(false);
  }

  function selectModel(provider: ProviderName, modelId: string) {
    setEcosystemProvider(provider);
    setEcosystemModel(modelId);
    setOpen(false);
  }

  const configuredNames = configuredProviders.map((p) => p.provider);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all",
            hasManualSelection
              ? "border-neon-purple/30 bg-neon-purple/10 text-neon-purple"
              : `${tierColors.border} ${tierColors.bg} ${tierColors.text}`,
            className
          )}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span className="max-w-[120px] truncate">
            {displayProvider ? `${displayProvider} · ${displayLabel}` : displayLabel}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 border-white/[0.08] bg-neutral-950/95 p-3 shadow-2xl backdrop-blur-xl"
        align="start"
        sideOffset={8}
      >
        {/* Tier pills */}
        <p className="mb-2 text-[10px] uppercase tracking-wide text-white/30">
          Nivel de resposta
        </p>
        <div className="mb-3 flex gap-1">
          {TIER_ORDER.map((tier) => {
            const config = TOKEN_TIERS[tier];
            const TierIcon = TIER_ICONS[tier];
            const colors = TIER_COLORS[config.color] ?? TIER_COLORS["neon-cyan"];
            const isActive = selectedTier === tier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => {
                  setSelectedTier(tier);
                  setEcosystemProvider(null);
                  setEcosystemModel("");
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-medium transition-all",
                  isActive && !hasManualSelection
                    ? `${colors.border} ${colors.bg} ${colors.text}`
                    : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:bg-white/[0.05] hover:text-white/50"
                )}
              >
                <TierIcon className="h-3 w-3" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Auto option */}
        <div className="border-t border-white/[0.06] pt-2">
          <button
            type="button"
            onClick={selectAuto}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
              !hasManualSelection
                ? "bg-neon-cyan/8 text-neon-cyan"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"
            )}
          >
            <Zap className="h-3 w-3" />
            <div className="flex-1">
              <p className="text-[11px] font-medium">Auto</p>
              <p className="text-[9px] opacity-50">
                Seleciona o melhor modelo pelo tier
              </p>
            </div>
            {!hasManualSelection && <Check className="h-3 w-3" />}
          </button>
        </div>

        {/* Provider + model list */}
        {loading ? (
          <p className="mt-2 text-center text-[10px] text-white/25">
            Carregando provedores...
          </p>
        ) : configuredNames.length === 0 ? (
          <p className="mt-2 text-center text-[10px] text-white/25">
            Nenhum provedor configurado
          </p>
        ) : (
          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto border-t border-white/[0.06] pt-2">
            {PROVIDER_CATALOG.filter((p) =>
              configuredNames.includes(p.name)
            ).map((provMeta) => (
              <div key={provMeta.name}>
                <p className="mb-0.5 px-2 text-[9px] uppercase tracking-wider text-white/25">
                  {provMeta.displayName}
                </p>
                {provMeta.models.map((model) => {
                  const isSelected =
                    ecosystemConfig.provider === provMeta.name &&
                    ecosystemConfig.model === model.id;

                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => selectModel(provMeta.name, model.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                        isSelected
                          ? "bg-neon-purple/8 text-neon-purple"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                      )}
                    >
                      <div className="flex-1">
                        <p className="text-[11px] font-medium">{model.name}</p>
                        <p className="text-[9px] opacity-50">
                          {model.costTier} · {model.bestFor.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
