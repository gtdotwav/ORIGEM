import {
  sortCalendarEventsChronologically,
  toDateKey,
  useCalendarStore,
  type CalendarEvent,
} from "@/stores/calendar-store";

type CalendarContextSource = "prompt" | "selected" | "today";

export interface CalendarPromptContext {
  source: CalendarContextSource;
  dateKeys: string[];
  eventCount: number;
  promptBlock: string;
  metadata: {
    source: CalendarContextSource;
    dateKeys: string[];
    eventCount: number;
    summary: string;
  };
}

function shiftDays(baseDate: Date, amount: number) {
  const shifted = new Date(baseDate);
  shifted.setDate(shifted.getDate() + amount);
  return shifted;
}

function isCalendarRelatedPrompt(prompt: string) {
  return /\b(calend[aá]rio|agenda|compromissos?|eventos?|hor[aá]rios?|rotina|cronograma|schedule|timeline)\b/i.test(
    prompt
  );
}

function parseExplicitDateKeys(prompt: string, referenceDate: Date) {
  const dateKeys = new Set<string>();

  for (const match of prompt.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) {
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    const parsed = new Date(year, month - 1, day);

    if (!Number.isNaN(parsed.getTime())) {
      dateKeys.add(toDateKey(parsed));
    }
  }

  for (const match of prompt.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)) {
    const day = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const rawYear = match[3];
    const year = rawYear
      ? rawYear.length === 2
        ? 2000 + Number.parseInt(rawYear, 10)
        : Number.parseInt(rawYear, 10)
      : referenceDate.getFullYear();
    const parsed = new Date(year, month - 1, day);

    if (!Number.isNaN(parsed.getTime())) {
      dateKeys.add(toDateKey(parsed));
    }
  }

  if (/\b(hoje|today|hoy)\b/i.test(prompt)) {
    dateKeys.add(toDateKey(referenceDate));
  }

  if (/\b(amanh[aã]|tomorrow|mañana)\b/i.test(prompt)) {
    dateKeys.add(toDateKey(shiftDays(referenceDate, 1)));
  }

  if (/\b(ontem|yesterday|ayer)\b/i.test(prompt)) {
    dateKeys.add(toDateKey(shiftDays(referenceDate, -1)));
  }

  return Array.from(dateKeys).sort();
}

function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map((value) => Number.parseInt(value, 10));
  const date = new Date(year, (month || 1) - 1, day || 1);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatEventLine(event: CalendarEvent) {
  const time = event.time || "sem horario";
  const pieces = [
    `- ${event.dateKey} ${time}`,
    event.title.trim(),
    `tipo=${event.type}`,
    `duracao=${event.duration}min`,
  ];

  if (event.description.trim()) {
    pieces.push(`descricao=${event.description.trim()}`);
  }

  if (event.agent) {
    pieces.push(`agente=${event.agent}`);
  }

  if (event.context) {
    pieces.push(`contexto=${event.context}`);
  }

  return pieces.join(" | ");
}

function buildSummary(dateKeys: string[], events: CalendarEvent[]) {
  if (dateKeys.length === 1) {
    return `${formatDateKey(dateKeys[0])} com ${events.length} item(ns)`;
  }

  return `${dateKeys.length} dias selecionados com ${events.length} item(ns)`;
}

export function buildCalendarPromptContext(prompt: string): CalendarPromptContext | null {
  if (!isCalendarRelatedPrompt(prompt)) {
    return null;
  }

  const store = useCalendarStore.getState();
  const referenceDate = new Date();
  const explicitDateKeys = parseExplicitDateKeys(prompt, referenceDate);

  let source: CalendarContextSource = "today";
  let dateKeys: string[] = [];

  if (explicitDateKeys.length > 0) {
    source = "prompt";
    dateKeys = explicitDateKeys;
  } else if (store.activeDateKeys.length > 0) {
    source = "selected";
    dateKeys = store.activeDateKeys;
  } else {
    source = "today";
    dateKeys = [toDateKey(referenceDate)];
  }

  const events = sortCalendarEventsChronologically(
    dateKeys.flatMap((dateKey) => store.events[dateKey] ?? [])
  );
  const summary = buildSummary(dateKeys, events);
  const lines =
    events.length > 0
      ? events.map(formatEventLine)
      : dateKeys.map((dateKey) => `- ${dateKey} | sem eventos cadastrados`);

  return {
    source,
    dateKeys,
    eventCount: events.length,
    promptBlock: [
      "CALENDAR_CONTEXT",
      `source=${source}`,
      `summary=${summary}`,
      "events_in_chronological_order:",
      ...lines,
      "Use este contexto como fonte de verdade ao responder sobre agenda, ordem do dia, conflitos, lacunas e proximos compromissos.",
    ].join("\n"),
    metadata: {
      source,
      dateKeys,
      eventCount: events.length,
      summary,
    },
  };
}

export function mergeCalendarMetadata(
  metadata: Record<string, unknown> | undefined,
  calendarContext: CalendarPromptContext | null
) {
  if (!calendarContext) {
    return metadata;
  }

  return {
    ...(metadata ?? {}),
    calendarContext: calendarContext.metadata,
  };
}
