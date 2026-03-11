"use client";

import Image from "next/image";
import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, useConnection, type NodeProps } from "@xyflow/react";
import {
  ArrowRightLeft,
  Loader2,
  Copy,
  Trash2,
  Maximize2,
  Play,
  ChevronDown,
  Check,
  Upload,
  X,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import type { GenerationNodeData, AspectRatio, GenerationModel } from "@/types/spaces";
import {
  IMAGE_MODELS,
  ALL_MODELS,
  SPACE_ASPECT_RATIOS,
  SPACE_QUANTITIES,
} from "@/types/spaces";

const STATUS_CONFIG = {
  idle: { label: "pronto", className: "border-white/[0.06] bg-white/[0.03] text-white/35" },
  queued: { label: "fila", className: "border-white/[0.08] bg-white/[0.04] text-white/56" },
  generating: {
    label: "gerando",
    className: "border-white/[0.10] bg-white/[0.06] text-white/76",
  },
  done: { label: "concluido", className: "border-white/[0.08] bg-white/[0.04] text-white/62" },
  error: { label: "erro", className: "bg-red-500/10 text-red-400/80" },
} as const;

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
          "flex w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] transition-colors",
          open
            ? "border-white/[0.12] bg-white/[0.05]"
            : "border-white/[0.06] bg-white/[0.02]"
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
                  : "text-white/40 hover:bg-white/[0.03] hover:text-white/52"
              )}
            >
              <span className="flex-1 truncate font-medium">{model.label}</span>
              <span className="text-[8px] text-white/20">{model.provider}</span>
              {value === model.id && (
                <Check className="h-2.5 w-2.5 shrink-0 text-white/72" />
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
  const setCardImages = useSpacesStore((s) => s.setCardImages);
  const setCardError = useSpacesStore((s) => s.setCardError);
  const card = useSpacesStore((s) => s.cards.find((c) => c.id === id));
  const incomingConnections = useSpacesStore(
    (s) => s.edges.filter((edge) => edge.target === id).length
  );
  const outgoingConnections = useSpacesStore(
    (s) => s.edges.filter((edge) => edge.source === id).length
  );
  const connection = useConnection();
  const isConnecting = connection.inProgress && connection.fromNode?.id !== id;

  // Pull text from connected text nodes via edges
  const connectedText = useSpacesStore((s) => {
    const incomingEdges = s.edges.filter((e) => e.target === id);
    const texts: string[] = [];
    for (const edge of incomingEdges) {
      const srcNode = s.nodes.find((n) => n.id === edge.source);
      if (srcNode && (srcNode.data as Record<string, unknown>).type === "text") {
        const txt = (srcNode.data as Record<string, unknown>).text as string;
        if (txt?.trim()) texts.push(txt.trim());
      }
    }
    return texts.join("\n");
  });

  const [promptText, setPromptText] = useState(card?.prompt ?? "");
  const [localModel, setLocalModel] = useState<GenerationModel>(
    card?.settings.model ?? "nano-banana-pro"
  );
  const [localRatio, setLocalRatio] = useState<AspectRatio>(
    card?.settings.aspectRatio ?? "1:1"
  );
  const [localQty, setLocalQty] = useState(card?.settings.quantity ?? 1);
  const [refImage, setRefImage] = useState<string | null>(
    card?.referenceImageDataUrl ?? null
  );

  useEffect(() => {
    if (!card) {
      return;
    }

    setPromptText(card.prompt ?? "");
    setLocalModel(card.settings.model ?? "nano-banana-pro");
    setLocalRatio(card.settings.aspectRatio ?? "1:1");
    setLocalQty(card.settings.quantity ?? 1);
    setRefImage(card.referenceImageDataUrl ?? null);
  }, [card]);

  const [isExpanded, setIsExpanded] = useState(!card?.imageUrls?.length);

  useEffect(() => {
    if (card?.imageUrls && card.imageUrls.length > 0) {
      setIsExpanded(false);
    }
  }, [card?.imageUrls?.length]);

  // Effective prompt: local text takes priority, fallback to connected text nodes
  const effectivePrompt = promptText.trim() || connectedText;

  const resolvedStatus = card?.status ?? nodeData.status;
  const isGenerating =
    resolvedStatus === "generating" || resolvedStatus === "queued";
  const hasImages = card && card.imageUrls.length > 0;
  const status = STATUS_CONFIG[resolvedStatus] ?? STATUS_CONFIG.idle;
  const errorMessage = card?.errorMessage ?? nodeData.errorMessage;
  const selectedModelLabel =
    ALL_MODELS.find((model) => model.id === localModel)?.label ?? "Modelo";
  const showProviderAction =
    typeof errorMessage === "string" &&
    (errorMessage.toLowerCase().includes("google api key") ||
      errorMessage.toLowerCase().includes("providers"));

  const persistCardDraft = (updates?: {
    prompt?: string;
    model?: GenerationModel;
    aspectRatio?: AspectRatio;
    quantity?: number;
    referenceImageDataUrl?: string | null;
  }) => {
    if (!card) {
      return;
    }

    updateCard(id, {
      prompt: updates?.prompt ?? promptText,
      referenceImageDataUrl:
        updates?.referenceImageDataUrl ?? refImage ?? null,
      settings: {
        ...card.settings,
        model: updates?.model ?? localModel,
        aspectRatio: updates?.aspectRatio ?? localRatio,
        quantity: updates?.quantity ?? localQty,
      },
    });
  };

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!card || !effectivePrompt || isGenerating) {
      return;
    }

    persistCardDraft({
      prompt: effectivePrompt,
      model: localModel,
      aspectRatio: localRatio,
      quantity: localQty,
      referenceImageDataUrl: refImage,
    });

    setCardStatus(id, "queued");
    setCardStatus(id, "generating");

    try {
      const response = await fetch("/api/spaces/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: effectivePrompt,
          model: localModel,
          quantity: localQty,
          aspectRatio: localRatio,
          resolution: card.settings.resolution,
          negativePrompt: card.settings.negativePrompt,
          seed: card.settings.seed,
          referenceImages: refImage ? [refImage] : [],
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { imageUrls?: string[]; reason?: string; error?: string }
        | null;

      if (!response.ok || !payload?.imageUrls?.length) {
        const detail =
          payload?.reason ||
          payload?.error ||
          "Falha ao gerar imagem com o provider configurado.";
        throw new Error(detail);
      }

      setCardImages(id, payload.imageUrls);
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message.replaceAll("_", " ")
          : "Falha ao gerar imagem.";
      setCardError(id, detail);
    }
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const nextImage = reader.result as string;
      setRefImage(nextImage);
      persistCardDraft({ referenceImageDataUrl: nextImage });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePromptChange = (value: string) => {
    setPromptText(value);
    persistCardDraft({ prompt: value });
  };

  const handleModelChange = (value: GenerationModel) => {
    setLocalModel(value);
    persistCardDraft({ model: value });
  };

  const handleRatioChange = (value: AspectRatio) => {
    setLocalRatio(value);
    persistCardDraft({ aspectRatio: value });
  };

  const handleQuantityChange = (value: number) => {
    setLocalQty(value);
    persistCardDraft({ quantity: value });
  };

  const handleRemoveReference = () => {
    setRefImage(null);
    updateCard(id, { referenceImageDataUrl: null });
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[22px] border shadow-xl transition-all duration-300",
        isExpanded || !hasImages ? "w-[336px]" : "w-[260px]",
        selected
          ? "border-white/[0.18] bg-[oklch(0.12_0_0)] shadow-white/[0.05] ring-1 ring-white/[0.08]"
          : "border-white/[0.08] bg-[oklch(0.10_0_0)] hover:border-white/[0.12]"
      )}
      onClick={() => selectCard(id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectableStart={false}
        className={cn(
          "!border-0 !bg-transparent",
          !isConnecting && "!pointer-events-none"
        )}
        style={{
          inset: 0,
          width: "100%",
          height: "100%",
          transform: "none",
          borderRadius: 22,
          background: "transparent",
          zIndex: isConnecting ? 10 : -1,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!border-0 !bg-transparent"
        style={{
          top: 0,
          left: "auto",
          right: 0,
          width: 32,
          height: "100%",
          transform: "none",
          borderRadius: "0 22px 22px 0",
          background: "transparent",
          zIndex: 10,
        }}
      />
      
      {/* Target indicator */}
      <div className="pointer-events-none absolute inset-y-0 -left-[4px] z-20 flex items-center justify-center">
        <div
          className={cn(
            "h-2 w-2 rounded-full border transition-all duration-300",
            incomingConnections > 0 || selected
              ? "scale-110 border-white/60 bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
              : "scale-100 border-white/20 bg-white/10"
          )}
        />
      </div>

      {/* Source indicator */}
      <div className="pointer-events-none absolute inset-y-0 -right-[4px] z-20 flex items-center justify-center">
        <div
          className={cn(
            "h-2 w-2 rounded-full border transition-all duration-300",
            outgoingConnections > 0 || selected
              ? "scale-110 border-white/60 bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
              : "scale-100 border-white/20 bg-white/10"
          )}
        />
      </div>

      {isExpanded && (
        <div className="pointer-events-none absolute inset-x-6 top-0 z-[1] flex items-center justify-between px-2 pt-2 text-[9px] uppercase tracking-[0.2em] text-white/24">
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1">
            {selectedModelLabel}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1">
            <ArrowRightLeft className="h-2.5 w-2.5" />
            {incomingConnections}/{outgoingConnections}
          </span>
        </div>
      )}

      {/* Image result area */}
      {(hasImages || isGenerating) && (
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden bg-white/[0.02] transition-all duration-300",
            !isExpanded && hasImages ? "h-[346px]" : "h-[188px]"
          )}
        >
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
                <div key={`${id}-${i}-${url}`} className="relative h-full w-full">
                  <Image
                    src={url}
                    alt={`Gen ${i + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 220px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-white/30" />
                <div className="absolute inset-0 animate-ping">
                  <Loader2 className="h-6 w-6 text-white/10" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-white/25">
                Gerando...
              </span>
            </div>
          )}

          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-[2px]">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-white/70" />
                <div className="absolute inset-0 animate-ping">
                  <Loader2 className="h-6 w-6 text-white/16" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-white/75">
                Gerando...
              </span>
            </div>
          ) : null}

          <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                duplicateCard(id);
              }}
              className="nodrag nopan flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-black/55 text-white/55 backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:text-white/72"
              title="Duplicar"
            >
              <Copy className="h-3 w-3" />
            </button>
            {hasImages && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={cn(
                  "nodrag nopan flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-black/55 text-white/55 backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:text-white/72",
                  isExpanded && "bg-white/10 text-white/90"
                )}
                title={isExpanded ? "Ocultar ajustes" : "Mostrar ajustes"}
              >
                <Settings2 className="h-3 w-3" />
              </button>
            )}
            {hasImages && (
              <button
                type="button"
                className="nodrag nopan flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-black/55 text-white/55 backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:text-white/72"
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
              className="nodrag nopan flex h-6 w-6 items-center justify-center rounded-lg border border-red-500/18 bg-black/55 text-red-300/72 backdrop-blur-sm transition-colors hover:border-red-500/28 hover:text-red-200"
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
      {(!hasImages || isExpanded) && (
        <div className="space-y-2.5 px-3 py-3">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-[10px] text-white/46">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white/68">{selectedModelLabel}</span>
            <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-white/32">
              {localRatio}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em]",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>

        {/* Prompt */}
        <div className="nodrag nopan" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={promptText}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder={connectedText || "Descreva a imagem..."}
            rows={2}
            className="nodrag nopan w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[11px] leading-relaxed text-white/65 placeholder:text-white/18 outline-none transition-colors focus:border-white/[0.12]"
          />
        </div>

        {/* Reference image */}
        <div className="nodrag nopan" onClick={(e) => e.stopPropagation()}>
          {refImage ? (
            <div className="relative h-16 overflow-hidden rounded-lg border border-white/[0.06]">
              <Image
                src={refImage}
                alt="Referencia"
                fill
                unoptimized
                sizes="240px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveReference}
                className="nodrag nopan absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md bg-black/70 text-white/62 backdrop-blur-sm transition-colors hover:text-white/82"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1.5 text-[8px] font-medium text-white/50 drop-shadow">
                Referencia
              </span>
            </div>
          ) : (
            <label className="nodrag nopan flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/[0.06] px-2.5 py-2 text-[10px] text-white/26 transition-colors hover:border-white/[0.12] hover:text-white/42">
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
        <div className="nodrag nopan" onClick={(e) => e.stopPropagation()}>
          <CompactModelSelect value={localModel} onChange={handleModelChange} />
        </div>

        {/* Ratio + Quantity row */}
        <div
          className="nodrag nopan flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Aspect ratio */}
          <div className="flex flex-1 gap-1">
            {SPACE_ASPECT_RATIOS.slice(0, 5).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRatioChange(r)}
                className={cn(
                  "flex-1 rounded-md border py-1 text-[9px] font-semibold transition-colors",
                  localRatio === r
                    ? "border-white/[0.14] bg-white/[0.07] text-white/76"
                    : "border-white/[0.04] text-white/25 hover:border-white/[0.08] hover:text-white/42"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div className="flex gap-0.5">
            {SPACE_QUANTITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuantityChange(q)}
                className={cn(
                  "h-6 w-6 rounded-md border text-[10px] font-semibold transition-colors",
                  localQty === q
                    ? "border-white/[0.14] bg-white/[0.07] text-white/76"
                    : "border-white/[0.04] text-white/25 hover:border-white/[0.08] hover:text-white/42"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button + status */}
        <div className="nodrag nopan flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!effectivePrompt || isGenerating}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-20",
              "border border-white/[0.10] bg-white/[0.05] text-white/76 hover:border-white/[0.14] hover:bg-white/[0.08]"
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
          <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] font-medium text-white/40">
            {incomingConnections > 0 ? `${incomingConnections} entrada` : "sem entrada"}
          </span>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-red-500/15 bg-red-500/10 px-2.5 py-2 text-[10px] leading-relaxed text-red-200/85">
            {errorMessage}
            {showProviderAction ? (
              <div className="mt-2">
                <a
                  href="/dashboard/settings/providers"
                  className="inline-flex items-center rounded-md border border-red-300/22 bg-red-300/10 px-2 py-1 text-[10px] font-medium text-red-100 transition-colors hover:border-red-300/32 hover:bg-red-300/14"
                >
                  Abrir providers
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      )}
    </div>
  );
}

export default memo(GenerationCardNode);
