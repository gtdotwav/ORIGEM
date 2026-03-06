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
  Blocks,
  Send,
  Link2,
  Copy,
  UserPlus,
  X,
  GripVertical,
  CalendarDays,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCalendarStore,
  toDateKey,
  parseSchedulePrompt,
  type CalendarEvent,
  type CalendarEventType,
} from "@/stores/calendar-store";
import { AutomationSection } from "@/components/calendar/automation-section";
import { KanbanCardModal } from "@/components/calendar/kanban-card-modal";
import { useAutomationStore } from "@/stores/automation-store";

/* ── Constants ── */

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
  cyan: { bg: "bg-neon-cyan/10", bgStrong: "bg-neon-cyan/15", border: "border-neon-cyan/20", borderStrong: "border-neon-cyan/35", text: "text-neon-cyan", dot: "bg-neon-cyan", shadow: "shadow-neon-cyan/10" },
  purple: { bg: "bg-neon-purple/10", bgStrong: "bg-neon-purple/15", border: "border-neon-purple/20", borderStrong: "border-neon-purple/35", text: "text-neon-purple", dot: "bg-neon-purple", shadow: "shadow-neon-purple/10" },
  orange: { bg: "bg-neon-orange/10", bgStrong: "bg-neon-orange/15", border: "border-neon-orange/20", borderStrong: "border-neon-orange/35", text: "text-neon-orange", dot: "bg-neon-orange", shadow: "shadow-neon-orange/10" },
  green: { bg: "bg-neon-green/10", bgStrong: "bg-neon-green/15", border: "border-neon-green/20", borderStrong: "border-neon-green/35", text: "text-neon-green", dot: "bg-neon-green", shadow: "shadow-neon-green/10" },
  pink: { bg: "bg-neon-pink/10", bgStrong: "bg-neon-pink/15", border: "border-neon-pink/20", borderStrong: "border-neon-pink/35", text: "text-neon-pink", dot: "bg-neon-pink", shadow: "shadow-neon-pink/10" },
};

const KANBAN_COLUMNS = [
  { key: "backlog", label: "Backlog", icon: CalendarDays, color: "text-foreground/50", borderColor: "border-foreground/[0.08]", headerBg: "bg-foreground/[0.03]" },
  { key: "todo", label: "A fazer", icon: CalendarIcon, color: "text-neon-cyan", borderColor: "border-neon-cyan/15", headerBg: "bg-neon-cyan/[0.04]" },
  { key: "in-progress", label: "Em progresso", icon: Zap, color: "text-neon-orange", borderColor: "border-neon-orange/15", headerBg: "bg-neon-orange/[0.04]" },
  { key: "done", label: "Concluido", icon: Check, color: "text-neon-green", borderColor: "border-neon-green/15", headerBg: "bg-neon-green/[0.04]" },
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteScope, setInviteScope] = useState<"day" | "month" | "full">("day");
  const [inviteSent, setInviteSent] = useState(false);
  const [assignee, setAssignee] = useState("");

  // Drag state for kanban
  const [draggedEvent, setDraggedEvent] = useState<(CalendarEvent & { _dateKey: string }) | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<(CalendarEvent & { _dateKey: string }) | null>(null);

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
  const automationJobs = useAutomationStore((s) => s.jobs);
  const eventIdsWithAutomations = new Set(automationJobs.filter((j) => j.calendarEventId).map((j) => j.calendarEventId));

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

  // Count by type for sidebar stats
  const monthStats = useMemo(() => {
    let notes = 0, agents = 0, contexts = 0;
    for (const ev of monthEvents) {
      if (ev.type === "note") notes++;
      else if (ev.type === "agent") agents++;
      else contexts++;
    }
    return { notes, agents, contexts, total: monthEvents.length };
  }, [monthEvents]);

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

  const inviteLink = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://origemai.com";
    if (inviteScope === "day") return `${origin}/invite/calendar/${selectedDateKey}`;
    if (inviteScope === "month") return `${origin}/invite/calendar/${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    return `${origin}/invite/calendar/full`;
  }, [selectedDateKey, currentYear, currentMonth, inviteScope]);

  const handleCopyInvite = useCallback(() => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }, [inviteLink]);

  const handleSendInvite = useCallback(() => {
    if (!inviteEmail.trim()) return;
    // Simulate sending invite
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmail("");
    }, 2500);
  }, [inviteEmail]);

  // Kanban drag handlers
  const handleDragStart = (ev: CalendarEvent & { _dateKey: string }) => {
    setDraggedEvent(ev);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedEvent) return;

    // Move event: remove from old date, re-add with new date based on column
    const now = new Date();
    let newDate: Date;

    if (targetCol === "done") {
      // Set to yesterday or today's past
      newDate = new Date(now);
      newDate.setDate(newDate.getDate() - 1);
    } else if (targetCol === "in-progress") {
      newDate = now;
    } else if (targetCol === "todo") {
      newDate = new Date(now);
      newDate.setDate(newDate.getDate() + 1);
    } else {
      // backlog — set to a week ago
      newDate = new Date(now);
      newDate.setDate(newDate.getDate() - 7);
    }

    const newDateKey = toDateKey(newDate);

    // Only move if column actually changed
    if (getKanbanColumn(draggedEvent) !== targetCol) {
      removeEvent(draggedEvent._dateKey, draggedEvent.id);
      addEvent({
        dateKey: newDateKey,
        type: draggedEvent.type,
        title: draggedEvent.title,
        description: draggedEvent.description,
        time: draggedEvent.time,
        duration: draggedEvent.duration,
        agent: draggedEvent.agent,
        context: draggedEvent.context,
        color: draggedEvent.color,
      });
    }

    setDraggedEvent(null);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between border-b border-foreground/[0.08] bg-background/90 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-neon-cyan" />
            <h1 className="text-sm font-semibold text-foreground/90">Calendario</h1>
          </div>
          <div className="h-5 w-px bg-foreground/[0.08]" />
          <div className="flex items-center gap-1">
            <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/70">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={goToday} className="min-w-[140px] px-2 text-center text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground">
              {MONTHS[currentMonth]} {currentYear}
            </button>
            <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/70">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-foreground/[0.08] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/40 transition-all hover:bg-foreground/[0.04] hover:text-foreground/60"
          >
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] p-0.5">
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
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                  viewMode === mode
                    ? "bg-neon-cyan/15 text-neon-cyan shadow-sm shadow-neon-cyan/10"
                    : "text-foreground/40 hover:text-foreground/65"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-foreground/[0.08]" />

          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-foreground/[0.08] bg-foreground/[0.02] px-3 py-1.5 text-[11px] font-medium text-foreground/45 transition-all hover:border-neon-purple/25 hover:text-neon-purple"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Convidar
          </button>

          <button
            type="button"
            onClick={() => setAddMode(addMode ? null : "note")}
            className="flex items-center gap-1.5 rounded-lg border border-neon-cyan/25 bg-neon-cyan/12 px-3 py-1.5 text-[11px] font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 shadow-sm shadow-neon-cyan/10"
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
            <div className="grid grid-cols-7 border-b border-foreground/[0.06] bg-foreground/[0.015]">
              {WEEKDAYS_FULL.map((d) => (
                <div key={d} className="border-r border-foreground/[0.04] px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground/30 last:border-r-0">
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
                      "group relative flex flex-col border-b border-r border-foreground/[0.04] p-1.5 text-left transition-all last:border-r-0 hover:bg-foreground/[0.03]",
                      _isSelected && "bg-neon-cyan/[0.06] ring-1 ring-inset ring-neon-cyan/15",
                      !cell.inMonth && "opacity-25"
                    )}
                  >
                    <span
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums transition-colors",
                        _isToday && "bg-neon-cyan font-bold text-black shadow-sm shadow-neon-cyan/30",
                        _isSelected && !_isToday && "bg-foreground/10 font-semibold text-foreground/80",
                        !_isToday && !_isSelected && "text-foreground/55 group-hover:text-foreground/75"
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
                              "truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight",
                              c.bg, c.text
                            )}
                          >
                            {ev.time && <span className="mr-1 opacity-70">{ev.time}</span>}
                            {ev.title}
                          </div>
                        );
                      })}
                      {moreCount > 0 && (
                        <span className="px-1 text-[9px] font-medium text-foreground/30">+{moreCount} mais</span>
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
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {monthEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02]">
                  <CalendarIcon className="h-7 w-7 text-foreground/10" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/30">Nenhum evento neste mes</p>
                  <p className="mt-1 text-xs text-foreground/15">Adicione eventos usando o botao acima ou o painel lateral</p>
                </div>
              </div>
            )}
            {monthEvents.length > 0 && (() => {
              let lastDateKey = "";
              return monthEvents.map((ev) => {
                const showDateHeader = ev._dateKey !== lastDateKey;
                lastDateKey = ev._dateKey;
                const evDate = new Date(ev._dateKey + "T12:00:00");
                const c = COLOR_CLASSES[ev.color];
                const TypeIcon = getTypeIcon(ev.type);
                return (
                  <div key={ev.id}>
                    {showDateHeader && (
                      <div className="mb-3 mt-8 first:mt-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[13px] font-semibold text-foreground/50">
                            {evDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                          </h3>
                          <div className="h-px flex-1 bg-foreground/[0.06]" />
                        </div>
                      </div>
                    )}
                    <div className="group mb-2 max-w-3xl">
                      <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 transition-all hover:shadow-lg", c.border, c.bg)}>
                        <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", c.bgStrong)}>
                          <TypeIcon className={cn("h-3.5 w-3.5", c.text)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-foreground/85">{ev.title}</span>
                            {ev.time && (
                              <span className="shrink-0 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-foreground/50">
                                {ev.time}
                              </span>
                            )}
                            {!ev.time && (
                              <span className="shrink-0 rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] text-foreground/25">dia todo</span>
                            )}
                          </div>
                          {ev.description && (
                            <p className="mt-1 text-[11px] leading-relaxed text-foreground/40">{ev.description}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider", c.text)}>
                              {getTypeLabel(ev.type)}
                            </span>
                            {ev.time && ev.duration > 0 && (
                              <span className="text-[9px] text-foreground/25">{formatDuration(ev.duration)}</span>
                            )}
                            {ev.agent && (
                              <span className="rounded-full bg-neon-purple/10 px-2 py-0.5 text-[9px] font-medium text-neon-purple">
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
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── Kanban View ── */}
        {viewMode === "kanban" && (
          <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-5">
            {KANBAN_COLUMNS.map((col) => {
              const ColIcon = col.icon;
              const colEvents = monthEvents.filter(
                (ev) => getKanbanColumn(ev) === col.key
              );
              const isOver = dragOverCol === col.key;

              return (
                <div
                  key={col.key}
                  className={cn(
                    "flex w-80 shrink-0 flex-col rounded-xl border transition-all",
                    col.borderColor,
                    "bg-foreground/[0.015]",
                    isOver && "ring-2 ring-neon-cyan/30 bg-neon-cyan/[0.03]"
                  )}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {/* Column header */}
                  <div className={cn("flex items-center justify-between rounded-t-xl border-b px-4 py-3", col.borderColor, col.headerBg)}>
                    <div className="flex items-center gap-2.5">
                      <ColIcon className={cn("h-4 w-4", col.color)} />
                      <span className={cn("text-[13px] font-bold", col.color)}>
                        {col.label}
                      </span>
                    </div>
                    <span className={cn(
                      "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                      colEvents.length > 0
                        ? `${col.headerBg} ${col.color}`
                        : "bg-foreground/[0.04] text-foreground/25"
                    )}>
                      {colEvents.length}
                    </span>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
                    {colEvents.length === 0 && (
                      <div className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 transition-colors",
                        isOver ? "border-neon-cyan/30 bg-neon-cyan/[0.03]" : "border-foreground/[0.06]"
                      )}>
                        <p className="text-[11px] text-foreground/20">
                          {isOver ? "Solte aqui" : "Arraste cards para ca"}
                        </p>
                      </div>
                    )}
                    {colEvents.map((ev) => {
                      const c = COLOR_CLASSES[ev.color];
                      const evDate = new Date(ev._dateKey + "T12:00:00");
                      const TypeIcon = getTypeIcon(ev.type);
                      const isDragging = draggedEvent?.id === ev.id;

                      return (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={() => handleDragStart(ev)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setModalEvent(ev)}
                          className={cn(
                            "group cursor-grab rounded-xl border bg-background/60 p-3 transition-all hover:shadow-lg hover:border-foreground/[0.15] active:cursor-grabbing",
                            c.border,
                            isDragging && "opacity-40 scale-95"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {/* Drag handle */}
                            <div className="mt-0.5 shrink-0 text-foreground/10 transition-colors group-hover:text-foreground/25">
                              <GripVertical className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md", c.bg)}>
                                  <TypeIcon className={cn("h-2.5 w-2.5", c.text)} />
                                </div>
                                <span className="text-[12px] font-semibold text-foreground/80">
                                  {ev.title}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className="text-[10px] text-foreground/35">
                                  {evDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                                </span>
                                {ev.time && (
                                  <span className="rounded bg-foreground/[0.06] px-1 py-0.5 font-mono text-[9px] font-semibold tabular-nums text-foreground/45">
                                    {ev.time}
                                  </span>
                                )}
                              </div>
                              {ev.description && (
                                <p className="mt-1 text-[10px] leading-relaxed text-foreground/25">{ev.description}</p>
                              )}
                              <div className="mt-2 flex items-center gap-1.5">
                                <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider", c.bg, c.text)}>
                                  {getTypeLabel(ev.type)}
                                </span>
                                {ev.agent && (
                                  <span className="rounded-full bg-neon-purple/10 px-1.5 py-0.5 text-[8px] font-medium text-neon-purple">
                                    {ev.agent}
                                  </span>
                                )}
                                {ev.time && ev.duration > 0 && (
                                  <span className="ml-auto text-[9px] text-foreground/20">{formatDuration(ev.duration)}</span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeEvent(ev._dateKey, ev.id)}
                              className="shrink-0 text-foreground/0 transition-colors group-hover:text-foreground/20 hover:!text-red-400"
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

        {/* ── Right Sidebar ── */}
        <div className="w-[340px] shrink-0 overflow-y-auto border-l border-foreground/[0.08] bg-foreground/[0.02]">
          {/* Sidebar header */}
          <div className="border-b border-foreground/[0.06] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-cyan/10 shadow-sm">
                <CalendarIcon className="h-5 w-5 text-neon-cyan" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-foreground/85">
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "short",
                  })},{" "}
                  {selectedDate.getDate()}{" "}
                  {MONTHS[selectedDate.getMonth()].slice(0, 3)}
                </p>
                <p className="text-[11px] text-foreground/35">
                  {sortedEvents.length} evento{sortedEvents.length !== 1 ? "s" : ""} neste dia
                </p>
              </div>
            </div>
          </div>

          {/* Month summary stats */}
          <div className="grid grid-cols-3 gap-px border-b border-foreground/[0.06] bg-foreground/[0.04]">
            <div className="bg-background/80 px-3 py-2.5 text-center">
              <p className="text-[15px] font-bold tabular-nums text-neon-cyan">{monthStats.notes}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/25">Notas</p>
            </div>
            <div className="bg-background/80 px-3 py-2.5 text-center">
              <p className="text-[15px] font-bold tabular-nums text-neon-purple">{monthStats.agents}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/25">Agentes</p>
            </div>
            <div className="bg-background/80 px-3 py-2.5 text-center">
              <p className="text-[15px] font-bold tabular-nums text-neon-orange">{monthStats.contexts}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/25">Servicos</p>
            </div>
          </div>

          {/* Event timeline */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground/30">
                Timeline
              </h3>
              {sortedEvents.length > 0 && (
                <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[9px] font-bold tabular-nums text-foreground/35">
                  {sortedEvents.length}
                </span>
              )}
            </div>

            {sortedEvents.length > 0 && (
              <div className="space-y-0">
                {sortedEvents.map((ev, idx) => {
                  const c = COLOR_CLASSES[ev.color];
                  const isLast = idx === sortedEvents.length - 1;
                  const TypeIcon = getTypeIcon(ev.type);
                  return (
                    <div key={ev.id} className="group flex gap-3">
                      {/* Timeline rail */}
                      <div className="flex w-5 flex-col items-center">
                        <div className={cn("h-3 w-3 shrink-0 rounded-full border-2 shadow-sm", c.border, c.bg, c.shadow)} />
                        {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-foreground/[0.08] to-foreground/[0.03]" />}
                      </div>

                      {/* Event card */}
                      <div className={cn("mb-3 flex-1 rounded-xl border px-3 py-2.5 transition-all hover:shadow-md", c.border, c.bg)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <TypeIcon className={cn("h-3 w-3 shrink-0", c.text)} />
                              {ev.time ? (
                                <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-foreground/65">{ev.time}</span>
                              ) : (
                                <span className="shrink-0 text-[9px] text-foreground/30">dia todo</span>
                              )}
                              <span className="text-[12px] font-semibold text-foreground/85">{ev.title}</span>
                            </div>
                            {ev.description && <p className="mt-1 text-[10px] leading-relaxed text-foreground/35">{ev.description}</p>}
                            <div className="mt-1 flex items-center gap-2">
                              <span className={cn("text-[9px] font-bold uppercase tracking-wider", c.text)}>
                                {getTypeLabel(ev.type)}
                              </span>
                              {ev.time && ev.duration > 0 && (
                                <span className="text-[9px] text-foreground/25">{formatDuration(ev.duration)}</span>
                              )}
                              {ev.agent && (
                                <span className="rounded-full bg-neon-purple/10 px-1.5 py-0.5 text-[8px] font-medium text-neon-purple">
                                  {ev.agent}
                                </span>
                              )}
                              {eventIdsWithAutomations.has(ev.id) && (
                                <span className="flex items-center gap-0.5 rounded-full bg-neon-green/10 px-1.5 py-0.5 text-[8px] font-medium text-neon-green" title="Automacao vinculada">
                                  <Zap className="h-2 w-2" /> Auto
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEvent(selectedDateKey, ev.id)}
                            className="shrink-0 text-foreground/0 transition-colors group-hover:text-foreground/25 hover:!text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sortedEvents.length === 0 && addMode === null && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-foreground/[0.08] py-8">
                <CalendarIcon className="h-6 w-6 text-foreground/10" />
                <p className="text-[11px] font-medium text-foreground/25">Nenhum evento neste dia</p>
                <p className="text-[10px] text-foreground/15">Clique abaixo para adicionar</p>
              </div>
            )}

            {/* ── Automations ── */}
            {addMode === null && (
              <div className="mt-4 border-t border-foreground/[0.06] pt-4">
                <AutomationSection eventId={sortedEvents[0]?.id} />
              </div>
            )}

            {/* ── Quick Actions ── */}
            {addMode === null && (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setAddMode("prompt")}
                  className="flex w-full items-center gap-2 rounded-xl border border-neon-green/15 bg-neon-green/[0.04] px-3 py-2.5 text-left text-[11px] font-medium text-foreground/40 transition-all hover:border-neon-green/30 hover:text-neon-green/80 hover:shadow-sm"
                >
                  <Blocks className="h-4 w-4 shrink-0 text-neon-green/50" />
                  <span>Descreva sua agenda com horarios...</span>
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAddMode("note")} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] px-2 py-2 text-[11px] font-medium text-foreground/45 transition-all hover:border-neon-cyan/25 hover:bg-neon-cyan/[0.05] hover:text-neon-cyan">
                    <StickyNote className="h-3.5 w-3.5" /> Nota
                  </button>
                  <button type="button" onClick={() => setAddMode("agent")} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] px-2 py-2 text-[11px] font-medium text-foreground/45 transition-all hover:border-neon-purple/25 hover:bg-neon-purple/[0.05] hover:text-neon-purple">
                    <Bot className="h-3.5 w-3.5" /> Agente
                  </button>
                  <button type="button" onClick={() => setAddMode("context")} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] px-2 py-2 text-[11px] font-medium text-foreground/45 transition-all hover:border-neon-orange/25 hover:bg-neon-orange/[0.05] hover:text-neon-orange">
                    <Layers className="h-3.5 w-3.5" /> Contexto
                  </button>
                </div>
              </div>
            )}

            {/* ── Add Forms ── */}
            <AnimatePresence mode="wait">
              {addMode === "prompt" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-2.5 rounded-xl border border-neon-green/20 bg-neon-green/[0.04] p-3.5">
                    <div className="flex items-center gap-2">
                      <Blocks className="h-3.5 w-3.5 text-neon-green/70" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neon-green/70">
                        Prompt de Horarios
                      </span>
                    </div>
                    <textarea
                      value={promptText}
                      onChange={(e) => handlePromptChange(e.target.value)}
                      placeholder={"Ex: standup 9h, code review 10:30,\nplanning 14h, deploy 18h"}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-foreground/[0.08] bg-black/20 px-3 py-2 text-[12px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-green/30"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setAddMode(null); setPromptText(""); setParsedPreview([]); }
                      }}
                    />
                    {parsedPreview.length > 0 && (
                      <div className="space-y-1.5 rounded-lg border border-foreground/[0.06] bg-black/15 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/30">
                          Interpretado ({parsedPreview.length})
                        </p>
                        {parsedPreview.map((item, idx) => {
                          const c = COLOR_CLASSES[item.color];
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-11 shrink-0 font-mono text-[11px] font-bold tabular-nums text-foreground/55">{item.time}</span>
                              <div className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
                              <span className="text-[11px] text-foreground/60">{item.title}</span>
                              <span className={cn("ml-auto text-[9px] font-bold uppercase", c.text)}>
                                {getTypeLabel(item.type as CalendarEventType)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setAddMode(null); setPromptText(""); setParsedPreview([]); }} className="rounded-lg px-3 py-1.5 text-[11px] text-foreground/35 hover:text-foreground/55">
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handlePromptSubmit}
                        disabled={parsedPreview.length === 0}
                        className="flex items-center gap-1.5 rounded-lg border border-neon-green/30 bg-neon-green/12 px-3 py-1.5 text-[11px] font-semibold text-neon-green transition-all hover:bg-neon-green/20 disabled:opacity-30"
                      >
                        <Send className="h-3 w-3" />
                        Agendar {parsedPreview.length > 0 ? `(${parsedPreview.length})` : ""}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {addMode === "note" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-2.5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/[0.04] p-3.5">
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-3.5 w-3.5 text-neon-cyan/70" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neon-cyan/70">Nova Nota</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Titulo..."
                        className="flex-1 rounded-lg border border-foreground/[0.08] bg-black/20 px-3 py-2 text-[12px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-cyan/30"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddNote();
                          if (e.key === "Escape") setAddMode(null);
                        }}
                      />
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/25" />
                        <input type="time" value={noteTime} onChange={(e) => setNoteTime(e.target.value)} className="w-[88px] rounded-lg border border-foreground/[0.08] bg-black/20 py-2 pl-7 pr-1 text-[12px] tabular-nums text-foreground/60 outline-none focus:border-neon-cyan/30 [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                    </div>
                    <select
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full rounded-lg border border-foreground/[0.08] bg-black/20 px-3 py-2 text-[12px] text-foreground/60 outline-none focus:border-neon-cyan/30"
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
                      className="w-full resize-none rounded-lg border border-foreground/[0.08] bg-black/20 px-3 py-2 text-[12px] text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-cyan/30"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setAddMode(null); setNoteTitle(""); setNoteDesc(""); setNoteTime(""); setAssignee(""); }} className="rounded-lg px-3 py-1.5 text-[11px] text-foreground/35 hover:text-foreground/55">
                        Cancelar
                      </button>
                      <button type="button" onClick={handleAddNote} disabled={!noteTitle.trim()} className="flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/12 px-3 py-1.5 text-[11px] font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-30">
                        <Check className="h-3 w-3" /> Salvar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {addMode === "agent" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-2 rounded-xl border border-neon-purple/20 bg-neon-purple/[0.04] p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-neon-purple/70" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neon-purple/70">Agendar Agente</span>
                      </div>
                      <button type="button" onClick={() => setAddMode(null)} className="text-[11px] text-foreground/35 hover:text-foreground/55">Cancelar</button>
                    </div>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/25" />
                      <input type="time" value={agentTime} onChange={(e) => setAgentTime(e.target.value)} className="w-full rounded-lg border border-foreground/[0.08] bg-black/20 py-2 pl-8 pr-2 text-[12px] tabular-nums text-foreground/60 outline-none focus:border-neon-purple/30 [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                    <div className="space-y-1.5">
                      {AGENTS.map((agent) => (
                        <button key={agent.id} type="button" onClick={() => handleAddAgent(agent)} className="flex w-full items-center gap-2.5 rounded-lg border border-foreground/[0.06] bg-black/15 px-3 py-2 text-left transition-all hover:border-neon-purple/25 hover:bg-neon-purple/[0.06]">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-neon-purple/10">
                            <Bot className="h-3 w-3 text-neon-purple" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-foreground/75">{agent.name}</p>
                            <p className="text-[10px] text-foreground/30">{agent.role}</p>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-foreground/15" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {addMode === "context" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-2 rounded-xl border border-neon-orange/20 bg-neon-orange/[0.04] p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-neon-orange/70" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neon-orange/70">Agendar Servico</span>
                      </div>
                      <button type="button" onClick={() => setAddMode(null)} className="text-[11px] text-foreground/35 hover:text-foreground/55">Cancelar</button>
                    </div>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/25" />
                      <input type="time" value={ctxTime} onChange={(e) => setCtxTime(e.target.value)} className="w-full rounded-lg border border-foreground/[0.08] bg-black/20 py-2 pl-8 pr-2 text-[12px] tabular-nums text-foreground/60 outline-none focus:border-neon-orange/30 [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                    <div className="space-y-1.5">
                      {CONTEXTS.map((ctx) => (
                        <button key={ctx.id} type="button" onClick={() => handleAddContext(ctx)} className="flex w-full items-center gap-2.5 rounded-lg border border-foreground/[0.06] bg-black/15 px-3 py-2 text-left transition-all hover:border-neon-orange/25 hover:bg-neon-orange/[0.06]">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-neon-orange/10">
                            <Layers className="h-3 w-3 text-neon-orange" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-foreground/75">{ctx.label}</p>
                            <p className="text-[10px] text-foreground/30">{ctx.desc}</p>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-foreground/15" />
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-foreground/[0.12] bg-background shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-foreground/[0.06] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon-purple/10">
                    <UserPlus className="h-4.5 w-4.5 text-neon-purple" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground/90">Convidar para o calendario</h2>
                    <p className="text-[11px] text-foreground/35">Compartilhe com parceiros ou agentes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteEmail(""); setInviteSent(false); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Scope selector */}
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-foreground/30">
                    Escopo do convite
                  </p>
                  <div className="flex gap-2">
                    {([
                      { value: "day" as const, label: "Este dia", desc: selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) },
                      { value: "month" as const, label: "Este mes", desc: `${MONTHS[currentMonth].slice(0, 3)} ${currentYear}` },
                      { value: "full" as const, label: "Completo", desc: "Todo o calendario" },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setInviteScope(opt.value)}
                        className={cn(
                          "flex flex-1 flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition-all",
                          inviteScope === opt.value
                            ? "border-neon-purple/30 bg-neon-purple/[0.06] shadow-sm"
                            : "border-foreground/[0.06] bg-foreground/[0.02] hover:border-foreground/[0.12]"
                        )}
                      >
                        <span className={cn(
                          "text-[11px] font-semibold",
                          inviteScope === opt.value ? "text-neon-purple" : "text-foreground/55"
                        )}>
                          {opt.label}
                        </span>
                        <span className="text-[9px] text-foreground/25">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Link */}
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-foreground/30">
                    Link de convite
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] px-3.5 py-2.5">
                    <Link2 className="h-4 w-4 shrink-0 text-foreground/20" />
                    <span className="flex-1 truncate font-mono text-[11px] text-foreground/45">
                      {inviteLink}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                        inviteCopied
                          ? "bg-neon-green/15 text-neon-green"
                          : "bg-foreground/[0.06] text-foreground/45 hover:bg-foreground/[0.10] hover:text-foreground/65"
                      )}
                    >
                      {inviteCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {inviteCopied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* Email invite */}
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-foreground/30">
                    Enviar por email
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@parceiro.com"
                      className="flex-1 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] px-3.5 py-2.5 text-[12px] text-foreground/70 placeholder:text-foreground/20 outline-none transition-colors focus:border-neon-purple/30"
                      onKeyDown={(e) => { if (e.key === "Enter") handleSendInvite(); }}
                    />
                    <button
                      type="button"
                      onClick={handleSendInvite}
                      disabled={!inviteEmail.trim() || inviteSent}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[11px] font-semibold transition-all disabled:opacity-40",
                        inviteSent
                          ? "border border-neon-green/30 bg-neon-green/10 text-neon-green"
                          : "border border-neon-purple/25 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20"
                      )}
                    >
                      {inviteSent ? (
                        <><Check className="h-3.5 w-3.5" /> Enviado!</>
                      ) : (
                        <><Send className="h-3.5 w-3.5" /> Enviar</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick assign to agents */}
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-foreground/30">
                    Atribuir a agente
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AGENTS.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        className="flex items-center gap-2 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-2.5 py-2 text-left transition-all hover:border-neon-purple/25 hover:bg-neon-purple/[0.05]"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neon-purple/10">
                          <Bot className="h-2.5 w-2.5 text-neon-purple" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-foreground/65">{agent.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between border-t border-foreground/[0.06] px-6 py-3.5">
                <p className="text-[10px] text-foreground/20">
                  {sortedEvents.length} evento{sortedEvents.length !== 1 ? "s" : ""} no dia selecionado
                </p>
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteEmail(""); setInviteSent(false); }}
                  className="rounded-lg border border-foreground/[0.08] px-4 py-1.5 text-[11px] font-semibold text-foreground/45 transition-all hover:bg-foreground/[0.04] hover:text-foreground/65"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Kanban card detail modal */}
      <KanbanCardModal event={modalEvent} onClose={() => setModalEvent(null)} />
    </div>
  );
}
