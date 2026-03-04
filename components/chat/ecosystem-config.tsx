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
  { value: "pt-BR", label: "Portugues" },
  { value: "en-US", label: "English" },
  { value: "es-ES", label: "Espanol" },
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
        Config 360
      </p>

      {/* Provider */}
      <div>
        <label className="mb-1 block text-[10px] text-white/40">
          Provedor
        </label>
        <select
          value={ecosystemConfig.provider ?? ""}
          onChange={(e) =>
            setEcosystemProvider(
              e.target.value ? (e.target.value as ProviderName) : null
            )
          }
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/70 outline-none transition-colors focus:border-white/20"
        >
          <option value="" className="bg-neutral-900">
            Auto (melhor disponivel)
          </option>
          {configured.map((p) => {
            const meta = PROVIDER_CATALOG.find((c) => c.name === p.provider);
            return (
              <option
                key={p.provider}
                value={p.provider}
                className="bg-neutral-900"
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
          <label className="mb-1 block text-[10px] text-white/40">
            Modelo
          </label>
          <select
            value={ecosystemConfig.model}
            onChange={(e) => setEcosystemModel(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/70 outline-none transition-colors focus:border-white/20"
          >
            <option value="" className="bg-neutral-900">
              Padrao
            </option>
            {selectedProviderMeta.models.map((m) => (
              <option key={m.id} value={m.id} className="bg-neutral-900">
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Language */}
      <div>
        <label className="mb-1 block text-[10px] text-white/40">
          Linguagem
        </label>
        <select
          value={ecosystemConfig.language}
          onChange={(e) =>
            setEcosystemLanguage(
              e.target.value as RuntimeLanguage | "origem"
            )
          }
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/70 outline-none transition-colors focus:border-white/20"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-neutral-900"
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
