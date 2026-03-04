import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { PersonaChatSession, PersonaChatMessage, ChatMode } from "@/types/persona";

interface PersonaState {
  activePersonaId: string | null;
  chatMode: ChatMode;
  chatSessions: PersonaChatSession[];

  setActivePersona: (id: string | null) => void;
  setChatMode: (mode: ChatMode) => void;
  addChatSession: (session: PersonaChatSession) => void;
  addMessage: (sessionId: string, message: PersonaChatMessage) => void;
  getSessionByPersona: (personaId: string) => PersonaChatSession | undefined;
  clearSessionMessages: (sessionId: string) => void;
}

export const usePersonaStore = create<PersonaState>()(
  devtools(
    persist(
      (set, get) => ({
        activePersonaId: null,
        chatMode: "direct" as ChatMode,
        chatSessions: [],

        setActivePersona: (id) => set({ activePersonaId: id }),

        setChatMode: (mode) => set({ chatMode: mode }),

        addChatSession: (session) =>
          set((s) => ({ chatSessions: [session, ...s.chatSessions] })),

        addMessage: (sessionId, message) =>
          set((s) => ({
            chatSessions: s.chatSessions.map((cs) =>
              cs.id === sessionId
                ? { ...cs, messages: [...cs.messages, message], updatedAt: new Date() }
                : cs
            ),
          })),

        getSessionByPersona: (personaId) =>
          get().chatSessions.find((cs) => cs.personaId === personaId),

        clearSessionMessages: (sessionId) =>
          set((s) => ({
            chatSessions: s.chatSessions.map((cs) =>
              cs.id === sessionId
                ? { ...cs, messages: [], updatedAt: new Date() }
                : cs
            ),
          })),
      }),
      {
        name: "origem-personas",
        partialize: (state) => ({
          activePersonaId: state.activePersonaId,
          chatMode: state.chatMode,
          chatSessions: state.chatSessions,
        }),
      }
    ),
    { name: "persona-store" }
  )
);
