"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Layers, Plus, ArrowUpRight, X, MessageSquare, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSessionStore } from "@/stores/session-store";
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from "@/components/workspace/workspace-card";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const sessions = useSessionStore((s) => s.sessions);
  const removeSession = useSessionStore((s) => s.removeSession);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"workspaces" | "history">("workspaces");

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

  const looseSessions = useMemo(() => {
    return sessions
      .filter((s) => !s.projectId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [sessions]);

  if (activeWorkspaces.length === 0 && looseSessions.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => setTab("workspaces")} // default opening tab
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
                {activeWorkspace ? "Workspace ativo" : "Contexto Global"}
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
                {activeWorkspace ? activeWorkspace.name : "ORIGEM"}
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
        className="w-[320px] rounded-[24px] border-foreground/[0.08] bg-card/80 p-0 shadow-2xl shadow-black/40 backdrop-blur-3xl overflow-hidden"
      >
        {/* Tabs */}
        <div className="flex items-center border-b border-foreground/[0.06] bg-foreground/[0.02]">
          <button
            onClick={() => setTab("workspaces")}
            className={cn(
              "flex-1 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
              tab === "workspaces" ? "text-foreground/90 bg-foreground/[0.04]" : "text-foreground/40 hover:text-foreground/70"
            )}
          >
            Workspaces
          </button>
          <button
            onClick={() => setTab("history")}
            className={cn(
              "flex-1 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
              tab === "history" ? "text-foreground/90 bg-foreground/[0.04]" : "text-foreground/40 hover:text-foreground/70"
            )}
          >
            Chats Recentes
          </button>
        </div>

        <div className="p-2">
          {tab === "workspaces" && (
            <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
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
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1 scrollbar-thin">
              {looseSessions.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-8 text-center bg-foreground/[0.02] rounded-xl border border-foreground/[0.04]">
                  <MessageSquare className="mb-2 h-5 w-5 text-foreground/20" />
                  <p className="text-[11px] text-foreground/40">
                    Nenhum chat recente.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {looseSessions.map((session) => {
                    const isCurrent = session.id === currentSessionId;
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all",
                          isCurrent
                            ? "bg-neon-cyan/10 text-neon-cyan"
                            : "text-foreground/50 hover:bg-foreground/[0.05] hover:text-foreground/80"
                        )}
                      >
                        <MessageSquare
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            isCurrent
                              ? "text-neon-cyan/80"
                              : "text-foreground/25 group-hover:text-foreground/40"
                          )}
                        />
                        <Link
                          href={`/dashboard/chat/${session.id}`}
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => setOpen(false)}
                        >
                          <p className="truncate text-[12px] font-medium leading-tight text-foreground/90">
                            {session.title}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 text-[9px] tabular-nums tracking-wide",
                              isCurrent
                                ? "text-neon-cyan/50"
                                : "text-foreground/30"
                            )}
                          >
                            {new Date(session.updatedAt).toLocaleDateString(
                              "pt-BR",
                              { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </Link>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeSession(session.id);
                              toast.success("Conversa removida");
                            }}
                            className="shrink-0 rounded-md p-1.5 text-foreground/0 transition-all hover:bg-red-500/10 group-hover:bg-foreground/[0.06] group-hover:text-foreground/30 hover:!text-red-400"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
