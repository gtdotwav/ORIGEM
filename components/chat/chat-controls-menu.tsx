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
            "inline-flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-left transition-colors hover:border-foreground/[0.12] hover:bg-foreground/[0.05]",
            className
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/[0.08] bg-black/20 text-foreground/45">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-foreground/72">
              Ajustes
            </p>
            <p className="truncate text-[10px] text-foreground/32">
              {isEcosystem ? "Ecossistema" : "Chat direto"}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-foreground/28 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[340px] rounded-2xl border-foreground/[0.08] bg-card/96 p-3 shadow-2xl backdrop-blur-2xl"
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-foreground/[0.06] bg-black/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/32">
              Contexto
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-foreground/62">
              {isEcosystem ? (
                <Workflow className="h-3.5 w-3.5 text-foreground/45" />
              ) : (
                <MessageCircle className="h-3.5 w-3.5 text-foreground/45" />
              )}
              <span>{isEcosystem ? "Modo ecossistema" : "Modo chat direto"}</span>
            </div>
            {workspaceName ? (
              <p className="mt-1 text-[11px] text-foreground/38">
                Workspace ativo: {workspaceName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-xl border border-foreground/[0.06] bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-foreground/72">
                  Modelo
                </p>
                <p className="text-[10px] text-foreground/30">
                  Seleciona o tier ou o modelo manual.
                </p>
              </div>
              <LLMSelector />
            </div>

            <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-3 py-2.5">
              <p className="mb-2 text-[11px] font-medium text-foreground/72">
                Modo
              </p>
              <ChatModeToggle />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-3 py-2.5">
              <div>
                <p className="text-[11px] font-medium text-foreground/72">
                  Criticos
                </p>
                <p className="text-[10px] text-foreground/30">
                  Ative revisao extra quando precisar de mais rigor.
                </p>
              </div>
              <CriticPanel />
            </div>
          </div>

          <Link
            href="/dashboard/settings/providers"
            className="inline-flex w-full items-center justify-between rounded-xl border border-foreground/[0.06] bg-black/20 px-3 py-2.5 text-[11px] text-foreground/65 transition-colors hover:border-foreground/[0.10] hover:text-foreground/82"
          >
            <span>Configurar providers</span>
            <Settings2 className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
