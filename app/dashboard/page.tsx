"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Settings,
  Send,
  Atom,
  ChevronDown,
  Brain,
  FolderKanban,
  Bot,
  Orbit,
  Users,
  GitBranch,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Contextos",
    description: "Mapeie e decomponha contextos semanticos",
    href: "/dashboard/contexts",
    icon: Brain,
  },
  {
    label: "Projetos",
    description: "Organize sessoes e workflows em projetos",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    label: "Agentes",
    description: "Configure e gerencie agentes especializados",
    href: "/dashboard/agents",
    icon: Bot,
  },
  {
    label: "Space",
    description: "Canvas infinito para orquestracao visual",
    href: "/dashboard/space",
    icon: Orbit,
  },
  {
    label: "Grupos",
    description: "Coordene grupos de agentes em paralelo",
    href: "/dashboard/groups",
    icon: Users,
  },
  {
    label: "Fluxos",
    description: "Pipelines de execucao e automacao",
    href: "/dashboard/flows",
    icon: GitBranch,
  },
];

const SUGGESTIONS = [
  "Decompose a concept",
  "Create a context map",
  "Orchestrate agents",
  "Analyze semantics",
];

export default function DashboardPage() {
  const [input, setInput] = useState("");
  const [backgroundImage, setBackgroundImage] = useState(
    "/images/background.png"
  );
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(e.target as Node)) {
      setNavOpen(false);
    }
  }, []);

  useEffect(() => {
    if (navOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navOpen, handleClickOutside]);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-between bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

      {/* Brand badge + nav — top center */}
      <div className="relative z-20 flex w-full flex-col items-center pt-8">
        <div ref={navRef} className="relative">
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
          >
            <Atom className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white/90">
              ORIGEM
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-white/40 transition-transform duration-200 ${
                navOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown — 2-col grid, compact */}
          {navOpen && (
            <div className="absolute left-1/2 top-full mt-3 w-[520px] -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-neutral-900/95 p-3 shadow-2xl backdrop-blur-xl">
              {/* Arrow indicator */}
              <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-white/[0.08] bg-neutral-900/95" />

              <div className="relative grid grid-cols-2 gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.06]"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                      <item.icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/90">
                        {item.label}
                      </p>
                      <p className="text-[11px] leading-snug text-white/40">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Separator + bottom links */}
              <div className="mt-1.5 border-t border-white/[0.06] pt-1.5">
                <div className="flex items-center justify-center gap-4 px-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setNavOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
                  >
                    Settings
                  </Link>
                  <span className="text-white/10">|</span>
                  <Link
                    href="/dashboard/settings/providers"
                    onClick={() => setNavOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
                  >
                    Providers
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
      <div className="relative z-10 pb-4 text-center">
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
    </main>
  );
}
