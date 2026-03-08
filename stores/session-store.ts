import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Session, Message } from "@/types/session";
import { useRuntimeStore } from "@/stores/runtime-store";

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  isLoading: boolean;

  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  setCurrentSession: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  getMessagesBySession: (sessionId: string) => Message[];
  updateSession: (id: string, updates: Partial<Session>) => void;
  removeSession: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      (set, get) => ({
        sessions: [],
        currentSessionId: null,
        messages: [],
        isLoading: false,

        setSessions: (sessions) => set({ sessions }),
        addSession: (session) =>
          set((s) => ({ sessions: [session, ...s.sessions] })),
        setCurrentSession: (id) => set({ currentSessionId: id }),
        setMessages: (messages) => set({ messages }),
        addMessage: (message) =>
          set((s) => ({ messages: [...s.messages, message] })),
        getMessagesBySession: (sessionId) =>
          get()
            .messages.filter((message) => message.sessionId === sessionId)
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            ),
        updateSession: (id, updates) =>
          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === id ? { ...sess, ...updates } : sess
            ),
          })),
        removeSession: (id) => {
          set((s) => ({
            sessions: s.sessions.filter((sess) => sess.id !== id),
            messages: s.messages.filter((message) => message.sessionId !== id),
            currentSessionId:
              s.currentSessionId === id ? null : s.currentSessionId,
          }));
          useRuntimeStore.getState().removeSession(id);
        },
        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: "origem-sessions",
        partialize: (state) => ({
          sessions: state.sessions,
          messages: state.messages,
          currentSessionId: state.currentSessionId,
        }),
      }
    ),
    { name: "session-store" }
  )
);
