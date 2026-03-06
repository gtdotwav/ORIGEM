"use client";

import { useState } from "react";
import {
  Sparkles,
  Save,
  X,
  Download,
  ImageIcon,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";

export function ControlPanel() {
  const selectedCardId = useSpacesStore((s) => s.selectedCardId);
  const activeSettings = useSpacesStore((s) => s.activeSettings);
  const setActiveSettings = useSpacesStore((s) => s.setActiveSettings);
  const saveStylePreset = useSpacesStore((s) => s.saveStylePreset);
  const card = useSpacesStore((s) =>
    s.selectedCardId
      ? s.cards.find((c) => c.id === s.selectedCardId)
      : null
  );

  const [presetName, setPresetName] = useState("");

  return (
    <div className="flex h-full w-[320px] flex-col border-l border-white/[0.05] bg-[oklch(0.09_0_0)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-white/25" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
            {selectedCardId ? "Detalhes" : "Space"}
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
        {selectedCardId && card ? (
          <>
            {/* Card info */}
            <div className="border-b border-white/[0.04] px-4 py-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Card selecionado
              </p>
              <p className="line-clamp-3 text-[11px] leading-relaxed text-white/50">
                {card.prompt || "Sem prompt"}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[9px] text-white/20">
                <span>{card.settings.model}</span>
                <span>&middot;</span>
                <span>{card.settings.aspectRatio}</span>
                <span>&middot;</span>
                <span>{card.imageUrls.length} imgs</span>
              </div>
            </div>

            {/* Global defaults */}
            <div className="border-b border-white/[0.04] px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="h-3 w-3 text-white/25" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Defaults globais
                </p>
              </div>
              {/* Creativity */}
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
                  className="w-full accent-neon-cyan"
                />
              </div>
              {/* Style Strength */}
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
                  className="w-full accent-neon-purple"
                />
              </div>
              {/* Negative Prompt */}
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

            {/* Export */}
            <div className="border-b border-white/[0.04] px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Download className="h-3 w-3 text-white/25" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Exportar
                </p>
              </div>
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
            </div>

            {/* Save Style */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
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
            </div>
          </>
        ) : (
          /* Empty state — no card selected */
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <ImageIcon className="h-5 w-5 text-white/10" />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-medium text-white/25">
                Selecione um card
              </p>
              <p className="mt-0.5 text-[10px] text-white/15">
                Clique em um card no canvas para ver detalhes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
