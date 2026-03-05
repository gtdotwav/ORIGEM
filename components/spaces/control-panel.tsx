"use client";

import { useState } from "react";
import {
  ImageIcon,
  Sliders,
  Type,
  Wand2,
  Download,
  ChevronDown,
  Play,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import { IMAGE_MODELS } from "@/types/spaces";
import type { AspectRatio, Resolution, ImageModel } from "@/types/spaces";

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "3:2", label: "3:2" },
];

const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: "512", label: "512px" },
  { value: "1024", label: "1K" },
  { value: "2048", label: "2K" },
  { value: "4096", label: "4K" },
];

const QUANTITIES = [1, 2, 4, 8, 16];

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon: Icon, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-foreground/[0.05]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <Icon className="h-3.5 w-3.5 text-foreground/40" />
        <span className="flex-1 text-[11px] font-medium uppercase tracking-wider text-foreground/50">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-foreground/25 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function ControlPanel() {
  const selectedCardId = useSpacesStore((s) => s.selectedCardId);
  const activeSettings = useSpacesStore((s) => s.activeSettings);
  const activePromptBlocks = useSpacesStore((s) => s.activePromptBlocks);
  const setActiveSettings = useSpacesStore((s) => s.setActiveSettings);
  const setActivePromptBlocks = useSpacesStore((s) => s.setActivePromptBlocks);
  const updateCard = useSpacesStore((s) => s.updateCard);
  const setCardStatus = useSpacesStore((s) => s.setCardStatus);
  const saveStylePreset = useSpacesStore((s) => s.saveStylePreset);
  const card = useSpacesStore((s) =>
    s.selectedCardId ? s.cards.find((c) => c.id === s.selectedCardId) : null
  );

  const [promptText, setPromptText] = useState(card?.prompt ?? "");
  const [presetName, setPresetName] = useState("");

  const handleGenerate = () => {
    if (!selectedCardId || !promptText.trim()) return;
    updateCard(selectedCardId, {
      prompt: promptText,
      settings: { ...activeSettings },
    });
    setCardStatus(selectedCardId, "queued");
    // Simulate generation (would call actual API)
    setTimeout(() => setCardStatus(selectedCardId, "generating"), 500);
    setTimeout(() => {
      // Placeholder images for demo
      const placeholders = Array.from({ length: activeSettings.quantity }, (_, i) =>
        `https://picsum.photos/seed/${selectedCardId}-${i}/512/512`
      );
      useSpacesStore.getState().setCardImages(selectedCardId, placeholders);
    }, 3000);
  };

  return (
    <div className="flex h-full w-[300px] flex-col border-l border-foreground/[0.05] bg-[oklch(0.13_0_0)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-foreground/[0.06] px-4 py-3">
        <h3 className="text-xs font-semibold text-foreground/70">
          {selectedCardId ? "Configuracoes" : "ORIGEM Spaces"}
        </h3>
        {selectedCardId && (
          <button
            type="button"
            onClick={() => useSpacesStore.getState().selectCard(null)}
            className="flex h-5 w-5 items-center justify-center rounded text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Prompt Editor */}
        <Section title="Prompt" icon={Type} defaultOpen>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Descreva a imagem que deseja criar..."
            className="mb-3 h-20 w-full resize-none rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-xs text-foreground placeholder:text-foreground/25 outline-none focus:border-neon-cyan/30"
          />

          {/* Structured prompt blocks */}
          <div className="space-y-2">
            {(["subject", "composition", "lighting", "camera", "style"] as const).map(
              (field) => (
                <input
                  key={field}
                  type="text"
                  value={activePromptBlocks[field]}
                  onChange={(e) =>
                    setActivePromptBlocks({ [field]: e.target.value })
                  }
                  placeholder={
                    field === "subject"
                      ? "Sujeito"
                      : field === "composition"
                        ? "Composicao"
                        : field === "lighting"
                          ? "Iluminacao"
                          : field === "camera"
                            ? "Camera"
                            : "Estilo"
                  }
                  className="w-full rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-foreground/20 outline-none focus:border-neon-cyan/20"
                />
              )
            )}
          </div>
        </Section>

        {/* Model Selection */}
        <Section title="Modelo" icon={Wand2}>
          <div className="grid grid-cols-2 gap-1.5">
            {IMAGE_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setActiveSettings({ model: model.id as ImageModel })}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left transition-all",
                  activeSettings.model === model.id
                    ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
                    : "border-foreground/[0.06] bg-foreground/[0.02] text-foreground/50 hover:border-foreground/[0.12] hover:text-foreground/70"
                )}
              >
                <p className="text-[10px] font-medium">{model.label}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Generation Settings */}
        <Section title="Configuracoes" icon={Sliders}>
          {/* Quantity */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] text-foreground/40">
              Quantidade
            </label>
            <div className="flex gap-1">
              {QUANTITIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setActiveSettings({ quantity: q })}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all",
                    activeSettings.quantity === q
                      ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
                      : "border-foreground/[0.06] text-foreground/40 hover:border-foreground/[0.12]"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] text-foreground/40">
              Resolucao
            </label>
            <div className="flex gap-1">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setActiveSettings({ resolution: r.value })}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all",
                    activeSettings.resolution === r.value
                      ? "border-neon-purple/30 bg-neon-purple/10 text-neon-purple"
                      : "border-foreground/[0.06] text-foreground/40 hover:border-foreground/[0.12]"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] text-foreground/40">
              Proporcao
            </label>
            <div className="flex flex-wrap gap-1">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.value}
                  type="button"
                  onClick={() => setActiveSettings({ aspectRatio: ar.value })}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                    activeSettings.aspectRatio === ar.value
                      ? "border-neon-green/30 bg-neon-green/10 text-neon-green"
                      : "border-foreground/[0.06] text-foreground/40 hover:border-foreground/[0.12]"
                  )}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Creativity slider */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] text-foreground/40">Criatividade</label>
              <span className="text-[10px] text-foreground/30">
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
                setActiveSettings({ creativity: parseFloat(e.target.value) })
              }
              className="w-full accent-neon-cyan"
            />
          </div>

          {/* Style Strength slider */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] text-foreground/40">Forca do estilo</label>
              <span className="text-[10px] text-foreground/30">
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
                setActiveSettings({ styleStrength: parseFloat(e.target.value) })
              }
              className="w-full accent-neon-purple"
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="mb-1.5 block text-[10px] text-foreground/40">
              Prompt negativo
            </label>
            <input
              type="text"
              value={activeSettings.negativePrompt}
              onChange={(e) =>
                setActiveSettings({ negativePrompt: e.target.value })
              }
              placeholder="O que nao incluir..."
              className="w-full rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-foreground/20 outline-none focus:border-foreground/[0.12]"
            />
          </div>
        </Section>

        {/* Reference Images */}
        <Section title="Referencias" icon={ImageIcon} defaultOpen={false}>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-foreground/[0.08] py-6">
            <ImageIcon className="h-5 w-5 text-foreground/15" />
            <p className="text-[10px] text-foreground/25">
              Arraste imagens de referencia
            </p>
          </div>
        </Section>

        {/* Export */}
        <Section title="Exportar" icon={Download} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {["PNG", "JPEG", "WebP"].map((fmt) => (
              <button
                key={fmt}
                type="button"
                className="rounded-lg border border-foreground/[0.06] px-3 py-1.5 text-[11px] text-foreground/40 transition-all hover:border-foreground/[0.12] hover:text-foreground/60"
              >
                {fmt}
              </button>
            ))}
          </div>
        </Section>

        {/* Save Style Preset */}
        <Section title="Salvar Estilo" icon={Save} defaultOpen={false}>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nome do estilo..."
              className="flex-1 rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-foreground/20 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (presetName.trim()) {
                  saveStylePreset(presetName.trim());
                  setPresetName("");
                }
              }}
              className="rounded-lg border border-neon-purple/25 bg-neon-purple/10 px-3 py-1.5 text-[11px] text-neon-purple transition-all hover:bg-neon-purple/20"
            >
              Salvar
            </button>
          </div>
        </Section>
      </div>

      {/* Generate button */}
      <div className="border-t border-foreground/[0.06] p-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedCardId || !promptText.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 py-2.5 text-sm font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20 hover:shadow-[0_0_20px_rgba(0,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Play className="h-4 w-4" />
          Gerar {activeSettings.quantity > 1 ? `${activeSettings.quantity} imagens` : "imagem"}
        </button>
      </div>
    </div>
  );
}
