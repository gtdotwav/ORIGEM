"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ImageIcon,
  Loader2,
  Copy,
  Trash2,
  GitBranch,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import type { GenerationNodeData } from "@/types/spaces";
import { IMAGE_MODELS } from "@/types/spaces";

function GenerationCardNode({ data, id, selected }: NodeProps) {
  const nodeData = data as unknown as GenerationNodeData;
  const selectCard = useSpacesStore((s) => s.selectCard);
  const deleteCard = useSpacesStore((s) => s.deleteCard);
  const duplicateCard = useSpacesStore((s) => s.duplicateCard);
  const card = useSpacesStore((s) => s.cards.find((c) => c.id === id));

  const modelLabel =
    IMAGE_MODELS.find((m) => m.id === nodeData.model)?.label ?? nodeData.model;

  const isGenerating = nodeData.status === "generating" || nodeData.status === "queued";
  const isDone = nodeData.status === "done";
  const hasImages = card && card.imageUrls.length > 0;

  return (
    <div
      className={cn(
        "group w-[260px] rounded-2xl border bg-card/70 shadow-lg backdrop-blur-md transition-all",
        selected
          ? "border-foreground/[0.18]"
          : "border-foreground/[0.08] hover:border-foreground/[0.12]"
      )}
      onClick={() => selectCard(id)}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-foreground/20 !bg-card"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-neon-cyan/40 !bg-neon-cyan/20"
      />

      {/* Image area */}
      <div className="relative flex h-[180px] items-center justify-center overflow-hidden rounded-t-2xl bg-foreground/[0.03]">
        {hasImages ? (
          <div className={cn(
            "grid h-full w-full gap-0.5",
            card.imageUrls.length === 1 && "grid-cols-1",
            card.imageUrls.length === 2 && "grid-cols-2",
            card.imageUrls.length >= 3 && "grid-cols-2 grid-rows-2"
          )}>
            {card.imageUrls.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Generation ${i + 1}`}
                className="h-full w-full object-cover"
              />
            ))}
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-foreground/30" />
            <span className="text-[10px] text-foreground/25">Gerando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8 text-foreground/10" />
            <span className="text-[10px] text-foreground/20">Aguardando prompt</span>
          </div>
        )}

        {/* Quick actions overlay */}
        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); duplicateCard(id); }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
            title="Duplicar"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); duplicateCard(id); }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
            title="Variacao"
          >
            <GitBranch className="h-3 w-3" />
          </button>
          {hasImages && (
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
              title="Ampliar"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); deleteCard(id); }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/50 text-red-400/70 backdrop-blur-sm transition-colors hover:bg-red-500/30 hover:text-red-300"
            title="Excluir"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Status badge */}
        {isDone && card && card.imageUrls.length > 1 && (
          <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] text-white/70 backdrop-blur-sm">
            {card.imageUrls.length} imagens
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3">
        <p className="line-clamp-2 text-xs text-foreground/70">
          {nodeData.prompt || "Sem prompt definido"}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[9px] text-foreground/40">
            {modelLabel}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px]",
              nodeData.status === "done" && "bg-neon-green/10 text-neon-green",
              nodeData.status === "generating" && "bg-neon-cyan/10 text-neon-cyan",
              nodeData.status === "queued" && "bg-neon-orange/10 text-neon-orange",
              nodeData.status === "error" && "bg-red-500/10 text-red-400",
              nodeData.status === "idle" && "bg-foreground/[0.05] text-foreground/30"
            )}
          >
            {nodeData.status === "idle" && "pronto"}
            {nodeData.status === "queued" && "na fila"}
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
