"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import {
  useCalendarStore,
  toDateKey,
  type CalendarEventType,
} from "@/stores/calendar-store";

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

const EVENT_COLORS: Record<CalendarEventType, "cyan" | "purple" | "orange"> = {
  note: "cyan",
  agent: "purple",
  context: "orange",
};

const COLOR_CLASSES = {
  cyan: { bg: "bg-neon-cyan/10", border: "border-neon-cyan/20", text: "text-neon-cyan", dot: "bg-neon-cyan" },
  purple: { bg: "bg-neon-purple/10", border: "border-neon-purple/20", text: "text-neon-purple", dot: "bg-neon-purple" },
  orange: { bg: "bg-neon-orange/10", border: "border-neon-orange/20", text: "text-neon-orange", dot: "bg-neon-orange" },
  green: { bg: "bg-neon-green/10", border: "border-neon-green/20", text: "text-neon-green", dot: "bg-neon-green" },
  pink: { bg: "bg-neon-pink/10", border: "border-neon-pink/20", text: "text-neon-pink", dot: "bg-neon-pink" },
};

type AddMode = null | "note" | "agent" | "context";

export function CalendarPanel({ open, onClose }: CalendarPanelProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");

  const { events, addEvent, removeEvent } = useCalendarStore();

  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : "";
  const dateEvents = selectedDateKey ? (events[selectedDateKey] ?? []) : [];

  // Check which dates have events for dot indicators
  const eventDateKeys = useMemo(() => new Set(Object.keys(events).filter((k) => (events[k]?.length ?? 0) > 0)), [events]);

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

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };
  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  const isToday = (date: Date) =>
    date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  const isSelected = (date: Date) =>
    selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();

  const handleAddNote = () => {
    if (!noteTitle.trim() || !selectedDateKey) return;
    addEvent({ dateKey: selectedDateKey, type: "note", title: noteTitle.trim(), description: noteDesc.trim(), color: "cyan" });
    setNoteTitle(""); setNoteDesc(""); setAddMode(null);
  };

  const handleAddAgent = (agent: typeof AGENTS[0]) => {
    if (!selectedDateKey) return;
    addEvent({ dateKey: selectedDateKey, type: "agent", title: agent.name, description: agent.role, agent: agent.id, color: "purple" });
    setAddMode(null);
  };

  const handleAddContext = (ctx: typeof CONTEXTS[0]) => {
    if (!selectedDateKey) return;
    addEvent({ dateKey: selectedDateKey, type: "context", title: ctx.label, description: ctx.desc, context: ctx.id, color: "orange" });
    setAddMode(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: -16, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed left-12 top-1/2 z-50 -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] blur-xl" />

            <div
              className="relative max-h-[85vh] w-80 overflow-y-auto overflow-x-hidden rounded-2xl border border-white/[0.12] shadow-2xl shadow-black/40 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Calendario</span>
                </div>
                <button type="button" onClick={onClose} className="flex h-5 w-5 items-center justify-center rounded-md text-white/20 transition-colors hover:bg-white/[0.08] hover:text-white/50">
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Month nav */}
              <div className="flex items-center justify-between px-4 pb-3 pt-1">
                <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.08] hover:text-white/60">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={goToday} className="text-sm font-medium text-white/80 transition-colors hover:text-white">
                  {MONTHS[currentMonth]} {currentYear}
                </button>
                <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.08] hover:text-white/60">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* Weekday headers */}
              <div className="grid grid-cols-7 px-3 pt-3">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="pb-2 text-center text-[10px] font-medium uppercase tracking-wider text-white/25">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
                {days.map((cell, i) => {
                  const _isToday = isToday(cell.date);
                  const _isSelected = isSelected(cell.date);
                  const hasEvents = eventDateKeys.has(toDateKey(cell.date));

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedDate(cell.date); setAddMode(null); }}
                      className="group relative flex h-8 w-full items-center justify-center rounded-lg transition-all"
                    >
                      {_isSelected && (
                        <motion.div
                          layoutId="calendar-selected"
                          className="absolute inset-0.5 rounded-lg"
                          style={{
                            background: "linear-gradient(135deg, rgba(0,210,210,0.25) 0%, rgba(0,210,210,0.10) 100%)",
                            boxShadow: "0 0 12px rgba(0,210,210,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                          }}
                          transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        />
                      )}
                      {_isToday && !_isSelected && (
                        <div className="absolute inset-0.5 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }} />
                      )}
                      {!_isSelected && (
                        <div className="absolute inset-0.5 rounded-lg opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)" }} />
                      )}
                      <span className={`relative z-10 text-xs tabular-nums ${_isSelected ? "font-semibold text-neon-cyan" : _isToday ? "font-semibold text-white/90" : cell.inMonth ? "text-white/60 group-hover:text-white/80" : "text-white/15"}`}>
                        {cell.day}
                      </span>
                      {/* Today dot */}
                      {_isToday && (
                        <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-neon-cyan shadow-[0_0_4px_rgba(0,210,210,0.5)]" />
                      )}
                      {/* Event indicator */}
                      {hasEvents && !_isToday && (
                        <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-neon-orange shadow-[0_0_4px_rgba(255,160,0,0.4)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Date Detail Section ── */}
              {selectedDate && (
                <>
                  <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                  <div className="px-4 py-3">
                    {/* Date header */}
                    <p className="text-xs font-medium text-white/50">
                      {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                    </p>

                    {/* Events list */}
                    {dateEvents.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {dateEvents.map((ev) => {
                          const c = COLOR_CLASSES[ev.color];
                          return (
                            <div key={ev.id} className={`group flex items-start gap-2 rounded-lg border ${c.border} ${c.bg} px-2.5 py-2`}>
                              <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-white/80">{ev.title}</p>
                                {ev.description && <p className="mt-0.5 text-[10px] text-white/35">{ev.description}</p>}
                                <span className={`mt-0.5 inline-block text-[9px] uppercase tracking-wider ${c.text}`}>
                                  {ev.type === "note" ? "Nota" : ev.type === "agent" ? "Agente" : "Servico"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeEvent(selectedDateKey, ev.id)}
                                className="shrink-0 text-white/0 transition-colors group-hover:text-white/30 hover:!text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {dateEvents.length === 0 && addMode === null && (
                      <p className="mt-1 text-[10px] text-white/20">Nenhum evento agendado</p>
                    )}

                    {/* Add buttons */}
                    {addMode === null && (
                      <div className="mt-3 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAddMode("note")}
                          className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/40 transition-all hover:border-neon-cyan/20 hover:bg-neon-cyan/5 hover:text-neon-cyan"
                        >
                          <StickyNote className="h-3 w-3" />
                          Nota
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddMode("agent")}
                          className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/40 transition-all hover:border-neon-purple/20 hover:bg-neon-purple/5 hover:text-neon-purple"
                        >
                          <Bot className="h-3 w-3" />
                          Agente
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddMode("context")}
                          className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/40 transition-all hover:border-neon-orange/20 hover:bg-neon-orange/5 hover:text-neon-orange"
                        >
                          <Layers className="h-3 w-3" />
                          Contexto
                        </button>
                      </div>
                    )}

                    {/* ── Add Note Form ── */}
                    <AnimatePresence mode="wait">
                      {addMode === "note" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2 rounded-lg border border-neon-cyan/15 bg-neon-cyan/[0.03] p-2.5">
                            <div className="flex items-center gap-1.5">
                              <StickyNote className="h-3 w-3 text-neon-cyan/60" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-cyan/60">Nova Nota</span>
                            </div>
                            <input
                              type="text"
                              value={noteTitle}
                              onChange={(e) => setNoteTitle(e.target.value)}
                              placeholder="Titulo..."
                              className="w-full rounded-md border border-white/[0.06] bg-black/20 px-2 py-1.5 text-[11px] text-white/80 placeholder:text-white/20 outline-none focus:border-neon-cyan/30"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); if (e.key === "Escape") setAddMode(null); }}
                            />
                            <textarea
                              value={noteDesc}
                              onChange={(e) => setNoteDesc(e.target.value)}
                              placeholder="Descricao (opcional)..."
                              rows={2}
                              className="w-full resize-none rounded-md border border-white/[0.06] bg-black/20 px-2 py-1.5 text-[11px] text-white/80 placeholder:text-white/20 outline-none focus:border-neon-cyan/30"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => { setAddMode(null); setNoteTitle(""); setNoteDesc(""); }} className="rounded-md px-2 py-1 text-[10px] text-white/30 hover:text-white/50">
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={handleAddNote}
                                disabled={!noteTitle.trim()}
                                className="flex items-center gap-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-1 text-[10px] font-medium text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-30"
                              >
                                <Check className="h-2.5 w-2.5" />
                                Salvar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Add Agent Picker ── */}
                      {addMode === "agent" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-1.5 rounded-lg border border-neon-purple/15 bg-neon-purple/[0.03] p-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Bot className="h-3 w-3 text-neon-purple/60" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-purple/60">Agendar Agente</span>
                              </div>
                              <button type="button" onClick={() => setAddMode(null)} className="text-[10px] text-white/30 hover:text-white/50">Cancelar</button>
                            </div>
                            <div className="space-y-1">
                              {AGENTS.map((agent) => (
                                <button
                                  key={agent.id}
                                  type="button"
                                  onClick={() => handleAddAgent(agent)}
                                  className="flex w-full items-center gap-2 rounded-md border border-white/[0.04] bg-black/15 px-2 py-1.5 text-left transition-all hover:border-neon-purple/20 hover:bg-neon-purple/5"
                                >
                                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neon-purple/10">
                                    <Bot className="h-2.5 w-2.5 text-neon-purple" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-medium text-white/70">{agent.name}</p>
                                    <p className="text-[9px] text-white/25">{agent.role}</p>
                                  </div>
                                  <Plus className="h-3 w-3 text-white/15" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Add Context/Service Picker ── */}
                      {addMode === "context" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-1.5 rounded-lg border border-neon-orange/15 bg-neon-orange/[0.03] p-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Layers className="h-3 w-3 text-neon-orange/60" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-orange/60">Agendar Servico</span>
                              </div>
                              <button type="button" onClick={() => setAddMode(null)} className="text-[10px] text-white/30 hover:text-white/50">Cancelar</button>
                            </div>
                            <div className="space-y-1">
                              {CONTEXTS.map((ctx) => (
                                <button
                                  key={ctx.id}
                                  type="button"
                                  onClick={() => handleAddContext(ctx)}
                                  className="flex w-full items-center gap-2 rounded-md border border-white/[0.04] bg-black/15 px-2 py-1.5 text-left transition-all hover:border-neon-orange/20 hover:bg-neon-orange/5"
                                >
                                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neon-orange/10">
                                    <Layers className="h-2.5 w-2.5 text-neon-orange" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-medium text-white/70">{ctx.label}</p>
                                    <p className="text-[9px] text-white/25">{ctx.desc}</p>
                                  </div>
                                  <Plus className="h-3 w-3 text-white/15" />
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

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
