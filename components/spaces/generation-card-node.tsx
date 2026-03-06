"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ImageIcon,
  Loader2,
  Copy,
  Trash2,
  Maximize2,
  Play,
  ChevronDown,
  Check,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import type { GenerationNodeData, AspectRatio, GenerationModel } from "@/types/spaces";
import { IMAGE_MODELS, ALL_MODELS } from "@/types/spaces";

const STATUS_CONFIG = {
  idle: { label: "pronto", className: "text-white/20" },
  queued: {
    label: "fila",
    className: "bg-neon-orange/10 text-neon-orange/80",
  },
  generating: {
    label: "gerando",
    className: "bg-neon-cyan/10 text-neon-cyan/80",
  },
  done: {
    label: "concluido",
    className: "bg-neon-green/10 text-neon-green/80",
  },
  error: { label: "erro", className: "bg-red-500/10 text-red-400/80" },
} as const;

const RATIOS: AspectRatio[] = ["1:1", "4:3", "16:9", "9:16"];
const QUANTITIES = [1, 2, 4];

/* ─── Compact model selector ─── */
function CompactModelSelect({
  value,
  onChange,
}: {
  value: GenerationModel;
  onChange: (m: GenerationModel) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = ALL_MODELS.find((m) => m.id === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] transition-all",
          open
            ? "border-white/[0.14] bg-white/[0.06]"
            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10]"
        )}
      >
        <span className="flex-1 truncate text-left font-medium text-white/60">
          {selected?.label ?? "Modelo"}
        </span>
        <ChevronDown
          className={cn(
            "h-2.5 w-2.5 shrink-0 text-white/20 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-white/[0.08] bg-[oklch(0.12_0_0)] shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {IMAGE_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(model.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[10px] transition-colors",
                value === model.id
                  ? "bg-white/[0.06] text-white/75"
                  : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
              )}
            >
              <span className="flex-1 truncate font-medium">{model.label}</span>
              <span className="text-[8px] text-white/20">{model.provider}</span>
              {value === model.id && (
                <Check className="h-2.5 w-2.5 shrink-0 text-neon-cyan" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GenerationCardNode({ data, id, selected }: NodeProps) {
  const nodeData = data as unknown as GenerationNodeData;
  const selectCard = useSpacesStore((s) => s.selectCard);
  const deleteCard = useSpacesStore((s) => s.deleteCard);
  const duplicateCard = useSpacesStore((s) => s.duplicateCard);
  const updateCard = useSpacesStore((s) => s.updateCard);
  const setCardStatus = useSpacesStore((s) => s.setCardStatus);
  const card = useSpacesStore((s) => s.cards.find((c) => c.id === id));

  const [promptText, setPromptText] = useState(card?.prompt ?? "");
  const [localModel, setLocalModel] = useState<GenerationModel>(
    card?.settings.model ?? "nano-banana-pro"
  );
  const [localRatio, setLocalRatio] = useState<AspectRatio>(
    card?.settings.aspectRatio ?? "1:1"
  );
  const [localQty, setLocalQty] = useState(card?.settings.quantity ?? 4);
  const [refImage, setRefImage] = useState<string | null>(null);

  const isGenerating =
    nodeData.status === "generating" || nodeData.status === "queued";
  const hasImages = card && card.imageUrls.length > 0;
  const isDone = nodeData.status === "done";
  const status = STATUS_CONFIG[nodeData.status] ?? STATUS_CONFIG.idle;

  const handleGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!promptText.trim() || isGenerating) return;
    updateCard(id, {
      prompt: promptText,
      settings: {
        ...(card?.settings ?? {}),
        model: localModel,
        aspectRatio: localRatio,
        quantity: localQty,
      },
    });
    setCardStatus(id, "queued");
    setTimeout(() => setCardStatus(id, "generating"), 500);
    setTimeout(() => {
      const placeholders = Array.from({ length: localQty }, (_, i) =>
        `https://picsum.photos/seed/${id}-${i}/512/512`
      );
      useSpacesStore.getState().setCardImages(id, placeholders);
    }, 3000);
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRefImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "group w-[320px] overflow-hidden rounded-2xl border shadow-xl transition-all duration-200",
        selected
          ? "border-white/[0.18] bg-[oklch(0.12_0_0)] shadow-white/[0.03] ring-1 ring-white/[0.06]"
          : "border-white/[0.07] bg-[oklch(0.10_0_0)] hover:border-white/[0.12] hover:shadow-2xl"
      )}
      onClick={() => selectCard(id)}
    >
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

      {/* Image result area */}
      {(hasImages || isGenerating) && (
        <div className="relative flex h-[180px] items-center justify-center overflow-hidden bg-white/[0.02]">
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
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-neon-cyan/30" />
                <div className="absolute inset-0 animate-ping">
                  <Loader2 className="h-6 w-6 text-neon-cyan/10" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-white/25">
                Gerando...
              </span>
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

          {hasImages && card.imageUrls.length > 1 && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-white/60 backdrop-blur-sm">
              {card.imageUrls.length} imgs
            </div>
          )}
        </div>
      )}

      {/* Settings area — embedded in card */}
      <div className="space-y-2.5 px-3 py-3">
        {/* Prompt */}
        <div onClick={(e) => e.stopPropagation()}>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Descreva a imagem..."
            rows={2}
            className="w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[11px] leading-relaxed text-white/65 placeholder:text-white/18 outline-none transition-colors focus:border-white/[0.14]"
          />
        </div>

        {/* Reference image */}
        <div onClick={(e) => e.stopPropagation()}>
          {refImage ? (
            <div className="relative overflow-hidden rounded-lg border border-white/[0.06]">
              <img
                src={refImage}
                alt="Referencia"
                className="h-16 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setRefImage(null)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md bg-black/70 text-white/70 backdrop-blur-sm transition-colors hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1.5 text-[8px] font-medium text-white/50 drop-shadow">
                Referencia
              </span>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/[0.06] px-2.5 py-2 text-[10px] text-white/20 transition-colors hover:border-white/[0.12] hover:text-white/35">
              <Upload className="h-3 w-3" />
              Imagem de referencia
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleRefUpload}
              />
            </label>
          )}
        </div>

        {/* Model selector */}
        <div onClick={(e) => e.stopPropagation()}>
          <CompactModelSelect value={localModel} onChange={setLocalModel} />
        </div>

        {/* Ratio + Quantity row */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Aspect ratio */}
          <div className="flex flex-1 gap-1">
            {RATIOS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setLocalRatio(r)}
                className={cn(
                  "flex-1 rounded-md border py-1 text-[9px] font-semibold transition-all",
                  localRatio === r
                    ? "border-neon-cyan/25 bg-neon-cyan/8 text-neon-cyan"
                    : "border-white/[0.04] text-white/25 hover:border-white/[0.08] hover:text-white/40"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div className="flex gap-0.5">
            {QUANTITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setLocalQty(q)}
                className={cn(
                  "h-6 w-6 rounded-md border text-[10px] font-semibold transition-all",
                  localQty === q
                    ? "border-neon-purple/25 bg-neon-purple/8 text-neon-purple"
                    : "border-white/[0.04] text-white/25 hover:border-white/[0.08]"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button + status */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!promptText.trim() || isGenerating}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-20",
              "border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/18"
            )}
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {isGenerating
              ? "Gerando..."
              : localQty > 1
                ? `Gerar ${localQty}`
                : "Gerar"}
          </button>
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
