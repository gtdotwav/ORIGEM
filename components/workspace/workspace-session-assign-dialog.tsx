"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";

interface WorkspaceSessionAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
}

export function WorkspaceSessionAssignDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
}: WorkspaceSessionAssignDialogProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const updateSession = useSessionStore((s) => s.updateSession);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const unassigned = useMemo(() => {
    const q = search.toLowerCase();
    return sessions
      .filter((s) => s.workspaceId !== workspaceId)
      .filter((s) => !q || s.title.toLowerCase().includes(q));
  }, [sessions, workspaceId, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = () => {
    for (const id of selected) {
      updateSession(id, { workspaceId });
    }
    toast.success(`${selected.size} sessao(oes) adicionada(s) a ${workspaceName}`);
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Adicionar sessoes a {workspaceName}
          </DialogTitle>
          <DialogDescription>
            Selecione sessoes existentes para vincular ao workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sessao..."
            className="border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder:text-white/25"
          />

          <div className="max-h-[240px] space-y-1 overflow-y-auto pr-1">
            {unassigned.length === 0 ? (
              <p className="py-6 text-center text-xs text-white/35">
                Nenhuma sessao disponivel
              </p>
            ) : (
              unassigned.map((session) => (
                <label
                  key={session.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-all",
                    selected.has(session.id)
                      ? "border-neon-cyan/30 bg-neon-cyan/5"
                      : "border-transparent hover:bg-white/[0.03]"
                  )}
                >
                  <Checkbox
                    checked={selected.has(session.id)}
                    onCheckedChange={() => toggle(session.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white/80">
                      {session.title}
                    </p>
                    <p className="text-[10px] text-white/35">
                      {new Date(session.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-white/50 hover:text-white/70"
          >
            Cancelar
          </Button>
          <Button
            variant="neon"
            size="sm"
            onClick={handleAssign}
            disabled={selected.size === 0}
          >
            Adicionar ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
