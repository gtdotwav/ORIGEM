"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, History, Mail, Orbit, Plug } from "lucide-react";
import { ChatHistoryPanel } from "@/components/chat/chat-history-panel";
import { ConnectorsPanel } from "@/components/chat/connectors-panel";
import { CalendarPanel } from "@/components/chat/calendar-panel";
import { EmailPanel } from "@/components/chat/email-panel";

interface LeftToolbarProps {
  currentSessionId?: string;
}

export function LeftToolbar({ currentSessionId }: LeftToolbarProps) {
  const router = useRouter();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const closeAll = () => {
    setHistoryOpen(false);
    setConnectorsOpen(false);
    setCalendarOpen(false);
    setEmailOpen(false);
  };

  const toggle = (panel: "history" | "connectors" | "calendar" | "email") => {
    setHistoryOpen(panel === "history" ? (v) => !v : false);
    setConnectorsOpen(panel === "connectors" ? (v) => !v : false);
    setCalendarOpen(panel === "calendar" ? (v) => !v : false);
    setEmailOpen(panel === "email" ? (v) => !v : false);
  };

  const actions = [
    { id: "history", label: "Historico", icon: History, onClick: () => toggle("history") },
    { id: "connectors", label: "Conectores", icon: Plug, onClick: () => toggle("connectors") },
    { id: "calendar", label: "Calendario", icon: Calendar, onClick: () => toggle("calendar") },
    { id: "email", label: "E-mail", icon: Mail, onClick: () => toggle("email") },
  ] as const;

  return (
    <>
      <div
        data-tour="left-toolbar"
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.9rem)] z-30 mx-auto flex w-auto max-w-[26rem] items-stretch gap-1.5 rounded-[22px] border border-foreground/[0.08] bg-card/88 p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.88)] backdrop-blur-2xl md:inset-x-auto md:bottom-auto md:left-3 md:top-1/2 md:mx-0 md:w-auto md:max-w-none md:-translate-y-1/2 md:flex-col md:gap-1 md:rounded-xl md:border-foreground/[0.06] md:bg-card/80 md:p-1"
      >
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-foreground/34 transition-all hover:bg-foreground/[0.06] hover:text-foreground/58 md:h-7 md:w-7 md:flex-none md:rounded-lg md:px-0 md:py-0"
              title={action.label}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-[9px] font-medium tracking-[0.08em] md:hidden">
                {action.label}
              </span>
            </button>
          );
        })}
        <div className="h-auto w-px self-stretch bg-foreground/[0.06] md:my-0.5 md:h-px md:w-5 md:self-center" />
        <button
          type="button"
          onClick={() => router.push("/dashboard/spaces")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-foreground/34 transition-all hover:bg-foreground/[0.06] hover:text-foreground/62 md:h-7 md:w-7 md:flex-none md:rounded-lg md:px-0 md:py-0"
          title="Spaces"
        >
          <Orbit className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-[9px] font-medium tracking-[0.08em] md:hidden">
            Spaces
          </span>
        </button>
      </div>

      <ChatHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentSessionId={currentSessionId}
        onCreateCanvas={() => {
          closeAll();
          router.push("/dashboard/canvas");
        }}
      />

      <ConnectorsPanel
        open={connectorsOpen}
        onClose={() => setConnectorsOpen(false)}
        currentSessionId={currentSessionId}
      />

      <CalendarPanel
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />

      <EmailPanel
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
      />
    </>
  );
}
