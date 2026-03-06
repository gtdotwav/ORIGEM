"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Circle,
  ExternalLink,
  Plug,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  statusKey: string;
}

const CONNECTORS: Connector[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Repositorios, PRs, Issues",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.12.83-.26.83-.57v-2.2c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.22.69.83.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    color: "text-foreground",
    statusKey: "origem-connector-github",
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Deploy, Domains, Analytics",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 1L24 22H0L12 1z" />
      </svg>
    ),
    color: "text-foreground",
    statusKey: "origem-connector-vercel",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Database, Auth, Storage",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M13.32 21.95c-.45.56-1.38.2-1.38-.53V13.5H3.35c-.88 0-1.35-1.04-.77-1.7L10.68 2.05c.45-.56 1.38-.2 1.38.53V10.5h8.59c.88 0 1.35 1.04.77 1.7l-8.1 9.75z" />
      </svg>
    ),
    color: "text-emerald-400",
    statusKey: "origem-connector-supabase",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Pagamentos, Subscricoes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M13.98 11.19c0-1.57-.77-2.81-2.24-2.81-1.48 0-2.36 1.24-2.36 2.8 0 1.85 1.05 2.78 2.56 2.78.73 0 1.29-.17 1.71-.4v-1.75c-.42.21-.9.34-1.51.34-.6 0-1.13-.21-1.2-.93h3.01c.01-.08.03-.42.03-.63zM10.9 10.8c0-.69.42-1.05.87-1.05.44 0 .83.36.83 1.05H10.9zM7.44 8.38c-.6 0-.99.28-1.2.48l-.08-.38H4.56v7.84l1.88-.4.01-1.9c.22.16.54.39 1.07.39 1.08 0 2.07-.87 2.07-2.79-.01-1.76-1-2.74-2.15-2.74zm-.38 4.22c-.36 0-.57-.13-.71-.28l-.01-2.23c.16-.17.37-.3.72-.3.55 0 .93.62.93 1.4 0 .81-.37 1.41-.93 1.41zM3.38 8.02l1.89-.4V5.95l-1.89.4v1.67zM3.38 8.55h1.89v7.17H3.38V8.55zM18.82 10.21l.08-.38h-1.56v7.17h1.88v-4.86c.44-.58 1.2-.47 1.43-.39V10.1c-.24-.09-1.1-.24-1.56.47l-.27-.36zM21.5 6.35l-1.87.4v6.56c0 1.21.91 2.1 2.12 2.1.67 0 1.16-.12 1.43-.27v-1.52c-.26.1-1.55.47-1.55-.71v-2.84h1.55V8.55h-1.55l-.13-2.2z" />
      </svg>
    ),
    color: "text-violet-400",
    statusKey: "origem-connector-stripe",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT, DALL-E, Whisper",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M22.28 9.37a5.98 5.98 0 0 0-.51-4.93 6.05 6.05 0 0 0-6.5-2.91A5.99 5.99 0 0 0 10.8.15a6.05 6.05 0 0 0-5.78 4.19 5.98 5.98 0 0 0-4 2.89 6.05 6.05 0 0 0 .74 7.09 5.98 5.98 0 0 0 .51 4.93 6.05 6.05 0 0 0 6.5 2.91A5.99 5.99 0 0 0 13.2 23.85a6.05 6.05 0 0 0 5.78-4.19 5.98 5.98 0 0 0 4-2.89 6.05 6.05 0 0 0-.74-7.09zM13.2 22.18a4.49 4.49 0 0 1-2.88-1.05l.14-.08 4.78-2.76a.78.78 0 0 0 .39-.67v-6.73l2.02 1.17a.07.07 0 0 1 .04.06v5.57a4.51 4.51 0 0 1-4.49 4.49zM3.6 18.11a4.49 4.49 0 0 1-.54-3.02l.14.09 4.78 2.76a.78.78 0 0 0 .78 0l5.83-3.37v2.33a.07.07 0 0 1-.03.06l-4.83 2.79a4.51 4.51 0 0 1-6.13-1.64zM2.34 7.89A4.49 4.49 0 0 1 4.7 5.91v5.69a.78.78 0 0 0 .39.67l5.83 3.37-2.02 1.17a.07.07 0 0 1-.07 0L4 14.02a4.51 4.51 0 0 1-1.66-6.13zM19.23 11.96l-5.83-3.37 2.02-1.17a.07.07 0 0 1 .07 0l4.83 2.79a4.51 4.51 0 0 1-.7 8.14v-5.72a.78.78 0 0 0-.39-.67zM21.2 8.91l-.14-.09-4.78-2.76a.78.78 0 0 0-.78 0l-5.83 3.37V7.1a.07.07 0 0 1 .03-.06l4.83-2.79a4.51 4.51 0 0 1 6.67 4.66zM7.85 13.36L5.83 12.2a.07.07 0 0 1-.04-.06V6.56a4.51 4.51 0 0 1 7.37-3.47l-.14.08-4.78 2.76a.78.78 0 0 0-.39.67v6.76zM8.88 11l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3z" />
      </svg>
    ),
    color: "text-foreground",
    statusKey: "origem-connector-openai",
  },
  {
    id: "aws",
    name: "AWS",
    description: "S3, Lambda, EC2",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M6.76 14.85c0 .26.03.47.08.62.06.15.13.32.23.5.04.06.05.12.05.17 0 .07-.05.15-.14.22l-.47.31c-.07.05-.13.07-.2.07-.07 0-.15-.04-.22-.11a2.3 2.3 0 0 1-.26-.34 5.9 5.9 0 0 1-.23-.43c-.57.68-1.29 1.01-2.16 1.01-.62 0-1.11-.17-1.48-.52-.37-.35-.56-.82-.56-1.4 0-.62.22-1.12.66-1.51.44-.39 1.03-.58 1.77-.58.25 0 .5.02.77.06s.54.1.84.17v-.54c0-.55-.12-.94-.35-1.17-.24-.23-.64-.34-1.22-.34-.26 0-.53.03-.81.1s-.56.15-.83.27a2 2 0 0 1-.25.1c-.04.01-.07.02-.09.02-.08 0-.12-.06-.12-.18v-.36c0-.1.01-.17.04-.21a.44.44 0 0 1 .16-.12c.27-.14.6-.25.97-.34.38-.1.78-.14 1.2-.14.91 0 1.58.21 2 .62.42.41.63 1.04.63 1.88v2.48zm-2.99 1.12c.24 0 .49-.04.75-.13s.49-.24.69-.46a1.2 1.2 0 0 0 .27-.48c.05-.19.08-.41.08-.68v-.33a6.1 6.1 0 0 0-.67-.13 5.5 5.5 0 0 0-.69-.04c-.48 0-.84.1-1.07.3-.23.2-.35.48-.35.85 0 .34.09.6.27.77.18.18.44.26.77.26l-.05.07zm5.91.76c-.1 0-.17-.02-.22-.06-.05-.04-.09-.13-.12-.25l-1.37-4.52c-.04-.13-.05-.21-.05-.26 0-.1.05-.16.15-.16h.53c.11 0 .18.02.23.06.05.04.08.13.12.25l.98 3.86.91-3.86c.03-.13.07-.21.12-.25a.44.44 0 0 1 .23-.06h.43c.11 0 .18.02.23.06.05.04.09.13.12.25l.92 3.91 1.01-3.91c.03-.13.07-.21.12-.25.05-.04.12-.06.23-.06h.5c.1 0 .16.05.16.16 0 .03-.01.06-.02.1s-.02.09-.04.16l-1.41 4.52c-.03.13-.07.21-.12.25s-.12.06-.22.06h-.47c-.1 0-.18-.02-.23-.06-.05-.04-.09-.13-.12-.26l-.9-3.76-.9 3.76c-.03.13-.07.22-.12.26-.05.04-.13.06-.23.06h-.47zm9.44.11c-.38 0-.76-.04-1.13-.13-.37-.09-.66-.18-.86-.29-.12-.07-.21-.14-.24-.22a.55.55 0 0 1-.04-.2v-.37c0-.12.05-.18.14-.18.04 0 .07.01.11.02s.1.04.16.07c.22.1.46.17.72.23.27.06.53.08.8.08.42 0 .75-.07.98-.22.23-.15.35-.36.35-.64a.72.72 0 0 0-.2-.52c-.13-.14-.38-.26-.75-.38l-1.07-.33c-.54-.17-.94-.42-1.19-.75-.25-.33-.37-.7-.37-1.09 0-.31.07-.59.2-.83.14-.24.32-.45.55-.62.23-.17.5-.3.79-.39.3-.09.62-.13.95-.13.17 0 .34.01.52.03.18.02.35.05.5.09.16.04.3.08.44.13.14.05.24.1.32.16a.6.6 0 0 1 .18.17c.04.06.05.14.05.23v.35c0 .12-.05.18-.14.18a.67.67 0 0 1-.24-.08 2.9 2.9 0 0 0-1.22-.25c-.38 0-.68.06-.9.18-.21.12-.32.31-.32.58 0 .2.07.38.22.52.15.14.42.28.82.41l1.05.33c.53.17.92.41 1.16.72.24.31.35.67.35 1.07 0 .32-.07.61-.2.87-.14.26-.33.49-.57.67-.24.18-.53.32-.86.42-.34.1-.7.15-1.09.15z" />
      </svg>
    ),
    color: "text-amber-400",
    statusKey: "origem-connector-aws",
  },
  {
    id: "docker",
    name: "Docker",
    description: "Containers, Images, Registry",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M13.98 11.08h2.12a.19.19 0 0 0 .19-.19V9.01a.19.19 0 0 0-.19-.19h-2.12a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm-2.95-5.43h2.12a.19.19 0 0 0 .19-.19V3.58a.19.19 0 0 0-.19-.19h-2.12a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm0 2.72h2.12a.19.19 0 0 0 .19-.19V6.3a.19.19 0 0 0-.19-.19h-2.12a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm-2.93 0h2.12a.19.19 0 0 0 .19-.19V6.3a.19.19 0 0 0-.19-.19H8.1a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm-2.96 0h2.12a.19.19 0 0 0 .19-.19V6.3a.19.19 0 0 0-.19-.19H5.14a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm5.89 2.71h2.12a.19.19 0 0 0 .19-.19V9.01a.19.19 0 0 0-.19-.19h-2.12a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm-2.93 0h2.12a.19.19 0 0 0 .19-.19V9.01a.19.19 0 0 0-.19-.19H8.1a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm-2.96 0h2.12a.19.19 0 0 0 .19-.19V9.01a.19.19 0 0 0-.19-.19H5.14a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm-2.93 0h2.12a.19.19 0 0 0 .19-.19V9.01a.19.19 0 0 0-.19-.19H2.21a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19zm21.54-1.57c-.25-.17-.83-.46-1.53-.46-.28 0-.56.04-.82.13-.28-1.95-1.93-2.9-2.01-2.94l-.4-.23-.26.38c-.33.5-.58 1.07-.72 1.66-.25.99-.1 1.92.44 2.71-.65.36-1.71.45-2.04.45H.72a.72.72 0 0 0-.72.72 12.63 12.63 0 0 0 .78 4.63c.6 1.33 1.49 2.31 2.64 2.91 1.29.68 3.4 1.07 5.76 1.07.99 0 2-.09 2.99-.27a11.38 11.38 0 0 0 3.87-1.49 10.01 10.01 0 0 0 2.72-2.55c1.24-1.58 1.98-3.36 2.46-4.89h.21c1.3 0 2.1-.52 2.54-1.11.31-.39.44-.86.36-1.36l-.02-.09-.14-.09z" />
      </svg>
    ),
    color: "text-sky-400",
    statusKey: "origem-connector-docker",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Design, Prototipos, Assets",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M15.85 0H8.15A3.15 3.15 0 0 0 5 3.15 3.15 3.15 0 0 0 6.88 6 3.15 3.15 0 0 0 5 8.85 3.15 3.15 0 0 0 6.88 11.7 3.15 3.15 0 0 0 5 14.55a3.15 3.15 0 0 0 3.15 3.15h.13A3.28 3.28 0 0 0 11.5 21a3.28 3.28 0 0 0 3.22-3.3v-2.82c.3.1.63.15.98.15h.15A3.15 3.15 0 0 0 19 11.88a3.15 3.15 0 0 0-1.88-2.88A3.15 3.15 0 0 0 19 6.15 3.15 3.15 0 0 0 15.85 3V0zM8.15 1.5h3.35v3.15H8.15A1.65 1.65 0 0 1 6.5 3.15 1.65 1.65 0 0 1 8.15 1.5zm0 4.65h3.35v3.35H8.15a1.68 1.68 0 0 1 0-3.35zm0 8.05a1.68 1.68 0 0 1 0-3.35h3.35v1.68A1.68 1.68 0 0 1 8.15 14.2zm3.35 3.5a1.78 1.78 0 0 1-1.72 1.8 1.65 1.65 0 0 1-1.63-1.65 1.65 1.65 0 0 1 1.63-1.65h1.72V17.7zm4.35-5.82h-.15a1.68 1.68 0 0 1 0-3.35h.15a1.68 1.68 0 0 1 0 3.35zm0-4.85h-.15a1.68 1.68 0 0 1 0-3.35h.15a1.68 1.68 0 0 1 0 3.35z" />
      </svg>
    ),
    color: "text-pink-400",
    statusKey: "origem-connector-figma",
  },
];

interface ConnectorsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectorsPanel({ open, onClose }: ConnectorsPanelProps) {
  const [connectedIds, setConnectedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem("origem-connected-integrations");
    return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
  });

  const toggleConnector = (id: string) => {
    setConnectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success("Conector desconectado");
      } else {
        next.add(id);
        toast.success("Conector ativado");
      }
      localStorage.setItem(
        "origem-connected-integrations",
        JSON.stringify([...next])
      );
      return next;
    });
  };

  const connectedCount = connectedIds.size;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay — transparent, click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[55]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: -16, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed left-12 top-1/2 z-[60] -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer glow */}
            <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] blur-xl" />

            <div
              className="relative max-h-[88vh] w-96 overflow-hidden rounded-2xl border border-foreground/[0.12] shadow-2xl shadow-black/40"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
                backdropFilter: "blur(40px) saturate(1.8)",
              }}
            >
              {/* Top highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Plug className="h-3.5 w-3.5 text-foreground/30" />
                  <span className="text-[11px] font-semibold tracking-wide text-foreground/55">
                    CONECTORES
                  </span>
                  {connectedCount > 0 && (
                    <span className="rounded-md bg-neon-green/15 px-1.5 py-0.5 text-[9px] tabular-nums font-medium text-neon-green/60">
                      {connectedCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-foreground/25 transition-all hover:border-red-500/15 hover:bg-red-500/10 hover:text-red-400"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Divider */}
              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* Connectors list */}
              <div className="max-h-[70vh] overflow-y-auto py-2">
                <div className="space-y-0.5 px-2">
                  {CONNECTORS.map((connector) => {
                    const isConnected = connectedIds.has(connector.id);
                    return (
                      <button
                        key={connector.id}
                        type="button"
                        onClick={() => toggleConnector(connector.id)}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all",
                          isConnected
                            ? "bg-foreground/[0.05] text-foreground/70"
                            : "text-foreground/40 hover:bg-foreground/[0.03] hover:text-foreground/55"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                            isConnected
                              ? "bg-foreground/[0.08]"
                              : "bg-foreground/[0.03] group-hover:bg-foreground/[0.06]"
                          )}
                        >
                          <span className={cn(isConnected ? connector.color : "text-foreground/20")}>
                            {connector.icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium leading-tight">
                            {connector.name}
                          </p>
                          <p className="truncate text-[10px] text-foreground/20">
                            {connector.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isConnected && (
                            <Circle className="h-1.5 w-1.5 fill-neon-green text-neon-green" />
                          )}
                          <ExternalLink
                            className={cn(
                              "h-3 w-3 transition-opacity",
                              isConnected
                                ? "text-foreground/15 opacity-0 group-hover:opacity-100"
                                : "text-foreground/10 opacity-0 group-hover:opacity-60"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom highlight */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

              {/* Footer */}
              <div className="px-4 py-2.5">
                <div className="mx-auto h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-2" />
                <p className="text-[9px] text-foreground/18 text-center">
                  Conectores simulados — integracao real em breve
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
