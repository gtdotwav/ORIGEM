"use client";

import { useState } from "react";
import { Link2, Copy, Trash2, Plus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      <DialogContent className="border-white/[0.08] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <Link2 className="h-4 w-4 text-neon-purple" />
            Links de convite
          </DialogTitle>
        </DialogHeader>

        {/* Create new */}
        <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="mb-1.5 text-xs font-medium text-white/50">Criar novo link</p>
          <div className="flex gap-2">
            <Input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (opcional)"
              className="flex-1 border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder:text-white/25"
            />
            <Input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min={1}
              max={100}
              className="w-16 border-white/[0.08] bg-white/[0.04] text-center text-sm text-white/90"
            />
          </div>
          <Button
            variant="neon-purple"
            size="sm"
            onClick={handleCreate}
            className="w-full"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar link
          </Button>
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => copyLink(link.code, link.id)}
                  className="h-7 w-7 text-white/25 hover:text-white/50"
                >
                  {copiedId === link.id ? (
                    <Check className="h-3.5 w-3.5 text-neon-green" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    removeInviteLink(link.id);
                    toast.success("Link removido.");
                  }}
                  className="h-7 w-7 text-white/25 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
