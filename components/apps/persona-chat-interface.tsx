"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePersonaChat } from "@/hooks/use-persona-chat";
import { usePersonaStore } from "@/stores/persona-store";
import { PERSONA_COLORS } from "@/lib/personas";
import { ChatModeToggle } from "@/components/apps/chat-mode-toggle";
import { cn } from "@/lib/utils";

export function PersonaChatInterface() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isLoading, messages, activePersona, chatMode } =
    usePersonaChat();
  const chatSessions = usePersonaStore((s) => s.chatSessions);
  const clearSessionMessages = usePersonaStore((s) => s.clearSessionMessages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activePersona?.id]);

  if (!activePersona) return null;

  const colors = PERSONA_COLORS[activePersona.color];

  const currentSession = chatSessions.find(
    (cs) => cs.personaId === activePersona.id
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage(text);
  };

  const handleClear = () => {
    if (!currentSession) return;
    clearSessionMessages(currentSession.id);
    toast.success("Conversa limpa!");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{activePersona.emoji}</span>
          <div>
            <h2 className="text-sm font-semibold text-white/90">
              {activePersona.name}
            </h2>
            <p className="text-[10px] text-white/35">
              {chatMode === "direct"
                ? "Chat direto"
                : "Ecossistema completo"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ChatModeToggle />
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
              title="Limpar conversa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 text-5xl">{activePersona.emoji}</span>
            <div className="max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-sm leading-relaxed text-white/60">
                {activePersona.greeting}
              </p>
            </div>
            <p className="mt-3 text-[10px] text-white/20">
              Envie uma mensagem para comecar
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "mb-4 animate-message-in",
              msg.role === "user" ? "flex justify-end" : "flex justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-neon-cyan/10 border border-neon-cyan/20 text-white/90"
                  : cn(
                      "border bg-white/[0.03]",
                      colors.border,
                      "text-white/75"
                    )
              )}
            >
              {msg.role === "persona" && (
                <span className="mb-1 block text-xs font-medium text-white/40">
                  {activePersona.emoji} {activePersona.name}
                </span>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mb-4 flex justify-start animate-message-in">
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl border bg-white/[0.03] px-4 py-3",
                colors.border
              )}
            >
              <Loader2 className={cn("h-3.5 w-3.5 animate-spin", colors.text)} />
              <span className="text-xs text-white/40">
                {activePersona.name} esta pensando...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Pergunte algo para ${activePersona.name}...`}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSend();
              }
            }}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
              colors.border,
              colors.bg,
              colors.text,
              colors.borderHover
            )}
          >
            <Send className="h-3 w-3" />
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
