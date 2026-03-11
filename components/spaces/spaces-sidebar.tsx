"use client";

import { useState } from "react";
import {
  ImageIcon,
  Video,
  Bot,
  Box,
  Clock,
  FolderOpen,
  Layers,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";

interface ToolItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: () => void;
  dividerAfter?: boolean;
}

export function SpacesSidebar() {
  const activeSpaceId = useSpacesStore((s) => s.activeSpaceId);
  const createCard = useSpacesStore((s) => s.createCard);
  const [activeTool, setActiveTool] = useState<string>("image");

  const handleNewGeneration = () => {
    if (!activeSpaceId) return;
    createCard(activeSpaceId, "");
  };

  const tools: ToolItem[] = [
    { id: "image", label: "Imagem", icon: ImageIcon, action: handleNewGeneration },
    { id: "video", label: "Video", icon: Video },
    { id: "assistants", label: "Assistentes", icon: Bot, dividerAfter: true },
    { id: "models", label: "Modelos", icon: Box },
    { id: "history", label: "Historico", icon: Clock },
    { id: "assets", label: "Assets", icon: FolderOpen },
    { id: "spaces", label: "Spaces", icon: Layers, dividerAfter: true },
    { id: "settings", label: "Config", icon: Settings },
  ];

  return (
    <div className="pointer-events-auto flex flex-col items-center rounded-[20px] border border-white/[0.08] bg-[oklch(0.08_0_0)]/80 p-2 pb-3 pt-2 shadow-2xl backdrop-blur-xl">
      {/* New button */}
      <button
        type="button"
        onClick={handleNewGeneration}
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-neon-cyan/20 bg-neon-cyan/[0.06] text-neon-cyan/60 transition-all hover:bg-neon-cyan/10 hover:text-neon-cyan/80 active:scale-95"
        title="Novo card"
      >
        <Plus className="h-4 w-4" />
      </button>

      <div className="mb-2 h-px w-6 bg-white/[0.05]" />

      {/* Tools */}
      <div className="flex flex-1 flex-col items-center gap-0.5">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <div key={tool.id} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTool(tool.id);
                  tool.action?.();
                }}
                className={cn(
                  "group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  isActive
                    ? "bg-white/[0.08] text-white/70"
                    : "text-white/22 hover:bg-white/[0.04] hover:text-white/45"
                )}
                title={tool.label}
              >
                <tool.icon className="h-4 w-4" />
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -left-[7px] h-4 w-[3px] rounded-r-full bg-neon-cyan/60" />
                )}
                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-white/[0.08] bg-[oklch(0.13_0_0)] px-2.5 py-1 text-[10px] font-medium text-white/60 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                  {tool.label}
                </div>
              </button>
              {tool.dividerAfter && (
                <div className="my-1.5 h-px w-5 bg-white/[0.04]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
