"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Archive, Trash2, ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from "@/components/workspace/workspace-card";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

function formatRelativeTime(date: Date | null) {
  if (!date) return "Sem atividade";
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes}min atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

interface ProjectCardProps {
  project: Project;
  sessionCount: number;
  lastActivity: Date | null;
  onEdit: (project: Project) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({
  project,
  sessionCount,
  lastActivity,
  onEdit,
  onArchive,
  onDelete,
}: ProjectCardProps) {
  const colors = WORKSPACE_COLORS[project.color];
  const Icon = WORKSPACE_ICONS[project.icon];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-black/25 transition-all duration-300",
        colors.border,
        colors.borderHover,
        colors.glow
      )}
    >
      {/* Gradient accent */}
      <div
        className={cn(
          "h-0.5 w-full bg-gradient-to-r opacity-50 transition-opacity group-hover:opacity-100",
          colors.gradient
        )}
      />

      <div className="p-3.5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/workspaces/${project.workspaceId}/projects/${project.id}`}
            className="flex items-center gap-2.5"
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 group-hover:scale-105",
                colors.border,
                colors.bg
              )}
            >
              <Icon className={cn("h-4 w-4", colors.text)} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground/85 transition-colors group-hover:text-foreground">
                {project.name}
              </p>
              {project.description && (
                <p className="truncate text-[11px] text-foreground/35">
                  {project.description}
                </p>
              )}
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-foreground/25 opacity-0 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-foreground/[0.08] bg-card/95 backdrop-blur-xl"
            >
              <DropdownMenuItem
                onClick={() => onEdit(project)}
                className="text-xs text-foreground/70"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onArchive(project.id)}
                className="text-xs text-foreground/70"
              >
                <Archive className="mr-2 h-3.5 w-3.5" />
                Arquivar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(project.id)}
                className="text-xs text-red-400"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats + footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-foreground/[0.06] bg-foreground/[0.03] px-1.5 py-0.5 text-[10px] text-foreground/40">
              {sessionCount} {sessionCount === 1 ? "sessao" : "sessoes"}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-foreground/25">
              <span className={cn("h-1 w-1 rounded-full", colors.dot, "opacity-40")} />
              {formatRelativeTime(lastActivity)}
            </div>
          </div>
          <Link
            href={`/dashboard/workspaces/${project.workspaceId}/projects/${project.id}`}
            className="inline-flex items-center gap-0.5 text-[10px] text-foreground/20 opacity-0 transition-all group-hover:text-foreground/50 group-hover:opacity-100"
          >
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {project.status === "archived" && (
          <span className="mt-2 inline-block rounded-md border border-foreground/[0.08] bg-foreground/[0.03] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-foreground/30">
            Arquivado
          </span>
        )}
      </div>
    </div>
  );
}
