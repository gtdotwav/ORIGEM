"use client";

import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  MessageSquare,
  Plus,
  Trash2,
  Workflow,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";

interface ChatHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  currentSessionId?: string;
  onCreateCanvas?: () => void;
}

export function ChatHistoryPanel({
  open,
  onClose,
  currentSessionId,
  onCreateCanvas,
}: ChatHistoryPanelProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const removeSession = useSessionStore((s) => s.removeSession);

  const looseSessions = sessions
    .filter((s) => !s.projectId)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  if (!open) return null;

  return (
    <>
      {/* Overlay — subtle, click to close */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Left sidebar panel — IDE style */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-foreground/[0.06] bg-card/98 backdrop-blur-2xl"
      >
        {/* Header — compact IDE toolbar */}
        <div className="flex h-10 items-center justify-between border-b border-foreground/[0.05] px-3">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-[11px] font-medium tracking-wide text-foreground/50">
              HISTORICO
            </span>
            <span className="ml-1 rounded bg-foreground/[0.06] px-1 py-px text-[9px] tabular-nums text-foreground/25">
              {looseSessions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Session list — file tree style */}
        <div className="flex-1 overflow-y-auto py-1">
          {looseSessions.length === 0 ? (
            <div className="flex flex-col items-center px-3 py-10 text-center">
              <MessageSquare className="mb-2 h-5 w-5 text-foreground/8" />
              <p className="text-[11px] text-foreground/25">
                Nenhuma conversa avulsa
              </p>
            </div>
          ) : (
            <div className="space-y-px px-1">
              {looseSessions.map((session) => {
                const isCurrent = session.id === currentSessionId;
                return (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
                      isCurrent
                        ? "bg-neon-cyan/8 text-neon-cyan"
                        : "text-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground/70"
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "h-3 w-3 shrink-0",
                        isCurrent ? "text-neon-cyan/60" : "text-foreground/15"
                      )}
                    />
                    <Link
                      href={`/dashboard/chat/${session.id}`}
                      className="min-w-0 flex-1"
                      onClick={onClose}
                    >
                      <p className="truncate text-[11px] leading-tight">
                        {session.title}
                      </p>
                      <p
                        className={cn(
                          "mt-px text-[9px] tabular-nums",
                          isCurrent ? "text-neon-cyan/30" : "text-foreground/15"
                        )}
                      >
                        {new Date(session.updatedAt).toLocaleDateString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </Link>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          removeSession(session.id);
                          toast.success("Conversa removida");
                        }}
                        className="shrink-0 rounded p-0.5 text-foreground/0 transition-colors group-hover:text-foreground/20 hover:!text-red-400/70"
                        title="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — compact actions */}
        <div className="space-y-1 border-t border-foreground/[0.05] px-2 py-2">
          {onCreateCanvas && (
            <button
              type="button"
              onClick={() => {
                onCreateCanvas();
                onClose();
              }}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-foreground/35 transition-colors hover:bg-neon-purple/8 hover:text-neon-purple/70"
            >
              <Workflow className="h-3 w-3" />
              Canvas de Fluxos
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-foreground/35 transition-colors hover:bg-foreground/[0.04] hover:text-foreground/50"
          >
            <Plus className="h-3 w-3" />
            Novo Chat
          </button>
        </div>
      </motion.div>
    </>
  );
}
