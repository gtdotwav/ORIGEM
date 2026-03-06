"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Columns3,
  Plus,
  StickyNote,
  Bot,
  Layers,
  Trash2,
  Check,
  Clock,
  Sparkles,
  Send,
  Link2,
  Copy,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCalendarStore,
  toDateKey,
  parseSchedulePrompt,
  type CalendarEvent,
  type CalendarEventType,
} from "@/stores/calendar-store";

/* ── Constants ── */

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const WEEKDAYS_FULL = [
  "Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado",
];
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

const KANBAN_COLUMNS = [
  { key: "backlog", label: "Backlog", color: "text-foreground/40" },
  { key: "todo", label: "A fazer", color: "text-neon-cyan" },
  { key: "in-progress", label: "Em progresso", color: "text-neon-orange" },
  { key: "done", label: "Concluido", color: "text-neon-green" },
] as const;

type ViewMode = "standard" | "list" | "kanban";
type AddMode = null | "note" | "agent" | "context" | "prompt";

/* ── Helpers ── */

function formatDuration(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function getKanbanColumn(ev: CalendarEvent): string {
  const now = new Date();
  const evDate = new Date(ev.dateKey + "T00:00:00");
  if (ev.time) {
    const [h, m] = ev.time.split(":").map(Number);
    evDate.setHours(h, m);
  }
  if (evDate < now && ev.time) return "done";
  if (evDate.toDateString() === now.toDateString()) return "in-progress";
  if (evDate > now) return "todo";
  return "backlog";
}

/* ── Main Page ── */

export default function CalendarFullPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [assignee, setAssignee] = useState("");

  // Form state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteTime, setNoteTime] = useState("");
  const [agentTime, setAgentTime] = useState("");
  const [ctxTime, setCtxTime] = useState("");
  const [promptText, setPromptText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<
    ReturnType<typeof parseSchedulePrompt>
  >([]);

  const { events, addEvent, removeEvent } = useCalendarStore();

  const selectedDateKey = toDateKey(selectedDate);
  const dateEvents = events[selectedDateKey] ?? [];

  const sortedEvents = useMemo(
    () =>
      [...dateEvents].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      }),
    [dateEvents]
  );

  const eventDateKeys = useMemo(
    () =>
      new Set(
        Object.keys(events).filter((k) => (events[k]?.length ?? 0) > 0)
      ),
    [events]
  );

  // All events for the current month (for list & kanban views)
  const monthEvents = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const all: (CalendarEvent & { _dateKey: string })[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dk = toDateKey(new Date(currentYear, currentMonth, d));
      for (const ev of events[dk] ?? []) {
        all.push({ ...ev, _dateKey: dk });
      }
    }
    return all.sort((a, b) => {
      if (a._dateKey !== b._dateKey) return a._dateKey.localeCompare(b._dateKey);
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }, [events, currentMonth, currentYear]);

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
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isSelected = (date: Date) =>
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  // Handlers
  const handleAddNote = () => {
    if (!noteTitle.trim()) return;
    addEvent({
      dateKey: selectedDateKey, type: "note", title: noteTitle.trim(),
      description: noteDesc.trim(), time: noteTime, duration: 60, color: "cyan",
    });
    setNoteTitle(""); setNoteDesc(""); setNoteTime(""); setAddMode(null);
  };

  const handleAddAgent = (agent: (typeof AGENTS)[0]) => {
    addEvent({
      dateKey: selectedDateKey, type: "agent", title: agent.name,
      description: agent.role, agent: agent.id, time: agentTime, duration: 60, color: "purple",
    });
    setAgentTime(""); setAddMode(null);
  };

  const handleAddContext = (ctx: (typeof CONTEXTS)[0]) => {
    addEvent({
      dateKey: selectedDateKey, type: "context", title: ctx.label,
      description: ctx.desc, context: ctx.id, time: ctxTime, duration: 60, color: "orange",
    });
    setCtxTime(""); setAddMode(null);
  };

  const handlePromptChange = (text: string) => {
    setPromptText(text);
    setParsedPreview(text.trim().length > 3 ? parseSchedulePrompt(text) : []);
  };

  const handlePromptSubmit = () => {
    if (parsedPreview.length === 0) return;
    for (const item of parsedPreview) {
      addEvent({
        dateKey: selectedDateKey, type: item.type, title: item.title,
        description: "", time: item.time, duration: item.duration,
        agent: item.agent, context: item.context, color: item.color,
      });
    }
    setPromptText(""); setParsedPreview([]); setAddMode(null);
  };

  const handleCopyInvite = useCallback(() => {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/calendar/${selectedDateKey}`;
    navigator.clipboard.writeText(link);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }, [selectedDateKey]);

  /* ── Render: Event Card (reusable) ── */
  const renderEventCard = (ev: CalendarEvent, dateKey: string, compact = false) => {
    const c = COLOR_CLASSES[ev.color];
    return (
      <div
        key={ev.id}
        className={cn(
          "group rounded-lg border px-3 py-2 transition-all hover:shadow-md",
          c.border, c.bg
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {ev.time && (
                <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-foreground/60">
                  {ev.time}
                </span>
              )}
              {!ev.time && (
                <span className="shrink-0 text-[10px] text-foreground/25">dia todo</span>
              )}
              <span className={cn("text-[12px] font-medium text-foreground/80", compact && "text-[11px]")}>
                {ev.title}
              </span>
            </div>
            {ev.description && !compact && (
              <p className="mt-0.5 text-[11px] text-foreground/35">{ev.description}</p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <span className={cn("text-[9px] font-semibold uppercase tracking-wider", c.text)}>
                {ev.type === "note" ? "Nota" : ev.type === "agent" ? "Agente" : "Servico"}
              </span>
              {ev.time && ev.duration > 0 && (
                <span className="text-[9px] text-foreground/20">{formatDuration(ev.duration)}</span>
              )}
              {ev.agent && (
                <span className="rounded-full bg-neon-purple/10 px-1.5 py-0.5 text-[8px] font-medium text-neon-purple">
                  {ev.agent}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeEvent(dateKey, ev.id)}
            className="shrink-0 text-foreground/0 transition-colors group-hover:text-foreground/30 hover:!text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between border-b border-foreground/[0.06] bg-background/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-neon-cyan/60" />
            <h1 className="text-sm font-semibold text-foreground/80">Calendario</h1>
          </div>
          <div className="h-4 w-px bg-foreground/[0.06]" />
          <div className="flex items-center gap-1">
            <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={goToday} className="px-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
              {MONTHS[currentMonth]} {currentYear}
            </button>
            <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] p-0.5">
            {([
              { mode: "standard" as ViewMode, icon: Grid3X3, label: "Grade" },
              { mode: "list" as ViewMode, icon: List, label: "Lista" },
              { mode: "kanban" as ViewMode, icon: Columns3, label: "Kanban" },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                  viewMode === mode
                    ? "bg-neon-cyan/10 text-neon-cyan shadow-sm"
                    : "text-foreground/35 hover:text-foreground/60"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-foreground/[0.06]" />

          {/* Invite */}
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] px-3 py-1.5 text-[11px] font-medium text-foreground/40 transition-all hover:border-neon-purple/20 hover:text-neon-purple"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Convidar
          </button>

          {/* Add event */}
          <button
            type="button"
            onClick={() => setAddMode(addMode ? null : "note")}
            className="flex items-center gap-1.5 rounded-lg border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-1.5 text-[11px] font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Evento
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Standard / Grid View ── */}
        {viewMode === "standard" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-foreground/[0.04]">
              {WEEKDAYS_FULL.map((d) => (
                <div key={d} className="border-r border-foreground/[0.04] px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-foreground/25 last:border-r-0">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid flex-1 grid-cols-7 grid-rows-6">
              {days.map((cell, i) => {
                const dk = toDateKey(cell.date);
                const dayEvents = (events[dk] ?? []).slice(0, 3);
                const moreCount = (events[dk] ?? []).length - 3;
                const _isToday = isToday(cell.date);
                const _isSelected = isSelected(cell.date);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setSelectedDate(cell.date); setAddMode(null); }}
                    className={cn(
                      "group relative flex flex-col border-b border-r border-foreground/[0.04] p-1.5 text-left transition-all last:border-r-0 hover:bg-foreground/[0.02]",
                      _isSelected && "bg-neon-cyan/[0.04]",
                      !cell.inMonth && "opacity-30"
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums",
                        _isToday && "bg-neon-cyan font-bold text-black",
                        _isSelected && !_isToday && "bg-foreground/10 font-semibold text-foreground/80",
                        !_isToday && !_isSelected && "text-foreground/50"
                      )}
                    >
                      {cell.day}
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      {dayEvents.map((ev) => {
                        const c = COLOR_CLASSES[ev.color];
                        return (
                          <div
                            key={ev.id}
                            className={cn(
                              "truncate rounded px-1 py-0.5 text-[9px] font-medium",
                              c.bg, c.text
                            )}
                          >
                            {ev.time && <span className="mr-1 opacity-60">{ev.time}</span>}
                            {ev.title}
                          </div>
                        );
                      })}
                      {moreCount > 0 && (
                        <span className="px-1 text-[9px] text-foreground/25">+{moreCount} mais</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── List View ── */}
        {viewMode === "list" && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {monthEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <CalendarIcon className="h-8 w-8 text-foreground/10" />
                <p className="text-sm text-foreground/25">Nenhum evento neste mes</p>
              </div>
            )}
            {monthEvents.length > 0 && (() => {
              let lastDateKey = "";
              return monthEvents.map((ev) => {
                const showDateHeader = ev._dateKey !== lastDateKey;
                lastDateKey = ev._dateKey;
                const evDate = new Date(ev._dateKey + "T12:00:00");
                return (
                  <div key={ev.id}>
                    {showDateHeader && (
                      <div className="mb-2 mt-6 first:mt-0">
                        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-foreground/35">
                          {evDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                        </h3>
                        <div className="mt-1 h-px bg-foreground/[0.06]" />
                      </div>
                    )}
                    <div className="mb-2 max-w-2xl">
                      {renderEventCard(ev, ev._dateKey)}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── Kanban View ── */}
        {viewMode === "kanban" && (
          <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-4">
            {KANBAN_COLUMNS.map((col) => {
              const colEvents = monthEvents.filter(
                (ev) => getKanbanColumn(ev) === col.key
              );
              return (
                <div
                  key={col.key}
                  className="flex w-72 shrink-0 flex-col rounded-xl border border-foreground/[0.06] bg-foreground/[0.02]"
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between border-b border-foreground/[0.06] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[12px] font-semibold", col.color)}>
                        {col.label}
                      </span>
                      <span className="rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-foreground/30">
                        {colEvents.length}
                      </span>
                    </div>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 space-y-2 overflow-y-auto p-2">
                    {colEvents.length === 0 && (
                      <p className="py-8 text-center text-[11px] text-foreground/15">
                        Vazio
                      </p>
                    )}
                    {colEvents.map((ev) => {
                      const c = COLOR_CLASSES[ev.color];
                      const evDate = new Date(ev._dateKey + "T12:00:00");
                      return (
                        <div
                          key={ev.id}
                          className={cn(
                            "group rounded-lg border bg-background/50 p-2.5 transition-all hover:shadow-md",
                            c.border
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <div className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
                                <span className="text-[11px] font-medium text-foreground/75">
                                  {ev.title}
                                </span>
                              </div>
                              <p className="mt-1 text-[10px] text-foreground/30">
                                {evDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                                {ev.time && ` - ${ev.time}`}
                              </p>
                              {ev.description && (
                                <p className="mt-0.5 text-[10px] text-foreground/20">{ev.description}</p>
                              )}
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className={cn("text-[8px] font-semibold uppercase tracking-wider", c.text)}>
                                  {ev.type === "note" ? "nota" : ev.type === "agent" ? "agente" : "servico"}
                                </span>
                                {ev.agent && (
                                  <span className="rounded-full bg-neon-purple/10 px-1.5 py-0.5 text-[8px] font-medium text-neon-purple">
                                    {ev.agent}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEvent(ev._dateKey, ev.id)}
                              className="shrink-0 text-foreground/0 transition-colors group-hover:text-foreground/25 hover:!text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Right Sidebar (day detail + add forms) ── */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-foreground/[0.06] bg-foreground/[0.01]">
          <div className="px-4 py-4">
            <p className="text-[13px] font-semibold text-foreground/70">
              {selectedDate.toLocaleDateString("pt-BR", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </p>
            <p className="mt-0.5 text-[10px] text-foreground/25">
              {sortedEvents.length} evento{sortedEvents.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="h-px bg-foreground/[0.06]" />

          {/* Event timeline */}
          <div className="px-4 py-3">
            {sortedEvents.length > 0 && (
              <div className="space-y-0">
                {sortedEvents.map((ev, idx) => {
                  const c = COLOR_CLASSES[ev.color];
                  const isLast = idx === sortedEvents.length - 1;
                  return (
                    <div key={ev.id} className="group flex gap-2.5">
                      <div className="flex w-4 flex-col items-center">
                        <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full border-2", c.border, c.bg)} />
                        {!isLast && <div className="w-px flex-1 bg-foreground/[0.06]" />}
                      </div>
                      <div className={cn("mb-2 flex-1 rounded-lg border px-2.5 py-2", c.border, c.bg)}>
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {ev.time ? (
                                <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-foreground/60">{ev.time}</span>
                              ) : (
                                <span className="shrink-0 text-[9px] text-foreground/25">dia todo</span>
                              )}
                              <span className="text-[11px] font-medium text-foreground/80">{ev.title}</span>
                            </div>
                            {ev.description && <p className="mt-0.5 text-[10px] text-foreground/30">{ev.description}</p>}
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className={cn("text-[9px] uppercase tracking-wider", c.text)}>
                                {ev.type === "note" ? "Nota" : ev.type === "agent" ? "Agente" : "Servico"}
                              </span>
                              {ev.time && ev.duration > 0 && (
                                <span className="text-[9px] text-foreground/20">{formatDuration(ev.duration)}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEvent(selectedDateKey, ev.id)}
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
              <p className="py-4 text-center text-[11px] text-foreground/20">Nenhum evento</p>
            )}

            {/* ── Quick Action Buttons ── */}
            {addMode === null && (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setAddMode("prompt")}
                  className="flex w-full items-center gap-1.5 rounded-lg border border-neon-green/15 bg-neon-green/[0.03] px-2.5 py-2 text-left text-[11px] text-foreground/35 transition-all hover:border-neon-green/30 hover:text-neon-green/70"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-neon-green/50" />
                  Descreva sua agenda com horarios...
                </button>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setAddMode("note")} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1.5 text-[10px] text-foreground/40 transition-all hover:border-neon-cyan/20 hover:bg-neon-cyan/[0.05] hover:text-neon-cyan">
                    <StickyNote className="h-3 w-3" /> Nota
                  </button>
                  <button type="button" onClick={() => setAddMode("agent")} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1.5 text-[10px] text-foreground/40 transition-all hover:border-neon-purple/20 hover:bg-neon-purple/[0.05] hover:text-neon-purple">
                    <Bot className="h-3 w-3" /> Agente
                  </button>
                  <button type="button" onClick={() => setAddMode("context")} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1.5 text-[10px] text-foreground/40 transition-all hover:border-neon-orange/20 hover:bg-neon-orange/[0.05] hover:text-neon-orange">
                    <Layers className="h-3 w-3" /> Contexto
                  </button>
                </div>
              </div>
            )}

            {/* ── Add Forms ── */}
            <AnimatePresence mode="wait">
              {/* Prompt interpreter */}
              {addMode === "prompt" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2 rounded-lg border border-neon-green/15 bg-neon-green/[0.03] p-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-neon-green/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-green/60">
                        Prompt de Horarios
                      </span>
                    </div>
                    <textarea
                      value={promptText}
                      onChange={(e) => handlePromptChange(e.target.value)}
                      placeholder={"Ex: standup 9h, code review 10:30,\nplanning 14h, deploy 18h"}
                      rows={3}
                      className="w-full resize-none rounded-md border border-foreground/[0.06] bg-black/20 px-2.5 py-2 text-[11px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-green/30"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setAddMode(null); setPromptText(""); setParsedPreview([]); }
                      }}
                    />
                    {parsedPreview.length > 0 && (
                      <div className="space-y-1 rounded-md border border-foreground/[0.04] bg-black/15 p-2">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/25">
                          Interpretado ({parsedPreview.length})
                        </p>
                        {parsedPreview.map((item, idx) => {
                          const c = COLOR_CLASSES[item.color];
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-10 shrink-0 font-mono text-[10px] font-semibold tabular-nums text-foreground/50">{item.time}</span>
                              <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
                              <span className="text-[10px] text-foreground/60">{item.title}</span>
                              <span className={cn("ml-auto text-[8px] uppercase", c.text)}>
                                {item.type === "note" ? "nota" : item.type === "agent" ? "agente" : "servico"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => { setAddMode(null); setPromptText(""); setParsedPreview([]); }} className="rounded-md px-2.5 py-1 text-[10px] text-foreground/30 hover:text-foreground/50">
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handlePromptSubmit}
                        disabled={parsedPreview.length === 0}
                        className="flex items-center gap-1 rounded-md border border-neon-green/30 bg-neon-green/10 px-2.5 py-1 text-[10px] font-medium text-neon-green transition-all hover:bg-neon-green/20 disabled:opacity-30"
                      >
                        <Send className="h-2.5 w-2.5" />
                        Agendar {parsedPreview.length > 0 ? `(${parsedPreview.length})` : ""}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Add note */}
              {addMode === "note" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2 rounded-lg border border-neon-cyan/15 bg-neon-cyan/[0.03] p-3">
                    <div className="flex items-center gap-1.5">
                      <StickyNote className="h-3 w-3 text-neon-cyan/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-cyan/60">Nova Nota</span>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Titulo..."
                        className="flex-1 rounded-md border border-foreground/[0.06] bg-black/20 px-2.5 py-1.5 text-[11px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-cyan/30"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddNote();
                          if (e.key === "Escape") setAddMode(null);
                        }}
                      />
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/20" />
                        <input type="time" value={noteTime} onChange={(e) => setNoteTime(e.target.value)} className="w-20 rounded-md border border-foreground/[0.06] bg-black/20 py-1.5 pl-6 pr-1 text-[11px] tabular-nums text-foreground/60 outline-none focus:border-neon-cyan/30 [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                    </div>
                    {/* Assignee */}
                    <select
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full rounded-md border border-foreground/[0.06] bg-black/20 px-2.5 py-1.5 text-[11px] text-foreground/60 outline-none focus:border-neon-cyan/30"
                    >
                      <option value="">Sem atribuicao</option>
                      {AGENTS.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
                      ))}
                      <option value="partner">Parceiro (convidado)</option>
                    </select>
                    <textarea
                      value={noteDesc}
                      onChange={(e) => setNoteDesc(e.target.value)}
                      placeholder="Descricao (opcional)..."
                      rows={2}
                      className="w-full resize-none rounded-md border border-foreground/[0.06] bg-black/20 px-2.5 py-1.5 text-[11px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-cyan/30"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => { setAddMode(null); setNoteTitle(""); setNoteDesc(""); setNoteTime(""); setAssignee(""); }} className="rounded-md px-2.5 py-1 text-[10px] text-foreground/30 hover:text-foreground/50">
                        Cancelar
                      </button>
                      <button type="button" onClick={handleAddNote} disabled={!noteTitle.trim()} className="flex items-center gap-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-[10px] font-medium text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-30">
                        <Check className="h-2.5 w-2.5" /> Salvar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Agent picker */}
              {addMode === "agent" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-1.5 rounded-lg border border-neon-purple/15 bg-neon-purple/[0.03] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bot className="h-3 w-3 text-neon-purple/60" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-purple/60">Agendar Agente</span>
                      </div>
                      <button type="button" onClick={() => setAddMode(null)} className="text-[10px] text-foreground/30 hover:text-foreground/50">Cancelar</button>
                    </div>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/20" />
                      <input type="time" value={agentTime} onChange={(e) => setAgentTime(e.target.value)} className="w-full rounded-md border border-foreground/[0.06] bg-black/20 py-1.5 pl-7 pr-2 text-[11px] tabular-nums text-foreground/60 outline-none focus:border-neon-purple/30 [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                    <div className="space-y-1">
                      {AGENTS.map((agent) => (
                        <button key={agent.id} type="button" onClick={() => handleAddAgent(agent)} className="flex w-full items-center gap-2 rounded-md border border-foreground/[0.04] bg-black/15 px-2 py-1.5 text-left transition-all hover:border-neon-purple/20 hover:bg-neon-purple/[0.05]">
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neon-purple/10">
                            <Bot className="h-2.5 w-2.5 text-neon-purple" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-foreground/70">{agent.name}</p>
                            <p className="text-[9px] text-foreground/25">{agent.role}</p>
                          </div>
                          <Plus className="h-3 w-3 text-foreground/15" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Context picker */}
              {addMode === "context" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-1.5 rounded-lg border border-neon-orange/15 bg-neon-orange/[0.03] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-neon-orange/60" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-orange/60">Agendar Servico</span>
                      </div>
                      <button type="button" onClick={() => setAddMode(null)} className="text-[10px] text-foreground/30 hover:text-foreground/50">Cancelar</button>
                    </div>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/20" />
                      <input type="time" value={ctxTime} onChange={(e) => setCtxTime(e.target.value)} className="w-full rounded-md border border-foreground/[0.06] bg-black/20 py-1.5 pl-7 pr-2 text-[11px] tabular-nums text-foreground/60 outline-none focus:border-neon-orange/30 [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                    <div className="space-y-1">
                      {CONTEXTS.map((ctx) => (
                        <button key={ctx.id} type="button" onClick={() => handleAddContext(ctx)} className="flex w-full items-center gap-2 rounded-md border border-foreground/[0.04] bg-black/15 px-2 py-1.5 text-left transition-all hover:border-neon-orange/20 hover:bg-neon-orange/[0.05]">
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neon-orange/10">
                            <Layers className="h-2.5 w-2.5 text-neon-orange" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-foreground/70">{ctx.label}</p>
                            <p className="text-[9px] text-foreground/25">{ctx.desc}</p>
                          </div>
                          <Plus className="h-3 w-3 text-foreground/15" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Invite Modal ── */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-foreground/[0.1] bg-background p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-neon-purple/60" />
                  <h2 className="text-sm font-semibold text-foreground/80">Convidar para o calendario</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 text-[12px] text-foreground/40">
                Compartilhe este link para que parceiros ou agentes possam visualizar e colaborar no seu calendario.
              </p>

              {/* Invite link */}
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-2.5">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-foreground/25" />
                <span className="flex-1 truncate font-mono text-[11px] text-foreground/50">
                  {typeof window !== "undefined" ? window.location.origin : "https://origemai.com"}/invite/calendar/{selectedDateKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
                    inviteCopied
                      ? "bg-neon-green/10 text-neon-green"
                      : "bg-foreground/[0.06] text-foreground/40 hover:text-foreground/60"
                  )}
                >
                  {inviteCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {inviteCopied ? "Copiado" : "Copiar"}
                </button>
              </div>

              {/* Assign to */}
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/30">
                  Atribuir a agente ou parceiro
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {AGENTS.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] px-2.5 py-2 text-left transition-all hover:border-neon-purple/20 hover:bg-neon-purple/[0.04]"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neon-purple/10">
                        <Bot className="h-2.5 w-2.5 text-neon-purple" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground/65">{agent.name}</p>
                        <p className="text-[9px] text-foreground/25">{agent.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg border border-foreground/[0.08] px-4 py-2 text-[11px] font-medium text-foreground/50 transition-all hover:bg-foreground/[0.04] hover:text-foreground/70"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
