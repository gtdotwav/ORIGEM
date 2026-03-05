"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { PROVIDER_CATALOG } from "@/config/providers";
import type { ProviderName, ProviderMeta } from "@/types/provider";
import type { RuntimeLanguage } from "@/types/runtime";

interface ConfiguredProvider {
  provider: ProviderName;
  selectedModel: string;
  hasApiKey: boolean;
}

const LANGUAGE_OPTIONS: Array<{
  value: RuntimeLanguage | "origem";
  label: string;
}> = [
  { value: "pt-BR", label: "Portugues (BR)" },
  { value: "en-US", label: "Ingles (US)" },
  { value: "es-ES", label: "Espanhol (ES)" },
  { value: "origem", label: "ORIGEM (Proprietaria)" },
];

export function EcosystemConfig({ className }: { className?: string }) {
  const ecosystemConfig = useChatSettingsStore((s) => s.ecosystemConfig);
  const setEcosystemProvider = useChatSettingsStore(
    (s) => s.setEcosystemProvider
  );
  const setEcosystemModel = useChatSettingsStore((s) => s.setEcosystemModel);
  const setEcosystemLanguage = useChatSettingsStore(
    (s) => s.setEcosystemLanguage
  );

  const [configured, setConfigured] = useState<ConfiguredProvider[]>([]);

  useEffect(() => {
    fetch("/api/settings/providers")
      .then((res) => res.json())
      .then(
        (data: { providers: ConfiguredProvider[] }) => {
          setConfigured(data.providers.filter((p) => p.hasApiKey));
        }
      )
      .catch(() => {});
  }, []);

  const selectedProviderMeta: ProviderMeta | undefined = ecosystemConfig.provider
    ? PROVIDER_CATALOG.find((p) => p.name === ecosystemConfig.provider)
    : undefined;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/30">
        Config 360
      </p>

      {/* Provider */}
      <div>
        <label className="mb-1 block text-[10px] text-foreground/40">
          Provedor
        </label>
        <select
          value={ecosystemConfig.provider ?? ""}
          onChange={(e) =>
            setEcosystemProvider(
              e.target.value ? (e.target.value as ProviderName) : null
            )
          }
          className="w-full rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] px-2.5 py-1.5 text-xs text-foreground/70 outline-none transition-colors focus:border-foreground/20"
        >
          <option value="" className="bg-card">
            Auto (melhor disponivel)
          </option>
          {configured.map((p) => {
            const meta = PROVIDER_CATALOG.find((c) => c.name === p.provider);
            return (
              <option
                key={p.provider}
                value={p.provider}
                className="bg-card"
              >
                {meta?.displayName ?? p.provider}
              </option>
            );
          })}
        </select>
      </div>

      {/* Model */}
      {selectedProviderMeta && (
        <div>
          <label className="mb-1 block text-[10px] text-foreground/40">
            Modelo
          </label>
          <select
            value={ecosystemConfig.model}
            onChange={(e) => setEcosystemModel(e.target.value)}
            className="w-full rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] px-2.5 py-1.5 text-xs text-foreground/70 outline-none transition-colors focus:border-foreground/20"
          >
            <option value="" className="bg-card">
              Padrao
            </option>
            {selectedProviderMeta.models.map((m) => (
              <option key={m.id} value={m.id} className="bg-card">
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Language */}
      <div>
        <label className="mb-1 block text-[10px] text-foreground/40">
          Linguagem
        </label>
        <select
          value={ecosystemConfig.language}
          onChange={(e) =>
            setEcosystemLanguage(
              e.target.value as RuntimeLanguage | "origem"
            )
          }
          className="w-full rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] px-2.5 py-1.5 text-xs text-foreground/70 outline-none transition-colors focus:border-foreground/20"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-card"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {configured.length === 0 && (
        <p className="text-[10px] text-neon-orange/60">
          Nenhum provedor configurado. Va em Settings &gt; Providers.
        </p>
      )}
    </div>
  );
}
