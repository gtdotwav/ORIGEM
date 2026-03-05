"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Shield } from "lucide-react";

const SUGGESTIONS = [
  { emoji: "\u{1F4D6}", label: "Conte uma historia" },
  { emoji: "\u{1F4A1}", label: "Me ensine algo" },
  { emoji: "\u{1F50D}", label: "Curiosidade" },
  { emoji: "\u{1F3AF}", label: "Desafio" },
];

type ChatMessage = { role: "user" | "assistant"; content: string };

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Ola! Eu sou o Ori, seu amigo virtual! \u{1F916}\u2728 Posso contar historias, ensinar coisas legais, responder suas perguntas e propor desafios divertidos. O que voce quer fazer?",
  },
];

export default function KidsCompanionPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user" as const, content: text.trim() },
      {
        role: "assistant" as const,
        content:
          "Que pergunta legal! \u{1F31F} Eu ainda estou aprendendo a responder direitinho, mas em breve vou poder conversar com voce sobre tudo! Continue explorando as outras secoes do ORIGEM Kids enquanto isso. \u{1F680}",
      },
    ]);
    setInput("");
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-8" style={{ height: "calc(100vh - 130px)" }}>
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <Link
          href="/dashboard/kids"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/40 transition-colors hover:text-foreground/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-orange/25 bg-neon-orange/10">
          <span className="text-xl">{"\u{1F916}"}</span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Ori — Companheiro IA</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Seu amigo virtual inteligente e divertido
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-neon-green/20 bg-neon-green/8 px-2.5 py-1">
          <Shield className="h-3 w-3 text-neon-green" />
          <span className="text-[10px] text-neon-green/80">Modo Seguro</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-neon-cyan/15 text-foreground/90"
                    : "border border-foreground/[0.06] bg-foreground/[0.03] text-foreground/80"
                }`}
              >
                {msg.role === "assistant" && (
                  <span className="mb-1 block text-xs font-semibold text-neon-orange">
                    Ori {"\u{1F916}"}
                  </span>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => handleSend(s.label)}
            className="rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-3.5 py-1.5 text-xs text-foreground/50 transition-all hover:border-neon-orange/30 hover:bg-neon-orange/8 hover:text-foreground/70"
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-black/30 p-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend(input);
            }
          }}
          placeholder="Pergunte algo para o Ori..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none"
        />
        <button
          type="button"
          onClick={() => handleSend(input)}
          disabled={!input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neon-orange/30 bg-neon-orange/10 px-3 py-1.5 text-xs font-medium text-neon-orange transition-all hover:border-neon-orange/60 hover:bg-neon-orange/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          Enviar
        </button>
      </div>
    </div>
  );
}
