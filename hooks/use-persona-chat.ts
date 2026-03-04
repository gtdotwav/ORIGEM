import { useState, useMemo, useCallback } from "react";
import { usePersonaStore } from "@/stores/persona-store";
import { CELEBRITY_PERSONAS } from "@/lib/personas";
import {
  generateDirectResponse,
  createPersonaMessage,
  createPersonaMessageId,
} from "@/lib/persona-chat";

export function usePersonaChat() {
  const [isLoading, setIsLoading] = useState(false);
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const chatMode = usePersonaStore((s) => s.chatMode);
  const chatSessions = usePersonaStore((s) => s.chatSessions);
  const addMessage = usePersonaStore((s) => s.addMessage);
  const addChatSession = usePersonaStore((s) => s.addChatSession);

  const activePersona = useMemo(
    () => CELEBRITY_PERSONAS.find((p) => p.id === activePersonaId),
    [activePersonaId]
  );

  const currentSession = useMemo(
    () =>
      activePersonaId
        ? chatSessions.find((cs) => cs.personaId === activePersonaId)
        : undefined,
    [activePersonaId, chatSessions]
  );

  const ensureSession = useCallback(
    (personaId: string) => {
      const existing = chatSessions.find((cs) => cs.personaId === personaId);
      if (existing) return existing.id;
      const sessionId = `pcs-${Date.now()}-${createPersonaMessageId()}`;
      addChatSession({
        id: sessionId,
        personaId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return sessionId;
    },
    [chatSessions, addChatSession]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activePersona || !text.trim() || isLoading) return;

      const sessionId = ensureSession(activePersona.id);

      const userMsg = createPersonaMessage(
        activePersona.id,
        "user",
        text.trim(),
        chatMode
      );
      addMessage(sessionId, userMsg);
      setIsLoading(true);

      try {
        const response = await generateDirectResponse(activePersona, text.trim());
        const personaMsg = createPersonaMessage(
          activePersona.id,
          "persona",
          response,
          chatMode
        );
        addMessage(sessionId, personaMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [activePersona, chatMode, isLoading, ensureSession, addMessage]
  );

  return {
    sendMessage,
    isLoading,
    messages: currentSession?.messages ?? [],
    activePersona,
    chatMode,
  };
}
