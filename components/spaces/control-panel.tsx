"use client";

import { useState, useRef, useEffect } from "react";
import {
  ImageIcon,
  Sliders,
  Type,
  Download,
  ChevronDown,
  Play,
  Save,
  X,
  Check,
  Video,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  ALL_MODELS,
} from "@/types/spaces";
import type {
  AspectRatio,
  Resolution,
  GenerationModel,
  GenerationType,
} from "@/types/spaces";

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "3:2", label: "3:2" },
];

const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: "512", label: "512" },
  { value: "1024", label: "1K" },
  { value: "2048", label: "2K" },
  { value: "4096", label: "4K" },
];

const QUANTITIES = [1, 2, 4, 8];

/* ─── Collapsible section ─── */

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.04]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <Icon className="h-3.5 w-3.5 text-white/25" />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-widest text-white/35">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-white/20 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/* ─── Model dropdown ─── */

function ModelSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeSettings = useSpacesStore((s) => s.activeSettings);
  const setActiveSettings = useSpacesStore((s) => s.setActiveSettings);

  const selectedModel = ALL_MODELS.find(
    (m) => m.id === activeSettings.model
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (modelId: GenerationModel, type: GenerationType) => {
    setActiveSettings({ model: modelId, generationType: type });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
          open
            ? "border-white/[0.14] bg-white/[0.07]"
            : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.10]"
        )}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
          <Sparkles className="h-3 w-3 text-white/30" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[12px] font-semibold text-white/75">
            {selectedModel?.label ?? "Selecione"}
          </p>
          <p className="truncate text-[10px] text-white/25">
            {selectedModel?.provider}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-white/25 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-[320px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[oklch(0.12_0_0)] shadow-2xl backdrop-blur-xl">
          {/* Image models */}
          <div className="px-3 pb-1 pt-2.5">
            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/30">
              <ImageIcon className="h-3 w-3" />
              Imagem
            </p>
          </div>
          {IMAGE_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model.id, "image")}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                activeSettings.model === model.id
                  ? "bg-white/[0.06]"
                  : "hover:bg-white/[0.03]"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "truncate text-[12px] font-medium",
                  activeSettings.model === model.id ? "text-white/80" : "text-white/55"
                )}>
                  {model.label}
                </p>
                <p className="truncate text-[9px] text-white/20">
                  {model.provider}
                </p>
              </div>
              {activeSettings.model === model.id && (
                <Check className="h-3.5 w-3.5 shrink-0 text-neon-cyan" />
              )}
            </button>
          ))}

          {/* Video models */}
          <div className="mt-1 border-t border-white/[0.05] px-3 pb-1 pt-2.5">
            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/30">
              <Video className="h-3 w-3" />
              Video
            </p>
          </div>
          {VIDEO_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model.id, "video")}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                activeSettings.model === model.id
                  ? "bg-white/[0.06]"
                  : "hover:bg-white/[0.03]"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "truncate text-[12px] font-medium",
                  activeSettings.model === model.id ? "text-white/80" : "text-white/55"
                )}>
                  {model.label}
                </p>
                <p className="truncate text-[9px] text-white/20">
                  {model.provider}
                </p>
              </div>
              {activeSettings.model === model.id && (
                <Check className="h-3.5 w-3.5 shrink-0 text-neon-purple" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Chip selector (reusable) ─── */

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

function ChipSelector<T extends string>({
  options,
  value,
  onChange,
  accentColor = "cyan",
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  accentColor?: "cyan" | "purple" | "green";
}) {
  const colors = {
    cyan: "border-neon-cyan/25 bg-neon-cyan/8 text-neon-cyan",
    purple: "border-neon-purple/25 bg-neon-purple/8 text-neon-purple",
    green: "border-neon-green/25 bg-neon-green/8 text-neon-green",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all",
            value === opt.value
              ? colors[accentColor]
              : "border-white/[0.04] text-white/30 hover:border-white/[0.08] hover:text-white/45"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main control panel ─── */

export function ControlPanel() {
  const selectedCardId = useSpacesStore((s) => s.selectedCardId);
  const activeSettings = useSpacesStore((s) => s.activeSettings);
  const activePromptBlocks = useSpacesStore((s) => s.activePromptBlocks);
  const setActiveSettings = useSpacesStore((s) => s.setActiveSettings);
  const setActivePromptBlocks = useSpacesStore(
    (s) => s.setActivePromptBlocks
  );
  const updateCard = useSpacesStore((s) => s.updateCard);
  const setCardStatus = useSpacesStore((s) => s.setCardStatus);
  const saveStylePreset = useSpacesStore((s) => s.saveStylePreset);
  const card = useSpacesStore((s) =>
    s.selectedCardId
      ? s.cards.find((c) => c.id === s.selectedCardId)
      : null
  );

  const [promptText, setPromptText] = useState(card?.prompt ?? "");
  const [presetName, setPresetName] = useState("");

  // Sync prompt when card changes
  useEffect(() => {
    setPromptText(card?.prompt ?? "");
  }, [card?.id, card?.prompt]);

  const isVideo = activeSettings.generationType === "video";

  const handleGenerate = () => {
    if (!selectedCardId || !promptText.trim()) return;
    updateCard(selectedCardId, {
      prompt: promptText,
      settings: { ...activeSettings },
    });
    setCardStatus(selectedCardId, "queued");
    setTimeout(() => setCardStatus(selectedCardId, "generating"), 500);
    setTimeout(() => {
      const placeholders = Array.from(
        { length: activeSettings.quantity },
        (_, i) =>
          `https://picsum.photos/seed/${selectedCardId}-${i}/512/512`
      );
      useSpacesStore.getState().setCardImages(selectedCardId, placeholders);
    }, 3000);
  };

  const PROMPT_FIELDS = [
    { key: "subject" as const, placeholder: "Sujeito" },
    { key: "composition" as const, placeholder: "Composicao" },
    { key: "lighting" as const, placeholder: "Iluminacao" },
    { key: "camera" as const, placeholder: "Camera" },
    { key: "style" as const, placeholder: "Estilo" },
  ];

  return (
    <div className="flex h-full w-[320px] flex-col border-l border-white/[0.05] bg-[oklch(0.09_0_0)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-white/25" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
            {selectedCardId ? "Config" : "Spaces"}
          </span>
        </div>
        {selectedCardId && (
          <button
            type="button"
            onClick={() => useSpacesStore.getState().selectCard(null)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-white/20 transition-all hover:bg-white/[0.06] hover:text-white/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Model Selector */}
        <div className="border-b border-white/[0.04] px-4 py-4">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Modelo
          </p>
          <ModelSelector />
        </div>

        {/* Prompt */}
        <Section title="Prompt" icon={Type} defaultOpen>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={
              isVideo
                ? "Descreva o video que deseja criar..."
                : "Descreva a imagem que deseja criar..."
            }
            className="mb-3 h-24 w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[12px] leading-relaxed text-white/70 placeholder:text-white/18 outline-none transition-colors focus:border-white/[0.14]"
          />
          <div className="space-y-1.5">
            {PROMPT_FIELDS.map(({ key, placeholder }) => (
              <input
                key={key}
                type="text"
                value={activePromptBlocks[key]}
                onChange={(e) =>
                  setActivePromptBlocks({ [key]: e.target.value })
                }
                placeholder={placeholder}
                className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/60 placeholder:text-white/15 outline-none transition-colors focus:border-white/[0.10]"
              />
            ))}
          </div>
        </Section>

        {/* Settings */}
        <Section title="Configuracoes" icon={Sliders}>
          {/* Quantity */}
          <div className="mb-4">
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/25">
              Quantidade
            </label>
            <div className="flex gap-1.5">
              {QUANTITIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setActiveSettings({ quantity: q })}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition-all",
                    activeSettings.quantity === q
                      ? "border-neon-cyan/25 bg-neon-cyan/8 text-neon-cyan"
                      : "border-white/[0.04] text-white/30 hover:border-white/[0.08]"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="mb-4">
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/25">
              Resolucao
            </label>
            <ChipSelector
              options={RESOLUTIONS}
              value={activeSettings.resolution}
              onChange={(v) => setActiveSettings({ resolution: v })}
              accentColor="purple"
            />
          </div>

          {/* Aspect Ratio */}
          <div className="mb-4">
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/25">
              Proporcao
            </label>
            <ChipSelector
              options={ASPECT_RATIOS}
              value={activeSettings.aspectRatio}
              onChange={(v) => setActiveSettings({ aspectRatio: v })}
              accentColor="green"
            />
          </div>

          {/* Creativity */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/25">
                Criatividade
              </label>
              <span className="text-[10px] tabular-nums text-white/25">
                {Math.round(activeSettings.creativity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={activeSettings.creativity}
              onChange={(e) =>
                setActiveSettings({
                  creativity: parseFloat(e.target.value),
                })
              }
              className="w-full accent-neon-cyan"
            />
          </div>

          {/* Style Strength */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/25">
                Forca do estilo
              </label>
              <span className="text-[10px] tabular-nums text-white/25">
                {Math.round(activeSettings.styleStrength * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={activeSettings.styleStrength}
              onChange={(e) =>
                setActiveSettings({
                  styleStrength: parseFloat(e.target.value),
                })
              }
              className="w-full accent-neon-purple"
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/25">
              Prompt negativo
            </label>
            <input
              type="text"
              value={activeSettings.negativePrompt}
              onChange={(e) =>
                setActiveSettings({ negativePrompt: e.target.value })
              }
              placeholder="O que nao incluir..."
              className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/60 placeholder:text-white/15 outline-none transition-colors focus:border-white/[0.10]"
            />
          </div>
        </Section>

        {/* References */}
        <Section title="Referencias" icon={ImageIcon} defaultOpen={false}>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/[0.06] py-6 transition-colors hover:border-white/[0.10]">
            <ImageIcon className="h-5 w-5 text-white/10" />
            <p className="text-[10px] text-white/20">
              Arraste imagens de referencia
            </p>
          </div>
        </Section>

        {/* Export */}
        <Section title="Exportar" icon={Download} defaultOpen={false}>
          <div className="flex gap-1.5">
            {["PNG", "JPEG", "WebP"].map((fmt) => (
              <button
                key={fmt}
                type="button"
                className="flex-1 rounded-lg border border-white/[0.04] py-1.5 text-[11px] font-medium text-white/30 transition-all hover:border-white/[0.08] hover:text-white/55"
              >
                {fmt}
              </button>
            ))}
          </div>
        </Section>

        {/* Save Style */}
        <Section title="Salvar Estilo" icon={Save} defaultOpen={false}>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nome do estilo..."
              className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/60 placeholder:text-white/15 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (presetName.trim()) {
                  saveStylePreset(presetName.trim());
                  setPresetName("");
                }
              }}
              className="rounded-lg border border-neon-purple/20 bg-neon-purple/8 px-3 py-2 text-[11px] font-medium text-neon-purple transition-all hover:bg-neon-purple/15"
            >
              Salvar
            </button>
          </div>
        </Section>
      </div>

      {/* Generate button */}
      <div className="border-t border-white/[0.05] p-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedCardId || !promptText.trim()}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-[13px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-15",
            isVideo
              ? "border border-neon-purple/30 bg-neon-purple/12 text-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.08)] hover:bg-neon-purple/20"
              : "border border-neon-cyan/30 bg-neon-cyan/12 text-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.06)] hover:bg-neon-cyan/20"
          )}
        >
          <Play className="h-4 w-4" />
          {isVideo
            ? "Gerar video"
            : activeSettings.quantity > 1
              ? `Gerar ${activeSettings.quantity} imagens`
              : "Gerar imagem"}
        </button>
      </div>
    </div>
  );
}
