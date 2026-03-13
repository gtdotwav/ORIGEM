"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  PlugZap,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { LLMSelector } from "@/components/chat/llm-selector";
import { CriticPanel } from "@/components/chat/critic-panel";
import { ConnectorsPanel } from "@/components/chat/connectors-panel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PROVIDER_CATALOG } from "@/config/providers";
import { useConfiguredProviders } from "@/hooks/use-configured-providers";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { cn } from "@/lib/utils";

interface ChatControlsMenuProps {
  workspaceName?: string;
  currentSessionId?: string;
  className?: string;
}

export function ChatControlsMenu({
  workspaceName,
  currentSessionId,
  className,
}: ChatControlsMenuProps) {
  const [open, setOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const { providers, loading } = useConfiguredProviders();
  const ecosystemConfig = useChatSettingsStore((s) => s.ecosystemConfig);

  const providerSummary = useMemo(() => {
    if (loading) {
      return "Carregando runtime";
    }

    if (ecosystemConfig.provider && ecosystemConfig.model) {
      const meta = PROVIDER_CATALOG.find(
        (provider) => provider.name === ecosystemConfig.provider
      );

      return `${meta?.displayName ?? ecosystemConfig.provider} / ${ecosystemConfig.model}`;
    }

    if (providers.length === 0) {
      return "Nenhum provider configurado";
    }

    return `${providers.length} provider${providers.length > 1 ? "s" : ""} pronto${providers.length > 1 ? "s" : ""}`;
  }, [ecosystemConfig.model, ecosystemConfig.provider, loading, providers.length]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            data-tour="chat-controls"
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-3.5 py-2 text-left backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]",
              className
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(208,186,143,0.14)] bg-[rgba(208,186,143,0.08)] text-[#ead7b1]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white/90">Runtime</p>
              <p className="truncate text-[10.5px] font-medium text-white/42">
                {providerSummary}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-white/30 transition-transform",
                open && "rotate-180 text-neon-cyan"
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={10}
          className="w-[360px] rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(14,14,15,0.94),rgba(8,8,9,0.98))] p-3 shadow-[0_30px_100px_-40px_rgba(0,0,0,0.96)] backdrop-blur-3xl"
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/[0.06] bg-black/40 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Workspace ativo
              </p>
              <p className="mt-1.5 text-[11px] text-white/80">
                {workspaceName ?? "Sem workspace associado"}
              </p>
              <p className="mt-1 text-[10px] text-white/38">
                Ferramentas MCP e contexto operacional usam o workspace desta sessao.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-black/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-white/90">Modelo</p>
                  <p className="text-[10.5px] text-white/40">
                    Auto, tier ou modelo manual.
                  </p>
                </div>
                <LLMSelector />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                <div>
                  <p className="text-[12px] font-medium text-white/90">
                    Astro-Critico
                  </p>
                  <p className="text-[10.5px] text-white/40">
                    Camada extra de rigor quando precisar revisar.
                  </p>
                </div>
                <CriticPanel />
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-black/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Ferramentas e providers
              </p>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConnectorsOpen(true);
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left text-white/65 transition-colors hover:border-white/[0.14] hover:text-white"
              >
                <div>
                  <p className="text-[11.5px] font-medium text-white/88">
                    Ferramentas do workspace
                  </p>
                  <p className="text-[10px] text-white/35">
                    MCP, dados e integracoes usados pelo chat.
                  </p>
                </div>
                <PlugZap className="h-4 w-4 text-neon-cyan" />
              </button>

              <Link
                href="/dashboard/settings/providers"
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11.5px] text-white/65 transition-colors hover:border-white/[0.14] hover:text-white"
              >
                <div>
                  <p className="font-medium text-white/88">Providers de IA</p>
                  <p className="text-[10px] text-white/35">
                    Chaves, modelos e roteamento do runtime.
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/dashboard/workspaces"
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-[11.5px] text-white/55 transition-colors hover:border-white/[0.14] hover:text-white"
              >
                <span>Gerenciar workspaces</span>
                <Settings2 className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ConnectorsPanel
        open={connectorsOpen}
        onClose={() => setConnectorsOpen(false)}
        currentSessionId={currentSessionId}
      />
    </>
  );
}
