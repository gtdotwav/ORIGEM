"use client";

import { useState } from "react";
import { Blocks, Save, Sliders, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import {
  IMAGE_MODELS,
  SPACE_ASPECT_RATIOS,
  SPACE_QUANTITIES,
  SPACE_RESOLUTIONS,
} from "@/types/spaces";

export function ControlPanel() {
  const selectedCardId = useSpacesStore((s) => s.selectedCardId);
  const activeSettings = useSpacesStore((s) => s.activeSettings);
  const setActiveSettings = useSpacesStore((s) => s.setActiveSettings);
  const saveStylePreset = useSpacesStore((s) => s.saveStylePreset);
  const stylePresets = useSpacesStore((s) => s.stylePresets);
  const applyStylePreset = useSpacesStore((s) => s.applyStylePreset);
  const deleteStylePreset = useSpacesStore((s) => s.deleteStylePreset);
  const card = useSpacesStore((s) =>
    s.selectedCardId ? s.cards.find((c) => c.id === s.selectedCardId) : null
  );

  const [presetName, setPresetName] = useState("");

  return (
    <div className="flex h-full w-[320px] flex-col border-l border-white/[0.05] bg-[oklch(0.09_0_0)]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2">
          <Blocks className="h-3.5 w-3.5 text-white/25" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
            {selectedCardId ? "Card ativo" : "Space"}
          </span>
        </div>
        {selectedCardId ? (
          <button
            type="button"
            onClick={() => useSpacesStore.getState().selectCard(null)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-white/20 transition-colors hover:bg-white/[0.04] hover:text-white/48"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="border-b border-white/[0.04] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            {card ? "Resumo" : "Canvas pronto"}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-white/54">
            {card?.prompt ||
              "Selecione um card para editar esse bloco, ou ajuste os defaults para os proximos cards."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[9px] text-white/24">
            <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5">
              {card?.settings.model ?? activeSettings.model}
            </span>
            <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5">
              {card?.settings.aspectRatio ?? activeSettings.aspectRatio}
            </span>
            <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5">
              {card
                ? `${card.imageUrls.length} imgs`
                : `${SPACE_QUANTITIES[0]} a ${SPACE_QUANTITIES[SPACE_QUANTITIES.length - 1]} imgs`}
            </span>
            <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5">
              {card?.status ?? "aguardando"}
            </span>
          </div>
          {card?.errorMessage ? (
            <div className="mt-3 rounded-lg border border-red-500/15 bg-red-500/10 px-2.5 py-2 text-[10px] leading-relaxed text-red-200/85">
              {card.errorMessage}
            </div>
          ) : null}
        </div>

        <div className="border-b border-white/[0.04] px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Sliders className="h-3 w-3 text-white/25" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Defaults globais
            </p>
          </div>

          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] font-medium text-white/25">
              Modelo padrao
            </label>
            <select
              value={activeSettings.model}
              onChange={(e) =>
                setActiveSettings({
                  model: e.target.value as typeof activeSettings.model,
                })
              }
              className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/60 outline-none transition-colors focus:border-white/[0.10]"
            >
              {IMAGE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] font-medium text-white/25">
              Aspect ratio
            </label>
            <div className="grid grid-cols-3 gap-1">
              {SPACE_ASPECT_RATIOS.slice(0, 6).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setActiveSettings({ aspectRatio: ratio })}
                  className={cn(
                    "rounded-md border py-1.5 text-[10px] font-medium transition-colors",
                    activeSettings.aspectRatio === ratio
                      ? "border-white/[0.14] bg-white/[0.07] text-white/76"
                      : "border-white/[0.04] text-white/28 hover:border-white/[0.08] hover:text-white/46"
                  )}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-white/25">
                Quantidade
              </label>
              <div className="flex gap-1">
                {SPACE_QUANTITIES.map((quantity) => (
                  <button
                    key={quantity}
                    type="button"
                    onClick={() => setActiveSettings({ quantity })}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-[10px] font-medium transition-colors",
                      activeSettings.quantity === quantity
                        ? "border-white/[0.14] bg-white/[0.07] text-white/76"
                        : "border-white/[0.04] text-white/28 hover:border-white/[0.08] hover:text-white/46"
                    )}
                  >
                    {quantity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-white/25">
                Resolucao
              </label>
              <select
                value={activeSettings.resolution}
                onChange={(e) =>
                  setActiveSettings({
                    resolution: e.target.value as typeof activeSettings.resolution,
                  })
                }
                className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/60 outline-none transition-colors focus:border-white/[0.10]"
              >
                {SPACE_RESOLUTIONS.map((resolution) => (
                  <option key={resolution} value={resolution}>
                    {resolution}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-medium text-white/25">
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
              className="w-full accent-white"
            />
          </div>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-medium text-white/25">
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
              className="w-full accent-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-medium text-white/25">
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
        </div>

        <div className="border-b border-white/[0.04] px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Blocks className="h-3 w-3 text-white/25" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Presets
            </p>
          </div>

          {stylePresets.length > 0 ? (
            <div className="space-y-2">
              {stylePresets.slice(-6).reverse().map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-white/68">
                      {preset.name}
                    </p>
                    <p className="truncate text-[10px] text-white/24">
                      {preset.settings.model ?? activeSettings.model}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyStylePreset(preset.id)}
                    className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-white/58 transition-colors hover:border-white/[0.10] hover:text-white/78"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStylePreset(preset.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.04] text-white/30 transition-colors hover:border-red-500/18 hover:text-red-300/78"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-white/26">
              Salve um conjunto de configuracoes para reutilizar rapidamente em outros cards.
            </p>
          )}
        </div>

        <div className="px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Save className="h-3 w-3 text-white/25" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Salvar estilo
            </p>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nome do estilo..."
              className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/60 placeholder:text-white/15 outline-none transition-colors focus:border-white/[0.10]"
            />
            <button
              type="button"
              onClick={() => {
                if (presetName.trim()) {
                  saveStylePreset(presetName.trim());
                  setPresetName("");
                }
              }}
              className="rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-[11px] font-medium text-white/68 transition-colors hover:border-white/[0.12] hover:text-white/82"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
