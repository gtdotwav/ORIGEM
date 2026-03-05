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
  ArrowUpRight,
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
  {
    border: string;
    bg: string;
    text: string;
    borderHover: string;
    bgHover: string;
    gradient: string;
    glow: string;
    dot: string;
  }
> = {
  cyan: {
    border: "border-neon-cyan/30",
    bg: "bg-neon-cyan/10",
    text: "text-neon-cyan",
    borderHover: "hover:border-neon-cyan/50",
    bgHover: "hover:bg-neon-cyan/[0.06]",
    gradient: "from-neon-cyan/20 to-neon-cyan/0",
    glow: "group-hover:shadow-[0_0_30px_-5px] group-hover:shadow-neon-cyan/15",
    dot: "bg-neon-cyan",
  },
  purple: {
    border: "border-neon-purple/30",
    bg: "bg-neon-purple/10",
    text: "text-neon-purple",
    borderHover: "hover:border-neon-purple/50",
    bgHover: "hover:bg-neon-purple/[0.06]",
    gradient: "from-neon-purple/20 to-neon-purple/0",
    glow: "group-hover:shadow-[0_0_30px_-5px] group-hover:shadow-neon-purple/15",
    dot: "bg-neon-purple",
  },
  green: {
    border: "border-neon-green/30",
    bg: "bg-neon-green/10",
    text: "text-neon-green",
    borderHover: "hover:border-neon-green/50",
    bgHover: "hover:bg-neon-green/[0.06]",
    gradient: "from-neon-green/20 to-neon-green/0",
    glow: "group-hover:shadow-[0_0_30px_-5px] group-hover:shadow-neon-green/15",
    dot: "bg-neon-green",
  },
  orange: {
    border: "border-neon-orange/30",
    bg: "bg-neon-orange/10",
    text: "text-neon-orange",
    borderHover: "hover:border-neon-orange/50",
    bgHover: "hover:bg-neon-orange/[0.06]",
    gradient: "from-neon-orange/20 to-neon-orange/0",
    glow: "group-hover:shadow-[0_0_30px_-5px] group-hover:shadow-neon-orange/15",
    dot: "bg-neon-orange",
  },
  pink: {
    border: "border-neon-pink/30",
    bg: "bg-neon-pink/10",
    text: "text-neon-pink",
    borderHover: "hover:border-neon-pink/50",
    bgHover: "hover:bg-neon-pink/[0.06]",
    gradient: "from-neon-pink/20 to-neon-pink/0",
    glow: "group-hover:shadow-[0_0_30px_-5px] group-hover:shadow-neon-pink/15",
    dot: "bg-neon-pink",
  },
  blue: {
    border: "border-neon-blue/30",
    bg: "bg-neon-blue/10",
    text: "text-neon-blue",
    borderHover: "hover:border-neon-blue/50",
    bgHover: "hover:bg-neon-blue/[0.06]",
    gradient: "from-neon-blue/20 to-neon-blue/0",
    glow: "group-hover:shadow-[0_0_30px_-5px] group-hover:shadow-neon-blue/15",
    dot: "bg-neon-blue",
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
  projectCount?: number;
  lastActivity: Date | null;
  onEdit: (workspace: Workspace) => void;
  onActivate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkspaceCard({
  workspace,
  sessionCount,
  projectCount,
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
        "group relative overflow-hidden rounded-2xl border border-foreground/[0.08] bg-card/70 backdrop-blur-xl transition-all duration-300",
        colors.borderHover,
        colors.glow
      )}
    >
      {/* Gradient accent strip */}
      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r opacity-60 transition-opacity group-hover:opacity-100",
          colors.gradient
        )}
      />

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/workspaces/${workspace.id}`}
            className="flex items-start gap-3"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105",
                colors.border,
                colors.bg
              )}
            >
              <Icon className={cn("h-5 w-5", colors.text)} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground/90 transition-colors group-hover:text-foreground">
                {workspace.name}
              </p>
              {workspace.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-foreground/40">
                  {workspace.description}
                </p>
              )}
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-foreground/30 opacity-0 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-foreground/[0.08] bg-card/95 backdrop-blur-xl"
            >
              <DropdownMenuItem
                onClick={() => onEdit(workspace)}
                className="text-xs text-foreground/70"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onActivate(workspace.id)}
                className="text-xs text-foreground/70"
              >
                <Filter className="mr-2 h-3.5 w-3.5" />
                Ativar como filtro
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground/[0.06]" />
              <DropdownMenuItem
                onClick={() => onArchive(workspace.id)}
                className="text-xs text-foreground/70"
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

        {/* Stats row */}
        <div className="mb-3 flex items-center gap-2">
          {projectCount !== undefined && projectCount > 0 && (
            <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-medium", colors.border, colors.bg, colors.text)}>
              {projectCount} {projectCount === 1 ? "projeto" : "projetos"}
            </span>
          )}
          <span className="rounded-md border border-foreground/[0.06] bg-foreground/[0.03] px-1.5 py-0.5 text-[10px] text-foreground/45">
            {sessionCount} {sessionCount === 1 ? "sessao" : "sessoes"}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
            {lastActivity ? (
              <>
                <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot, "opacity-50")} />
                <span>{formatRelativeTime(lastActivity)}</span>
              </>
            ) : (
              <span>Sem atividade</span>
            )}
            {workspace.status === "archived" && (
              <span className="ml-1 rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-foreground/30">
                Arquivado
              </span>
            )}
          </div>
          <Link
            href={`/dashboard/workspaces/${workspace.id}`}
            className="inline-flex items-center gap-0.5 text-[10px] text-foreground/25 opacity-0 transition-all group-hover:text-foreground/50 group-hover:opacity-100"
          >
            Abrir
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
