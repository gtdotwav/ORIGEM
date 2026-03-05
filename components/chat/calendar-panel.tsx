"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface CalendarPanelProps {
  open: boolean;
  onClose: () => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function CalendarPanel({ open, onClose }: CalendarPanelProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{ day: number; inMonth: boolean; date: Date }> = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({
        day: d,
        inMonth: false,
        date: new Date(currentYear, currentMonth - 1, d),
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        inMonth: true,
        date: new Date(currentYear, currentMonth, d),
      });
    }

    // Next month leading days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        inMonth: false,
        date: new Date(currentYear, currentMonth + 1, d),
      });
    }

    return cells;
  }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
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
    selectedDate &&
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Liquid glass panel */}
          <motion.div
            initial={{ opacity: 0, x: -16, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed left-12 top-1/2 z-50 -translate-y-1/2"
          >
            {/* Outer glow */}
            <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] blur-xl" />

            {/* Glass container */}
            <div
              className="relative w-72 overflow-hidden rounded-2xl border border-white/[0.12] shadow-2xl shadow-black/40"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              {/* Inner highlight — top edge refraction */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                    Calendario
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-white/20 transition-colors hover:bg-white/[0.08] hover:text-white/50"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between px-4 pb-3 pt-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.08] hover:text-white/60"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                >
                  {MONTHS[currentMonth]} {currentYear}
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.08] hover:text-white/60"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Separator — liquid glass style */}
              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* Weekday headers */}
              <div className="grid grid-cols-7 px-3 pt-3">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="pb-2 text-center text-[10px] font-medium uppercase tracking-wider text-white/25"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5 px-3 pb-4">
                {days.map((cell, i) => {
                  const _isToday = isToday(cell.date);
                  const _isSelected = isSelected(cell.date);

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDate(cell.date)}
                      className="group relative flex h-8 w-full items-center justify-center rounded-lg transition-all"
                    >
                      {/* Selected / today background */}
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
                        <div
                          className="absolute inset-0.5 rounded-lg"
                          style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                          }}
                        />
                      )}

                      {/* Hover glass effect */}
                      {!_isSelected && (
                        <div className="absolute inset-0.5 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                          style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                          }}
                        />
                      )}

                      {/* Day number */}
                      <span
                        className={`relative z-10 text-xs tabular-nums ${
                          _isSelected
                            ? "font-semibold text-neon-cyan"
                            : _isToday
                              ? "font-semibold text-white/90"
                              : cell.inMonth
                                ? "text-white/60 group-hover:text-white/80"
                                : "text-white/15"
                        }`}
                      >
                        {cell.day}
                      </span>

                      {/* Today dot */}
                      {_isToday && (
                        <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-neon-cyan shadow-[0_0_4px_rgba(0,210,210,0.5)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer — selected date info */}
              {selectedDate && (
                <>
                  <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                  <div className="px-4 py-3">
                    <p className="text-xs text-white/40">
                      {selectedDate.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-[10px] text-white/20">
                      Nenhum evento agendado
                    </p>
                  </div>
                </>
              )}

              {/* Bottom edge refraction */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
