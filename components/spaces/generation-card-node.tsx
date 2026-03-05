"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ImageIcon,
  Loader2,
  Copy,
  Trash2,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import type { GenerationNodeData } from "@/types/spaces";
import { ALL_MODELS } from "@/types/spaces";

function GenerationCardNode({ data, id, selected }: NodeProps) {
  const nodeData = data as unknown as GenerationNodeData;
  const selectCard = useSpacesStore((s) => s.selectCard);
  const deleteCard = useSpacesStore((s) => s.deleteCard);
  const duplicateCard = useSpacesStore((s) => s.duplicateCard);
  const card = useSpacesStore((s) => s.cards.find((c) => c.id === id));

  const modelInfo = ALL_MODELS.find((m) => m.id === nodeData.model);
  const isGenerating =
    nodeData.status === "generating" || nodeData.status === "queued";
  const hasImages = card && card.imageUrls.length > 0;

  return (
    <div
      className={cn(
        "group w-[240px] overflow-hidden rounded-xl border bg-[oklch(0.12_0_0)] shadow-lg transition-all",
        selected
          ? "border-white/[0.15] shadow-white/[0.02]"
          : "border-white/[0.06] hover:border-white/[0.10]"
      )}
      onClick={() => selectCard(id)}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !rounded-full !border !border-white/15 !bg-white/5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !rounded-full !border !border-neon-cyan/30 !bg-neon-cyan/15"
      />

      {/* Image area */}
      <div className="relative flex h-[160px] items-center justify-center bg-white/[0.02]">
        {hasImages ? (
          <div
            className={cn(
              "grid h-full w-full gap-px",
              card.imageUrls.length === 1 && "grid-cols-1",
              card.imageUrls.length === 2 && "grid-cols-2",
              card.imageUrls.length >= 3 && "grid-cols-2 grid-rows-2"
            )}
          >
            {card.imageUrls.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Gen ${i + 1}`}
                className="h-full w-full object-cover"
              />
            ))}
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-white/20" />
            <span className="text-[9px] text-white/18">Gerando...</span>
          </div>
        ) : (
          <ImageIcon className="h-6 w-6 text-white/8" />
        )}

        {/* Quick actions */}
        <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              duplicateCard(id);
            }}
            className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-white/60 hover:text-white"
            title="Duplicar"
          >
            <Copy className="h-2.5 w-2.5" />
          </button>
          {hasImages && (
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-white/60 hover:text-white"
              title="Ampliar"
            >
              <Maximize2 className="h-2.5 w-2.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteCard(id);
            }}
            className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-red-400/70 hover:text-red-300"
            title="Excluir"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Image count */}
        {hasImages && card.imageUrls.length > 1 && (
          <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[8px] text-white/50">
            {card.imageUrls.length}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 py-2">
        <p className="line-clamp-1 text-[10px] text-white/50">
          {nodeData.prompt || "Sem prompt"}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[8px] text-white/25">
            {modelInfo?.label ?? nodeData.model}
          </span>
          <span
            className={cn(
              "rounded px-1 py-px text-[8px]",
              nodeData.status === "done" &&
                "bg-neon-green/10 text-neon-green/70",
              nodeData.status === "generating" &&
                "bg-neon-cyan/10 text-neon-cyan/70",
              nodeData.status === "queued" &&
                "bg-neon-orange/10 text-neon-orange/70",
              nodeData.status === "error" &&
                "bg-red-500/10 text-red-400/70",
              nodeData.status === "idle" && "text-white/15"
            )}
          >
            {nodeData.status === "idle" && "pronto"}
            {nodeData.status === "queued" && "fila"}
            {nodeData.status === "generating" && "gerando"}
            {nodeData.status === "done" && "concluido"}
            {nodeData.status === "error" && "erro"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(GenerationCardNode);
