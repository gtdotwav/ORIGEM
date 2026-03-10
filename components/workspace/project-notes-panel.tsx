"use client";

import { useState } from "react";
import { FileText, Plus, Trash2, Pencil, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useProjectStore } from "@/stores/project-store";
import { createId } from "@/lib/chat-orchestrator";
import type { ProjectNote } from "@/types/project";

interface ProjectNotesPanelProps {
  projectId: string;
  notes: ProjectNote[];
}

export function ProjectNotesPanel({ projectId, notes }: ProjectNotesPanelProps) {
  const addNote = useProjectStore((s) => s.addNote);
  const updateNote = useProjectStore((s) => s.updateNote);
  const removeNote = useProjectStore((s) => s.removeNote);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newContent, setNewContent] = useState("");
  const [showNew, setShowNew] = useState(false);

  const handleCreate = () => {
    const content = newContent.trim();
    if (!content) return;
    const now = new Date().toISOString();
    addNote(projectId, {
      id: createId("note"),
      content,
      createdAt: now,
      updatedAt: now,
    });
    setNewContent("");
    setShowNew(false);
  };

  const handleEdit = (note: ProjectNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSave = (noteId: string) => {
    updateNote(projectId, noteId, editContent.trim());
    setEditingId(null);
    setEditContent("");
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-foreground/40">
          <FileText className="h-3.5 w-3.5" />
          Notas
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:text-neon-cyan/80"
        >
          <Plus className="h-3 w-3" />
          Nova nota
        </button>
      </div>

      {/* New note form */}
      {showNew && (
        <div className="mb-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-3">
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Escreva sua nota..."
            className="mb-2 min-h-[80px] resize-none border-foreground/[0.06] bg-black/20 text-xs text-foreground/80 placeholder:text-foreground/25"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowNew(false);
                setNewContent("");
              }}
              className="text-[10px] text-foreground/40 hover:text-foreground/60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newContent.trim()}
              className="inline-flex items-center gap-1 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-[10px] font-medium text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-30"
            >
              <Save className="h-3 w-3" />
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 && !showNew ? (
        <p className="py-4 text-center text-[11px] text-foreground/25">
          Nenhuma nota adicionada
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group/note rounded-xl border border-foreground/[0.06] bg-black/15 p-3"
            >
              {editingId === note.id ? (
                <>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="mb-2 min-h-[60px] resize-none border-foreground/[0.06] bg-black/20 text-xs text-foreground/80"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-[10px] text-foreground/40 hover:text-foreground/60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(note.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/25 bg-neon-cyan/10 px-2 py-0.5 text-[10px] text-neon-cyan hover:bg-neon-cyan/20"
                    >
                      <Save className="h-2.5 w-2.5" />
                      Salvar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/65">
                    {note.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-foreground/20">
                      {formatDate(note.updatedAt)}
                    </span>
                    <div className="flex gap-1.5 opacity-0 transition-opacity group-hover/note:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleEdit(note)}
                        className="text-foreground/25 hover:text-foreground/60"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNote(projectId, note.id)}
                        className="text-foreground/25 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
