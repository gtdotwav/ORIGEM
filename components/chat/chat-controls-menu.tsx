"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  MessageCircle,
  Settings2,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";
import { LLMSelector } from "@/components/chat/llm-selector";
import { CriticPanel } from "@/components/chat/critic-panel";
import { ChatModeToggle } from "@/components/apps/chat-mode-toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePersonaStore } from "@/stores/persona-store";

interface ChatControlsMenuProps {
  workspaceName?: string;
  className?: string;
}

export function ChatControlsMenu({
  workspaceName,
  className,
}: ChatControlsMenuProps) {
  const [open, setOpen] = useState(false);
  const chatMode = usePersonaStore((s) => s.chatMode);
  const isEcosystem = chatMode === "ecosystem";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-tour="chat-controls"
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-black/40 px-3 py-2 text-left backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]",
            className
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] text-white/50">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-white/90">
              Ajustes
            </p>
            <p className="truncate text-[10.5px] font-medium text-white/40">
              {isEcosystem ? "Ecossistema" : "Chat direto"}
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
        className="w-[340px] rounded-[24px] border-white/10 bg-black/60 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/[0.06] bg-black/40 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
              Contexto
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11.5px] text-white/80">
              {isEcosystem ? (
                <Workflow className="h-3.5 w-3.5 text-neon-cyan" />
              ) : (
                <MessageCircle className="h-3.5 w-3.5 text-neon-cyan" />
              )}
              <span>{isEcosystem ? "Modo ecossistema" : "Modo chat direto"}</span>
            </div>
            {workspaceName ? (
              <p className="mt-1.5 text-[11px] text-white/40">
                Workspace ativo: {workspaceName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-black/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium text-white/90">
                  Modelo
                </p>
                <p className="text-[10.5px] text-white/40">
                  Seleciona o tier ou o modelo manual.
                </p>
              </div>
              <LLMSelector />
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
              <p className="mb-2 text-[12px] font-medium text-white/90">
                Modo
              </p>
              <ChatModeToggle />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
              <div>
                <p className="text-[12px] font-medium text-white/90">
                  Astro-Crítico
                </p>
                <p className="text-[10.5px] text-white/40">
                  Revisao extra quando precisar de mais rigor.
                </p>
              </div>
              <CriticPanel />
            </div>
          </div>

          <Link
            href="/dashboard/settings/providers"
            className="inline-flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-black/40 px-3 py-2.5 text-[11.5px] text-white/60 transition-colors hover:border-white/[0.15] hover:text-white"
          >
            <span>Configurar providers</span>
            <Settings2 className="h-4 w-4" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
