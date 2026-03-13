"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "motion/react";
import { Calendar as CalendarIcon, Clock3, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDateKey, useCalendarStore } from "@/stores/calendar-store";

const EVENT_STYLES = {
  agent:
    "border-[rgba(177,152,216,0.16)] bg-[rgba(177,152,216,0.06)] before:bg-[rgba(217,201,246,0.9)]",
  context:
    "border-[rgba(208,186,143,0.16)] bg-[rgba(208,186,143,0.06)] before:bg-[rgba(236,219,183,0.92)]",
  default:
    "border-white/[0.06] bg-white/[0.025] before:bg-white/28",
} as const;

export function CalendarWidget({
  variant = "standalone",
  className,
}: {
  variant?: "standalone" | "panel";
  className?: string;
}) {
  const events = useCalendarStore((s) => s.events);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(today, i - 1)),
    [today]
  );

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

  const isPanel = variant === "panel";

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-48 rounded-[32px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]",
          isPanel ? "w-full" : "mx-auto mt-8 w-full max-w-[720px]",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        isPanel ? "w-full" : "mx-auto mt-6 w-full max-w-[720px] px-1 pb-6",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-[34px] border border-white/[0.06] bg-[radial-gradient(circle_at_top_left,rgba(208,186,143,0.08),transparent_30%),linear-gradient(180deg,rgba(16,16,17,0.92),rgba(8,8,9,0.98))] shadow-[0_28px_110px_-40px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(208,186,143,0.28)] to-transparent" />

        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(208,186,143,0.16)] bg-[rgba(208,186,143,0.08)] text-[#ead7b1]">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">
                Agenda
              </p>
              <h2 className="mt-1 text-sm font-semibold text-white/88">
                {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
              </h2>
            </div>
          </div>

          <Link
            href="/dashboard/calendar"
            title="Abrir calendario completo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/34 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white/80"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-white/[0.04] px-5 py-4 scrollbar-none">
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
                  "relative flex min-w-[62px] flex-col items-center justify-center rounded-[22px] border px-3 py-3.5 transition-all duration-300",
                  isSelected
                    ? "border-[rgba(208,186,143,0.26)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] shadow-[0_18px_34px_-20px_rgba(208,186,143,0.5)]"
                    : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.045]"
                )}
              >
                <span
                  className={cn(
                    "mb-1 text-[9px] font-semibold uppercase tracking-[0.22em]",
                    isSelected
                      ? "text-[#ead7b1]"
                      : isCurrentToday
                        ? "text-white/70"
                        : "text-white/34"
                  )}
                >
                  {format(day, "EEEEE", { locale: ptBR }).substring(0, 1)}
                </span>
                <span
                  className={cn(
                    "text-lg font-semibold",
                    isSelected ? "text-white" : "text-white/78"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 ? (
                  <div className="mt-2 flex gap-1">
                    {dayEvents.slice(0, 3).map((_, index) => (
                      <span
                        key={index}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          isSelected ? "bg-[#ead7b1]" : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 h-1 w-1 rounded-full bg-transparent" />
                )}
              </button>
            );
          })}
        </div>

        <div className="min-h-[184px] bg-[linear-gradient(180deg,rgba(255,255,255,0.012),rgba(0,0,0,0.04))] p-5">
          <AnimatePresence mode="popLayout">
            {selectedEvents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex h-full flex-col items-center justify-center py-6 text-center"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/42">
                  <Clock3 className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-white/70">Sem blocos neste dia.</p>
                <p className="mt-1 max-w-[18rem] text-[12px] leading-relaxed text-white/42">
                  Use o calendario para transformar uma decisao em agenda real.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-2.5">
                {selectedEvents.map((event) => {
                  const style =
                    event.type === "agent"
                      ? EVENT_STYLES.agent
                      : event.type === "context"
                        ? EVENT_STYLES.context
                        : EVENT_STYLES.default;

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className={cn(
                        "relative overflow-hidden rounded-[20px] border pl-4 pr-3 py-3 transition-colors before:absolute before:bottom-4 before:left-0 before:top-4 before:w-px",
                        style
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 min-w-10 items-center justify-center rounded-full border border-white/[0.06] bg-black/24 px-2 text-[10px] font-semibold text-white/72">
                          {event.time || "--"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-white/88">
                            {event.title}
                          </p>
                          {event.description ? (
                            <p className="mt-1 text-[11px] leading-relaxed text-white/46">
                              {event.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
