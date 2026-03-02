"use client";

import { useParams } from "next/navigation";
import { GlassCard } from "@/components/shared/glass-card";

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="flex h-full">
      {/* Chat Panel — 60% */}
      <div className="flex w-3/5 flex-col border-r border-border">
        {/* Messages area */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground/60">
              Start a conversation to decompose meaning
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4">
          <GlassCard className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter a topic, prompt, or thought..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
            />
            <button className="rounded-lg bg-neon-cyan/10 px-4 py-1.5 text-xs font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20">
              Decompose
            </button>
          </GlassCard>
        </div>
      </div>

      {/* Mini Orchestra — 40% */}
      <div className="flex w-2/5 flex-col bg-canvas-bg">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            Orchestra Preview
          </span>
          <a
            href={`/dashboard/orchestra/${sessionId}`}
            className="text-[10px] text-neon-purple hover:underline"
          >
            Expand
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-muted-foreground/40">
            Canvas will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
