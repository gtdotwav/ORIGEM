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
    { id: "history", label: "Histórico", description: "Ver e retomar sessões anteriores do chat", icon: History, onClick: () => toggle("history") },
    { id: "connectors", label: "Conectores", description: "Gerenciar integrações, APIs e banco de dados externos", icon: Plug, onClick: () => toggle("connectors") },
    { id: "calendar", label: "Calendário", description: "Planejamento estrutural e agenda integrada", icon: Calendar, onClick: () => toggle("calendar") },
    { id: "email", label: "E-mail", description: "Sincronização de caixas de entrada e agentes de resposta", icon: Mail, onClick: () => toggle("email") },
  ] as const;

  return (
    <>
      <div
        data-tour="left-toolbar"
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.9rem)] z-30 mx-auto flex w-auto max-w-[26rem] items-stretch gap-1.5 rounded-[22px] border border-white/10 bg-black/40 p-1.5 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-3xl md:inset-x-auto md:bottom-auto md:left-4 md:top-1/2 md:mx-0 md:w-auto md:max-w-none md:-translate-y-1/2 md:flex-col md:gap-1.5 md:rounded-2xl md:border-white/10 md:bg-black/40 md:p-1.5"
      >
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[14px] px-2 py-2 text-white/40 transition-all duration-300 hover:bg-white/[0.06] hover:text-neon-cyan md:h-10 md:w-10 md:flex-none md:px-0 md:py-0"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-[9px] font-medium tracking-[0.08em] md:hidden">
                {action.label}
              </span>

              {/* Tooltip for desktop */}
              <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 origin-left scale-95 items-center gap-2 rounded-xl border border-foreground/[0.08] bg-card/95 px-3 py-2 opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 md:flex">
                <div className="whitespace-nowrap text-left">
                   <p className="text-[12px] font-medium text-foreground">{action.label}</p>
                   <p className="text-[10px] text-foreground/50">{action.description}</p>
                </div>
              </div>
            </button>
          );
        })}
        <div className="h-auto w-px self-stretch bg-white/[0.06] md:my-1 md:h-px md:w-6 md:self-center" />
        <button
          type="button"
          onClick={() => router.push("/dashboard/spaces")}
          className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[14px] px-2 py-2 text-white/40 transition-all duration-300 hover:bg-white/[0.06] hover:text-neon-cyan md:h-10 md:w-10 md:flex-none md:px-0 md:py-0"
        >
          <Orbit className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-[9px] font-medium tracking-[0.08em] md:hidden">
            Spaces
          </span>

          {/* Tooltip for desktop */}
          <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 origin-left scale-95 items-center gap-2 rounded-xl border border-foreground/[0.08] bg-card/95 px-3 py-2 opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 md:flex">
            <div className="whitespace-nowrap text-left">
               <p className="text-[12px] font-medium text-foreground">Spaces</p>
               <p className="text-[10px] text-foreground/50">Quadro infinito para fluxos de imagens e videos</p>
            </div>
          </div>
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
