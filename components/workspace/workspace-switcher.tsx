"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Layers, Plus, ArrowUpRight, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from "@/components/workspace/workspace-card";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const [open, setOpen] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeWorkspaces = workspaces.filter((w) => w.status === "active");
  const activeWorkspaceColors = activeWorkspace
    ? WORKSPACE_COLORS[activeWorkspace.color]
    : null;
  const ActiveWorkspaceIcon = activeWorkspace
    ? WORKSPACE_ICONS[activeWorkspace.icon]
    : Layers;
  const subtitle = useMemo(() => {
    if (!activeWorkspace) {
      return "Explorando todos os workspaces";
    }

    return activeWorkspace.description?.trim().length
      ? activeWorkspace.description
      : "Filtro ativo para projetos, sessoes e feed";
  }, [activeWorkspace]);

  if (activeWorkspaces.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex min-w-[220px] max-w-[260px] items-center gap-2.5 rounded-full border border-foreground/[0.06] bg-card/50 px-2 py-1.5 text-left text-foreground/70 shadow-lg shadow-black/20 backdrop-blur-3xl transition-all hover:border-foreground/[0.12] hover:bg-card/70 hover:shadow-xl hover:shadow-black/30"
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-foreground/[0.03] transition-all",
              activeWorkspaceColors
                ? cn(activeWorkspaceColors.border, activeWorkspaceColors.bg)
                : "border-foreground/[0.08]"
            )}
          >
            <ActiveWorkspaceIcon
              className={cn(
                "h-4 w-4",
                activeWorkspaceColors ? activeWorkspaceColors.text : "text-foreground/45"
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-foreground/28">
                {activeWorkspace ? "Workspace ativo" : "Escopo geral"}
              </span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  activeWorkspaceColors?.dot ?? "bg-foreground/30"
                )}
              />
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground/88">
                {activeWorkspace ? activeWorkspace.name : "Todos os workspaces"}
              </span>
              {activeWorkspace ? (
                <span className="rounded-full border border-foreground/[0.08] bg-foreground/[0.03] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-foreground/35">
                  filtro
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-foreground/38">{subtitle}</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-40 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="w-[300px] rounded-[24px] border-foreground/[0.08] bg-card/80 p-2 shadow-2xl shadow-black/40 backdrop-blur-3xl"
      >
        <div className="mb-2 flex items-start justify-between gap-3 rounded-[16px] border border-foreground/[0.06] bg-foreground/[0.03] px-3 py-2.5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-foreground/28">
              Contexto
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground/86">
              {activeWorkspace ? activeWorkspace.name : "Todos os workspaces"}
            </p>
            <p className="mt-0.5 text-[11px] text-foreground/38">{subtitle}</p>
          </div>
          {activeWorkspace ? (
            <button
              type="button"
              onClick={() => {
                setActiveWorkspace(null);
                setOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] text-foreground/40 transition-colors hover:border-foreground/[0.12] hover:text-foreground/72"
              title="Limpar filtro"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveWorkspace(null);
            setOpen(false);
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all hover:bg-foreground/[0.06]",
            !activeWorkspaceId ? "text-foreground/90" : "text-foreground/50"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.03]">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[12px] font-medium">Todos os workspaces</p>
            <p className="truncate text-[10px] text-foreground/32">
              Remove o filtro e reabre a visao completa
            </p>
          </div>
          {!activeWorkspaceId && (
            <Check className="h-3.5 w-3.5 text-neon-cyan" />
          )}
        </button>

        <div className="my-1 border-t border-foreground/[0.06]" />

        {activeWorkspaces.map((ws) => {
          const colors = WORKSPACE_COLORS[ws.color];
          const Icon = WORKSPACE_ICONS[ws.icon];
          const isActive = activeWorkspaceId === ws.id;

          return (
            <button
              key={ws.id}
              type="button"
              onClick={() => {
                setActiveWorkspace(ws.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all hover:bg-foreground/[0.06]",
                isActive ? "text-foreground/90" : "text-foreground/50"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  colors.border,
                  colors.bg
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", colors.text)} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-medium">{ws.name}</p>
                <p className="truncate text-[10px] text-foreground/32">
                  {ws.description?.trim() || "Workspace pronto para organizar sessoes e projetos"}
                </p>
              </div>
              {isActive && (
                <Check className="h-3.5 w-3.5 text-neon-cyan" />
              )}
            </button>
          );
        })}

        <div className="my-1 border-t border-foreground/[0.06]" />

        <button
          type="button"
          onClick={() => {
            router.push("/dashboard/workspaces");
            setOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.03]">
            <Plus className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[12px] font-medium">Gerenciar workspaces</p>
            <p className="text-[10px] text-foreground/32">
              Criar, editar e abrir a visao completa
            </p>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </PopoverContent>
    </Popover>
  );
}
