"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
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
      <DialogContent className="border-white/[0.08] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-neon-cyan" />
            {editConnection ? "Editar conexao" : "Adicionar conexao"}
          </DialogTitle>
          <DialogDescription>
            {editConnection
              ? "Atualize os dados da conexao"
              : "Registre um contato na sua rede profissional"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Nome *</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder:text-white/25"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder:text-white/25"
            />
          </div>

          {/* Role + Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Função</label>
              <Input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Desenvolvedor"
                className="border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder:text-white/25"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Título</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Senior @ XPTO"
                className="border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder:text-white/25"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Tags (Enter para adicionar)</label>
            <Input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Ex: tech, ia, design"
              className="border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder:text-white/25"
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
            <label className="mb-1.5 block text-xs font-medium text-white/50">Notas</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre essa conexão..."
              rows={2}
              className="min-h-[60px] resize-none border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder:text-white/25"
            />
          </div>

          {/* Submit */}
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs text-white/50 hover:text-white/70"
            >
              Cancelar
            </Button>
            <Button variant="neon" size="sm" type="submit">
              {editConnection ? "Salvar alterações" : "Adicionar conexão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
