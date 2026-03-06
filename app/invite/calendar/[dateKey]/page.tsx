"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  Calendar as CalendarIcon,
  ArrowRight,
  Clock,
  StickyNote,
  Bot,
  Layers,
  Check,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Particles } from "@/components/ui/particles";
import {
  useCalendarStore,
  type CalendarEvent,
  type CalendarEventType,
} from "@/stores/calendar-store";

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  cyan: { bg: "bg-neon-cyan/10", border: "border-neon-cyan/25", text: "text-neon-cyan", dot: "bg-neon-cyan" },
  purple: { bg: "bg-neon-purple/10", border: "border-neon-purple/25", text: "text-neon-purple", dot: "bg-neon-purple" },
  orange: { bg: "bg-neon-orange/10", border: "border-neon-orange/25", text: "text-neon-orange", dot: "bg-neon-orange" },
  green: { bg: "bg-neon-green/10", border: "border-neon-green/25", text: "text-neon-green", dot: "bg-neon-green" },
  pink: { bg: "bg-neon-pink/10", border: "border-neon-pink/25", text: "text-neon-pink", dot: "bg-neon-pink" },
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getTypeIcon(type: CalendarEventType) {
  if (type === "agent") return Bot;
  if (type === "context") return Layers;
  return StickyNote;
}

function getTypeLabel(type: CalendarEventType) {
  if (type === "agent") return "Agente";
  if (type === "context") return "Servico";
  return "Nota";
}

function formatDuration(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export default function CalendarInvitePage() {
  const { dateKey } = useParams<{ dateKey: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<"loading" | "preview" | "accepted">("loading");
  const events = useCalendarStore((s) => s.events[dateKey] ?? []);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      }),
    [events]
  );

  // Parse date from key
  const parsedDate = useMemo(() => {
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
    const d = new Date(dateKey + "T12:00:00");
    if (isNaN(d.getTime())) return null;
    return d;
  }, [dateKey]);

  useEffect(() => {
    const t = setTimeout(() => setPhase("preview"), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = () => {
    setPhase("accepted");
    setTimeout(() => {
      router.push("/dashboard/calendar");
    }, 1500);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.08_0_0)]">
      <Particles
        color="#40E0D0"
        quantity={60}
        ease={40}
        size={0.4}
        className="absolute inset-0 opacity-50"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.78_0.08_195_/_0.06)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          {/* Loading phase */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/logo.png"
                  alt="ORIGEM"
                  width={80}
                  height={80}
                  className="pointer-events-none"
                />
              </motion.div>
              <p className="text-sm text-white/30">Carregando convite...</p>
            </motion.div>
          )}

          {/* Preview phase */}
          {phase === "preview" && (
            <motion.div
              key="preview"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Logo small */}
              <Image
                src="/logo.png"
                alt="ORIGEM"
                width={48}
                height={48}
                className="pointer-events-none opacity-60"
              />

              {/* Header */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-neon-cyan/60" />
                  <h1 className="text-xl font-semibold text-white/90">Convite de Calendario</h1>
                </div>
                <p className="text-sm text-white/35">
                  Voce foi convidado para colaborar nesta agenda
                </p>
              </div>

              {/* Date card */}
              {parsedDate && (
                <motion.div
                  className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {/* Date header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-neon-cyan/20 bg-neon-cyan/10">
                      <span className="text-[10px] font-bold uppercase text-neon-cyan/70">
                        {MONTHS[parsedDate.getMonth()].slice(0, 3)}
                      </span>
                      <span className="text-lg font-bold leading-none text-neon-cyan">
                        {parsedDate.getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/80">
                        {parsedDate.toLocaleDateString("pt-BR", { weekday: "long" })}
                      </p>
                      <p className="text-xs text-white/30">
                        {parsedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Events list */}
                  {sortedEvents.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                        {sortedEvents.length} evento{sortedEvents.length !== 1 ? "s" : ""} agendado{sortedEvents.length !== 1 ? "s" : ""}
                      </p>
                      {sortedEvents.map((ev) => {
                        const c = COLOR_CLASSES[ev.color] ?? COLOR_CLASSES.cyan;
                        const TypeIcon = getTypeIcon(ev.type);
                        return (
                          <div
                            key={ev.id}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                              c.border, c.bg
                            )}
                          >
                            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", c.bg)}>
                              <TypeIcon className={cn("h-3.5 w-3.5", c.text)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-semibold text-white/80">{ev.title}</span>
                                {ev.time && (
                                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-white/50">
                                    {ev.time}
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className={cn("text-[9px] font-bold uppercase tracking-wider", c.text)}>
                                  {getTypeLabel(ev.type)}
                                </span>
                                {ev.time && ev.duration > 0 && (
                                  <span className="text-[9px] text-white/20">{formatDuration(ev.duration)}</span>
                                )}
                                {ev.agent && (
                                  <span className="rounded-full bg-neon-purple/10 px-1.5 py-0.5 text-[8px] font-medium text-neon-purple">
                                    {ev.agent}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] py-6 text-center">
                      <CalendarIcon className="mx-auto h-5 w-5 text-white/10" />
                      <p className="mt-2 text-xs text-white/25">Nenhum evento nesta data ainda</p>
                      <p className="mt-0.5 text-[10px] text-white/15">Aceite o convite para colaborar</p>
                    </div>
                  )}
                </motion.div>
              )}

              {!parsedDate && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-6 py-4">
                  <p className="text-sm text-red-400/80">Data do convite invalida</p>
                  <p className="mt-1 text-xs text-red-400/40">Verifique o link e tente novamente</p>
                </div>
              )}

              {/* CTA */}
              {parsedDate && (
                <motion.div
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <button
                    type="button"
                    onClick={handleAccept}
                    className="flex items-center gap-2.5 rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 px-6 py-3 text-sm font-semibold text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/20 hover:shadow-lg hover:shadow-neon-cyan/10"
                  >
                    <UserPlus className="h-4 w-4" />
                    Aceitar convite e abrir calendario
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] text-white/15">
                    Ao aceitar, voce tera acesso para visualizar e editar esta agenda
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Accepted phase */}
          {phase === "accepted" && (
            <motion.div
              key="accepted"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-green/25 bg-neon-green/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
              >
                <Check className="h-8 w-8 text-neon-green" />
              </motion.div>
              <h2 className="text-lg font-semibold text-white/90">Convite aceito!</h2>
              <p className="text-sm text-white/35">Redirecionando para o calendario...</p>
              <motion.div
                className="h-1 w-32 overflow-hidden rounded-full bg-white/[0.06]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="h-full rounded-full bg-neon-green"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-[10px] text-white/10">ORIGEM — Psychosemantic AI Engine</p>
      </div>
    </div>
  );
}
