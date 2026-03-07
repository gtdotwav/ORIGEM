"use client";

import { useState } from "react";
import {
  Mail,
  X,
  RefreshCw,
  Star,
  Paperclip,
  Clock,
  Check,
  AlertCircle,
  Send,
  Inbox,
  Archive,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailMessage {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
  label?: "primary" | "updates" | "promotions";
}

const MOCK_EMAILS: EmailMessage[] = [
  {
    id: "e1",
    from: "GitHub",
    fromEmail: "noreply@github.com",
    subject: "[ORIGEM] Pull request #42 merged",
    preview: "Your pull request 'feat: slides editor' has been successfully merged into main...",
    time: "09:14",
    read: false,
    starred: false,
    hasAttachment: false,
    label: "updates",
  },
  {
    id: "e2",
    from: "Vercel",
    fromEmail: "notifications@vercel.com",
    subject: "Deployment Ready - origemai.com",
    preview: "Your deployment to production has completed successfully. All checks passed.",
    time: "08:47",
    read: false,
    starred: true,
    hasAttachment: false,
    label: "updates",
  },
  {
    id: "e3",
    from: "Equipe ORIGEM",
    fromEmail: "team@origemai.com",
    subject: "Sprint Review - Semana 10",
    preview: "Segue o resumo da sprint review. Concluimos 14 tasks, velocity de 47 pontos...",
    time: "08:30",
    read: true,
    starred: false,
    hasAttachment: true,
    label: "primary",
  },
  {
    id: "e4",
    from: "Supabase",
    fromEmail: "notify@supabase.io",
    subject: "Database approaching row limit",
    preview: "Your project 'origem-prod' is at 85% of the row limit for the free tier...",
    time: "Ontem",
    read: true,
    starred: false,
    hasAttachment: false,
    label: "updates",
  },
  {
    id: "e5",
    from: "Linear",
    fromEmail: "notifications@linear.app",
    subject: "3 issues assigned to you",
    preview: "ORI-128: Calendar drag-select, ORI-129: Email panel, ORI-130: Kanban polish...",
    time: "Ontem",
    read: true,
    starred: true,
    hasAttachment: false,
    label: "primary",
  },
  {
    id: "e6",
    from: "Stripe",
    fromEmail: "receipts@stripe.com",
    subject: "Pagamento recebido - R$ 97,00",
    preview: "Voce recebeu um pagamento de R$ 97,00 referente ao plano ORIGEM Pro...",
    time: "06/03",
    read: true,
    starred: false,
    hasAttachment: true,
    label: "promotions",
  },
];

const LABEL_STYLES = {
  primary: { bg: "bg-neon-cyan/10", text: "text-neon-cyan", label: "Principal" },
  updates: { bg: "bg-neon-purple/10", text: "text-neon-purple", label: "Atualizacoes" },
  promotions: { bg: "bg-neon-orange/10", text: "text-neon-orange", label: "Promocoes" },
};

type FilterTab = "all" | "unread" | "starred";

interface EmailPanelProps {
  open: boolean;
  onClose: () => void;
}

export function EmailPanel({ open, onClose }: EmailPanelProps) {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [emails, setEmails] = useState<EmailMessage[]>(MOCK_EMAILS);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  const handleConnect = () => {
    setSyncing(true);
    setTimeout(() => {
      setConnected(true);
      setSyncing(false);
      toast.success("E-mail sincronizado com sucesso");
    }, 1800);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success("Caixa de entrada atualizada");
    }, 1200);
  };

  const toggleStar = (id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))
    );
  };

  const markRead = (id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, read: true } : e))
    );
  };

  const deleteEmail = (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    toast.success("E-mail removido");
  };

  const filtered = emails.filter((e) => {
    if (filter === "unread") return !e.read;
    if (filter === "starred") return e.starred;
    return true;
  });

  const unreadCount = emails.filter((e) => !e.read).length;

  return (
    <AnimatePresence>
      {open && (
        <>
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
            className="fixed left-12 top-1/2 z-[60] -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] blur-xl" />

            <div
              className="relative flex max-h-[88vh] w-96 flex-col overflow-hidden rounded-2xl border border-foreground/[0.12] shadow-2xl shadow-black/40"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Header — fixed */}
              <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-foreground/40" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40">
                    E-mail
                  </span>
                  {connected && unreadCount > 0 && (
                    <span className="rounded-full bg-neon-cyan/15 px-1.5 py-px text-[9px] font-bold tabular-nums text-neon-cyan">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {connected && (
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={syncing}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/25 transition-all hover:border-foreground/[0.08] hover:bg-foreground/[0.06] hover:text-neon-cyan/70 disabled:opacity-30"
                      title="Sincronizar"
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5",
                          syncing && "animate-spin"
                        )}
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/25 transition-all hover:border-red-500/15 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {!connected ? (
                  /* ── Connect Screen ── */
                  <div className="flex flex-col items-center px-6 py-10 text-center">
                    <div className="relative mb-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03]">
                        <Mail className="h-7 w-7 text-foreground/20" />
                      </div>
                      {syncing && (
                        <motion.div
                          className="absolute -inset-1 rounded-2xl border-2 border-neon-cyan/40"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-foreground/70">
                      Sincronizar E-mail
                    </h3>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/30">
                      Conecte sua conta de e-mail para receber
                      notificacoes e gerenciar mensagens diretamente
                      do ORIGEM.
                    </p>

                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={syncing}
                      className="mt-6 flex items-center gap-2 rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 px-5 py-2.5 text-[12px] font-semibold text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/15 hover:shadow-[0_0_20px_rgba(0,210,210,0.15)] disabled:opacity-50"
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Conectar E-mail
                        </>
                      )}
                    </button>

                    <div className="mt-6 flex items-center gap-3">
                      {["Gmail", "Outlook", "IMAP"].map((p) => (
                        <span
                          key={p}
                          className="rounded-md border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1 text-[9px] text-foreground/25"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ── Connected: Email List ── */
                  <>
                    <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                    {/* Filter tabs */}
                    <div className="flex gap-1 px-3 py-2">
                      {(
                        [
                          { id: "all", label: "Todos", icon: Inbox },
                          { id: "unread", label: "Nao lidos", icon: AlertCircle },
                          { id: "starred", label: "Favoritos", icon: Star },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFilter(tab.id)}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] transition-all",
                            filter === tab.id
                              ? "bg-neon-cyan/10 text-neon-cyan"
                              : "text-foreground/30 hover:bg-foreground/[0.04] hover:text-foreground/50"
                          )}
                        >
                          <tab.icon className="h-3 w-3" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                    {/* Email detail view */}
                    <AnimatePresence mode="wait">
                      {selectedEmail ? (
                        <motion.div
                          key="detail"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="px-3 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedEmail(null)}
                            className="mb-2 flex items-center gap-1 text-[10px] text-foreground/30 transition-colors hover:text-foreground/50"
                          >
                            <Inbox className="h-3 w-3" />
                            Voltar para caixa de entrada
                          </button>

                          <div className="rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[12px] font-semibold text-foreground/80">
                                  {selectedEmail.subject}
                                </p>
                                <p className="mt-1 text-[10px] text-foreground/40">
                                  {selectedEmail.from}{" "}
                                  <span className="text-foreground/20">
                                    &lt;{selectedEmail.fromEmail}&gt;
                                  </span>
                                </p>
                              </div>
                              <span className="shrink-0 text-[9px] tabular-nums text-foreground/20">
                                {selectedEmail.time}
                              </span>
                            </div>

                            {selectedEmail.label && (
                              <span
                                className={cn(
                                  "mt-2 inline-block rounded-md px-1.5 py-0.5 text-[8px] font-semibold uppercase",
                                  LABEL_STYLES[selectedEmail.label].bg,
                                  LABEL_STYLES[selectedEmail.label].text
                                )}
                              >
                                {LABEL_STYLES[selectedEmail.label].label}
                              </span>
                            )}

                            <div className="mt-3 border-t border-foreground/[0.06] pt-3">
                              <p className="text-[11px] leading-relaxed text-foreground/50">
                                {selectedEmail.preview}
                              </p>
                              <p className="mt-2 text-[11px] leading-relaxed text-foreground/50">
                                Este e um preview simulado do corpo do e-mail.
                                A integracao completa permitira visualizar o
                                conteudo completo, responder e encaminhar
                                diretamente do ORIGEM.
                              </p>
                            </div>

                            <div className="mt-3 flex gap-1.5">
                              <button
                                type="button"
                                className="flex items-center gap-1 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-2.5 py-1.5 text-[10px] text-neon-cyan transition-all hover:bg-neon-cyan/10"
                              >
                                <Send className="h-3 w-3" />
                                Responder
                              </button>
                              <button
                                type="button"
                                className="flex items-center gap-1 rounded-lg border border-foreground/[0.08] px-2.5 py-1.5 text-[10px] text-foreground/40 transition-all hover:bg-foreground/[0.04]"
                              >
                                <Archive className="h-3 w-3" />
                                Arquivar
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteEmail(selectedEmail.id)}
                                className="flex items-center gap-1 rounded-lg border border-foreground/[0.08] px-2.5 py-1.5 text-[10px] text-foreground/40 transition-all hover:border-red-500/15 hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="list"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {/* Email list */}
                          <div className="px-3 py-1">
                            {filtered.length === 0 ? (
                              <div className="flex flex-col items-center py-8 text-center">
                                <Check className="mb-2 h-5 w-5 text-foreground/8" />
                                <p className="text-[11px] text-foreground/25">
                                  Nenhum e-mail{" "}
                                  {filter === "unread"
                                    ? "nao lido"
                                    : filter === "starred"
                                      ? "favorito"
                                      : ""}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                {filtered.map((email) => (
                                  <button
                                    key={email.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedEmail(email);
                                      markRead(email.id);
                                    }}
                                    className={cn(
                                      "group flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-all",
                                      !email.read
                                        ? "bg-foreground/[0.03]"
                                        : "hover:bg-foreground/[0.03]"
                                    )}
                                  >
                                    {/* Unread indicator */}
                                    <div className="mt-1.5 shrink-0">
                                      {!email.read ? (
                                        <div className="h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-[0_0_6px_rgba(0,210,210,0.5)]" />
                                      ) : (
                                        <div className="h-1.5 w-1.5 rounded-full bg-foreground/[0.06]" />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span
                                          className={cn(
                                            "truncate text-[11px]",
                                            !email.read
                                              ? "font-semibold text-foreground/80"
                                              : "text-foreground/50"
                                          )}
                                        >
                                          {email.from}
                                        </span>
                                        <div className="flex shrink-0 items-center gap-1">
                                          {email.hasAttachment && (
                                            <Paperclip className="h-2.5 w-2.5 text-foreground/15" />
                                          )}
                                          <span className="text-[9px] tabular-nums text-foreground/20">
                                            {email.time}
                                          </span>
                                        </div>
                                      </div>
                                      <p
                                        className={cn(
                                          "truncate text-[10px]",
                                          !email.read
                                            ? "text-foreground/60"
                                            : "text-foreground/35"
                                        )}
                                      >
                                        {email.subject}
                                      </p>
                                      <p className="mt-0.5 truncate text-[9px] text-foreground/20">
                                        {email.preview}
                                      </p>
                                    </div>

                                    {/* Star */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStar(email.id);
                                      }}
                                      className={cn(
                                        "mt-0.5 shrink-0 transition-colors",
                                        email.starred
                                          ? "text-neon-orange"
                                          : "text-foreground/0 group-hover:text-foreground/15 hover:!text-neon-orange/70"
                                      )}
                                    >
                                      <Star
                                        className="h-3 w-3"
                                        fill={email.starred ? "currentColor" : "none"}
                                      />
                                    </button>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Status bar */}
                    <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-neon-green shadow-[0_0_4px_rgba(0,200,0,0.4)]" />
                        <span className="text-[9px] text-foreground/25">
                          Sincronizado
                        </span>
                      </div>
                      <span className="text-[9px] tabular-nums text-foreground/15">
                        {emails.length} mensagens
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
