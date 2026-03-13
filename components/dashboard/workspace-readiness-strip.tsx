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
import { useConfiguredProviders } from "@/hooks/use-configured-providers";
import { PROVIDER_CATALOG } from "@/config/providers";
import { useChatSettingsStore } from "@/stores/chat-settings-store";
import { useCalendarStore, toDateKey } from "@/stores/calendar-store";
import { useMCPStore } from "@/stores/mcp-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";

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
  tone: string;
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

      return `${meta?.displayName ?? ecosystemConfig.provider} · ${ecosystemConfig.model}`;
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

    return connectors.filter(
      (connector) => connector.workspaceId === effectiveWorkspaceId
    );
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
      value: effectiveWorkspaceName ?? "Global",
      helper:
        effectiveWorkspaceId && workspaceConnectors.length > 0
          ? `${workspaceConnectors.length} conector${workspaceConnectors.length > 1 ? "es" : ""} instalado${workspaceConnectors.length > 1 ? "s" : ""}`
          : "Sem filtro de workspace",
      icon: FolderKanban,
      tone:
        "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.05]",
    },
    {
      href: "/dashboard/settings/providers",
      label: "Runtime",
      value: providerSummary,
      helper:
        ecosystemConfig.provider && ecosystemConfig.model
          ? "Roteamento definido"
          : "Auto, tier ou manual",
      icon: Orbit,
      tone:
        "border-cyan-400/20 bg-cyan-400/8 hover:border-cyan-400/35 hover:bg-cyan-400/12",
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
          : "Conecte MCP ao workspace",
      icon: PlugZap,
      tone:
        "border-orange-400/20 bg-orange-400/8 hover:border-orange-400/35 hover:bg-orange-400/12",
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
          ? "Planejamento ja refletido no calendario"
          : "Transforme prompts em agenda",
      icon: CalendarClock,
      tone:
        "border-green-400/20 bg-green-400/8 hover:border-green-400/35 hover:bg-green-400/12",
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
      tone:
        "border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] hover:border-white/[0.16] hover:bg-white/[0.05]",
    },
  ];

  return (
    <div
      className={cn(
        "grid gap-2",
        compact ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.label}
            href={card.href}
            className={cn(
              "group rounded-[22px] border px-4 py-3 backdrop-blur-xl transition-all duration-300",
              card.tone
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                  {card.label}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-white/90">
                  {card.value}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 p-2 text-white/58 transition-colors group-hover:text-white">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/42">
              {card.helper}
            </p>
          </Link>
        );
      })}

    </div>
  );
}
