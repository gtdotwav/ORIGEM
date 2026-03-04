"use client";

import Link from "next/link";
import {
  Code,
  FolderOpen,
  Globe,
  Layers,
  MoreHorizontal,
  Pencil,
  Rocket,
  Star,
  Target,
  Trash2,
  Zap,
  Archive,
  Filter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Workspace, WorkspaceColor, WorkspaceIcon } from "@/types/workspace";
import { cn } from "@/lib/utils";

export const WORKSPACE_ICONS: Record<WorkspaceIcon, LucideIcon> = {
  folder: FolderOpen,
  rocket: Rocket,
  zap: Zap,
  star: Star,
  target: Target,
  globe: Globe,
  code: Code,
  layers: Layers,
};

export const WORKSPACE_COLORS: Record<
  WorkspaceColor,
  { border: string; bg: string; text: string; borderHover: string; bgHover: string }
> = {
  cyan: {
    border: "border-neon-cyan/30",
    bg: "bg-neon-cyan/10",
    text: "text-neon-cyan",
    borderHover: "hover:border-neon-cyan/50",
    bgHover: "hover:bg-neon-cyan/[0.06]",
  },
  purple: {
    border: "border-neon-purple/30",
    bg: "bg-neon-purple/10",
    text: "text-neon-purple",
    borderHover: "hover:border-neon-purple/50",
    bgHover: "hover:bg-neon-purple/[0.06]",
  },
  green: {
    border: "border-neon-green/30",
    bg: "bg-neon-green/10",
    text: "text-neon-green",
    borderHover: "hover:border-neon-green/50",
    bgHover: "hover:bg-neon-green/[0.06]",
  },
  orange: {
    border: "border-neon-orange/30",
    bg: "bg-neon-orange/10",
    text: "text-neon-orange",
    borderHover: "hover:border-neon-orange/50",
    bgHover: "hover:bg-neon-orange/[0.06]",
  },
  pink: {
    border: "border-neon-pink/30",
    bg: "bg-neon-pink/10",
    text: "text-neon-pink",
    borderHover: "hover:border-neon-pink/50",
    bgHover: "hover:bg-neon-pink/[0.06]",
  },
  blue: {
    border: "border-neon-blue/30",
    bg: "bg-neon-blue/10",
    text: "text-neon-blue",
    borderHover: "hover:border-neon-blue/50",
    bgHover: "hover:bg-neon-blue/[0.06]",
  },
};

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes}min atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

interface WorkspaceCardProps {
  workspace: Workspace;
  sessionCount: number;
  lastActivity: Date | null;
  onEdit: (workspace: Workspace) => void;
  onActivate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkspaceCard({
  workspace,
  sessionCount,
  lastActivity,
  onEdit,
  onActivate,
  onArchive,
  onDelete,
}: WorkspaceCardProps) {
  const colors = WORKSPACE_COLORS[workspace.color];
  const Icon = WORKSPACE_ICONS[workspace.icon];

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl transition-all",
        colors.borderHover,
        colors.bgHover
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/workspaces/${workspace.id}`}
          className="flex items-start gap-3"
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              colors.border,
              colors.bg
            )}
          >
            <Icon className={cn("h-5 w-5", colors.text)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/90 group-hover:text-white">
              {workspace.name}
            </p>
            {workspace.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-white/45">
                {workspace.description}
              </p>
            )}
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-lg p-1.5 text-white/30 opacity-0 transition-all hover:bg-white/[0.06] hover:text-white/60 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-white/[0.08] bg-neutral-900/95 backdrop-blur-xl"
          >
            <DropdownMenuItem
              onClick={() => onEdit(workspace)}
              className="text-xs text-white/70"
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onActivate(workspace.id)}
              className="text-xs text-white/70"
            >
              <Filter className="mr-2 h-3.5 w-3.5" />
              Ativar como filtro
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              onClick={() => onArchive(workspace.id)}
              className="text-xs text-white/70"
            >
              <Archive className="mr-2 h-3.5 w-3.5" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(workspace.id)}
              className="text-xs text-red-400"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-white/40">
        <span>
          {sessionCount} {sessionCount === 1 ? "sessao" : "sessoes"}
        </span>
        {lastActivity && (
          <>
            <span>•</span>
            <span>{formatRelativeTime(lastActivity)}</span>
          </>
        )}
        {workspace.status === "archived" && (
          <>
            <span>•</span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/40">
              Arquivado
            </span>
          </>
        )}
      </div>
    </div>
  );
}
