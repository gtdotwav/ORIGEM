"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Presentation,
  Plus,
  Trash2,
  Clock,
  FileSliders,
} from "lucide-react";
import { useSlidesStore } from "@/stores/slides-store";
import { cn } from "@/lib/utils";

const THEME_PREVIEW: Record<string, string> = {
  dark: "bg-[#1a1a2e]",
  light: "bg-white",
  neon: "bg-[#0a0a1a]",
  gradient: "bg-gradient-to-br from-[#1a1a2e] to-[#2d1b4e]",
};

export default function SlidesPage() {
  const router = useRouter();
  const presentations = useSlidesStore((s) => s.presentations);
  const createPresentation = useSlidesStore((s) => s.createPresentation);
  const deletePresentation = useSlidesStore((s) => s.deletePresentation);
  const setActivePresentation = useSlidesStore((s) => s.setActivePresentation);
  const [title, setTitle] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = () => {
    const name = title.trim() || "Apresentacao sem titulo";
    const id = createPresentation(name);
    setTitle("");
    setShowCreate(false);
    router.push(`/dashboard/apps/slides/${id}`);
  };

  const handleOpen = (id: string) => {
    setActivePresentation(id);
    router.push(`/dashboard/apps/slides/${id}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-orange/20 bg-neon-orange/10">
          <Presentation className="h-5 w-5 text-neon-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Slides</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Crie apresentacoes profissionais com temas e layouts variados
          </p>
        </div>
      </div>

      {/* Presentations grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presentations.map((p) => (
          <div
            key={p.id}
            className="group relative rounded-2xl border border-foreground/[0.08] bg-card/70 backdrop-blur-xl transition-all hover:border-foreground/[0.15]"
          >
            <button
              type="button"
              onClick={() => deletePresentation(p.id)}
              className="absolute right-3 top-3 z-10 rounded-md p-1 text-foreground/15 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              title="Remover apresentacao"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleOpen(p.id)}
              className="flex w-full flex-col p-5 text-left"
            >
              {/* Preview */}
              <div
                className={cn(
                  "mb-4 flex aspect-video w-full items-center justify-center rounded-lg border border-foreground/[0.06]",
                  THEME_PREVIEW[p.theme]
                )}
              >
                <FileSliders className="h-8 w-8 text-foreground/20" />
              </div>

              <h3 className="mb-1 text-sm font-semibold text-foreground/90 transition-colors group-hover:text-foreground">
                {p.title}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-foreground/35">
                <span>{p.slides.length} slide{p.slides.length !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </button>
          </div>
        ))}

        {/* Create new */}
        {showCreate ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-neon-orange/20 bg-card/70 p-5 backdrop-blur-xl">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nome da apresentacao..."
              className="rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/30 focus:border-neon-orange/30"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 rounded-lg bg-neon-orange/15 py-1.5 text-xs font-medium text-neon-orange transition-colors hover:bg-neon-orange/25"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setTitle(""); }}
                className="rounded-lg px-3 py-1.5 text-xs text-foreground/40 transition-colors hover:text-foreground/60"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/[0.12] py-12 text-foreground/30 transition-all hover:border-neon-orange/30 hover:text-neon-orange/60"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm">Nova Apresentacao</span>
          </button>
        )}
      </div>
    </div>
  );
}
