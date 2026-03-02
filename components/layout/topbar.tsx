"use client";

import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Orbit,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useSessionStore } from "@/stores/session-store";
import { Button } from "@/components/ui/button";
import { StatusPulse } from "@/components/shared/status-pulse";
import { usePipelineStore } from "@/stores/pipeline-store";

export function Topbar() {
  const { sidebarOpen, toggleSidebar, setCommandPaletteOpen } =
    useUIStore();
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const pipelineStage = usePipelineStore((s) => s.stage);

  const currentSession = sessions.find(
    (s) => s.id === currentSessionId
  );

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        {currentSession && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground/80">
              {currentSession.title || "Untitled Session"}
            </span>
            {pipelineStage !== "idle" &&
              pipelineStage !== "complete" && (
                <div className="flex items-center gap-1.5">
                  <StatusPulse status="active" />
                  <span className="text-xs text-neon-cyan/80">
                    {pipelineStage}
                  </span>
                </div>
              )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search</span>
          <kbd className="ml-1 rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
            &#8984;K
          </kbd>
        </Button>

        {currentSessionId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-neon-purple"
            asChild
          >
            <a href={`/dashboard/orchestra/${currentSessionId}`}>
              <Orbit className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </header>
  );
}
