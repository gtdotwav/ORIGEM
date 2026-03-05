"use client";

import { useState } from "react";
import { Search, Users2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";

interface ConnectionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (connectionIds: string[]) => void;
  multiSelect?: boolean;
  selected?: string[];
  title?: string;
}

export function ConnectionPicker({
  open,
  onOpenChange,
  onSelect,
  multiSelect = false,
  selected: initialSelected = [],
  title = "Selecionar conexão",
}: ConnectionPickerProps) {
  const connections = useConnectionStore((s) => s.connections);
  const accepted = connections.filter((c) => c.status === "accepted");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const filtered = search.trim()
    ? accepted.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.role.toLowerCase().includes(search.toLowerCase())
      )
    : accepted;

  function handleToggle(id: string) {
    if (multiSelect) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      onSelect([id]);
      onOpenChange(false);
    }
  }

  function handleConfirm() {
    onSelect(selectedIds);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-neutral-950/95 backdrop-blur-xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <Users2 className="h-4 w-4 text-neon-cyan" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white/80 placeholder:text-white/25 focus:border-white/15 focus:outline-none"
          />
        </div>

        <div className="max-h-60 space-y-0.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/25">
              Nenhuma conexão encontrada.
            </p>
          ) : (
            filtered.map((conn) => {
              const isSelected = selectedIds.includes(conn.id);
              return (
                <button
                  key={conn.id}
                  type="button"
                  onClick={() => handleToggle(conn.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    isSelected ? "bg-neon-cyan/5" : "hover:bg-white/[0.05]"
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neon-cyan/10 text-[10px] font-bold text-neon-cyan/70">
                    {conn.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white/80">{conn.name}</p>
                    <p className="truncate text-[11px] text-white/30">{conn.role}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-neon-cyan" />}
                </button>
              );
            })
          )}
        </div>

        {multiSelect && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
            className="mt-2 w-full rounded-xl bg-neon-cyan/15 py-2 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20 disabled:opacity-40"
          >
            Confirmar ({selectedIds.length})
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
