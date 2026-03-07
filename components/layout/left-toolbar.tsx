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

  return (
    <>
      <div
        data-tour="left-toolbar"
        className="fixed left-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-foreground/[0.06] bg-card/80 p-1 shadow-lg backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => toggle("history")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
          title="Historico"
        >
          <History className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => toggle("connectors")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
          title="Conectores"
        >
          <Plug className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => toggle("calendar")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
          title="Calendario"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => toggle("email")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
          title="E-mail"
        >
          <Mail className="h-3.5 w-3.5" />
        </button>
        <div className="my-0.5 h-px w-5 self-center bg-foreground/[0.06]" />
        <button
          type="button"
          onClick={() => router.push("/dashboard/spaces")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-neon-pink"
          title="Spaces"
        >
          <Orbit className="h-3.5 w-3.5" />
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
