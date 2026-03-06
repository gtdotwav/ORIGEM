"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Orbit,
  Plus,
  Clock,
  ImageIcon,
  Trash2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useSpacesStore } from "@/stores/spaces-store";

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
    }
    setEditingId(null);
  };

  const handleDelete = (spaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSpace(spaceId);
    toast.success("Space excluido");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-foreground/[0.06] bg-foreground/[0.03]">
            <Orbit className="h-4 w-4 text-foreground/40" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Spaces</h1>
            <p className="text-[11px] text-foreground/35">
              Canvas infinito para criacao de imagens e videos com IA
            </p>
          </div>
        </div>
      </motion.div>

      {/* Create hero */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        type="button"
        onClick={handleCreate}
        className="group mb-8 flex w-full items-center justify-center rounded-2xl border border-dashed border-foreground/[0.06] py-14 transition-all hover:border-neon-cyan/20 hover:bg-neon-cyan/[0.02]"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] transition-all group-hover:border-neon-cyan/20 group-hover:bg-neon-cyan/[0.04]">
            <Plus className="h-5 w-5 text-foreground/25 transition-colors group-hover:text-neon-cyan/60" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-foreground/40 group-hover:text-foreground/60">
              Criar novo Space
            </p>
            <p className="mt-0.5 text-[10px] text-foreground/20">
              Canvas infinito com geracao de imagens
            </p>
          </div>
        </div>
      </motion.button>

      {/* Grid */}
      {spaces.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/25">
              Seus Spaces
            </span>
            <span className="text-[10px] tabular-nums text-foreground/15">
              {spaces.length}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...spaces]
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((space, i) => {
                const spaceCards = cards.filter(
                  (c) => c.spaceId === space.id
                );
                const previewImages = spaceCards
                  .filter((c) => c.status === "done")
                  .flatMap((c) => c.imageUrls)
                  .slice(0, 4);

                return (
                  <motion.div
                    key={space.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-foreground/[0.06] bg-card/50 transition-all hover:border-foreground/[0.12] hover:shadow-xl"
                    onClick={() =>
                      router.push(`/dashboard/spaces/${space.id}`)
                    }
                  >
                    <div className="relative flex h-32 items-center justify-center bg-foreground/[0.02] transition-colors group-hover:bg-foreground/[0.04]">
                      {previewImages.length > 0 ? (
                        <div className="grid h-full w-full grid-cols-2 gap-px">
                          {previewImages.map((url, j) => (
                            <img
                              key={j}
                              src={url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Sparkles className="h-5 w-5 text-foreground/8" />
                          <span className="text-[9px] text-foreground/15">Vazio</span>
                        </div>
                      )}
                    </div>

                    <div className="px-3.5 py-3">
                      <div className="flex items-center justify-between">
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
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="flex-1 rounded-md bg-transparent text-xs font-medium text-foreground outline-none ring-1 ring-neon-cyan/30 px-1"
                          />
                        ) : (
                          <h3 className="truncate text-[13px] font-medium text-foreground/75">
                            {space.name}
                          </h3>
                        )}

                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(space.id);
                              setEditName(space.name);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-foreground/20 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(space.id, e)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-foreground/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-[10px] text-foreground/20">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {spaceCards.length} cards
                        </span>
                        <span className="ml-auto flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(space.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      {spaces.length === 0 && (
        <div className="text-center py-12">
          <Orbit className="mx-auto h-8 w-8 text-foreground/10 mb-3" />
          <p className="text-xs text-foreground/25">
            Nenhum space criado ainda
          </p>
        </div>
      )}
    </div>
  );
}
