"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  ChevronRight,
  Layers,
  LayoutDashboard,
  Brain,
  FolderKanban,
  Bot,
  Zap,
  Users,
  GitBranch,
  Workflow,
  Blocks,
  Settings,
  Palette,
  Key,
  LogOut,
  Compass,
  Orbit,
  Rss,
  Users2,
  Monitor,
  Moon,
  Code2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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
    label: "Skills",
    description: "Capacidades atômicas modulares",
    href: "/dashboard/skills",
    icon: Zap,
    color: "orange",
  },
  {
    label: "360º",
    description: "Pipeline de orquestração completo",
    icon: Compass,
    color: "purple",
    children: [
      {
        label: "1 · Contextos",
        description: "Decomponha e mapeie contextos",
        href: "/dashboard/contexts",
        icon: Brain,
        color: "purple",
      },
      {
        label: "2 · Agentes",
        description: "Delegue a agentes especializados",
        href: "/dashboard/agents",
        icon: Bot,
        color: "orange",
      },
      {
        label: "3 · Projetos",
        description: "Estruture o plano de execução",
        href: "/dashboard/projects",
        icon: FolderKanban,
        color: "green",
      },
      {
        label: "4 · Grupos",
        description: "Defina estratégia de execução",
        href: "/dashboard/groups",
        icon: Users,
        color: "blue",
      },
      {
        label: "5 · Fluxos",
        description: "Monitore execução em tempo real",
        href: "/dashboard/flows",
        icon: GitBranch,
        color: "cyan",
      },
      {
        label: "6 · Canvas",
        description: "Visualize a cadeia da execucao",
        href: "/dashboard/canvas",
        icon: Workflow,
        color: "orange",
      },
      {
        label: "7 · Orquestra",
        description: "Visão unificada da execução",
        href: "/dashboard/orchestra",
        icon: Orbit,
        color: "purple",
      },
    ],
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
    label: "Code",
    description: "Editor de código com IA",
    href: "/dashboard/code",
    icon: Code2,
    color: "cyan",
  },
  {
    label: "Apps",
    description: "Experiências especializadas com IA",
    href: "/dashboard/apps",
    icon: Blocks,
    color: "pink",
  },
];

const COLOR_CLASSES: Record<NeonColor, { icon: string; activeBg: string; dot: string }> = {
  cyan: { icon: "text-neon-cyan", activeBg: "bg-neon-cyan/8", dot: "bg-neon-cyan" },
  purple: { icon: "text-neon-purple", activeBg: "bg-neon-purple/8", dot: "bg-neon-purple" },
  green: { icon: "text-neon-green", activeBg: "bg-neon-green/8", dot: "bg-neon-green" },
  orange: { icon: "text-neon-orange", activeBg: "bg-neon-orange/8", dot: "bg-neon-orange" },
  pink: { icon: "text-neon-pink", activeBg: "bg-neon-pink/8", dot: "bg-neon-pink" },
  blue: { icon: "text-neon-blue", activeBg: "bg-neon-blue/8", dot: "bg-neon-blue" },
};

interface QuickLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_LINKS: QuickLink[] = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Configurações", href: "/dashboard/settings", icon: Settings },
  { label: "UX/UI", href: "/dashboard/uxui", icon: Palette },
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
  const active = findActivePage(pathname);
  const is360Expanded = expanded360 || (navOpen && active?.parentLabel === "360º");
  const session = useSession();
  const isAuthenticated = session.status === "authenticated";
  const isDark = theme !== "light";

  return (
    <div className="pointer-events-none relative z-50 w-full px-3 pt-4 md:px-6 md:pt-6">
      {isAuthenticated && (
        <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-1.5 md:right-6 md:top-6 md:gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-foreground/10 px-2.5 py-1 text-[11px] font-medium text-foreground/80 backdrop-blur-md transition-all hover:bg-foreground/15 hover:text-foreground md:gap-1.5 md:px-3 md:py-1.5 md:text-xs"
          >
            Assinar
          </Link>
          {/* Theme toggle — soft slide */}
          <button
            data-tour="theme-toggle"
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative inline-flex h-7 w-11 items-center rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-md transition-all md:w-12"
            aria-label="Alternar tema"
          >
            <span
              className={cn(
                "absolute flex h-5 w-5 items-center justify-center rounded-full bg-foreground shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isDark ? "left-[22px]" : "left-[3px]"
              )}
            >
              {isDark ? (
                <Moon className="h-3 w-3 text-neutral-800" />
              ) : (
                <Monitor className="h-3 w-3 text-neutral-400" />
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[11px] font-medium text-foreground/50 backdrop-blur-md transition-all hover:border-foreground/20 hover:text-foreground/70 md:gap-1.5 md:px-3 md:py-1.5 md:text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      )}

      <div className="flex w-full justify-center">
        <motion.div
          ref={navRef as any}
          layout
          initial={false}
          animate={{
            width: navOpen ? (typeof window !== "undefined" && window.innerWidth < 640 ? "calc(100vw - 1rem)" : 540) : "auto",
            borderRadius: navOpen ? 24 : 9999,
          }}
          className={cn(
            "pointer-events-auto relative flex flex-col overflow-hidden border bg-card/76 backdrop-blur-3xl transition-shadow duration-500",
            navOpen
              ? "border-foreground/[0.08] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
              : "border-foreground/[0.04] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] hover:border-foreground/[0.08] hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.4)]"
          )}
        >
          {/* CLOSED STATE (Dynamic Island Pill) */}
          <AnimatePresence mode="popLayout">
            {!navOpen && (
              <motion.div
                key="closed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex h-[42px] items-center gap-1.5 px-1.5 py-1 sm:h-[48px] sm:gap-2 sm:px-2"
              >
                <button
                  data-tour="nav-logo"
                  type="button"
                  onClick={() => setNavOpen(true)}
                  className="flex h-full items-center justify-center rounded-full px-2 transition-colors hover:bg-foreground/5"
                  aria-label="Abrir Navegação"
                >
                  <Image
                    src="/logo.png"
                    alt="ORIGEM"
                    width={28}
                    height={28}
                    className="pointer-events-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  />
                </button>
                <div className="h-4 w-[1px] bg-foreground/10" />
                <div className="flex items-center space-x-0.5">
                  <Link
                    href="/dashboard"
                    className="flex h-8 items-center rounded-full px-3 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/contexts"
                    className="flex h-8 items-center rounded-full px-3 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    360º
                  </Link>
                  <Link
                    href="/dashboard/code"
                    className="flex h-8 items-center rounded-full px-3 text-[12px] font-medium text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    Code
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OPEN STATE (Expanded Grid) */}
          <AnimatePresence mode="popLayout">
            {navOpen && (
              <motion.div
                key="open"
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.3, staggerChildren: 0.05 }}
                className="flex w-full flex-col p-2 sm:p-3"
              >
                {/* Header inside open state */}
                <div className="mb-4 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/logo.png"
                      alt="ORIGEM"
                      width={32}
                      height={32}
                      className="opacity-90 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                    />
                    <span className="text-[10px] font-semibold tracking-[0.2em] text-foreground/40">
                      ORIGEM OS
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setNavOpen(false);
                      setExpanded360(false);
                    }}
                    className="rounded-full p-2 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
                    aria-label="Fechar Navegação"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

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
                              is360Expanded && "rotate-90"
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
                  {is360Expanded && (
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
                              ? "bg-foreground/[0.04] text-foreground/60"
                              : "text-foreground/30 hover:bg-foreground/[0.03] hover:text-foreground/50"
                          )}
                        >
                          <link.icon className="h-3 w-3" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
