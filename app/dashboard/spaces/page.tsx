"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Orbit,
  Plus,
  Clock,
  ImageIcon,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useSpacesStore } from "@/stores/spaces-store";
import { cn } from "@/lib/utils";

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function SpacesHubPage() {
  const router = useRouter();
  const spaces = useSpacesStore((s) => s.spaces);
  const cards = useSpacesStore((s) => s.cards);
  const createSpace = useSpacesStore((s) => s.createSpace);
  const deleteSpace = useSpacesStore((s) => s.deleteSpace);
  const renameSpace = useSpacesStore((s) => s.renameSpace);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    const id = createSpace("Space sem titulo");
    toast.success("Space criado!");
    router.push(`/dashboard/spaces/${id}`);
  };

  const handleRename = (spaceId: string) => {
    if (editName.trim()) {
      renameSpace(spaceId, editName.trim());
      toast.success("Renomeado!");
    }
    setEditingId(null);
  };

  const handleDelete = (spaceId: string) => {
    deleteSpace(spaceId);
    toast.success("Space excluido");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-cyan/15 bg-neon-cyan/[0.06]">
            <Orbit className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">ORIGEM Spaces</h1>
            <p className="mt-1 text-sm text-foreground/50">
              Workspace infinito para criacao de imagens com IA — organize, gere e
              itere visualmente
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 px-4 py-2.5 text-sm text-neon-cyan transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/20 hover:shadow-[0_0_16px_rgba(0,255,255,0.1)]"
        >
          <Plus className="h-4 w-4" />
          Novo Space
        </button>
      </div>

      {/* New space hero */}
      <button
        type="button"
        onClick={handleCreate}
        className="group mb-6 flex w-full items-center justify-center rounded-2xl border border-dashed border-foreground/[0.08] bg-card/40 py-14 backdrop-blur-sm transition-all hover:border-neon-cyan/25 hover:bg-neon-cyan/[0.03]"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-neon-cyan/5 blur-2xl transition-all group-hover:bg-neon-cyan/10" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] transition-all group-hover:border-neon-cyan/25 group-hover:bg-neon-cyan/10">
              <Orbit className="h-7 w-7 text-foreground/20 transition-colors group-hover:text-neon-cyan" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground/50 transition-colors group-hover:text-foreground/80">
              Criar novo Space
            </p>
            <p className="mt-1 text-xs text-foreground/25">
              Canvas infinito com geracao de imagens, variacoes e workflow visual
            </p>
          </div>
        </div>
      </button>

      {/* Spaces grid */}
      {spaces.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground/50">Seus Spaces</h2>
            <span className="text-[10px] text-foreground/20">
              {spaces.length} {spaces.length === 1 ? "space" : "spaces"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...spaces]
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((space) => {
                const spaceCards = cards.filter((c) => c.spaceId === space.id);
                const doneCards = spaceCards.filter((c) => c.status === "done");
                const previewImages = doneCards
                  .flatMap((c) => c.imageUrls)
                  .slice(0, 4);

                return (
                  <div
                    key={space.id}
                    className="group rounded-2xl border border-foreground/[0.08] bg-card/70 backdrop-blur-xl transition-all hover:border-neon-cyan/20 hover:bg-card/80"
                  >
                    {/* Preview area */}
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/spaces/${space.id}`)}
                      className="flex h-32 w-full items-center justify-center overflow-hidden rounded-t-2xl border-b border-foreground/[0.04] bg-foreground/[0.02] transition-colors hover:bg-foreground/[0.04]"
                    >
                      {previewImages.length > 0 ? (
                        <div className="grid h-full w-full grid-cols-2 gap-0.5">
                          {previewImages.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="h-6 w-6 text-foreground/10" />
                          <span className="text-[10px] text-foreground/20">
                            Space vazio
                          </span>
                        </div>
                      )}
                    </button>

                    {/* Info */}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        {editingId === space.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleRename(space.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(space.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 rounded border border-neon-cyan/30 bg-transparent px-1 text-sm font-semibold text-foreground outline-none"
                          />
                        ) : (
                          <h3 className="text-sm font-semibold text-foreground/90">
                            {space.name}
                          </h3>
                        )}

                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(space.id);
                              setEditName(space.name);
                            }}
                            className="flex h-5 w-5 items-center justify-center rounded text-foreground/25 hover:text-foreground/50"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(space.id)}
                            className="flex h-5 w-5 items-center justify-center rounded text-foreground/25 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {space.description && (
                        <p className="mb-2 text-xs text-foreground/40">
                          {space.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 border-t border-foreground/[0.05] pt-3">
                        <span className="flex items-center gap-1 text-[10px] text-foreground/25">
                          <ImageIcon className="h-3 w-3" />
                          {spaceCards.length} {spaceCards.length === 1 ? "card" : "cards"}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-[10px] text-foreground/20">
                          <Clock className="h-3 w-3" />
                          {formatTime(space.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {spaces.length === 0 && (
        <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-8 text-center backdrop-blur-xl">
          <Orbit className="mx-auto mb-3 h-8 w-8 text-foreground/15" />
          <p className="text-sm text-foreground/50">
            Nenhum space criado. Crie seu primeiro workspace de geracao de imagens.
          </p>
        </div>
      )}
    </div>
  );
}
