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
import { CELEBRITY_PERSONAS } from "@/lib/personas";
import {
  LayoutDashboard,
  Brain,
  Bot,
  FolderKanban,
  Users,
  GitBranch,
  Orbit,
  Settings,
  Key,
  Gauge,
  Layers,
  MessageSquare,
  Plus,
  Sparkles,
  Filter,
  Baby,
  Workflow,
  Rss,
  Users2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Space", href: "/dashboard/space", icon: Orbit },
  { label: "Workspaces", href: "/dashboard/workspaces", icon: Layers },
  { label: "Feed", href: "/dashboard/feed", icon: Rss },
  { label: "Conexões", href: "/dashboard/connections", icon: Users2 },
  { label: "Apps", href: "/dashboard/apps", icon: Sparkles },
  { label: "Celebridade IA", href: "/dashboard/apps/celebrity-chat", icon: MessageSquare },
  { label: "ORIGEM Kids", href: "/dashboard/kids", icon: Baby },
  { label: "Configurações", href: "/dashboard/settings", icon: Settings },
  { label: "Provedores", href: "/dashboard/settings/providers", icon: Key },
  { label: "Controle", href: "/dashboard/control", icon: Gauge },
];

const pipelineItems = [
  { label: "Contextos", href: "/dashboard/contexts", icon: Brain },
  { label: "Agentes", href: "/dashboard/agents", icon: Bot },
  { label: "Projetos", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Grupos", href: "/dashboard/groups", icon: Users },
  { label: "Fluxos", href: "/dashboard/flows", icon: GitBranch },
  { label: "Canvas", href: "/dashboard/canvas", icon: Workflow },
];

const actionItems = [
  { label: "Nova sessão", href: "/dashboard", icon: Plus },
  { label: "Novo workspace", href: "/dashboard/workspaces", icon: Layers },
  {
    label: "Configurar provedores",
    href: "/dashboard/settings/providers",
    icon: Sparkles,
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

        <CommandGroup heading="360º — Pipeline">
          {pipelineItems.map((item) => (
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
          <CommandGroup heading="Conexões recentes">
            {acceptedConnections.map((conn) => (
              <CommandItem
                key={conn.id}
                onSelect={() => select("/dashboard/connections")}
              >
                <Users2 />
                <span>{conn.name}</span>
                <span className="ml-auto text-[10px] text-white/30">{conn.role}</span>
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
              <span className="text-base">{persona.emoji}</span>
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
