"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ImageIcon,
  Loader2,
  Copy,
  Trash2,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import type { GenerationNodeData } from "@/types/spaces";
import { ALL_MODELS } from "@/types/spaces";

const STATUS_CONFIG = {
  idle: { label: "pronto", className: "text-white/20" },
  queued: { label: "fila", className: "bg-neon-orange/10 text-neon-orange/80" },
  generating: { label: "gerando", className: "bg-neon-cyan/10 text-neon-cyan/80" },
  done: { label: "concluido", className: "bg-neon-green/10 text-neon-green/80" },
  error: { label: "erro", className: "bg-red-500/10 text-red-400/80" },
} as const;

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
  const status = STATUS_CONFIG[nodeData.status] ?? STATUS_CONFIG.idle;

  return (
    <div
      className={cn(
        "group w-[280px] overflow-hidden rounded-2xl border shadow-xl transition-all duration-200",
        selected
          ? "border-white/[0.18] bg-[oklch(0.13_0_0)] shadow-white/[0.03] ring-1 ring-white/[0.06]"
          : "border-white/[0.07] bg-[oklch(0.11_0_0)] hover:border-white/[0.12] hover:shadow-2xl"
      )}
      onClick={() => selectCard(id)}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-white/15 !bg-white/[0.08] !transition-colors hover:!border-white/30"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-neon-cyan/30 !bg-neon-cyan/15 !transition-colors hover:!border-neon-cyan/50"
      />

      {/* Image area */}
      <div className="relative flex h-[180px] items-center justify-center overflow-hidden bg-white/[0.025]">
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
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="h-6 w-6 animate-spin text-neon-cyan/30" />
              <div className="absolute inset-0 animate-ping">
                <Loader2 className="h-6 w-6 text-neon-cyan/10" />
              </div>
            </div>
            <span className="text-[10px] font-medium text-white/25">Gerando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <ImageIcon className="h-4 w-4 text-white/10" />
            </div>
            <span className="text-[9px] text-white/15">Sem imagem</span>
          </div>
        )}

        {/* Quick actions overlay */}
        <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              duplicateCard(id);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/70 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
            title="Duplicar"
          >
            <Copy className="h-3 w-3" />
          </button>
          {hasImages && (
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/70 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
              title="Ampliar"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteCard(id);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/70 text-red-400/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-red-300"
            title="Excluir"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Image count badge */}
        {hasImages && card.imageUrls.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-white/60 backdrop-blur-sm">
            {card.imageUrls.length} imgs
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="space-y-2 px-3 py-2.5">
        {/* Prompt */}
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-white/15" />
          <p className="line-clamp-2 text-[11px] leading-relaxed text-white/55">
            {nodeData.prompt || "Sem prompt definido"}
          </p>
        </div>

        {/* Footer: model + status */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-2">
          <span className="text-[9px] font-medium text-white/30">
            {modelInfo?.label ?? nodeData.model}
          </span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[9px] font-medium",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(GenerationCardNode);
