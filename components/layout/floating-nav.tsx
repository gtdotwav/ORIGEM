"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Blocks,
  CalendarDays,
  Code2,
  Compass,
  Gauge,
  Key,
  Layers,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sparkles,
  Users2,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DockTone = "cyan" | "green" | "purple" | "pink" | "orange" | "blue";

interface NavItem {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: DockTone;
}

const PRIMARY_ENTRIES: NavItem[] = [
  {
    label: "Comando",
    description: "Chat, output e execucao",
    href: "/dashboard",
    icon: LayoutDashboard,
    tone: "cyan",
  },
  {
    label: "Spaces",
    description: "Canvas visual e geracao",
    href: "/dashboard/spaces",
    icon: Sparkles,
    tone: "purple",
  },
  {
    label: "Workspaces",
    description: "Contexto e memoria",
    href: "/dashboard/workspaces",
    icon: Layers,
    tone: "green",
  },
  {
    label: "Calendario",
    description: "Agenda e execucao",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    tone: "green",
  },
  {
    label: "Code",
    description: "Execucao tecnica",
    href: "/dashboard/code",
    icon: Code2,
    tone: "blue",
  },
  {
    label: "Apps",
    description: "Superficies especiais",
    href: "/dashboard/apps",
    icon: Blocks,
    tone: "pink",
  },
];

const EXPLORE_ENTRIES: NavItem[] = [
  {
    label: "Skills",
    description: "Capacidades modulares",
    href: "/dashboard/skills",
    icon: Zap,
    tone: "orange",
  },
  {
    label: "Equipe",
    description: "Colaboradores e parceiros",
    href: "/dashboard/connections",
    icon: Users2,
    tone: "blue",
  },
  {
    label: "Controle",
    description: "Visao operacional",
    href: "/dashboard/control",
    icon: Gauge,
    tone: "cyan",
  },
  {
    label: "Providers",
    description: "Modelos e chaves",
    href: "/dashboard/settings/providers",
    icon: Key,
    tone: "orange",
  },
  {
    label: "UX/UI",
    description: "Sistema visual",
    href: "/dashboard/uxui",
    icon: Palette,
    tone: "purple",
  },
  {
    label: "Configuracoes",
    description: "Ajustes do produto",
    href: "/dashboard/settings",
    icon: Settings,
    tone: "green",
  },
];

const TONE_STYLES: Record<DockTone, { active: string; idle: string; dot: string }> = {
  cyan: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "border-transparent text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  green: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "border-transparent text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  purple: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "border-transparent text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  pink: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "border-transparent text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  orange: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "border-transparent text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  blue: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "border-transparent text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
};

function matchesPath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/chat/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function DockLink({
  entry,
  pathname,
  onSelect,
}: {
  entry: NavItem;
  pathname: string;
  onSelect?: () => void;
}) {
  const isActive = matchesPath(pathname, entry.href);
  const tone = TONE_STYLES[entry.tone];
  const Icon = entry.icon;

  return (
    <Link
      href={entry.href}
      onClick={onSelect}
      className={cn(
        "group inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[10px] font-medium uppercase tracking-[0.16em] transition-all duration-300",
        isActive ? tone.active : tone.idle
      )}
    >
      <Icon className="h-3 w-3 opacity-70" />
      <span>{entry.label}</span>
      {isActive ? <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} /> : null}
    </Link>
  );
}

export function FloatingNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const session = useSession();
  const isAuthenticated = session.status === "authenticated";
  const isDark = theme !== "light";

  return (
    <div className="pointer-events-none relative z-50 w-full px-3 pt-3 md:px-5 md:pt-4">
      <div className="mx-auto flex max-w-5xl justify-center">
        <div className="pointer-events-auto w-full rounded-[22px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(11,11,12,0.58),rgba(4,4,5,0.76))] px-2 py-2 shadow-[0_24px_96px_-58px_rgba(0,0,0,0.96),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-2xl">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-white/82 transition-all hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white"
            >
              <Image
                src="/logo.png"
                alt="ORIGEM"
                width={20}
                height={20}
                className="pointer-events-none drop-shadow-[0_0_14px_rgba(232,214,177,0.1)]"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#cbb486]/62">
                  ORIGEM
                </p>
              </div>
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-center overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5">
                  {PRIMARY_ENTRIES.map((entry) => (
                    <DockLink key={entry.href} entry={entry} pathname={pathname} />
                  ))}

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.08] px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/54 transition-all hover:border-white/[0.14] hover:bg-white/[0.04] hover:text-white"
                      >
                        <Compass className="h-3 w-3" />
                        <span>Explorar</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="center"
                      sideOffset={12}
                      className="w-[min(92vw,620px)] rounded-[28px] border-white/[0.10] bg-black/78 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/32">
                            Explorar superficies
                          </p>
                          <p className="mt-1 text-sm text-white/70">
                            Camadas complementares da operacao, sem tirar o foco do comando central.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {EXPLORE_ENTRIES.map((entry) => {
                          const Icon = entry.icon;
                          const isActive = matchesPath(pathname, entry.href);
                          const tone = TONE_STYLES[entry.tone];

                          return (
                            <Link
                              key={entry.href}
                              href={entry.href}
                              className={cn(
                                "group rounded-[22px] border px-4 py-3 transition-all",
                                isActive
                                  ? tone.active
                                  : "border-white/[0.06] bg-white/[0.02] text-white/65 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold">{entry.label}</p>
                                  <p className="mt-1 text-[11px] leading-relaxed text-white/42">
                                    {entry.description}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-2">
                                  <Icon className="h-4 w-4" />
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      {isAuthenticated ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3 lg:hidden">
                          <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(208,186,143,0.16)] bg-[linear-gradient(180deg,rgba(208,186,143,0.10),rgba(208,186,143,0.04))] px-3 py-2 text-xs font-medium text-[#ead7b1] transition-all hover:border-[rgba(208,186,143,0.28)] hover:text-white"
                          >
                            Upgrade
                          </Link>
                          <button
                            data-tour="theme-toggle"
                            type="button"
                            onClick={() => setTheme(isDark ? "light" : "dark")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/68 transition-all hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
                          >
                            {isDark ? <Moon className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                            {isDark ? "Claro" : "Escuro"}
                          </button>
                          <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/62 transition-all hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Sair
                          </button>
                        </div>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  href="/pricing"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgba(208,186,143,0.16)] bg-[linear-gradient(180deg,rgba(208,186,143,0.09),rgba(208,186,143,0.03))] px-3.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#ead7b1] transition-all hover:border-[rgba(208,186,143,0.28)] hover:text-white"
                >
                  Upgrade
                </Link>
                <button
                  data-tour="theme-toggle"
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 transition-all hover:border-white/[0.14] hover:text-white"
                  aria-label="Alternar tema"
                >
                  {isDark ? <Moon className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 transition-all hover:border-white/[0.14] hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
