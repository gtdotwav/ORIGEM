"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  StickyNote,
  Bot,
  Layers,
  Trash2,
  Check,
  Clock,
  Blocks,
  Send,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import {
  useCalendarStore,
  toDateKey,
  parseSchedulePrompt,
  type CalendarEvent,
} from "@/stores/calendar-store";
import { AutomationSection } from "@/components/calendar/automation-section";
import { useAutomationStore } from "@/stores/automation-store";

interface CalendarPanelProps {
  open: boolean;
  onClose: () => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const AGENTS = [
  { id: "planner", name: "Planner", role: "Arquiteto de plano" },
  { id: "builder", name: "Builder", role: "Executor tecnico" },
  { id: "researcher", name: "Researcher", role: "Mapeador de fontes" },
  { id: "analyst", name: "Analyst", role: "Interpretador de dados" },
  { id: "designer", name: "Designer", role: "Modelador de UX" },
  { id: "critic", name: "Critic", role: "Validador de qualidade" },
];

const CONTEXTS = [
  { id: "deploy", label: "Deploy", desc: "Agendar deploy de producao" },
  { id: "review", label: "Code Review", desc: "Revisao de codigo" },
  { id: "backup", label: "Backup", desc: "Backup de dados" },
  { id: "meeting", label: "Reuniao", desc: "Reuniao de alinhamento" },
  { id: "sprint", label: "Sprint", desc: "Planejamento de sprint" },
  { id: "monitor", label: "Monitoramento", desc: "Check de infraestrutura" },
];

const COLOR_CLASSES = {
  cyan: { bg: "bg-neon-cyan/10", border: "border-neon-cyan/20", text: "text-neon-cyan", dot: "bg-neon-cyan" },
  purple: { bg: "bg-neon-purple/10", border: "border-neon-purple/20", text: "text-neon-purple", dot: "bg-neon-purple" },
  orange: { bg: "bg-neon-orange/10", border: "border-neon-orange/20", text: "text-neon-orange", dot: "bg-neon-orange" },
  green: { bg: "bg-neon-green/10", border: "border-neon-green/20", text: "text-neon-green", dot: "bg-neon-green" },
  pink: { bg: "bg-neon-pink/10", border: "border-neon-pink/20", text: "text-neon-pink", dot: "bg-neon-pink" },
};

type AddMode = null | "note" | "agent" | "context" | "prompt";

export function CalendarPanel({ open, onClose }: CalendarPanelProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDates, setSelectedDates] = useState<Date[]>([today]);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteTime, setNoteTime] = useState("");
  const [agentTime, setAgentTime] = useState("");
  const [ctxTime, setCtxTime] = useState("");
  const [promptText, setPromptText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<ReturnType<typeof parseSchedulePrompt>>([]);

  // Drag-select state
  const [isDragging, setIsDragging] = useState(false);
  const dragAnchorRef = useRef<Date | null>(null);

  const { events, addEvent, removeEvent } = useCalendarStore();

  // Derived: primary selected date (first in selection)
  const selectedDate = selectedDates[0] ?? null;
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : "";

  // All selected date keys
  const selectedDateKeys = useMemo(() => selectedDates.map(toDateKey), [selectedDates]);

  // Aggregate events across all selected dates
  const dateEvents = useMemo(
    () => selectedDateKeys.flatMap((dk) => events[dk] ?? []),
    [selectedDateKeys, events]
  );

  // Sort events by date then time for timeline
  const sortedEvents = useMemo(
    () => [...dateEvents].sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    }),
    [dateEvents]
  );

  const eventDateKeys = useMemo(() => new Set(Object.keys(events).filter((k) => (events[k]?.length ?? 0) > 0)), [events]);

  // Date range helper
  const getDateRange = useCallback((a: Date, b: Date): Date[] => {
    const start = a < b ? a : b;
    const end = a < b ? b : a;
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, []);

  // Drag handlers
  const handleDayMouseDown = useCallback((date: Date) => {
    setIsDragging(true);
    dragAnchorRef.current = date;
    setSelectedDates([date]);
    setAddMode(null);
  }, []);

  const handleDayMouseEnter = useCallback((date: Date) => {
    if (!isDragging || !dragAnchorRef.current) return;
    setSelectedDates(getDateRange(dragAnchorRef.current, date));
  }, [isDragging, getDateRange]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  // Listen for mouseup on document to handle releasing outside the grid
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  // Check if a date is in the selection
  const isSelected = useCallback((date: Date) =>
    selectedDates.some((d) =>
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    ), [selectedDates]);

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const cells: Array<{ day: number; inMonth: boolean; date: Date }> = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({ day: d, inMonth: false, date: new Date(currentYear, currentMonth - 1, d) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, inMonth: true, date: new Date(currentYear, currentMonth, d) });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, inMonth: false, date: new Date(currentYear, currentMonth + 1, d) });
    }
    return cells;
  }, [currentMonth, currentYear]);

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };
  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setSelectedDates([today]); };

  const isToday = (date: Date) => date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

  const handleAddNote = () => {
    if (!noteTitle.trim() || selectedDateKeys.length === 0) return;
    for (const dk of selectedDateKeys) {
      addEvent({ dateKey: dk, type: "note", title: noteTitle.trim(), description: noteDesc.trim(), time: noteTime, duration: 60, color: "cyan" });
    }
    setNoteTitle(""); setNoteDesc(""); setNoteTime(""); setAddMode(null);
  };

  const handleAddAgent = (agent: typeof AGENTS[0]) => {
    if (selectedDateKeys.length === 0) return;
    for (const dk of selectedDateKeys) {
      addEvent({ dateKey: dk, type: "agent", title: agent.name, description: agent.role, agent: agent.id, time: agentTime, duration: 60, color: "purple" });
    }
    setAgentTime(""); setAddMode(null);
  };

  const handleAddContext = (ctx: typeof CONTEXTS[0]) => {
    if (selectedDateKeys.length === 0) return;
    for (const dk of selectedDateKeys) {
      addEvent({ dateKey: dk, type: "context", title: ctx.label, description: ctx.desc, context: ctx.id, time: ctxTime, duration: 60, color: "orange" });
    }
    setCtxTime(""); setAddMode(null);
  };

  // Prompt interpretation
  const handlePromptChange = (text: string) => {
    setPromptText(text);
    if (text.trim().length > 3) {
      setParsedPreview(parseSchedulePrompt(text));
    } else {
      setParsedPreview([]);
    }
  };

  const handlePromptSubmit = () => {
    if (selectedDateKeys.length === 0 || parsedPreview.length === 0) return;
    for (const dk of selectedDateKeys) {
      for (const item of parsedPreview) {
        addEvent({
          dateKey: dk,
          type: item.type,
          title: item.title,
          description: "",
          time: item.time,
          duration: item.duration,
          agent: item.agent,
          context: item.context,
          color: item.color,
        });
      }
    }
    setPromptText(""); setParsedPreview([]); setAddMode(null);
  };

  const formatDuration = (min: number) => {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-[55]" onClick={onClose} />

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
                background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Header — always visible, never scrolls */}
              <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-foreground/40" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40">Calendario</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link href="/dashboard/calendar" onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/25 transition-all hover:border-foreground/[0.08] hover:bg-foreground/[0.06] hover:text-neon-cyan/70" title="Calendario completo">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Link>
                  <button type="button" onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/25 transition-all hover:border-red-500/15 hover:bg-red-500/10 hover:text-red-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">

              {/* Month nav */}
              <div className="flex items-center justify-between px-4 pb-3 pt-1">
                <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.08] hover:text-foreground/60"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={goToday} className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">{MONTHS[currentMonth]} {currentYear}</button>
                <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.08] hover:text-foreground/60"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>

              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* Weekday headers */}
              <div className="grid grid-cols-7 px-3 pt-3">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="pb-2 text-center text-[10px] font-medium uppercase tracking-wider text-foreground/25">{d}</div>
                ))}
              </div>

              {/* Day grid — drag to select range */}
              <div
                className="grid grid-cols-7 gap-0.5 px-3 pb-3 select-none"
                onMouseLeave={() => { if (isDragging) setIsDragging(false); }}
              >
                {days.map((cell, i) => {
                  const _isToday = isToday(cell.date);
                  const _isSelected = isSelected(cell.date);
                  const hasEvents = eventDateKeys.has(toDateKey(cell.date));
                  return (
                    <div
                      key={toDateKey(cell.date)}
                      role="button"
                      tabIndex={0}
                      onMouseDown={(e) => { e.preventDefault(); handleDayMouseDown(cell.date); }}
                      onMouseEnter={() => handleDayMouseEnter(cell.date)}
                      className="group relative flex h-8 w-full cursor-pointer items-center justify-center rounded-lg transition-all"
                    >
                      {_isSelected && selectedDates.length === 1 && (
                        <motion.div layoutId="calendar-selected" className="absolute inset-0.5 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(0,210,210,0.25) 0%, rgba(0,210,210,0.10) 100%)", boxShadow: "0 0 12px rgba(0,210,210,0.15), inset 0 1px 0 rgba(255,255,255,0.1)" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} />
                      )}
                      {_isSelected && selectedDates.length > 1 && (
                        <div className="absolute inset-0.5 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(0,210,210,0.20) 0%, rgba(0,210,210,0.08) 100%)" }} />
                      )}
                      {_isToday && !_isSelected && <div className="absolute inset-0.5 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }} />}
                      {!_isSelected && <div className="absolute inset-0.5 rounded-lg opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)" }} />}
                      <span className={`relative z-10 text-xs tabular-nums ${_isSelected ? "font-semibold text-neon-cyan" : _isToday ? "font-semibold text-foreground/90" : cell.inMonth ? "text-foreground/60 group-hover:text-foreground/80" : "text-foreground/15"}`}>{cell.day}</span>
                      {_isToday && <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-neon-cyan shadow-[0_0_4px_rgba(0,210,210,0.5)]" />}
                      {hasEvents && !_isToday && <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-neon-orange shadow-[0_0_4px_rgba(255,160,0,0.4)]" />}
                    </div>
                  );
                })}
              </div>

              {/* ── Date Detail Section ── */}
              {selectedDates.length > 0 && (
                <>
                  <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                  <div className="px-4 py-3">
                    {selectedDates.length === 1 && selectedDate ? (
                      <p className="text-xs font-medium text-foreground/50">
                        {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-neon-cyan/10 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-neon-cyan">
                          {selectedDates.length} dias
                        </span>
                        <p className="text-[10px] text-foreground/40">
                          {selectedDates[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                          {" — "}
                          {selectedDates[selectedDates.length - 1].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    )}

                    {/* ── Timeline View ── */}
                    {sortedEvents.length > 0 && (
                      <div className="mt-3 space-y-0">
                        {sortedEvents.map((ev, idx) => {
                          const c = COLOR_CLASSES[ev.color];
                          const isLast = idx === sortedEvents.length - 1;
                          return (
                            <div key={ev.id} className="group flex gap-2.5">
                              {/* Timeline rail */}
                              <div className="flex w-4 flex-col items-center">
                                <div className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${c.border} ${c.bg}`} />
                                {!isLast && <div className="w-px flex-1 bg-foreground/[0.06]" />}
                              </div>

                              {/* Event card */}
                              <div className={`mb-2 flex-1 rounded-lg border ${c.border} ${c.bg} px-2.5 py-2`}>
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      {selectedDates.length > 1 && (
                                        <span className="shrink-0 rounded bg-foreground/[0.06] px-1 py-0.5 text-[8px] font-medium tabular-nums text-foreground/35">
                                          {ev.dateKey.slice(5)}
                                        </span>
                                      )}
                                      {ev.time && (
                                        <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-foreground/60">{ev.time}</span>
                                      )}
                                      {!ev.time && (
                                        <span className="shrink-0 text-[9px] text-foreground/25">dia todo</span>
                                      )}
                                      <span className="text-[11px] font-medium text-foreground/80">{ev.title}</span>
                                    </div>
                                    {ev.description && <p className="mt-0.5 text-[10px] text-foreground/30">{ev.description}</p>}
                                    <div className="mt-0.5 flex items-center gap-2">
                                      <span className={`text-[9px] uppercase tracking-wider ${c.text}`}>
                                        {ev.type === "note" ? "Nota" : ev.type === "agent" ? "Agente" : "Servico"}
                                      </span>
                                      {ev.time && ev.duration > 0 && (
                                        <span className="text-[9px] text-foreground/20">{formatDuration(ev.duration)}</span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeEvent(ev.dateKey, ev.id)}
                                    className="shrink-0 text-foreground/0 transition-colors group-hover:text-foreground/30 hover:!text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {sortedEvents.length === 0 && addMode === null && (
                      <p className="mt-1 text-[10px] text-foreground/20">Nenhum evento agendado</p>
                    )}

                    {/* ── Automations for selected events ── */}
                    {sortedEvents.length > 0 && addMode === null && (
                      <div className="mt-3">
                        <AutomationSection
                          eventId={sortedEvents[0]?.id}
                          compact
                        />
                      </div>
                    )}

                    {/* ── Action Buttons ── */}
                    {addMode === null && (
                      <div className="mt-3 space-y-2">
                        {/* Prompt input — always visible */}
                        <button
                          type="button"
                          onClick={() => setAddMode("prompt")}
                          className="flex w-full items-center gap-1.5 rounded-lg border border-neon-green/15 bg-neon-green/[0.03] px-2.5 py-2 text-left text-[10px] text-foreground/35 transition-all hover:border-neon-green/30 hover:text-neon-green/70"
                        >
                          <Blocks className="h-3 w-3 shrink-0 text-neon-green/50" />
                          <span>Descreva sua agenda com horarios...</span>
                        </button>

                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => setAddMode("note")} className="flex items-center gap-1 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1.5 text-[10px] text-foreground/40 transition-all hover:border-neon-cyan/20 hover:bg-neon-cyan/5 hover:text-neon-cyan">
                            <StickyNote className="h-3 w-3" /> Nota
                          </button>
                          <button type="button" onClick={() => setAddMode("agent")} className="flex items-center gap-1 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1.5 text-[10px] text-foreground/40 transition-all hover:border-neon-purple/20 hover:bg-neon-purple/5 hover:text-neon-purple">
                            <Bot className="h-3 w-3" /> Agente
                          </button>
                          <button type="button" onClick={() => setAddMode("context")} className="flex items-center gap-1 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1.5 text-[10px] text-foreground/40 transition-all hover:border-neon-orange/20 hover:bg-neon-orange/5 hover:text-neon-orange">
                            <Layers className="h-3 w-3" /> Contexto
                          </button>
                        </div>
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      {/* ── Prompt Interpreter ── */}
                      {addMode === "prompt" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mt-3 space-y-2 rounded-lg border border-neon-green/15 bg-neon-green/[0.03] p-2.5">
                            <div className="flex items-center gap-1.5">
                              <Blocks className="h-3 w-3 text-neon-green/60" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-green/60">Prompt de Horarios</span>
                            </div>
                            <textarea
                              value={promptText}
                              onChange={(e) => handlePromptChange(e.target.value)}
                              placeholder={"Ex: standup 9h, code review 10:30,\nplanning 14h, deploy 18h"}
                              rows={3}
                              className="w-full resize-none rounded-md border border-foreground/[0.06] bg-black/20 px-2 py-1.5 text-[11px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-green/30"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Escape") { setAddMode(null); setPromptText(""); setParsedPreview([]); } }}
                            />

                            {/* Live preview */}
                            {parsedPreview.length > 0 && (
                              <div className="space-y-1 rounded-md border border-foreground/[0.04] bg-black/15 p-2">
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/25">Interpretado ({parsedPreview.length})</p>
                                {parsedPreview.map((item, idx) => {
                                  const c = COLOR_CLASSES[item.color];
                                  return (
                                    <div key={idx} className="flex items-center gap-2">
                                      <span className="w-10 shrink-0 font-mono text-[10px] font-semibold tabular-nums text-foreground/50">{item.time}</span>
                                      <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
                                      <span className="text-[10px] text-foreground/60">{item.title}</span>
                                      <span className={`ml-auto text-[8px] uppercase ${c.text}`}>
                                        {item.type === "note" ? "nota" : item.type === "agent" ? "agente" : "servico"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => { setAddMode(null); setPromptText(""); setParsedPreview([]); }} className="rounded-md px-2 py-1 text-[10px] text-foreground/30 hover:text-foreground/50">Cancelar</button>
                              <button
                                type="button"
                                onClick={handlePromptSubmit}
                                disabled={parsedPreview.length === 0}
                                className="flex items-center gap-1 rounded-md border border-neon-green/30 bg-neon-green/10 px-2 py-1 text-[10px] font-medium text-neon-green transition-all hover:bg-neon-green/20 disabled:opacity-30"
                              >
                                <Send className="h-2.5 w-2.5" />
                                Agendar {parsedPreview.length > 0 ? `(${parsedPreview.length})` : ""}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Add Note Form ── */}
                      {addMode === "note" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mt-3 space-y-2 rounded-lg border border-neon-cyan/15 bg-neon-cyan/[0.03] p-2.5">
                            <div className="flex items-center gap-1.5">
                              <StickyNote className="h-3 w-3 text-neon-cyan/60" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-cyan/60">Nova Nota</span>
                            </div>
                            <div className="flex gap-1.5">
                              <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Titulo..." className="flex-1 rounded-md border border-foreground/[0.06] bg-black/20 px-2 py-1.5 text-[11px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-cyan/30" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); if (e.key === "Escape") setAddMode(null); }} />
                              <div className="relative">
                                <Clock className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/20" />
                                <input type="time" value={noteTime} onChange={(e) => setNoteTime(e.target.value)} className="w-20 rounded-md border border-foreground/[0.06] bg-black/20 py-1.5 pl-6 pr-1 text-[11px] tabular-nums text-foreground/60 outline-none focus:border-neon-cyan/30 [&::-webkit-calendar-picker-indicator]:invert" />
                              </div>
                            </div>
                            <textarea value={noteDesc} onChange={(e) => setNoteDesc(e.target.value)} placeholder="Descricao (opcional)..." rows={2} className="w-full resize-none rounded-md border border-foreground/[0.06] bg-black/20 px-2 py-1.5 text-[11px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-cyan/30" />
                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => { setAddMode(null); setNoteTitle(""); setNoteDesc(""); setNoteTime(""); }} className="rounded-md px-2 py-1 text-[10px] text-foreground/30 hover:text-foreground/50">Cancelar</button>
                              <button type="button" onClick={handleAddNote} disabled={!noteTitle.trim()} className="flex items-center gap-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-1 text-[10px] font-medium text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-30"><Check className="h-2.5 w-2.5" /> Salvar</button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Add Agent Picker ── */}
                      {addMode === "agent" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mt-3 space-y-1.5 rounded-lg border border-neon-purple/15 bg-neon-purple/[0.03] p-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5"><Bot className="h-3 w-3 text-neon-purple/60" /><span className="text-[10px] font-semibold uppercase tracking-wider text-neon-purple/60">Agendar Agente</span></div>
                              <button type="button" onClick={() => setAddMode(null)} className="text-[10px] text-foreground/30 hover:text-foreground/50">Cancelar</button>
                            </div>
                            {/* Time picker for agent */}
                            <div className="relative">
                              <Clock className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/20" />
                              <input type="time" value={agentTime} onChange={(e) => setAgentTime(e.target.value)} placeholder="Horario" className="w-full rounded-md border border-foreground/[0.06] bg-black/20 py-1.5 pl-7 pr-2 text-[11px] tabular-nums text-foreground/60 outline-none focus:border-neon-purple/30 [&::-webkit-calendar-picker-indicator]:invert" />
                            </div>
                            <div className="space-y-1">
                              {AGENTS.map((agent) => (
                                <button key={agent.id} type="button" onClick={() => handleAddAgent(agent)} className="flex w-full items-center gap-2 rounded-md border border-foreground/[0.04] bg-black/15 px-2 py-1.5 text-left transition-all hover:border-neon-purple/20 hover:bg-neon-purple/5">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neon-purple/10"><Bot className="h-2.5 w-2.5 text-neon-purple" /></div>
                                  <div className="min-w-0 flex-1"><p className="text-[11px] font-medium text-foreground/70">{agent.name}</p><p className="text-[9px] text-foreground/25">{agent.role}</p></div>
                                  <Plus className="h-3 w-3 text-foreground/15" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Add Context/Service Picker ── */}
                      {addMode === "context" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mt-3 space-y-1.5 rounded-lg border border-neon-orange/15 bg-neon-orange/[0.03] p-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5"><Layers className="h-3 w-3 text-neon-orange/60" /><span className="text-[10px] font-semibold uppercase tracking-wider text-neon-orange/60">Agendar Servico</span></div>
                              <button type="button" onClick={() => setAddMode(null)} className="text-[10px] text-foreground/30 hover:text-foreground/50">Cancelar</button>
                            </div>
                            {/* Time picker for context */}
                            <div className="relative">
                              <Clock className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/20" />
                              <input type="time" value={ctxTime} onChange={(e) => setCtxTime(e.target.value)} className="w-full rounded-md border border-foreground/[0.06] bg-black/20 py-1.5 pl-7 pr-2 text-[11px] tabular-nums text-foreground/60 outline-none focus:border-neon-orange/30 [&::-webkit-calendar-picker-indicator]:invert" />
                            </div>
                            <div className="space-y-1">
                              {CONTEXTS.map((ctx) => (
                                <button key={ctx.id} type="button" onClick={() => handleAddContext(ctx)} className="flex w-full items-center gap-2 rounded-md border border-foreground/[0.04] bg-black/15 px-2 py-1.5 text-left transition-all hover:border-neon-orange/20 hover:bg-neon-orange/5">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neon-orange/10"><Layers className="h-2.5 w-2.5 text-neon-orange" /></div>
                                  <div className="min-w-0 flex-1"><p className="text-[11px] font-medium text-foreground/70">{ctx.label}</p><p className="text-[9px] text-foreground/25">{ctx.desc}</p></div>
                                  <Plus className="h-3 w-3 text-foreground/15" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              </div>{/* end scrollable content */}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
