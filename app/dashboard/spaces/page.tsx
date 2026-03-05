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

  const handleDelete = (spaceId: string) => {
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
        <div className="flex items-center gap-2.5 mb-1">
          <Orbit className="h-5 w-5 text-foreground/40" />
          <h1 className="text-xl font-semibold text-foreground">Spaces</h1>
        </div>
        <p className="text-xs text-foreground/35 pl-[30px]">
          Canvas infinito para criacao de imagens e videos com IA
        </p>
      </motion.div>

      {/* Create hero */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        type="button"
        onClick={handleCreate}
        className="group mb-8 flex w-full items-center justify-center rounded-xl border border-dashed border-foreground/[0.06] py-12 transition-all hover:border-foreground/[0.12] hover:bg-foreground/[0.02]"
      >
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] transition-all group-hover:bg-foreground/[0.06]">
            <Plus className="h-4 w-4 text-foreground/25 transition-colors group-hover:text-foreground/50" />
          </div>
          <p className="text-xs text-foreground/35 group-hover:text-foreground/55">
            Criar novo Space
          </p>
        </div>
      </motion.button>

      {/* Grid */}
      {spaces.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/25">
              Seus Spaces
            </span>
            <span className="text-[10px] text-foreground/15">
              {spaces.length}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="group overflow-hidden rounded-xl border border-foreground/[0.06] bg-card/50 transition-all hover:border-foreground/[0.10]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/dashboard/spaces/${space.id}`)
                      }
                      className="flex h-28 w-full items-center justify-center bg-foreground/[0.02] transition-colors hover:bg-foreground/[0.04]"
                    >
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
                        <ImageIcon className="h-5 w-5 text-foreground/8" />
                      )}
                    </button>

                    <div className="px-3 py-2.5">
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
                            autoFocus
                            className="flex-1 rounded bg-transparent text-xs font-medium text-foreground outline-none ring-1 ring-neon-cyan/30 px-1"
                          />
                        ) : (
                          <h3 className="truncate text-xs font-medium text-foreground/75">
                            {space.name}
                          </h3>
                        )}

                        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(space.id);
                              setEditName(space.name);
                            }}
                            className="flex h-5 w-5 items-center justify-center rounded text-foreground/20 hover:text-foreground/50"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(space.id)}
                            className="flex h-5 w-5 items-center justify-center rounded text-foreground/20 hover:text-red-400"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-center gap-2 text-[9px] text-foreground/20">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-2.5 w-2.5" />
                          {spaceCards.length}
                        </span>
                        <span className="ml-auto flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
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
        <div className="text-center py-8">
          <p className="text-xs text-foreground/25">
            Nenhum space criado ainda
          </p>
        </div>
      )}
    </div>
  );
}
