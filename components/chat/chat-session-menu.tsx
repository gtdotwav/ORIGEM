"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, ArrowUpRight, ChevronDown, FolderKanban } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ChatSessionMenuProps {
  sessionId: string;
  stageLabel: string;
  progress: number;
  workspaceName?: string;
}

export function ChatSessionMenu({
  sessionId,
  stageLabel,
  progress,
  workspaceName,
}: ChatSessionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-left transition-colors hover:border-foreground/[0.12] hover:bg-foreground/[0.05]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/[0.08] bg-black/20 text-foreground/45">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-foreground/72">
              Execucao
            </p>
            <p className="truncate text-[10px] text-foreground/32">
              {stageLabel}
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
        className="w-[300px] rounded-2xl border-foreground/[0.08] bg-card/96 p-3 shadow-2xl backdrop-blur-2xl"
      >
        <div className="space-y-3">
          <div className="grid gap-2">
            <div className="rounded-xl border border-foreground/[0.06] bg-black/20 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/32">
                Workspace
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-foreground/68">
                <FolderKanban className="h-3.5 w-3.5 text-foreground/42" />
                <span>{workspaceName ?? "Sem workspace ativo"}</span>
              </div>
            </div>

            <div className="rounded-xl border border-foreground/[0.06] bg-black/20 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-foreground/45">Etapa</span>
                <span className="text-foreground/72">{stageLabel}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                <span className="text-foreground/45">Progresso</span>
                <span className="text-foreground/72">{Math.round(progress)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div
                  className="h-full rounded-full bg-foreground/[0.72] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-foreground/[0.06] bg-black/20 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/32">
                Sessao
              </p>
              <p className="mt-2 font-mono text-[11px] text-foreground/52">
                {sessionId}
              </p>
            </div>
          </div>

          <Link
            href={`/dashboard/orchestra/${sessionId}`}
            className="inline-flex w-full items-center justify-between rounded-xl border border-foreground/[0.06] bg-black/20 px-3 py-2.5 text-[11px] text-foreground/65 transition-colors hover:border-foreground/[0.10] hover:text-foreground/82"
          >
            <span>Abrir canvas de execucao</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
