// ────────────────────────────────────────────────
// ORIGEM — Cron expression utilities
// ────────────────────────────────────────────────

export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export type CronFrequency = "once" | "hourly" | "daily" | "weekly" | "monthly" | "custom";

const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function parseCron(expression: string): CronParts {
  const parts = expression.trim().split(/\s+/);
  return {
    minute: parts[0] ?? "*",
    hour: parts[1] ?? "*",
    dayOfMonth: parts[2] ?? "*",
    month: parts[3] ?? "*",
    dayOfWeek: parts[4] ?? "*",
  };
}

export function toCronExpression(parts: CronParts): string {
  return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
}

export function frequencyToDefaults(freq: CronFrequency, time = "09:00"): CronParts {
  const [h, m] = time.split(":").map(Number);
  const minute = String(m ?? 0);
  const hour = String(h ?? 9);

  switch (freq) {
    case "once":
      return { minute, hour, dayOfMonth: "*", month: "*", dayOfWeek: "*" };
    case "hourly":
      return { minute, hour: "*", dayOfMonth: "*", month: "*", dayOfWeek: "*" };
    case "daily":
      return { minute, hour, dayOfMonth: "*", month: "*", dayOfWeek: "*" };
    case "weekly":
      return { minute, hour, dayOfMonth: "*", month: "*", dayOfWeek: "1" };
    case "monthly":
      return { minute, hour, dayOfMonth: "1", month: "*", dayOfWeek: "*" };
    case "custom":
      return { minute, hour, dayOfMonth: "*", month: "*", dayOfWeek: "*" };
  }
}

export function describeCron(expression: string): string {
  const p = parseCron(expression);

  const time = p.hour !== "*" && p.minute !== "*"
    ? `as ${p.hour.padStart(2, "0")}:${p.minute.padStart(2, "0")}`
    : p.hour !== "*"
      ? `a cada hora ${p.hour}`
      : "";

  // Every minute
  if (p.minute === "*" && p.hour === "*" && p.dayOfMonth === "*" && p.month === "*" && p.dayOfWeek === "*") {
    return "A cada minuto";
  }

  // Hourly
  if (p.hour === "*" && p.dayOfMonth === "*" && p.month === "*" && p.dayOfWeek === "*") {
    return `A cada hora no minuto ${p.minute}`;
  }

  // Weekly
  if (p.dayOfWeek !== "*" && p.dayOfMonth === "*") {
    const days = p.dayOfWeek.split(",").map((d) => {
      const n = parseInt(d, 10);
      return WEEKDAY_NAMES[n] ?? d;
    });
    return `Toda ${days.join(", ")} ${time}`;
  }

  // Monthly
  if (p.dayOfMonth !== "*" && p.month === "*" && p.dayOfWeek === "*") {
    return `Todo dia ${p.dayOfMonth} do mes ${time}`;
  }

  // Specific month
  if (p.month !== "*") {
    const months = p.month.split(",").map((m) => {
      const n = parseInt(m, 10);
      return MONTH_NAMES[n - 1] ?? m;
    });
    return `Em ${months.join(", ")} dia ${p.dayOfMonth === "*" ? "todos" : p.dayOfMonth} ${time}`;
  }

  // Daily
  if (p.dayOfMonth === "*" && p.dayOfWeek === "*" && p.month === "*") {
    return `Todo dia ${time}`;
  }

  return `Cron: ${expression}`;
}

export function calculateNextRun(expression: string, from = new Date()): Date {
  const p = parseCron(expression);

  const next = new Date(from);
  next.setSeconds(0, 0);

  const minute = p.minute === "*" ? -1 : parseInt(p.minute, 10);
  const hour = p.hour === "*" ? -1 : parseInt(p.hour, 10);
  const dom = p.dayOfMonth === "*" ? -1 : parseInt(p.dayOfMonth, 10);
  const dow = p.dayOfWeek === "*" ? -1 : parseInt(p.dayOfWeek, 10);

  // Advance at least 1 minute
  next.setMinutes(next.getMinutes() + 1);

  for (let i = 0; i < 525600; i++) {
    const matchMin = minute === -1 || next.getMinutes() === minute;
    const matchHour = hour === -1 || next.getHours() === hour;
    const matchDom = dom === -1 || next.getDate() === dom;
    const matchDow = dow === -1 || next.getDay() === dow;

    if (matchMin && matchHour && matchDom && matchDow) return next;

    next.setMinutes(next.getMinutes() + 1);
  }

  return next;
}

export function isValidCron(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const ranges = [
    [0, 59],  // minute
    [0, 23],  // hour
    [1, 31],  // day of month
    [1, 12],  // month
    [0, 7],   // day of week (0 and 7 = Sunday)
  ];

  return parts.every((part, i) => {
    if (part === "*") return true;
    const nums = part.split(",");
    return nums.every((n) => {
      const val = parseInt(n, 10);
      return !isNaN(val) && val >= ranges[i][0] && val <= ranges[i][1];
    });
  });
}
