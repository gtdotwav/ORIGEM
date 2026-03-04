"use client";

import Link from "next/link";
import { History, X, ArrowUpRight, Trash2, Workflow } from "lucide-react";
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

  const looseSessions = sessions.filter((s) => !s.projectId);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-white/[0.08] bg-neutral-950/95 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-neon-cyan" />
            <h2 className="text-sm font-semibold text-white/80">Historico</h2>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/35">
              {looseSessions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {looseSessions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <History className="mb-3 h-8 w-8 text-white/10" />
              <p className="text-xs text-white/30">
                Conversas avulsas aparecerao aqui
              </p>
              <p className="mt-1 text-[10px] text-white/20">
                Chats que nao evoluiram para projetos
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {looseSessions.map((session) => {
                const isCurrent = session.id === currentSessionId;
                return (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex items-start gap-2 rounded-lg border p-2 transition-all",
                      isCurrent
                        ? "border-neon-cyan/20 bg-neon-cyan/5"
                        : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/chat/${session.id}`}
                        className="block"
                        onClick={onClose}
                      >
                        <p
                          className={cn(
                            "truncate text-xs font-medium",
                            isCurrent
                              ? "text-neon-cyan"
                              : "text-white/70 group-hover:text-white/90"
                          )}
                        >
                          {session.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/25">
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
                    </div>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/dashboard/chat/${session.id}`}
                        className="rounded-md p-1 text-white/30 hover:bg-white/[0.06] hover:text-neon-cyan"
                        title="Abrir chat"
                        onClick={onClose}
                      >
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            removeSession(session.id);
                            toast.success("Conversa removida");
                          }}
                          className="rounded-md p-1 text-white/30 hover:bg-white/[0.06] hover:text-red-400"
                          title="Remover"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="space-y-2 border-t border-white/[0.06] px-4 py-3">
          {onCreateCanvas && (
            <button
              type="button"
              onClick={() => {
                onCreateCanvas();
                onClose();
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-neon-purple/30 bg-neon-purple/10 px-3 py-2 text-xs font-medium text-neon-purple transition-all hover:border-neon-purple/50 hover:bg-neon-purple/20"
            >
              <Workflow className="h-3.5 w-3.5" />
              Criar Canvas de Fluxos
            </button>
          )}
          <p className="text-[10px] text-white/20">
            Chats avulsos — sem projeto vinculado
          </p>
        </div>
      </motion.div>
    </>
  );
}
