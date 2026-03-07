"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  MessageSquare,
  Blocks,
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
  max: Blocks,
  ultra: Flame,
};

export function LLMSelector({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const { providers: configuredProviders, loading } = useConfiguredProviders();

  const selectedTier = useChatSettingsStore((s) => s.selectedTier);
  const setSelectedTier = useChatSettingsStore((s) => s.setSelectedTier);
  const ecosystemConfig = useChatSettingsStore((s) => s.ecosystemConfig);
  const setEcosystemProvider = useChatSettingsStore((s) => s.setEcosystemProvider);
  const setEcosystemModel = useChatSettingsStore((s) => s.setEcosystemModel);

  const hasManualSelection =
    ecosystemConfig.provider !== null && ecosystemConfig.model !== "";

  const updatePosition = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 400;
    if (spaceBelow >= dropdownHeight || spaceBelow >= rect.top) {
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    } else {
      setDropdownPos({ top: rect.top - dropdownHeight - 4, left: rect.left });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    updatePosition();
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

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
          "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all",
          open
            ? "border-foreground/[0.14] bg-foreground/[0.07]"
            : "border-foreground/[0.07] bg-foreground/[0.03] hover:border-foreground/[0.12] hover:bg-foreground/[0.05]"
        )}
      >
        {hasManualSelection ? (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
            <Blocks className="h-3 w-3 text-foreground/40" />
          </div>
        ) : (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neon-cyan/10">
            <Zap className="h-3 w-3 text-neon-cyan/70" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold leading-tight text-foreground/75">
            {displayLabel}
          </p>
          <p className="truncate text-[10px] leading-tight text-foreground/30">
            {displaySub}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-foreground/25 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown — rendered via portal to escape overflow-hidden parents */}
      {open && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 100 }}
          className="w-[280px] rounded-xl border border-foreground/[0.08] bg-card/95 shadow-2xl backdrop-blur-xl">
          {/* Tiers */}
          <div className="border-b border-foreground/[0.06] p-2.5">
            <p className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-widest text-foreground/30">
              Nivel
            </p>
            <div className="flex gap-1.5">
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
                      "flex flex-1 flex-col items-center gap-1 rounded-lg border py-2 transition-all",
                      isActive
                        ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.06)]"
                        : "border-foreground/[0.05] text-foreground/30 hover:border-foreground/[0.10] hover:text-foreground/55"
                    )}
                  >
                    <TierIcon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold">
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto */}
          <div className="border-b border-foreground/[0.06] px-2.5 py-2">
            <button
              type="button"
              onClick={selectAuto}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                !hasManualSelection
                  ? "bg-neon-cyan/[0.06] text-foreground/75"
                  : "text-foreground/35 hover:bg-foreground/[0.04] hover:text-foreground/55"
              )}
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-[12px] font-medium">Auto</span>
              {!hasManualSelection && (
                <Check className="h-3.5 w-3.5 shrink-0 text-neon-cyan" />
              )}
            </button>
          </div>

          {/* Models */}
          <div className="max-h-[260px] overflow-y-auto p-2">
            {loading ? (
              <p className="py-4 text-center text-[11px] text-foreground/25">
                Carregando...
              </p>
            ) : configuredNames.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-foreground/25">
                Nenhum provedor configurado
              </p>
            ) : (
              PROVIDER_CATALOG.filter((p) =>
                configuredNames.includes(p.name)
              ).map((provMeta) => (
                <div key={provMeta.name} className="mb-1.5">
                  <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-widest text-foreground/25">
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
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                          isSelected
                            ? "bg-foreground/[0.06]"
                            : "hover:bg-foreground/[0.03]"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "truncate text-[12px] font-medium",
                            isSelected ? "text-foreground/80" : "text-foreground/55"
                          )}>
                            {model.name}
                          </p>
                          <p className="truncate text-[9px] text-foreground/20">
                            {model.bestFor.slice(0, 2).join(" · ")}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-neon-cyan" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
