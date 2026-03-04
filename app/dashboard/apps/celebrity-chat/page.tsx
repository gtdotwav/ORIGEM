"use client";

import { MessageSquare } from "lucide-react";
import { usePersonaStore } from "@/stores/persona-store";
import { PersonaSwitcher } from "@/components/apps/persona-switcher";
import { PersonaChatInterface } from "@/components/apps/persona-chat-interface";
import { CELEBRITY_PERSONAS } from "@/lib/personas";

export default function CelebrityChatPage() {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const activePersona = CELEBRITY_PERSONAS.find(
    (p) => p.id === activePersonaId
  );

  return (
    <div className="relative flex h-[calc(100vh-80px)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neon-purple/20 bg-neon-purple/10">
            <MessageSquare className="h-4 w-4 text-neon-purple" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white/90">
              Converse com uma Celebridade IA
            </h1>
            <p className="text-[10px] text-white/35">
              Escolha uma persona e inicie a conversa
            </p>
          </div>
        </div>
        <PersonaSwitcher />
      </div>

      {/* Chat area */}
      {activePersona ? (
        <PersonaChatInterface />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <span className="mb-4 text-6xl">🎭</span>
          <h2 className="mb-2 text-lg font-semibold text-white/80">
            Escolha uma persona
          </h2>
          <p className="mb-6 max-w-sm text-center text-sm text-white/40">
            Selecione uma celebridade historica para iniciar uma conversa
            imersiva e didatica com IA
          </p>

          {/* Quick pick grid */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CELEBRITY_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() =>
                  usePersonaStore.getState().setActivePersona(persona.id)
                }
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 transition-all hover:border-white/[0.15] hover:bg-white/[0.05]"
              >
                <span className="text-2xl">{persona.emoji}</span>
                <span className="text-[10px] text-white/50">
                  {persona.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
