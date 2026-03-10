"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  StickyNote,
  Bot,
  Layers,
  Clock,
  CalendarDays,
  Tag,
  AlignLeft,
  Save,
  Trash2,
  Palette,
  Timer,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCalendarStore,
  type CalendarEvent,
  type CalendarEventType,
} from "@/stores/calendar-store";
import { useAutomationStore } from "@/stores/automation-store";
import { AutomationSection } from "./automation-section";

/* ── Constants ── */

const AGENTS = [
  { id: "planner", name: "Planner", role: "Arquiteto de plano" },
  { id: "builder", name: "Builder", role: "Executor tecnico" },
  { id: "researcher", name: "Researcher", role: "Mapeador de fontes" },
  { id: "analyst", name: "Analyst", role: "Interpretador de dados" },
  { id: "designer", name: "Designer", role: "Modelador de UX" },
  { id: "critic", name: "Critic", role: "Validador de qualidade" },
];

const CONTEXTS = [
  { id: "deploy", label: "Deploy" },
  { id: "review", label: "Code Review" },
  { id: "backup", label: "Backup" },
  { id: "meeting", label: "Reuniao" },
  { id: "sprint", label: "Sprint" },
  { id: "monitor", label: "Monitoramento" },
];

const COLORS: { value: CalendarEvent["color"]; label: string; dot: string }[] = [
  { value: "cyan", label: "Cyan", dot: "bg-neon-cyan" },
  { value: "purple", label: "Purple", dot: "bg-neon-purple" },
  { value: "green", label: "Green", dot: "bg-neon-green" },
  { value: "orange", label: "Orange", dot: "bg-neon-orange" },
  { value: "pink", label: "Pink", dot: "bg-neon-pink" },
];

const TYPE_META: Record<CalendarEventType, { icon: typeof StickyNote; label: string; color: string }> = {
  note: { icon: StickyNote, label: "Nota", color: "text-neon-cyan" },
  agent: { icon: Bot, label: "Agente", color: "text-neon-purple" },
  context: { icon: Layers, label: "Servico", color: "text-neon-orange" },
};

/* ── Props ── */

interface KanbanCardModalProps {
  event: (CalendarEvent & { _dateKey: string }) | null;
  onClose: () => void;
}

/* ── Component ── */

export function KanbanCardModal({ event, onClose }: KanbanCardModalProps) {
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const removeEvent = useCalendarStore((s) => s.removeEvent);
  const automationJobs = useAutomationStore((s) => s.jobs);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState<CalendarEvent["color"]>("cyan");
  const [agent, setAgent] = useState("");
  const [context, setContext] = useState("");
  const [dirty, setDirty] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Sync from event
  useEffect(() => {
    if (!event) return;
    queueMicrotask(() => {
      setTitle(event.title);
      setDescription(event.description);
      setTime(event.time);
      setDuration(event.duration);
      setColor(event.color);
      setAgent(event.agent ?? "");
      setContext(event.context ?? "");
      setDirty(false);
    });
    setTimeout(() => titleRef.current?.focus(), 80);
  }, [event]);

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    if (!event) return;
    updateEvent(event._dateKey, event.id, {
      title: title.trim() || "Sem titulo",
      description,
      time,
      duration,
      color,
      ...(event.type === "agent" ? { agent } : {}),
      ...(event.type === "context" ? { context } : {}),
    });
    setDirty(false);
    onClose();
  };

  const handleDelete = () => {
    if (!event) return;
    removeEvent(event._dateKey, event.id);
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    if (!event) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [event, onClose]);

  if (!event) return null;

  const typeMeta = TYPE_META[event.type];
  const TypeIcon = typeMeta.icon;
  const eventDate = new Date(event._dateKey + "T12:00:00");
  const hasAutomations = automationJobs.some((j) => j.calendarEventId === event.id);

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="fixed left-1/2 top-1/2 z-[61] w-[480px] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-foreground/[0.10] shadow-2xl shadow-black/50"
            style={{
              background: "linear-gradient(180deg, rgba(18,18,18,0.98) 0%, rgba(14,14,14,0.99) 100%)",
              backdropFilter: "blur(40px) saturate(1.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-foreground/[0.06] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", `bg-${event.color === "cyan" ? "neon-cyan" : event.color === "purple" ? "neon-purple" : event.color === "green" ? "neon-green" : event.color === "orange" ? "neon-orange" : "neon-pink"}/10`)}>
                  <TypeIcon className={cn("h-3.5 w-3.5", typeMeta.color)} />
                </div>
                <span className={cn("text-[11px] font-bold uppercase tracking-wider", typeMeta.color)}>
                  {typeMeta.label}
                </span>
                {hasAutomations && (
                  <span className="flex items-center gap-1 rounded-full bg-neon-green/10 px-1.5 py-0.5 text-[8px] font-bold text-neon-green">
                    <Zap className="h-2 w-2" /> Automacao
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-foreground/20 transition-all hover:border-red-500/15 hover:bg-red-500/10 hover:text-red-400"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-foreground/20 transition-all hover:border-foreground/[0.08] hover:bg-foreground/[0.06] hover:text-foreground/50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-5 px-5 py-5">
              {/* Title */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
                  <Tag className="h-3 w-3" /> Titulo
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                  placeholder="Nome do evento..."
                  className="w-full rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2.5 text-[14px] font-semibold text-foreground/85 placeholder:text-foreground/20 outline-none transition-colors focus:border-neon-cyan/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
                  <AlignLeft className="h-3 w-3" /> Descricao
                </label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  placeholder="Adicione detalhes, contexto, instrucoes..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2.5 text-[13px] leading-relaxed text-foreground/70 placeholder:text-foreground/20 outline-none transition-colors focus:border-neon-cyan/30"
                />
              </div>

              {/* Time + Duration + Date row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
                    <Clock className="h-3 w-3" /> Horario
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => { setTime(e.target.value); markDirty(); }}
                    className="w-full rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-[12px] tabular-nums text-foreground/70 outline-none transition-colors focus:border-neon-cyan/30 [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
                    <Timer className="h-3 w-3" /> Duracao
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      step={5}
                      value={duration}
                      onChange={(e) => { setDuration(Number(e.target.value) || 60); markDirty(); }}
                      className="w-full rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-[12px] tabular-nums text-foreground/70 outline-none transition-colors focus:border-neon-cyan/30"
                    />
                    <span className="shrink-0 text-[10px] text-foreground/25">min</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
                    <CalendarDays className="h-3 w-3" /> Data
                  </label>
                  <div className="rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-[12px] tabular-nums text-foreground/50">
                    {eventDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
                  <Palette className="h-3 w-3" /> Cor
                </label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => { setColor(c.value); markDirty(); }}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
                        color === c.value
                          ? "border-foreground/20 bg-foreground/[0.06] ring-1 ring-foreground/10"
                          : "border-foreground/[0.06] hover:border-foreground/[0.12]"
                      )}
                    >
                      <div className={cn("h-3 w-3 rounded-full", c.dot)} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent selector (for agent type) */}
              {event.type === "agent" && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
                    <User className="h-3 w-3" /> Agente
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AGENTS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setAgent(a.id); markDirty(); }}
                        className={cn(
                          "rounded-lg border px-2.5 py-2 text-left transition-all",
                          agent === a.id
                            ? "border-neon-purple/30 bg-neon-purple/10"
                            : "border-foreground/[0.06] hover:border-foreground/[0.12]"
                        )}
                      >
                        <p className={cn("text-[11px] font-semibold", agent === a.id ? "text-neon-purple" : "text-foreground/60")}>
                          {a.name}
                        </p>
                        <p className="text-[9px] text-foreground/25">{a.role}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Context selector (for context type) */}
              {event.type === "context" && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
                    <Layers className="h-3 w-3" /> Servico
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CONTEXTS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setContext(c.id); markDirty(); }}
                        className={cn(
                          "rounded-lg border px-2.5 py-2 text-left transition-all",
                          context === c.id
                            ? "border-neon-orange/30 bg-neon-orange/10"
                            : "border-foreground/[0.06] hover:border-foreground/[0.12]"
                        )}
                      >
                        <p className={cn("text-[11px] font-semibold", context === c.id ? "text-neon-orange" : "text-foreground/60")}>
                          {c.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Automations */}
              <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
                <AutomationSection eventId={event.id} compact />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-foreground/[0.06] px-5 py-3.5">
              <span className="text-[10px] text-foreground/20">
                Criado {new Date(event.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-foreground/35 transition-colors hover:text-foreground/55"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-[11px] font-semibold transition-all",
                    dirty
                      ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
                      : "border-foreground/[0.06] text-foreground/20 cursor-default"
                  )}
                >
                  <Save className="h-3 w-3" />
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
