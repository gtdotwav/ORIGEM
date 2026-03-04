"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Atom,
  ChevronDown,
  Layers,
  LayoutDashboard,
  Brain,
  FolderKanban,
  Bot,
  Orbit,
  Users,
  GitBranch,
  LogIn,
  Sparkles,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    description: "Centro de controle operacional",
    href: "/dashboard/control",
    icon: LayoutDashboard,
  },
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
  {
    label: "Workspaces",
    description: "Organize sessoes em espacos de trabalho",
    href: "/dashboard/workspaces",
    icon: Layers,
  },
  {
    label: "Apps",
    description: "Experiencias especializadas com IA",
    href: "/dashboard/apps",
    icon: Sparkles,
  },
];

export function FloatingNav() {
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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

  // Find the active page label for display
  const activePage = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWsName = workspaces.find((w) => w.id === activeWorkspaceId)?.name;

  return (
    <div className="relative z-50 w-full px-4 pt-6 md:px-6">
      <div className="absolute right-4 top-6 md:right-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/30 bg-black/45 px-3 py-1.5 text-xs font-medium text-neon-cyan backdrop-blur-md transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/15"
        >
          <LogIn className="h-3.5 w-3.5" />
          Login
        </Link>
      </div>

      <div className="flex w-full justify-center">
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
            {activeWsName && (
              <>
                <span className="text-white/20">/</span>
                <span className="max-w-[80px] truncate text-sm text-neon-cyan/60">{activeWsName}</span>
              </>
            )}
            {activePage && (
              <>
                <span className="text-white/20">/</span>
                <span className="text-sm text-white/50">{activePage.label}</span>
              </>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 text-white/40 transition-transform duration-200 ${
                navOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown — 2-col grid, compact */}
          {navOpen && (
            <div className="absolute left-1/2 top-full mt-3 w-[calc(100vw-2rem)] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl border border-white/[0.08] bg-neutral-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl sm:w-[520px] sm:p-3">
              {/* Arrow indicator */}
              <div className="absolute -top-1.5 left-1/2 hidden h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-white/[0.08] bg-neutral-900/95 sm:block" />

              <div className="relative grid grid-cols-1 gap-1 sm:grid-cols-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setNavOpen(false)}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.06] ${
                        isActive ? "bg-white/[0.04]" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                        <item.icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-white/40"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${isActive ? "text-white" : "text-white/90"}`}>
                          {item.label}
                        </p>
                        <p className="text-[11px] leading-snug text-white/40">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Separator + bottom links */}
              <div className="mt-1.5 border-t border-white/[0.06] pt-1.5">
                <div className="flex items-center justify-center gap-4 px-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setNavOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
                  >
                    Home
                  </Link>
                  <span className="text-white/10">|</span>
                  <Link
                    href="/dashboard/workspaces"
                    onClick={() => setNavOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
                  >
                    Workspaces
                  </Link>
                  <span className="text-white/10">|</span>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setNavOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
                  >
                    Settings
                  </Link>
                  <span className="text-white/10">|</span>
                  <Link
                    href="/dashboard/design"
                    onClick={() => setNavOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
                  >
                    Design
                  </Link>
                  <span className="text-white/10">|</span>
                  <Link
                    href="/dashboard/apps"
                    onClick={() => setNavOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
                  >
                    Apps
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
    </div>
  );
}
