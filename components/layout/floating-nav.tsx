"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Blocks,
  CalendarDays,
  Code2,
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
    label: "Calendario",
    description: "Agenda e execucao",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    tone: "green",
  },
  {
    label: "Workspaces",
    description: "Contexto e memoria",
    href: "/dashboard/workspaces",
    icon: Layers,
    tone: "purple",
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
    idle: "text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  green: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  purple: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  pink: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  orange: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
    dot: "bg-[#d7c29b]",
  },
  blue: {
    active:
      "border-[rgba(208,186,143,0.24)] bg-[linear-gradient(180deg,rgba(208,186,143,0.12),rgba(208,186,143,0.04))] text-white",
    idle: "text-white/56 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-white",
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
        "group inline-flex h-10 items-center gap-2 rounded-full border border-transparent px-3.5 text-sm font-medium transition-all duration-300",
        isActive ? tone.active : tone.idle
      )}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.05] bg-black/24">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="hidden sm:inline">{entry.label}</span>
      {isActive ? (
        <span className={cn("hidden h-1.5 w-1.5 rounded-full sm:block", tone.dot)} />
      ) : null}
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
    <div className="pointer-events-none relative z-50 w-full px-3 pt-4 md:px-6 md:pt-6">
      {isAuthenticated ? (
        <div className="pointer-events-auto absolute right-3 top-3 hidden items-center gap-2 lg:flex md:right-6 md:top-6">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(208,186,143,0.16)] bg-[linear-gradient(180deg,rgba(208,186,143,0.10),rgba(208,186,143,0.04))] px-3.5 py-2 text-[11px] font-medium text-[#ead7b1] backdrop-blur-md transition-all hover:border-[rgba(208,186,143,0.28)] hover:text-white"
          >
            Upgrade
          </Link>
          <button
            data-tour="theme-toggle"
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] text-white/72 backdrop-blur-md transition-all hover:border-white/[0.14] hover:text-white"
            aria-label="Alternar tema"
          >
            {isDark ? <Moon className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] text-white/62 backdrop-blur-md transition-all hover:border-white/[0.14] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex w-full justify-center">
        <div className="pointer-events-auto flex max-w-[calc(100vw-1rem)] items-center gap-2 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,18,0.78),rgba(7,7,8,0.96))] px-2 py-2 shadow-[0_30px_120px_-40px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl">
          <Link
            href="/dashboard"
            className="flex h-11 items-center gap-2 rounded-full border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3.5 text-white/78 transition-all hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white"
          >
            <Image
              src="/logo.png"
              alt="ORIGEM"
              width={28}
              height={28}
              className="pointer-events-none drop-shadow-[0_0_22px_rgba(232,214,177,0.16)]"
            />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-[#cbb486]/55 md:inline">
              ORIGEM
            </span>
          </Link>

          <div className="hidden h-7 w-px bg-white/[0.08] md:block" />

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {PRIMARY_ENTRIES.map((entry) => (
              <DockLink key={entry.href} entry={entry} pathname={pathname} />
            ))}

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-3.5 text-sm font-medium text-white/70 transition-all hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.05] bg-black/24">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden sm:inline">Explorar</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={12}
                className="w-[min(92vw,560px)] rounded-[28px] border-white/[0.10] bg-black/70 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl"
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
    </div>
  );
}
