"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  LayoutDashboard,
  Brain,
  FolderKanban,
  Bot,
  Orbit,
  Users,
  GitBranch,
  Workflow,
  Sparkles,
  Settings,
  Palette,
  Key,
  Baby,
  LogOut,
  Compass,
  Rss,
  Users2,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
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

interface NavGroup {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: NeonColor;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const NAV_ENTRIES: NavEntry[] = [
  {
    label: "Dashboard",
    description: "Centro de controle operacional",
    href: "/dashboard/control",
    icon: LayoutDashboard,
    color: "cyan",
  },
  {
    label: "360º",
    description: "Pipeline de orquestração completo",
    icon: Compass,
    color: "purple",
    children: [
      {
        label: "Contextos",
        description: "Mapeie e decomponha contextos",
        href: "/dashboard/contexts",
        icon: Brain,
        color: "purple",
      },
      {
        label: "Agentes",
        description: "Gerencie agentes especializados",
        href: "/dashboard/agents",
        icon: Bot,
        color: "orange",
      },
      {
        label: "Projetos",
        description: "Organize sessões e workflows",
        href: "/dashboard/projects",
        icon: FolderKanban,
        color: "green",
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
        description: "Pipelines e automação",
        href: "/dashboard/flows",
        icon: GitBranch,
        color: "cyan",
      },
      {
        label: "Canvas",
        description: "Fluxos visuais de chat",
        href: "/dashboard/canvas",
        icon: Workflow,
        color: "orange",
      },
    ],
  },
  {
    label: "Space",
    description: "Canvas infinito para orquestração",
    href: "/dashboard/space",
    icon: Orbit,
    color: "pink",
  },
  {
    label: "Workspaces",
    description: "Espaços de trabalho isolados",
    href: "/dashboard/workspaces",
    icon: Layers,
    color: "purple",
  },
  {
    label: "Feed",
    description: "Notícias e conteúdo em tempo real",
    href: "/dashboard/feed",
    icon: Rss,
    color: "blue",
  },
  {
    label: "Conexões",
    description: "Rede de contatos e colaboradores",
    href: "/dashboard/connections",
    icon: Users2,
    color: "cyan",
  },
  {
    label: "Apps",
    description: "Experiências especializadas com IA",
    href: "/dashboard/apps",
    icon: Sparkles,
    color: "pink",
  },
  {
    label: "Kids",
    description: "Aprendizado e diversão para crianças",
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
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Configurações", href: "/dashboard/settings", icon: Settings },
  { label: "Design", href: "/dashboard/design", icon: Palette },
  { label: "Provedores", href: "/dashboard/settings/providers", icon: Key },
];

/** Find the active page by checking all nav entries (including group children) */
function findActivePage(pathname: string): { item: NavItem; parentLabel?: string } | null {
  for (const entry of NAV_ENTRIES) {
    if (isNavGroup(entry)) {
      for (const child of entry.children) {
        if (pathname.startsWith(child.href)) {
          return { item: child, parentLabel: entry.label };
        }
      }
    } else {
      if (pathname.startsWith(entry.href)) {
        return { item: entry };
      }
    }
  }
  return null;
}

export function FloatingNav() {
  const [navOpen, setNavOpen] = useState(false);
  const [expanded360, setExpanded360] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(e.target as Node)) {
      setNavOpen(false);
      setExpanded360(false);
    }
  }, []);

  useEffect(() => {
    if (navOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navOpen, handleClickOutside]);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = findActivePage(pathname);
  const activeColor = active ? COLOR_CLASSES[active.item.color] : null;
  const session = useSession();
  const isAuthenticated = session.status === "authenticated";
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWsName = workspaces.find((w) => w.id === activeWorkspaceId)?.name;

  // Auto-expand 360º group when a child page is active
  useEffect(() => {
    if (active?.parentLabel === "360º" && navOpen) {
      setExpanded360(true);
    }
  }, [active?.parentLabel, navOpen]);

  return (
    <div className="relative z-50 w-full px-4 pt-6 md:px-6">
      {isAuthenticated && (
        <div className="absolute right-4 top-6 flex items-center gap-2 md:right-6">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-md transition-all hover:bg-foreground/15 hover:text-foreground"
          >
            Assinar
          </Link>
          {/* Theme toggle — soft slide */}
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative inline-flex h-7 w-12 items-center rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-md transition-all"
              aria-label="Alternar tema"
            >
              <span
                className={cn(
                  "absolute flex h-5 w-5 items-center justify-center rounded-full bg-foreground shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  theme === "dark" ? "left-[22px]" : "left-[3px]"
                )}
              >
                {theme === "dark" ? (
                  <Moon className="h-3 w-3 text-neutral-800" />
                ) : (
                  <Sun className="h-3 w-3 text-amber-500" />
                )}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/50 backdrop-blur-md transition-all hover:border-foreground/20 hover:text-foreground/70"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      )}

      <div className="flex w-full justify-center">
        <div ref={navRef} className="relative flex flex-col items-center gap-2">
          {/* Trigger — logo image */}
          <button
            type="button"
            onClick={() => {
              setNavOpen((v) => !v);
              if (navOpen) setExpanded360(false);
            }}
            className="relative transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Image
              src="/logo.png"
              alt="ORIGEM"
              width={128}
              height={128}
              className="pointer-events-none drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            />
          </button>
          {/* Label beneath logo */}
          <span className="text-xs font-semibold tracking-[0.3em] text-foreground/35">
            ORIGEM
          </span>

          {/* Dropdown */}
          {navOpen && (
            <div className="absolute left-1/2 top-full mt-3 w-[calc(100vw-2rem)] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl border border-foreground/[0.08] bg-card/95 p-2.5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:w-[540px] sm:p-3">
              {/* Arrow */}
              <div className="absolute -top-1.5 left-1/2 hidden h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-foreground/[0.08] bg-card/95 sm:block" />

              {/* Nav grid */}
              <div className="relative grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                {NAV_ENTRIES.map((entry) => {
                  if (isNavGroup(entry)) {
                    const groupActive = entry.children.some((child) =>
                      pathname.startsWith(child.href)
                    );
                    const colors = COLOR_CLASSES[entry.color];
                    return (
                      <button
                        key={entry.label}
                        type="button"
                        onClick={() => setExpanded360((v) => !v)}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all",
                          groupActive ? colors.activeBg : "hover:bg-foreground/[0.05]"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                            groupActive ? colors.activeBg : "bg-foreground/[0.03] group-hover:bg-foreground/[0.06]"
                          )}
                        >
                          <entry.icon
                            className={cn(
                              "h-3.5 w-3.5 transition-colors",
                              groupActive ? colors.icon : "text-foreground/30 group-hover:text-foreground/50"
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[13px] font-medium leading-tight",
                              groupActive ? "text-foreground" : "text-foreground/75 group-hover:text-foreground/90"
                            )}
                          >
                            {entry.label}
                          </p>
                          <p className="truncate text-[10px] leading-snug text-foreground/25">
                            {entry.description}
                          </p>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 shrink-0 text-foreground/20 transition-transform duration-200",
                            expanded360 && "rotate-90"
                          )}
                        />
                        {groupActive && (
                          <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", colors.dot)} />
                        )}
                      </button>
                    );
                  }

                  const isActive = pathname.startsWith(entry.href);
                  const colors = COLOR_CLASSES[entry.color];
                  return (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      onClick={() => {
                        setNavOpen(false);
                        setExpanded360(false);
                      }}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all",
                        isActive ? colors.activeBg : "hover:bg-foreground/[0.05]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isActive ? colors.activeBg : "bg-foreground/[0.03] group-hover:bg-foreground/[0.06]"
                        )}
                      >
                        <entry.icon
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isActive ? colors.icon : "text-foreground/30 group-hover:text-foreground/50"
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-[13px] font-medium leading-tight",
                            isActive ? "text-foreground" : "text-foreground/75 group-hover:text-foreground/90"
                          )}
                        >
                          {entry.label}
                        </p>
                        <p className="truncate text-[10px] leading-snug text-foreground/25">
                          {entry.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className={cn("ml-auto h-1.5 w-1.5 shrink-0 rounded-full", colors.dot)} />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* 360º Sub-grid (expandable) */}
              <AnimatePresence>
                {expanded360 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 rounded-xl border border-neon-purple/10 bg-neon-purple/[0.03] p-1.5">
                      <div className="mb-1 flex items-center gap-1.5 px-2 py-1">
                        <Compass className="h-3 w-3 text-neon-purple/50" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-neon-purple/40">
                          Pipeline 360º
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-3">
                        {(NAV_ENTRIES.find((e) => isNavGroup(e)) as NavGroup)?.children.map(
                          (child) => {
                            const isActive = pathname.startsWith(child.href);
                            const colors = COLOR_CLASSES[child.color];
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => {
                                  setNavOpen(false);
                                  setExpanded360(false);
                                }}
                                className={cn(
                                  "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all",
                                  isActive ? colors.activeBg : "hover:bg-foreground/[0.05]"
                                )}
                              >
                                <div
                                  className={cn(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                                    isActive
                                      ? colors.activeBg
                                      : "bg-foreground/[0.03] group-hover:bg-foreground/[0.06]"
                                  )}
                                >
                                  <child.icon
                                    className={cn(
                                      "h-3 w-3 transition-colors",
                                      isActive ? colors.icon : "text-foreground/30 group-hover:text-foreground/50"
                                    )}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className={cn(
                                      "truncate text-[12px] font-medium leading-tight",
                                      isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground/85"
                                    )}
                                  >
                                    {child.label}
                                  </p>
                                </div>
                                {isActive && (
                                  <div
                                    className={cn(
                                      "ml-auto h-1 w-1 shrink-0 rounded-full",
                                      colors.dot
                                    )}
                                  />
                                )}
                              </Link>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick links footer */}
              <div className="mt-2 border-t border-foreground/[0.05] pt-2">
                <div className="flex items-center justify-center gap-1">
                  {QUICK_LINKS.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                    const isExactDashboard = link.href === "/dashboard" && pathname !== "/dashboard";
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          setNavOpen(false);
                          setExpanded360(false);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors",
                          isActive && !isExactDashboard
                            ? "text-foreground/60 bg-foreground/[0.04]"
                            : "text-foreground/30 hover:text-foreground/50 hover:bg-foreground/[0.03]"
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
