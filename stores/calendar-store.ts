import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type CalendarEventType = "note" | "agent" | "context";

export interface CalendarEvent {
  id: string;
  dateKey: string; // "YYYY-MM-DD"
  type: CalendarEventType;
  title: string;
  description: string;
  /** Time in "HH:MM" 24h format, or empty for all-day */
  time: string;
  /** Duration in minutes (default 60) */
  duration: number;
  /** Agent template name (for type="agent") */
  agent?: string;
  /** Context/service label (for type="context") */
  context?: string;
  /** Color tag */
  color: "cyan" | "purple" | "green" | "orange" | "pink";
  createdAt: number;
}

interface CalendarState {
  events: Record<string, CalendarEvent[]>; // keyed by dateKey
  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => void;
  updateEvent: (dateKey: string, eventId: string, updates: Partial<Omit<CalendarEvent, "id" | "createdAt">>) => void;
  removeEvent: (dateKey: string, eventId: string) => void;
  getEventsForDate: (dateKey: string) => CalendarEvent[];
}

let counter = 0;
function genId() {
  return `cal-${Date.now()}-${++counter}`;
}

export const useCalendarStore = create<CalendarState>()(
  devtools(
    persist(
      (set, get) => ({
        events: {},

        addEvent: (input) => {
          const event: CalendarEvent = {
            ...input,
            id: genId(),
            createdAt: Date.now(),
          };
          set((s) => ({
            events: {
              ...s.events,
              [input.dateKey]: [...(s.events[input.dateKey] ?? []), event],
            },
          }));
        },

        updateEvent: (dateKey, eventId, updates) => {
          set((s) => ({
            events: {
              ...s.events,
              [dateKey]: (s.events[dateKey] ?? []).map((e) =>
                e.id === eventId ? { ...e, ...updates } : e
              ),
            },
          }));
        },

        removeEvent: (dateKey, eventId) => {
          set((s) => ({
            events: {
              ...s.events,
              [dateKey]: (s.events[dateKey] ?? []).filter((e) => e.id !== eventId),
            },
          }));
        },

        getEventsForDate: (dateKey) => {
          return get().events[dateKey] ?? [];
        },
      }),
      { name: "origem-calendar" }
    ),
    { name: "CalendarStore" }
  )
);

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ────────────────────────────────────────────────
// Natural language schedule parser
// Parses prompts like:
//   "reuniao as 14h, deploy as 18h, backup 22:30"
//   "9h standup, 10:30 code review, 14h planning, 17h retrospectiva"
//   "Planner 8h, Builder 10h, Analyst 14:00"
// ────────────────────────────────────────────────

interface ParsedScheduleItem {
  time: string;    // "HH:MM"
  title: string;
  type: CalendarEventType;
  agent?: string;
  context?: string;
  color: CalendarEvent["color"];
  duration: number;
}

const AGENT_KEYWORDS: Record<string, { name: string; role: string }> = {
  planner: { name: "Planner", role: "Arquiteto de plano" },
  builder: { name: "Builder", role: "Executor tecnico" },
  researcher: { name: "Researcher", role: "Mapeador de fontes" },
  analyst: { name: "Analyst", role: "Interpretador de dados" },
  designer: { name: "Designer", role: "Modelador de UX" },
  critic: { name: "Critic", role: "Validador de qualidade" },
};

const CONTEXT_KEYWORDS: Record<string, { label: string; desc: string }> = {
  deploy: { label: "Deploy", desc: "Deploy de producao" },
  "code review": { label: "Code Review", desc: "Revisao de codigo" },
  review: { label: "Code Review", desc: "Revisao de codigo" },
  backup: { label: "Backup", desc: "Backup de dados" },
  reuniao: { label: "Reuniao", desc: "Reuniao de alinhamento" },
  meeting: { label: "Reuniao", desc: "Reuniao de alinhamento" },
  sprint: { label: "Sprint", desc: "Planejamento de sprint" },
  monitor: { label: "Monitoramento", desc: "Check de infraestrutura" },
  monitoramento: { label: "Monitoramento", desc: "Check de infraestrutura" },
};

function parseTime(raw: string): string | null {
  // Matches: "14h", "14h30", "14:30", "9h", "09:00", "9:30"
  const m = raw.match(/^(\d{1,2})\s*[:h]\s*(\d{2})?$/i);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function parseDuration(text: string): number {
  const m = text.match(/(\d+)\s*(min|minuto|hora|hr|h)/i);
  if (!m) return 60;
  const val = parseInt(m[1], 10);
  if (/hora|hr|h/i.test(m[2])) return val * 60;
  return val;
}

export function parseSchedulePrompt(prompt: string): ParsedScheduleItem[] {
  const results: ParsedScheduleItem[] = [];

  // Split by comma, semicolon, newline, or " e "
  const segments = prompt.split(/[,;\n]|\be\b/).map((s) => s.trim()).filter(Boolean);

  for (const segment of segments) {
    // Find time pattern anywhere in the segment
    const timeMatch = segment.match(/(\d{1,2}\s*[:h]\s*\d{0,2})/i);
    if (!timeMatch) continue;

    const time = parseTime(timeMatch[1]);
    if (!time) continue;

    // Extract the rest as the title (remove the time part, "as", "às", "-", etc.)
    let title = segment
      .replace(timeMatch[0], "")
      .replace(/^\s*(as|às|at|de|do|da|-|–|:)\s*/i, "")
      .replace(/\s*(as|às|at|de|do|da|-|–|:)\s*$/i, "")
      .trim();

    if (!title) title = "Evento";

    // Detect duration if present
    const duration = parseDuration(segment);

    // Classify the event
    const lower = title.toLowerCase();

    // Check if it's an agent
    const agentKey = Object.keys(AGENT_KEYWORDS).find((k) => lower.includes(k));
    if (agentKey) {
      const agent = AGENT_KEYWORDS[agentKey];
      results.push({
        time, title: agent.name, type: "agent",
        agent: agentKey, color: "purple", duration,
      });
      continue;
    }

    // Check if it's a context/service
    const ctxKey = Object.keys(CONTEXT_KEYWORDS).find((k) => lower.includes(k));
    if (ctxKey) {
      const ctx = CONTEXT_KEYWORDS[ctxKey];
      results.push({
        time, title: ctx.label, type: "context",
        context: ctxKey, color: "orange", duration,
      });
      continue;
    }

    // Default to note
    results.push({ time, title, type: "note", color: "cyan", duration });
  }

  // Sort by time
  results.sort((a, b) => a.time.localeCompare(b.time));

  return results;
}
