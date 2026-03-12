"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { Calendar as CalendarIcon, Clock, MoreHorizontal, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarStore, toDateKey } from "@/stores/calendar-store";

export function CalendarWidget() {
  const events = useCalendarStore((s) => s.events);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Generate a week of days starting from yesterday
  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(today, i - 1));
  }, [today]);

  const selectedEvents = useMemo(() => {
    if (!mounted) return [];
    const dateKey = toDateKey(selectedDate);
    const dayEvents = events[dateKey] || [];
    
    return [...dayEvents].sort((a, b) => {
      if (!a.time && b.time) return -1;
      if (a.time && !b.time) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });
  }, [events, selectedDate, mounted]);

  if (!mounted) {
    return <div className="mt-8 h-40 w-full max-w-[720px] mx-auto rounded-3xl border border-white/[0.04] bg-white/[0.01]" />;
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-[720px] px-1 pb-6">
      <div className="overflow-hidden rounded-[28px] border border-white/[0.04] bg-black/40 shadow-xl backdrop-blur-3xl md:rounded-[32px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-neon-cyan" />
            <h2 className="text-[13px] font-semibold text-foreground/80">Agenda Inteligente</h2>
            <span className="ml-2 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-foreground/40 hidden sm:inline-block">
              {format(selectedDate, "MMMM", { locale: ptBR })}
            </span>
          </div>
          <Link
            href="/dashboard/calendar"
            title="Abrir calendario completo"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-colors hover:bg-white/[0.06] hover:text-foreground/70"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Horizontal Calendar Strip */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/[0.02] bg-white/[0.01] px-5 py-4 scrollbar-none">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentToday = isSameDay(day, today);
            
            const dayKey = toDateKey(day);
            const dayEvents = events[dayKey] || [];
            
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative flex min-w-[54px] flex-col items-center justify-center rounded-[16px] border px-2 py-3 transition-all",
                  isSelected
                    ? "border-neon-cyan/30 bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,255,255,0.15)]"
                    : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.08]"
                )}
              >
                <span className={cn(
                  "mb-1 text-[9px] font-medium uppercase tracking-widest",
                  isSelected ? "text-neon-cyan" : "text-foreground/40"
                )}>
                  {format(day, "eeeee", { locale: ptBR }).substring(0, 3)}
                </span>
                <span className={cn(
                  "text-lg font-semibold",
                  isSelected ? "text-white" : "text-foreground/80",
                  isCurrentToday && !isSelected && "text-neon-cyan/70"
                )}>
                  {format(day, "d")}
                </span>
                
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-[6px] flex gap-0.5">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <span key={i} className={cn("h-1 w-1 rounded-full", isSelected ? "bg-neon-cyan" : "bg-foreground/30")} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Daily Schedule */}
        <div className="bg-black/20 p-5 min-h-[140px]">
          <AnimatePresence mode="popLayout">
            {selectedEvents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex h-full flex-col items-center justify-center py-4 text-center"
              >
                <div className="mb-3 rounded-full border border-white/[0.04] bg-white/[0.02] p-2.5">
                  <Clock className="h-4 w-4 text-foreground/30" />
                </div>
                <p className="text-[12px] font-medium text-foreground/40">Agenda livre para criar.</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((evt) => (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group flex items-center gap-3 rounded-[14px] border px-3 py-2.5 transition-colors",
                      evt.type === "agent" ? "border-neon-purple/20 bg-neon-purple/5 hover:bg-neon-purple/10" :
                      evt.type === "context" ? "border-neon-pink/20 bg-neon-pink/5 hover:bg-neon-pink/10" :
                      "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-black/60 shadow-inner">
                      <span className="text-[10px] font-bold text-foreground/70">
                        {evt.time || "--"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pl-1">
                      <p className="truncate text-[13px] font-medium text-foreground/90">
                        {evt.title}
                      </p>
                      {evt.description && (
                        <p className="truncate text-[11px] text-foreground/40">
                          {evt.description}
                        </p>
                      )}
                    </div>
                    <button className="opacity-0 transition-opacity group-hover:opacity-100 p-2 rounded-lg hover:bg-white/[0.06]">
                      <MoreHorizontal className="h-4 w-4 text-foreground/40 hover:text-foreground/80" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
