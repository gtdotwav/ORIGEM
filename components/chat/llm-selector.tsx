"use client";

import { useState, useRef, useEffect } from "react";
import {
  Zap,
  MessageSquare,
  Sparkles,
  Flame,
  ChevronDown,
  Check,
} from "lucide-react";
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

export function LLMSelector({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { providers: configuredProviders, loading } = useConfiguredProviders();

  const selectedTier = useChatSettingsStore((s) => s.selectedTier);
  const setSelectedTier = useChatSettingsStore((s) => s.setSelectedTier);
  const ecosystemConfig = useChatSettingsStore((s) => s.ecosystemConfig);
  const setEcosystemProvider = useChatSettingsStore((s) => s.setEcosystemProvider);
  const setEcosystemModel = useChatSettingsStore((s) => s.setEcosystemModel);

  const hasManualSelection =
    ecosystemConfig.provider !== null && ecosystemConfig.model !== "";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentTierConfig = TOKEN_TIERS[selectedTier];

  let displayLabel = currentTierConfig.label;
  let displaySub = "Auto";

  if (hasManualSelection) {
    const provMeta = PROVIDER_CATALOG.find(
      (p) => p.name === ecosystemConfig.provider
    );
    const modelMeta = provMeta?.models.find(
      (m) => m.id === ecosystemConfig.model
    );
    displayLabel = modelMeta?.name ?? ecosystemConfig.model;
    displaySub = provMeta?.displayName ?? "";
  }

  const configuredNames = configuredProviders.map((p) => p.provider);

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

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all",
          open
            ? "border-foreground/[0.12] bg-foreground/[0.06]"
            : "border-foreground/[0.06] bg-foreground/[0.03] hover:border-foreground/[0.10]"
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-foreground/65">
            {displayLabel}
          </p>
          <p className="truncate text-[8px] text-foreground/25">
            {displaySub}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-foreground/20 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-[280px] rounded-xl border border-foreground/[0.08] bg-card/95 shadow-2xl backdrop-blur-xl">
          {/* Tiers */}
          <div className="border-b border-foreground/[0.05] p-2.5">
            <p className="mb-1.5 px-1 text-[8px] font-medium uppercase tracking-widest text-foreground/25">
              Nivel
            </p>
            <div className="flex gap-1">
              {TIER_ORDER.map((tier) => {
                const config = TOKEN_TIERS[tier];
                const TierIcon = TIER_ICONS[tier];
                const isActive =
                  selectedTier === tier && !hasManualSelection;
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
                      "flex flex-1 flex-col items-center gap-0.5 rounded-lg border py-1.5 transition-all",
                      isActive
                        ? "border-neon-cyan/25 bg-neon-cyan/8 text-neon-cyan"
                        : "border-foreground/[0.04] text-foreground/30 hover:border-foreground/[0.08] hover:text-foreground/50"
                    )}
                  >
                    <TierIcon className="h-3 w-3" />
                    <span className="text-[9px] font-medium">
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto */}
          <div className="border-b border-foreground/[0.05] px-2 py-1.5">
            <button
              type="button"
              onClick={selectAuto}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                !hasManualSelection
                  ? "bg-foreground/[0.04] text-foreground/70"
                  : "text-foreground/35 hover:bg-foreground/[0.03] hover:text-foreground/55"
              )}
            >
              <Zap className="h-3 w-3 shrink-0" />
              <span className="flex-1 text-[11px]">Auto</span>
              {!hasManualSelection && (
                <Check className="h-3 w-3 shrink-0 text-neon-cyan" />
              )}
            </button>
          </div>

          {/* Models */}
          <div className="max-h-[240px] overflow-y-auto p-1.5">
            {loading ? (
              <p className="py-3 text-center text-[10px] text-foreground/20">
                Carregando...
              </p>
            ) : configuredNames.length === 0 ? (
              <p className="py-3 text-center text-[10px] text-foreground/20">
                Nenhum provedor configurado
              </p>
            ) : (
              PROVIDER_CATALOG.filter((p) =>
                configuredNames.includes(p.name)
              ).map((provMeta) => (
                <div key={provMeta.name} className="mb-1">
                  <p className="px-2 py-1 text-[8px] font-medium uppercase tracking-widest text-foreground/20">
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
                        onClick={() =>
                          selectModel(provMeta.name, model.id)
                        }
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                          isSelected
                            ? "bg-foreground/[0.05]"
                            : "hover:bg-foreground/[0.03]"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] text-foreground/60">
                            {model.name}
                          </p>
                          <p className="truncate text-[8px] text-foreground/20">
                            {model.bestFor.slice(0, 2).join(" · ")}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-3 w-3 shrink-0 text-neon-cyan" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
