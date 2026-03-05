"use client";

import {
  MoreHorizontal,
  Check,
  Ban,
  Trash2,
  Pencil,
  MessageSquare,
  Compass,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import type { Connection, ConnectionStatus } from "@/types/connection";
import { toast } from "sonner";

const STATUS_STYLES: Record<ConnectionStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Pendente", bg: "bg-neon-orange/10", text: "text-neon-orange" },
  accepted: { label: "Aceito", bg: "bg-neon-green/10", text: "text-neon-green" },
  blocked: { label: "Bloqueado", bg: "bg-red-500/10", text: "text-red-400" },
};

interface ConnectionCardProps {
  connection: Connection;
  onEdit: (connection: Connection) => void;
}

export function ConnectionCard({ connection, onEdit }: ConnectionCardProps) {
  const acceptConnection = useConnectionStore((s) => s.acceptConnection);
  const blockConnection = useConnectionStore((s) => s.blockConnection);
  const removeConnection = useConnectionStore((s) => s.removeConnection);

  const status = STATUS_STYLES[connection.status];
  const initials = connection.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="group rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl transition-all hover:border-foreground/[0.12]">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neon-cyan/10 text-sm font-bold text-neon-cyan/70">
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground/90">
              {connection.name}
            </h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                status.bg,
                status.text
              )}
            >
              {status.label}
            </span>
          </div>
          <p className="truncate text-xs text-foreground/40">{connection.role}</p>
          {connection.title && (
            <p className="truncate text-xs text-foreground/25">{connection.title}</p>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-lg p-1.5 text-foreground/20 opacity-0 transition-all hover:bg-foreground/[0.05] hover:text-foreground/50 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-foreground/[0.08] bg-card/95 backdrop-blur-xl"
          >
            <DropdownMenuItem onClick={() => onEdit(connection)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Editar
            </DropdownMenuItem>
            {connection.status === "pending" && (
              <DropdownMenuItem
                onClick={() => {
                  acceptConnection(connection.id);
                  toast.success(`${connection.name} aceito!`);
                }}
              >
                <Check className="mr-2 h-3.5 w-3.5 text-neon-green" />
                Aceitar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => toast.info("Em breve: adicionar ao chat")}>
              <MessageSquare className="mr-2 h-3.5 w-3.5" />
              Adicionar ao Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Em breve: adicionar ao 360º")}>
              <Compass className="mr-2 h-3.5 w-3.5" />
              Adicionar ao 360º
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-foreground/[0.06]" />
            {connection.status !== "blocked" ? (
              <DropdownMenuItem
                onClick={() => {
                  blockConnection(connection.id);
                  toast.info(`${connection.name} bloqueado.`);
                }}
              >
                <Ban className="mr-2 h-3.5 w-3.5 text-red-400" />
                Bloquear
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => {
                  acceptConnection(connection.id);
                  toast.success(`${connection.name} desbloqueado!`);
                }}
              >
                <Check className="mr-2 h-3.5 w-3.5 text-neon-green" />
                Desbloquear
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                removeConnection(connection.id);
                toast.success(`${connection.name} removido.`);
              }}
              className="text-red-400 focus:text-red-400"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags */}
      {connection.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {connection.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[10px] text-foreground/35"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Direction badge */}
      <div className="mt-2 text-[10px] text-foreground/20">
        {connection.direction === "sent" ? "Convite enviado" : "Convite recebido"}
      </div>
    </div>
  );
}
