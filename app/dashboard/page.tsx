"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Settings, Atom, Send, LayoutDashboard } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { persistSessionSnapshot } from "@/lib/chat-backend-client";
import {
  createId,
  createMessage,
  createSession,
  runChatOrchestration,
} from "@/lib/chat-orchestrator";

const SUGGESTIONS = [
  "Decompose a concept",
  "Create a context map",
  "Orchestrate agents",
  "Analyze semantics",
];

export default function DashboardPage() {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const addSession = useSessionStore((s) => s.addSession);
  const addMessage = useSessionStore((s) => s.addMessage);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startSessionFromHome = async () => {
    const text = input.trim();
    if (!text || sending) {
      return;
    }

    const sessionId = createId("session");
    const session = createSession(sessionId, text);

    addSession(session);
    setCurrentSession(sessionId);
    addMessage(createMessage(sessionId, "user", text));
    setInput("");
    setSending(true);

    router.push(`/dashboard/chat/${sessionId}`);

    try {
      await runChatOrchestration(sessionId, text);
      await persistSessionSnapshot(sessionId);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-between overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[40%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/14 blur-[88px]" />
        <div className="absolute left-[55%] top-[58%] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/12 blur-[88px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.38)_82%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[640px] pb-3">
        <div className="flex justify-center">
          <Link
            href="/dashboard/control"
            className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard de Controle
          </Link>
        </div>
      </div>

      {/* Spacer to push chat card to center */}
      <div className="flex-1" />

      {/* Central chat card */}
      <div className="relative z-10 flex w-full max-w-[640px] flex-col items-center">
        <div className="pointer-events-none absolute -inset-10 rounded-[40px] border border-cyan-300/10 bg-cyan-300/5 blur-2xl" />
        <div className="w-full rounded-2xl border border-white/[0.08] bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-xl">
          {/* Greeting */}
          <div className="mb-1 flex items-center gap-2">
            <Atom className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-white/70">Welcome to ORIGEM</span>
          </div>

          <h1 className="mb-5 text-2xl font-semibold text-white">
            What can I help you today?
          </h1>

          {/* Input field */}
          <div className="mb-3 rounded-xl bg-white/[0.06] px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void startSessionFromHome();
                }
              }}
            />
          </div>

          {/* Controls row */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-white/30">ORIGEM 1.0</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white/50"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white/50"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void startSessionFromHome()}
                disabled={!input.trim() || sending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>

          {/* Suggestion badges */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/50 transition-all hover:border-white/15 hover:bg-white/[0.08] hover:text-white/70"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-1 items-end pb-4">
        <div className="text-center">
          <div className="mb-1 flex items-center justify-center gap-3 text-xs text-white/25">
            <a href="#" className="transition-colors hover:text-white/40">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#" className="transition-colors hover:text-white/40">
              Terms & Conditions
            </a>
          </div>
          <p className="text-[10px] text-white/15">Psychosemantic AI Engine</p>
        </div>
      </div>
    </div>
  );
}
