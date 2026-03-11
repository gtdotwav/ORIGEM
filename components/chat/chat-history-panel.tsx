"use client";

import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Plus,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay — transparent, click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[55]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: -16, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6.3rem)] z-[60] md:inset-x-auto md:bottom-auto md:left-12 md:top-1/2 md:-translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer glow */}
            <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] blur-xl" />

            <div
              className="relative max-h-[70vh] w-full overflow-hidden rounded-2xl border border-foreground/[0.12] shadow-2xl shadow-black/40 md:max-h-[88vh] md:w-96"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              {/* Top highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-foreground/40" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40">
                    Historico
                  </span>
                  <span className="rounded bg-foreground/[0.06] px-1.5 py-px text-[9px] tabular-nums text-foreground/25">
                    {looseSessions.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/25 transition-all hover:border-red-500/15 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* Session list */}
              <div className="max-h-[60vh] overflow-y-auto px-3 py-2">
                {looseSessions.length === 0 ? (
                  <div className="flex flex-col items-center px-3 py-10 text-center">
                    <MessageSquare className="mb-2 h-5 w-5 text-foreground/8" />
                    <p className="text-[11px] text-foreground/25">
                      Nenhuma conversa avulsa
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {looseSessions.map((session) => {
                      const isCurrent = session.id === currentSessionId;
                      return (
                        <div
                          key={session.id}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all",
                            isCurrent
                              ? "bg-neon-cyan/8 text-neon-cyan"
                              : "text-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground/70"
                          )}
                        >
                          <MessageSquare
                            className={cn(
                              "h-3 w-3 shrink-0",
                              isCurrent
                                ? "text-neon-cyan/60"
                                : "text-foreground/15"
                            )}
                          />
                          <Link
                            href={`/dashboard/chat/${session.id}`}
                            className="min-w-0 flex-1"
                            onClick={onClose}
                          >
                            <p className="truncate text-[11px] font-medium leading-tight">
                              {session.title}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 text-[9px] tabular-nums",
                                isCurrent
                                  ? "text-neon-cyan/30"
                                  : "text-foreground/15"
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

              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* Footer actions */}
              <div className="space-y-0.5 px-3 py-2.5">
                {onCreateCanvas && (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateCanvas();
                      onClose();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-foreground/35 transition-all hover:bg-neon-purple/8 hover:text-neon-purple/70"
                  >
                    <Workflow className="h-3 w-3" />
                    Canvas de Orquestracao
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-foreground/35 transition-all hover:bg-foreground/[0.04] hover:text-foreground/50"
                >
                  <Plus className="h-3 w-3" />
                  Novo Chat
                </button>
              </div>

              {/* Bottom highlight */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
