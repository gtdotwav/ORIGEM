"use client";

import { useState, useRef, useEffect } from "react";
import {
  ImageIcon,
  Settings,
  Atom,
} from "lucide-react";

const SUGGESTIONS = [
  "Decompose a concept",
  "Create a context map",
  "Orchestrate agents",
  "Analyze semantics",
];

export default function DashboardPage() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-between px-4 py-8">
      {/* Spacer to push chat card to center */}
      <div className="flex-1" />

      {/* Central chat card */}
      <div className="relative z-10 flex w-full max-w-[640px] flex-col items-center">
        <div className="w-full rounded-2xl border border-white/[0.08] bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-xl">
          {/* Greeting */}
          <div className="mb-1 flex items-center gap-2">
            <Atom className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-white/70">
              Welcome to ORIGEM
            </span>
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
                if (e.key === "Enter" && input.trim()) {
                  // Will navigate to chat session
                }
              }}
            />
          </div>

          {/* Controls row */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-white/30">ORIGEM 1.0</span>
            <div className="flex items-center gap-1">
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
      <div className="flex-1 flex items-end pb-4">
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
          <p className="text-[10px] text-white/15">
            Psychosemantic AI Engine
          </p>
        </div>
      </div>
    </div>
  );
}
