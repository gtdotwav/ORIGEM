"use client";

import {
  ImageIcon,
  Video,
  Bot,
  Box,
  Clock,
  FolderOpen,
  Layers,
  Plus,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action?: () => void;
}

export function SpacesSidebar() {
  const activeSpaceId = useSpacesStore((s) => s.activeSpaceId);
  const createCard = useSpacesStore((s) => s.createCard);
  const stylePresets = useSpacesStore((s) => s.stylePresets);

  const handleNewGeneration = () => {
    if (!activeSpaceId) return;
    createCard(activeSpaceId, "");
  };

  const tools: SidebarItem[] = [
    {
      id: "image-gen",
      label: "Gerar Imagem",
      icon: ImageIcon,
      color: "text-neon-cyan",
      action: handleNewGeneration,
    },
    {
      id: "video-gen",
      label: "Gerar Video",
      icon: Video,
      color: "text-neon-purple",
    },
    {
      id: "assistants",
      label: "Assistentes",
      icon: Bot,
      color: "text-neon-orange",
    },
    {
      id: "models",
      label: "Meus Modelos",
      icon: Box,
      color: "text-neon-green",
    },
    {
      id: "history",
      label: "Historico",
      icon: Clock,
      color: "text-foreground/50",
    },
    {
      id: "assets",
      label: "Assets",
      icon: FolderOpen,
      color: "text-foreground/50",
    },
    {
      id: "spaces",
      label: "Spaces",
      icon: Layers,
      color: "text-neon-pink",
    },
  ];

  return (
    <div className="flex h-full w-14 flex-col items-center gap-1 border-r border-foreground/[0.05] bg-[oklch(0.13_0_0)] py-3">
      {/* New generation button */}
      <button
        type="button"
        onClick={handleNewGeneration}
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-foreground/[0.10] bg-foreground/[0.06] text-foreground/50 transition-all hover:bg-foreground/[0.10] hover:text-foreground/70"
        title="Nova geracao"
      >
        <Plus className="h-4 w-4" />
      </button>

      <div className="mb-1 h-px w-6 bg-foreground/[0.06]" />

      {/* Tool buttons */}
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={tool.action}
          className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
          title={tool.label}
        >
          <tool.icon className={cn("h-4 w-4 transition-colors group-hover:" + tool.color.replace("text-", "text-"))} />
          {/* Tooltip */}
          <div className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg border border-foreground/[0.08] bg-card/95 px-2.5 py-1 text-[10px] text-foreground/70 opacity-0 shadow-lg backdrop-blur-xl transition-opacity group-hover:opacity-100">
            {tool.label}
          </div>
        </button>
      ))}

      <div className="flex-1" />

      {/* Style presets indicator */}
      {stylePresets.length > 0 && (
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground/25 transition-all hover:bg-foreground/[0.06] hover:text-neon-purple"
          title={`${stylePresets.length} estilos salvos`}
        >
          <Palette className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
