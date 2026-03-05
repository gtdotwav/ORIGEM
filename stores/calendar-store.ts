import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type CalendarEventType = "note" | "agent" | "context";

export interface CalendarEvent {
  id: string;
  dateKey: string; // "YYYY-MM-DD"
  type: CalendarEventType;
  title: string;
  description: string;
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
