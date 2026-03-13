"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CalendarClock,
  FolderKanban,
  Orbit,
  PlugZap,
  Workflow,
} from "lucide-react";
import { PROVIDER_CATALOG } from "@/config/providers";
import { useConfiguredProviders } from "@/hooks/use-configured-providers";
import { cn } from "@/lib/utils";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { useCalendarStore, toDateKey } from "@/stores/calendar-store";
import { useMCPStore } from "@/stores/mcp-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WorkspaceReadinessStripProps {
  workspaceId?: string | null;
  workspaceName?: string | null;
  compact?: boolean;
  className?: string;
}

interface ReadinessCard {
  href: string;
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconAccent: string;
}

export function WorkspaceReadinessStrip({
  workspaceId,
  workspaceName,
  compact = false,
  className,
}: WorkspaceReadinessStripProps) {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const { providers, loading } = useConfiguredProviders();
  const ecosystemConfig = useChatSettingsStore((state) => state.ecosystemConfig);
  const connectors = useMCPStore((state) => state.connectors);
  const events = useCalendarStore((state) => state.events);
  const sessions = useSessionStore((state) => state.sessions);

  const effectiveWorkspaceId = workspaceId ?? activeWorkspaceId ?? null;
  const effectiveWorkspaceName =
    workspaceName ??
    workspaces.find((workspace) => workspace.id === effectiveWorkspaceId)?.name ??
    null;

  const providerSummary = useMemo(() => {
    if (loading) {
      return "Carregando runtime";
    }

    if (ecosystemConfig.provider && ecosystemConfig.model) {
      const meta = PROVIDER_CATALOG.find(
        (provider) => provider.name === ecosystemConfig.provider
      );

      return `${meta?.displayName ?? ecosystemConfig.provider} / ${ecosystemConfig.model}`;
    }

    if (providers.length === 0) {
      return "Nenhum provider";
    }

    return `${providers.length} provider${providers.length > 1 ? "s" : ""} pronto${providers.length > 1 ? "s" : ""}`;
  }, [ecosystemConfig.model, ecosystemConfig.provider, loading, providers.length]);

  const workspaceConnectors = useMemo(() => {
    if (!effectiveWorkspaceId) {
      return [];
    }

    return connectors.filter((connector) => connector.workspaceId === effectiveWorkspaceId);
  }, [connectors, effectiveWorkspaceId]);

  const connectedConnectors = workspaceConnectors.filter(
    (connector) => connector.status === "connected"
  );
  const toolCount = connectedConnectors.reduce(
    (total, connector) => total + connector.tools.length,
    0
  );

  const todayKey = toDateKey(new Date());
  const todayEvents = events[todayKey] ?? [];

  const cards: ReadinessCard[] = [
    {
      href: "/dashboard/workspaces",
      label: "Contexto",
      value: effectiveWorkspaceName ?? "Contexto global",
      helper:
        effectiveWorkspaceId && workspaceConnectors.length > 0
          ? `${workspaceConnectors.length} conector${workspaceConnectors.length > 1 ? "es" : ""} instalado${workspaceConnectors.length > 1 ? "s" : ""}`
          : "Memoria aberta para toda a operacao",
      icon: FolderKanban,
      accent: "from-[rgba(208,186,143,0.18)] via-[rgba(208,186,143,0.05)] to-transparent",
      iconAccent:
        "border-[rgba(208,186,143,0.16)] bg-[rgba(208,186,143,0.08)] text-[#ead7b1]",
    },
    {
      href: "/dashboard/settings/providers",
      label: "Runtime",
      value: providerSummary,
      helper:
        ecosystemConfig.provider && ecosystemConfig.model
          ? "Roteamento definido para esta sessao"
          : "Auto, tier ou modelo manual",
      icon: Orbit,
      accent: "from-[rgba(153,176,199,0.16)] via-[rgba(153,176,199,0.05)] to-transparent",
      iconAccent:
        "border-[rgba(153,176,199,0.16)] bg-[rgba(153,176,199,0.08)] text-[#d8e3ef]",
    },
    {
      href: "/dashboard/workspaces",
      label: "Ferramentas",
      value:
        connectedConnectors.length > 0
          ? `${toolCount} ferramenta${toolCount !== 1 ? "s" : ""}`
          : "Sem ferramentas ativas",
      helper:
        connectedConnectors.length > 0
          ? `${connectedConnectors.length} MCP conectado${connectedConnectors.length > 1 ? "s" : ""}`
          : "Conecte dados e MCP ao workspace",
      icon: PlugZap,
      accent: "from-[rgba(177,152,216,0.16)] via-[rgba(177,152,216,0.05)] to-transparent",
      iconAccent:
        "border-[rgba(177,152,216,0.16)] bg-[rgba(177,152,216,0.08)] text-[#dfd4f2]",
    },
    {
      href: "/dashboard/calendar",
      label: "Agenda",
      value:
        todayEvents.length > 0
          ? `${todayEvents.length} bloco${todayEvents.length > 1 ? "s" : ""} hoje`
          : "Dia livre",
      helper:
        todayEvents.length > 0
          ? "Planejamento refletido no calendario"
          : "Transforme prompts em blocos operacionais",
      icon: CalendarClock,
      accent: "from-[rgba(138,168,145,0.16)] via-[rgba(138,168,145,0.05)] to-transparent",
      iconAccent:
        "border-[rgba(138,168,145,0.16)] bg-[rgba(138,168,145,0.08)] text-[#d3e5d6]",
    },
    {
      href: "/dashboard/control",
      label: "Operacao",
      value:
        sessions.length > 0
          ? `${sessions.length} sess${sessions.length > 1 ? "oes" : "ao"}`
          : "Sem sessoes",
      helper:
        sessions.length > 0
          ? "Historico pronto para continuidade"
          : "Abra uma sessao para iniciar a trilha",
      icon: Workflow,
      accent: "from-[rgba(255,255,255,0.12)] via-[rgba(255,255,255,0.04)] to-transparent",
      iconAccent:
        "border-white/[0.10] bg-white/[0.04] text-white/78",
    },
  ];

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "sm:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-5",
        className
      )}
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.label}
            href={card.href}
            className="group relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))] px-4 py-4 shadow-[0_18px_70px_-34px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-white/[0.12] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016))]"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-80 transition-opacity group-hover:opacity-100",
                card.accent
              )}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/32">
                  {card.label}
                </p>
                <p className="mt-2 text-[15px] font-semibold leading-snug text-white/92">
                  {card.value}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-full border p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300 group-hover:scale-[1.02]",
                  card.iconAccent
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 max-w-[18rem] text-[11px] leading-relaxed text-white/44">
              {card.helper}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
