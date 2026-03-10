"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createId } from "@/lib/chat-orchestrator";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from "@/components/workspace/workspace-card";
import type { Workspace, WorkspaceColor, WorkspaceIcon } from "@/types/workspace";

const COLOR_OPTIONS: WorkspaceColor[] = [
  "cyan",
  "purple",
  "green",
  "orange",
  "pink",
  "blue",
];

const ICON_OPTIONS: WorkspaceIcon[] = [
  "folder",
  "rocket",
  "zap",
  "star",
  "target",
  "globe",
  "code",
  "layers",
];

interface WorkspaceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editWorkspace?: Workspace | null;
  onCreated?: (workspace: Workspace) => void;
}

export function WorkspaceCreateDialog({
  open,
  onOpenChange,
  editWorkspace,
  onCreated,
}: WorkspaceCreateDialogProps) {
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<WorkspaceColor>("cyan");
  const [icon, setIcon] = useState<WorkspaceIcon>("folder");

  useEffect(() => {
    queueMicrotask(() => {
      if (editWorkspace) {
        setName(editWorkspace.name);
        setDescription(editWorkspace.description);
        setColor(editWorkspace.color);
        setIcon(editWorkspace.icon);
      } else {
        setName("");
        setDescription("");
        setColor("cyan");
        setIcon("folder");
      }
    });
  }, [editWorkspace, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (editWorkspace) {
      updateWorkspace(editWorkspace.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
      });
    } else {
      const now = new Date().toISOString();
      const workspace: Workspace = {
        id: createId("ws"),
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      addWorkspace(workspace);
      onCreated?.(workspace);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-foreground/[0.08] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editWorkspace ? "Editar workspace" : "Novo workspace"}
          </DialogTitle>
          <DialogDescription>
            {editWorkspace
              ? "Atualize as informacoes do workspace"
              : "Organize suas sessoes em um espaco dedicado"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/50">
              Nome
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Projeto Alpha"
              className="border-foreground/[0.08] bg-foreground/[0.04] text-sm text-foreground/90 placeholder:text-foreground/25"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/50">
              Descricao
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao opcional do workspace..."
              className="min-h-[60px] resize-none border-foreground/[0.08] bg-foreground/[0.04] text-sm text-foreground/90 placeholder:text-foreground/25"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/50">
              Cor
            </label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => {
                const colors = WORKSPACE_COLORS[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      colors.bg,
                      color === c
                        ? `${colors.border} scale-110 ring-2 ring-white/20`
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/50">
              Icone
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((i) => {
                const LucideIcon = WORKSPACE_ICONS[i];
                const colors = WORKSPACE_COLORS[color];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-lg border transition-all",
                      icon === i
                        ? `${colors.border} ${colors.bg} ${colors.text}`
                        : "border-foreground/[0.06] bg-foreground/[0.02] text-foreground/40 hover:border-foreground/[0.12] hover:text-foreground/60"
                    )}
                  >
                    <LucideIcon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-foreground/50 hover:text-foreground/70"
          >
            Cancelar
          </Button>
          <Button
            variant="neon"
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            {editWorkspace ? "Salvar" : "Criar workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
