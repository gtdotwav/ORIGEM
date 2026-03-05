"use client";

import { useState } from "react";
import { Search, Share2, Users2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useConnectionStore } from "@/stores/connection-store";
import { useFeedStore } from "@/stores/feed-store";
import type { FeedItem } from "@/types/feed";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FeedItem | null;
}

export function ShareDialog({ open, onOpenChange, item }: ShareDialogProps) {
  const connections = useConnectionStore((s) => s.connections);
  const shareWith = useFeedStore((s) => s.shareWith);
  const [search, setSearch] = useState("");

  const accepted = connections.filter((c) => c.status === "accepted");
  const filtered = search.trim()
    ? accepted.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.role.toLowerCase().includes(search.toLowerCase())
      )
    : accepted;

  function handleShare(connectionId: string, connectionName: string) {
    if (!item) return;
    shareWith(item.id, connectionId);
    toast.success(`Compartilhado com ${connectionName}!`);
    onOpenChange(false);
    setSearch("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-neon-cyan" />
            Compartilhar
          </DialogTitle>
          <DialogDescription>
            Envie para uma conexao da sua rede
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="dialog-section mb-3">
            <p className="truncate text-sm font-medium text-white/70">{item.title}</p>
            <p className="text-xs text-white/30">{item.source} · {item.author}</p>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conexão..."
            className="border-white/[0.08] bg-white/[0.04] pl-9 text-sm text-white/90 placeholder:text-white/25"
          />
        </div>

        {/* Connection list */}
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users2 className="h-8 w-8 text-white/10" />
              <p className="text-sm text-white/30">
                {accepted.length === 0
                  ? "Nenhuma conexão ainda. Adicione conexões primeiro."
                  : "Nenhuma conexão encontrada."}
              </p>
            </div>
          ) : (
            filtered.map((conn) => (
              <button
                key={conn.id}
                type="button"
                onClick={() => handleShare(conn.id, conn.name)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon-cyan/10 text-xs font-bold text-neon-cyan/70">
                  {conn.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/80">{conn.name}</p>
                  <p className="truncate text-xs text-white/30">{conn.role}</p>
                </div>
                <Share2 className="h-3.5 w-3.5 shrink-0 text-white/15" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
