"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  type CronFrequency,
  frequencyToDefaults,
  toCronExpression,
  describeCron,
  isValidCron,
} from "@/lib/cron";

const FREQUENCIES: { value: CronFrequency; label: string }[] = [
  { value: "hourly", label: "A cada hora" },
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
  { value: "custom", label: "Cron avancado" },
];

const WEEKDAYS = [
  { value: "0", label: "Dom" },
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
  { value: "6", label: "Sab" },
];

interface CronBuilderProps {
  value: string;
  onChange: (expression: string) => void;
}

export function CronBuilder({ value, onChange }: CronBuilderProps) {
  const [frequency, setFrequency] = useState<CronFrequency>("daily");
  const [time, setTime] = useState("09:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["1"]);
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [customCron, setCustomCron] = useState(value || "0 9 * * *");
  const [isCustomValid, setIsCustomValid] = useState(true);

  // Sync from external value on mount
  useEffect(() => {
    if (!value) return;
    // Try to detect frequency from expression
    const parts = value.split(/\s+/);
    if (parts.length !== 5) return;
    const [min, hour, dom, , dow] = parts;

    if (hour === "*") {
      setFrequency("hourly");
      setTime(`00:${min.padStart(2, "0")}`);
    } else if (dow !== "*") {
      setFrequency("weekly");
      setSelectedDays(dow.split(","));
      setTime(`${hour.padStart(2, "0")}:${min.padStart(2, "0")}`);
    } else if (dom !== "*") {
      setFrequency("monthly");
      setDayOfMonth(dom);
      setTime(`${hour.padStart(2, "0")}:${min.padStart(2, "0")}`);
    } else {
      setFrequency("daily");
      setTime(`${hour.padStart(2, "0")}:${min.padStart(2, "0")}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildExpression = (freq: CronFrequency, t: string, days: string[], dom: string): string => {
    const parts = frequencyToDefaults(freq, t);

    if (freq === "weekly") {
      parts.dayOfWeek = days.length > 0 ? days.join(",") : "1";
    }
    if (freq === "monthly") {
      parts.dayOfMonth = dom;
    }

    return toCronExpression(parts);
  };

  const handleFrequencyChange = (freq: CronFrequency) => {
    setFrequency(freq);
    if (freq === "custom") {
      setCustomCron(value || "0 9 * * *");
      return;
    }
    const expr = buildExpression(freq, time, selectedDays, dayOfMonth);
    onChange(expr);
  };

  const handleTimeChange = (t: string) => {
    setTime(t);
    if (frequency !== "custom") {
      onChange(buildExpression(frequency, t, selectedDays, dayOfMonth));
    }
  };

  const handleDayToggle = (day: string) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    if (next.length === 0) return;
    setSelectedDays(next);
    onChange(buildExpression("weekly", time, next, dayOfMonth));
  };

  const handleDomChange = (dom: string) => {
    setDayOfMonth(dom);
    onChange(buildExpression("monthly", time, selectedDays, dom));
  };

  const handleCustomChange = (expr: string) => {
    setCustomCron(expr);
    const valid = isValidCron(expr);
    setIsCustomValid(valid);
    if (valid) onChange(expr);
  };

  const currentExpr = frequency === "custom" ? customCron : buildExpression(frequency, time, selectedDays, dayOfMonth);
  const description = isValidCron(currentExpr) ? describeCron(currentExpr) : "Expressao invalida";

  return (
    <div className="space-y-3">
      {/* Frequency selector */}
      <div className="flex flex-wrap gap-1">
        {FREQUENCIES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFrequencyChange(f.value)}
            className={cn(
              "rounded-lg px-2 py-1 text-[10px] font-medium transition-all",
              frequency === f.value
                ? "border border-neon-green/40 bg-neon-green/15 text-neon-green"
                : "border border-foreground/[0.06] text-foreground/40 hover:border-foreground/[0.12] hover:text-foreground/60"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Time picker (for non-hourly) */}
      {frequency !== "hourly" && frequency !== "custom" && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground/30">Horario</span>
          <input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="rounded-md border border-foreground/[0.06] bg-black/20 px-2 py-1 text-[11px] tabular-nums text-foreground/70 outline-none focus:border-neon-green/30 [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
      )}

      {/* Minute picker for hourly */}
      {frequency === "hourly" && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground/30">No minuto</span>
          <input
            type="number"
            min={0}
            max={59}
            value={time.split(":")[1] ?? "0"}
            onChange={(e) => {
              const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
              const t = `00:${String(m).padStart(2, "0")}`;
              handleTimeChange(t);
            }}
            className="w-16 rounded-md border border-foreground/[0.06] bg-black/20 px-2 py-1 text-center text-[11px] tabular-nums text-foreground/70 outline-none focus:border-neon-green/30"
          />
        </div>
      )}

      {/* Day of week selector */}
      {frequency === "weekly" && (
        <div className="flex gap-1">
          {WEEKDAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => handleDayToggle(d.value)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-medium transition-all",
                selectedDays.includes(d.value)
                  ? "border border-neon-green/40 bg-neon-green/15 text-neon-green"
                  : "border border-foreground/[0.06] text-foreground/30 hover:text-foreground/50"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Day of month selector */}
      {frequency === "monthly" && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground/30">Dia do mes</span>
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(e) => handleDomChange(e.target.value)}
            className="w-16 rounded-md border border-foreground/[0.06] bg-black/20 px-2 py-1 text-center text-[11px] tabular-nums text-foreground/70 outline-none focus:border-neon-green/30"
          />
        </div>
      )}

      {/* Custom cron input */}
      {frequency === "custom" && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-5 gap-1 text-center text-[8px] text-foreground/25">
            <span>Min</span>
            <span>Hora</span>
            <span>Dia</span>
            <span>Mes</span>
            <span>Sem</span>
          </div>
          <input
            type="text"
            value={customCron}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="0 9 * * 1"
            className={cn(
              "w-full rounded-md border bg-black/20 px-2 py-1.5 font-mono text-[12px] text-foreground/70 outline-none transition-colors",
              isCustomValid
                ? "border-foreground/[0.06] focus:border-neon-green/30"
                : "border-red-500/30 focus:border-red-500/50"
            )}
          />
        </div>
      )}

      {/* Preview */}
      <div className="rounded-lg border border-neon-green/10 bg-neon-green/[0.03] px-2.5 py-2">
        <p className="text-[10px] font-medium text-neon-green/80">{description}</p>
        <p className="mt-0.5 font-mono text-[9px] text-foreground/25">{currentExpr}</p>
      </div>
    </div>
  );
}
