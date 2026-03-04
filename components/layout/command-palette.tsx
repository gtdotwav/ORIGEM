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
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contextos", href: "/dashboard/contexts", icon: Brain },
  { label: "Agentes", href: "/dashboard/agents", icon: Bot },
  { label: "Projetos", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Grupos", href: "/dashboard/groups", icon: Users },
  { label: "Fluxos", href: "/dashboard/flows", icon: GitBranch },
  { label: "Space", href: "/dashboard/space", icon: Orbit },
  { label: "Configuracoes", href: "/dashboard/settings", icon: Settings },
  { label: "Providers", href: "/dashboard/settings/providers", icon: Key },
  { label: "Controle", href: "/dashboard/control", icon: Gauge },
  { label: "Workspaces", href: "/dashboard/workspaces", icon: Layers },
  { label: "Apps", href: "/dashboard/apps", icon: Sparkles },
  { label: "Celebridade IA", href: "/dashboard/apps/celebrity-chat", icon: MessageSquare },
];

const actionItems = [
  { label: "Nova sessao", href: "/dashboard", icon: Plus },
  { label: "Novo workspace", href: "/dashboard/workspaces", icon: Layers },
  {
    label: "Configurar providers",
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

        <CommandGroup heading="Navegacao">
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
          <CommandGroup heading="Sessoes recentes">
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

        <CommandGroup heading="Acoes">
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
