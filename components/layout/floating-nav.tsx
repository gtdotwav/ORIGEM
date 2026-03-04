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
  Settings,
  Palette,
  Key,
  Baby,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";

type NeonColor = "cyan" | "purple" | "green" | "orange" | "pink" | "blue";

interface NavItem {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: NeonColor;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    description: "Centro de controle operacional",
    href: "/dashboard/control",
    icon: LayoutDashboard,
    color: "cyan",
  },
  {
    label: "Contextos",
    description: "Mapeie e decomponha contextos",
    href: "/dashboard/contexts",
    icon: Brain,
    color: "purple",
  },
  {
    label: "Projetos",
    description: "Organize sessoes e workflows",
    href: "/dashboard/projects",
    icon: FolderKanban,
    color: "green",
  },
  {
    label: "Agentes",
    description: "Gerencie agentes especializados",
    href: "/dashboard/agents",
    icon: Bot,
    color: "orange",
  },
  {
    label: "Space",
    description: "Canvas infinito para orquestracao",
    href: "/dashboard/space",
    icon: Orbit,
    color: "pink",
  },
  {
    label: "Grupos",
    description: "Coordene agentes em paralelo",
    href: "/dashboard/groups",
    icon: Users,
    color: "blue",
  },
  {
    label: "Fluxos",
    description: "Pipelines e automacao",
    href: "/dashboard/flows",
    icon: GitBranch,
    color: "cyan",
  },
  {
    label: "Workspaces",
    description: "Espacos de trabalho isolados",
    href: "/dashboard/workspaces",
    icon: Layers,
    color: "purple",
  },
  {
    label: "Apps",
    description: "Experiencias especializadas com IA",
    href: "/dashboard/apps",
    icon: Sparkles,
    color: "pink",
  },
  {
    label: "Kids",
    description: "Aprendizado e diversao para criancas",
    href: "/dashboard/kids",
    icon: Baby,
    color: "green",
  },
];

const COLOR_CLASSES: Record<NeonColor, { icon: string; activeBg: string; dot: string }> = {
  cyan:   { icon: "text-neon-cyan",   activeBg: "bg-neon-cyan/8",   dot: "bg-neon-cyan" },
  purple: { icon: "text-neon-purple", activeBg: "bg-neon-purple/8", dot: "bg-neon-purple" },
  green:  { icon: "text-neon-green",  activeBg: "bg-neon-green/8",  dot: "bg-neon-green" },
  orange: { icon: "text-neon-orange", activeBg: "bg-neon-orange/8", dot: "bg-neon-orange" },
  pink:   { icon: "text-neon-pink",   activeBg: "bg-neon-pink/8",   dot: "bg-neon-pink" },
  blue:   { icon: "text-neon-blue",   activeBg: "bg-neon-blue/8",   dot: "bg-neon-blue" },
};

interface QuickLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_LINKS: QuickLink[] = [
  { label: "Inicio", href: "/dashboard", icon: Atom },
  { label: "Configuracoes", href: "/dashboard/settings", icon: Settings },
  { label: "Design", href: "/dashboard/design", icon: Palette },
  { label: "Provedores", href: "/dashboard/settings/providers", icon: Key },
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

  const activePage = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const activeColor = activePage ? COLOR_CLASSES[activePage.color] : null;
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWsName = workspaces.find((w) => w.id === activeWorkspaceId)?.name;

  return (
    <div className="relative z-50 w-full px-4 pt-6 md:px-6">
      {/* Login button */}
      <div className="absolute right-4 top-6 md:right-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/30 bg-black/45 px-3 py-1.5 text-xs font-medium text-neon-cyan backdrop-blur-md transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/15 hover:shadow-[0_0_12px_rgba(0,210,210,0.15)]"
        >
          <LogIn className="h-3.5 w-3.5" />
          Login
        </Link>
      </div>

      <div className="flex w-full justify-center">
        <div ref={navRef} className="relative">
          {/* Trigger pill */}
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-md transition-all",
              navOpen
                ? "border-white/20 bg-white/10 shadow-lg shadow-black/20"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            )}
          >
            <Atom className={cn("h-4 w-4", activeColor ? activeColor.icon : "text-blue-400")} />
            <span className="text-sm font-medium text-white/90">ORIGEM</span>
            {activeWsName && (
              <>
                <span className="text-white/15">·</span>
                <span className="max-w-[80px] truncate text-xs text-neon-cyan/50">{activeWsName}</span>
              </>
            )}
            {activePage && (
              <>
                <span className="text-white/15">·</span>
                <span className={cn("text-xs", activeColor?.icon ?? "text-white/40")}>
                  {activePage.label}
                </span>
              </>
            )}
            <ChevronDown
              className={cn(
                "h-3 w-3 text-white/30 transition-transform duration-200",
                navOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {navOpen && (
            <div className="absolute left-1/2 top-full mt-3 w-[calc(100vw-2rem)] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl border border-white/[0.08] bg-neutral-950/95 p-2.5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:w-[540px] sm:p-3">
              {/* Arrow */}
              <div className="absolute -top-1.5 left-1/2 hidden h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-white/[0.08] bg-neutral-950/95 sm:block" />

              {/* Nav grid */}
              <div className="relative grid grid-cols-1 gap-0.5 sm:grid-cols-3">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const colors = COLOR_CLASSES[item.color];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setNavOpen(false)}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all",
                        isActive
                          ? `${colors.activeBg}`
                          : "hover:bg-white/[0.05]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? `${colors.activeBg}`
                            : "bg-white/[0.03] group-hover:bg-white/[0.06]"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isActive ? colors.icon : "text-white/30 group-hover:text-white/50"
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-[13px] font-medium leading-tight",
                            isActive ? "text-white" : "text-white/75 group-hover:text-white/90"
                          )}
                        >
                          {item.label}
                        </p>
                        <p className="truncate text-[10px] leading-snug text-white/25">
                          {item.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className={cn("ml-auto h-1.5 w-1.5 shrink-0 rounded-full", colors.dot)} />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Quick links footer */}
              <div className="mt-2 border-t border-white/[0.05] pt-2">
                <div className="flex items-center justify-center gap-1">
                  {QUICK_LINKS.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                    const isExactDashboard = link.href === "/dashboard" && pathname !== "/dashboard";
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setNavOpen(false)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors",
                          isActive && !isExactDashboard
                            ? "text-white/60 bg-white/[0.04]"
                            : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                        )}
                      >
                        <link.icon className="h-3 w-3" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
