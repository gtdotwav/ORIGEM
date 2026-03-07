"use client";

import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layout,
  Type,
  Columns2,
  ImageIcon,
  Quote,
  Square,
  Palette,
  Presentation,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSlidesStore, createBlankSlide } from "@/stores/slides-store";
import type { SlideLayout, Presentation as PresentationType } from "@/types/slides";
import { SlideThumbnail } from "./slide-thumbnail";
import { SlideCanvas } from "./slide-canvas";
import { useState } from "react";

const LAYOUTS: { value: SlideLayout; label: string; icon: typeof Type }[] = [
  { value: "title", label: "Titulo", icon: Type },
  { value: "content", label: "Conteudo", icon: Layout },
  { value: "two-column", label: "Duas Colunas", icon: Columns2 },
  { value: "image", label: "Imagem", icon: ImageIcon },
  { value: "quote", label: "Citacao", icon: Quote },
  { value: "blank", label: "Em Branco", icon: Square },
];

const THEMES: { value: PresentationType["theme"]; label: string; preview: string }[] = [
  { value: "dark", label: "Dark", preview: "bg-[#1a1a2e]" },
  { value: "light", label: "Light", preview: "bg-white" },
  { value: "neon", label: "Neon", preview: "bg-[#0a0a1a]" },
  { value: "gradient", label: "Gradient", preview: "bg-gradient-to-br from-[#1a1a2e] to-[#2d1b4e]" },
];

export function SlideEditor() {
  const activePresentationId = useSlidesStore((s) => s.activePresentationId);
  const presentations = useSlidesStore((s) => s.presentations);
  const activeSlideIndex = useSlidesStore((s) => s.activeSlideIndex);
  const setActiveSlide = useSlidesStore((s) => s.setActiveSlide);
  const addSlide = useSlidesStore((s) => s.addSlide);
  const removeSlide = useSlidesStore((s) => s.removeSlide);
  const moveSlide = useSlidesStore((s) => s.moveSlide);
  const duplicateSlide = useSlidesStore((s) => s.duplicateSlide);
  const updateElement = useSlidesStore((s) => s.updateElement);
  const updatePresentationTheme = useSlidesStore((s) => s.updatePresentationTheme);
  const updatePresentationTitle = useSlidesStore((s) => s.updatePresentationTitle);

  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const presentation = presentations.find((p) => p.id === activePresentationId);
  if (!presentation) return null;

  const currentSlide = presentation.slides[activeSlideIndex];
  if (!currentSlide) return null;

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-foreground/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/apps/slides"
            className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-orange/20 bg-neon-orange/10">
            <Presentation className="h-4 w-4 text-neon-orange" />
          </div>
          <input
            type="text"
            value={presentation.title}
            onChange={(e) => updatePresentationTitle(e.target.value)}
            className="bg-transparent text-sm font-semibold text-foreground/90 outline-none placeholder:text-foreground/30"
            placeholder="Titulo da apresentacao"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowThemePicker(!showThemePicker); setShowLayoutPicker(false); }}
              className="flex items-center gap-1.5 rounded-lg border border-foreground/[0.08] px-2.5 py-1.5 text-[11px] text-foreground/50 transition-colors hover:border-foreground/[0.15] hover:text-foreground/70"
            >
              <Palette className="h-3.5 w-3.5" />
              Tema
            </button>
            {showThemePicker && (
              <div className="absolute right-0 top-full z-50 mt-1.5 flex gap-2 rounded-xl border border-foreground/[0.08] bg-card/95 p-3 shadow-lg backdrop-blur-xl">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { updatePresentationTheme(t.value); setShowThemePicker(false); }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
                      presentation.theme === t.value
                        ? "border-neon-orange/50 ring-1 ring-neon-orange/30"
                        : "border-foreground/[0.08] hover:border-foreground/[0.15]"
                    )}
                  >
                    <div className={cn("h-8 w-14 rounded", t.preview)} />
                    <span className="text-[9px] text-foreground/50">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[10px] text-foreground/30">
            {activeSlideIndex + 1} / {presentation.slides.length}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - slide thumbnails */}
        <div className="flex w-44 flex-col border-r border-foreground/[0.06] bg-foreground/[0.02]">
          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
            {presentation.slides.map((slide, i) => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                index={i}
                isActive={i === activeSlideIndex}
                theme={presentation.theme}
                onClick={() => setActiveSlide(i)}
              />
            ))}
          </div>

          {/* Sidebar actions */}
          <div className="border-t border-foreground/[0.06] p-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowLayoutPicker(!showLayoutPicker); setShowThemePicker(false); }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground/[0.12] py-2 text-[10px] text-foreground/40 transition-colors hover:border-neon-orange/30 hover:text-neon-orange/70"
              >
                <Plus className="h-3 w-3" />
                Novo Slide
              </button>
              {showLayoutPicker && (
                <div className="absolute bottom-full left-0 z-50 mb-1.5 w-48 rounded-xl border border-foreground/[0.08] bg-card/95 p-2 shadow-lg backdrop-blur-xl">
                  <p className="mb-1.5 px-2 text-[9px] font-medium uppercase tracking-wider text-foreground/30">
                    Layout
                  </p>
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => { addSlide(createBlankSlide(l.value)); setShowLayoutPicker(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-foreground/60 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/80"
                    >
                      <l.icon className="h-3.5 w-3.5 text-foreground/30" />
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center overflow-auto bg-foreground/[0.02] p-8">
            <SlideCanvas
              slide={currentSlide}
              theme={presentation.theme}
              slideIndex={activeSlideIndex}
              onUpdateElement={(_slideIndex, elementId, content) =>
                updateElement(currentSlide.id, elementId, { content })
              }
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between border-t border-foreground/[0.06] px-4 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => activeSlideIndex > 0 && moveSlide(activeSlideIndex, activeSlideIndex - 1)}
                disabled={activeSlideIndex === 0}
                className="rounded-md p-1.5 text-foreground/30 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/60 disabled:opacity-30"
                title="Mover para cima"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => activeSlideIndex < presentation.slides.length - 1 && moveSlide(activeSlideIndex, activeSlideIndex + 1)}
                disabled={activeSlideIndex === presentation.slides.length - 1}
                className="rounded-md p-1.5 text-foreground/30 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/60 disabled:opacity-30"
                title="Mover para baixo"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => duplicateSlide(currentSlide.id)}
                className="rounded-md p-1.5 text-foreground/30 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/60"
                title="Duplicar slide"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeSlide(currentSlide.id)}
                disabled={presentation.slides.length <= 1}
                className="rounded-md p-1.5 text-foreground/30 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                title="Remover slide"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
