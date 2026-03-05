"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConnectionStore } from "@/stores/connection-store";
import type { Connection } from "@/types/connection";
import { toast } from "sonner";

interface ConnectionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editConnection?: Connection | null;
}

export function ConnectionCreateDialog({
  open,
  onOpenChange,
  editConnection,
}: ConnectionCreateDialogProps) {
  const addConnection = useConnectionStore((s) => s.addConnection);
  const updateConnection = useConnectionStore((s) => s.updateConnection);

  const [name, setName] = useState(editConnection?.name ?? "");
  const [email, setEmail] = useState(editConnection?.email ?? "");
  const [role, setRole] = useState(editConnection?.role ?? "");
  const [title, setTitle] = useState(editConnection?.title ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(editConnection?.tags ?? []);
  const [notes, setNotes] = useState(editConnection?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (editConnection) {
      updateConnection(editConnection.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        role: role.trim() || "Contato",
        title: title.trim() || undefined,
        tags,
        notes: notes.trim() || undefined,
      });
      toast.success("Conexão atualizada!");
    } else {
      addConnection({
        name: name.trim(),
        email: email.trim() || undefined,
        role: role.trim() || "Contato",
        title: title.trim() || undefined,
        status: "accepted",
        direction: "sent",
        tags,
        notes: notes.trim() || undefined,
      });
      toast.success("Conexão adicionada!");
    }

    onOpenChange(false);
    resetForm();
  }

  function resetForm() {
    setName("");
    setEmail("");
    setRole("");
    setTitle("");
    setTags([]);
    setTagInput("");
    setNotes("");
  }

  function handleAddTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-neutral-950/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <UserPlus className="h-4 w-4 text-neon-cyan" />
            {editConnection ? "Editar conexão" : "Adicionar conexão"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs text-white/40">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-white/15 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs text-white/40">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-white/15 focus:outline-none"
            />
          </div>

          {/* Role + Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/40">Função</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Desenvolvedor"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-white/15 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Senior @ XPTO"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-white/15 focus:outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-xs text-white/40">Tags (Enter para adicionar)</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Ex: tech, ia, design"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-white/15 focus:outline-none"
            />
            {tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-1 rounded-full bg-neon-cyan/10 px-2 py-0.5 text-[11px] text-neon-cyan/70 transition-colors hover:bg-neon-cyan/20"
                  >
                    {tag}
                    <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs text-white/40">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre essa conexão..."
              rows={2}
              className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:border-white/15 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-xl bg-neon-cyan/15 py-2.5 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20"
          >
            {editConnection ? "Salvar alterações" : "Adicionar conexão"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
