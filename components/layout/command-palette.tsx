"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui-store";
import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonaStore } from "@/stores/persona-store";
import { useConnectionStore } from "@/stores/connection-store";
import { CELEBRITY_PERSONAS, PERSONA_ICONS } from "@/lib/personas";
import {
  Newspaper,
  LayoutDashboard,
  Settings,
  Key,
  Gauge,
  Layers,
  CalendarDays,
  MessageSquare,
  Plus,
  Blocks,
  Filter,
  Baby,
  Users2,
  Code2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendario", href: "/dashboard/calendar", icon: CalendarDays },
  { label: "Code", href: "/dashboard/code", icon: Code2 },
  { label: "Workspaces", href: "/dashboard/workspaces", icon: Layers },
  { label: "Equipe", href: "/dashboard/connections", icon: Users2 },
  { label: "Apps", href: "/dashboard/apps", icon: Blocks },
  { label: "Celebridade IA", href: "/dashboard/apps/celebrity-chat", icon: MessageSquare },
  { label: "ORIGEM Kids", href: "/dashboard/apps/kids", icon: Baby },
  { label: "Configurações", href: "/dashboard/settings", icon: Settings },
  { label: "Provedores", href: "/dashboard/settings/providers", icon: Key },
  { label: "Controle", href: "/dashboard/control", icon: Gauge },
];

const actionItems = [
  { label: "Nova sessão", href: "/dashboard", icon: Plus },
  { label: "Novo workspace", href: "/dashboard/workspaces", icon: Layers },
  { label: "Pesquisa ao vivo", href: "/dashboard/feed", icon: Newspaper },
  {
    label: "Configurar provedores",
    href: "/dashboard/settings/providers",
    icon: Blocks,
  },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const sessions = useSessionStore((s) => s.sessions);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const activeWorkspaces = workspaces.filter((w) => w.status === "active");
  const setActivePersona = usePersonaStore((s) => s.setActivePersona);
  const connections = useConnectionStore((s) => s.connections);
  const acceptedConnections = connections.filter((c) => c.status === "accepted").slice(0, 5);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  function select(href: string) {
    router.push(href);
    setCommandPaletteOpen(false);
  }

  const recentSessions = sessions.slice(0, 5);

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      title="Command Palette"
      description="Navegue rapidamente pelo sistema"
    >
      <CommandInput placeholder="Buscar..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => select(item.href)}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {recentSessions.length > 0 && (
          <CommandGroup heading="Sessões recentes">
            {recentSessions.map((session) => (
              <CommandItem
                key={session.id}
                onSelect={() => select(`/dashboard/chat/${session.id}`)}
              >
                <MessageSquare />
                <span>{session.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {activeWorkspaces.length > 0 && (
          <CommandGroup heading="Mudar workspace">
            <CommandItem
              onSelect={() => {
                setActiveWorkspace(null);
                setCommandPaletteOpen(false);
              }}
            >
              <Layers />
              <span>Todos os workspaces</span>
              {!activeWorkspaceId && <span className="ml-auto text-[10px] text-neon-cyan">ativo</span>}
            </CommandItem>
            {activeWorkspaces.map((ws) => (
              <CommandItem
                key={ws.id}
                onSelect={() => {
                  setActiveWorkspace(ws.id);
                  setCommandPaletteOpen(false);
                }}
              >
                <Filter />
                <span>{ws.name}</span>
                {activeWorkspaceId === ws.id && <span className="ml-auto text-[10px] text-neon-cyan">ativo</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {acceptedConnections.length > 0 && (
          <CommandGroup heading="Equipe recente">
            {acceptedConnections.map((conn) => (
              <CommandItem
                key={conn.id}
                onSelect={() => select("/dashboard/connections")}
              >
                <Users2 />
                <span>{conn.name}</span>
                <span className="ml-auto text-[10px] text-foreground/30">{conn.role}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Mudar persona">
          {CELEBRITY_PERSONAS.map((persona) => (
            <CommandItem
              key={persona.id}
              onSelect={() => {
                setActivePersona(persona.id);
                router.push("/dashboard/apps/celebrity-chat");
                setCommandPaletteOpen(false);
              }}
            >
              {(() => {
                const Icon = PERSONA_ICONS[persona.id];
                return Icon ? <Icon className="h-4 w-4" /> : null;
              })()}
              <span>{persona.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Ações">
          {actionItems.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => select(item.href)}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
