"use client";

import { useState } from "react";
import { Link2, Copy, Trash2, Plus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConnectionStore } from "@/stores/connection-store";
import { toast } from "sonner";

interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteLinkDialog({ open, onOpenChange }: InviteLinkDialogProps) {
  const inviteLinks = useConnectionStore((s) => s.inviteLinks);
  const createInviteLink = useConnectionStore((s) => s.createInviteLink);
  const removeInviteLink = useConnectionStore((s) => s.removeInviteLink);

  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("10");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleCreate() {
    createInviteLink(label.trim() || undefined, parseInt(maxUses) || 10);
    toast.success("Link de convite criado!");
    setLabel("");
    setMaxUses("10");
  }

  async function copyLink(code: string, id: string) {
    const url = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-neutral-950/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <Link2 className="h-4 w-4 text-neon-purple" />
            Links de convite
          </DialogTitle>
        </DialogHeader>

        {/* Create new */}
        <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-xs font-medium text-white/50">Criar novo link</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (opcional)"
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/80 placeholder:text-white/20 focus:border-white/15 focus:outline-none"
            />
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min="1"
              max="100"
              className="w-16 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-center text-sm text-white/80 focus:border-white/15 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-neon-purple/15 py-2 text-xs font-medium text-neon-purple transition-colors hover:bg-neon-purple/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar link
          </button>
        </div>

        {/* Existing links */}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {inviteLinks.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/25">
              Nenhum link de convite criado.
            </p>
          ) : (
            inviteLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0 text-neon-purple/50" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/70">
                    {link.label || `Convite ${link.code.slice(0, 6)}...`}
                  </p>
                  <p className="text-[10px] text-white/25">
                    {link.usedCount}/{link.maxUses} usos · {link.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyLink(link.code, link.id)}
                  className="rounded-md p-1 text-white/25 transition-colors hover:bg-white/[0.05] hover:text-white/50"
                >
                  {copiedId === link.id ? (
                    <Check className="h-3.5 w-3.5 text-neon-green" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeInviteLink(link.id);
                    toast.success("Link removido.");
                  }}
                  className="rounded-md p-1 text-white/25 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
