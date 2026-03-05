"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Layers, Plus } from "lucide-react";
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

  if (activeWorkspaces.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2.5 py-1.5 text-xs text-foreground/50 transition-all hover:border-foreground/[0.12] hover:text-foreground/70"
        >
          {activeWorkspace ? (
            <>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  WORKSPACE_COLORS[activeWorkspace.color].bg,
                  WORKSPACE_COLORS[activeWorkspace.color].border,
                  "border"
                )}
              />
              <span className="max-w-[100px] truncate">
                {activeWorkspace.name}
              </span>
            </>
          ) : (
            <>
              <Layers className="h-3 w-3" />
              <span>Todos</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-52 border-foreground/[0.08] bg-card/95 p-1.5 backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => {
            setActiveWorkspace(null);
            setOpen(false);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-all hover:bg-foreground/[0.06]",
            !activeWorkspaceId ? "text-foreground/90" : "text-foreground/50"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Todos os workspaces</span>
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
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-all hover:bg-foreground/[0.06]",
                isActive ? "text-foreground/90" : "text-foreground/50"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", colors.text)} />
              <span className="flex-1 truncate text-left">{ws.name}</span>
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
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Gerenciar workspaces</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
