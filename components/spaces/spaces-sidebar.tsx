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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";

interface ToolItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: () => void;
}

export function SpacesSidebar() {
  const activeSpaceId = useSpacesStore((s) => s.activeSpaceId);
  const createCard = useSpacesStore((s) => s.createCard);

  const handleNewGeneration = () => {
    if (!activeSpaceId) return;
    createCard(activeSpaceId, "");
  };

  const tools: ToolItem[] = [
    { id: "image", label: "Imagem", icon: ImageIcon, action: handleNewGeneration },
    { id: "video", label: "Video", icon: Video },
    { id: "assistants", label: "Assistentes", icon: Bot },
    { id: "models", label: "Modelos", icon: Box },
    { id: "history", label: "Historico", icon: Clock },
    { id: "assets", label: "Assets", icon: FolderOpen },
    { id: "spaces", label: "Spaces", icon: Layers },
  ];

  return (
    <div className="flex h-full w-12 flex-col items-center gap-0.5 border-r border-white/[0.04] bg-[oklch(0.08_0_0)] py-2.5">
      {/* New button */}
      <button
        type="button"
        onClick={handleNewGeneration}
        className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 transition-all hover:bg-white/[0.08] hover:text-white/65"
        title="Novo card"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <div className="mb-1 h-px w-5 bg-white/[0.04]" />

      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={tool.action}
          className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-white/22 transition-all hover:bg-white/[0.05] hover:text-white/50"
          title={tool.label}
        >
          <tool.icon className="h-3.5 w-3.5" />
          <div className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md border border-white/[0.08] bg-[oklch(0.12_0_0)] px-2 py-0.5 text-[9px] text-white/50 opacity-0 transition-opacity group-hover:opacity-100">
            {tool.label}
          </div>
        </button>
      ))}
    </div>
  );
}
