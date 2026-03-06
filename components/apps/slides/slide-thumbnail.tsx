"use client";

import { cn } from "@/lib/utils";
import type { Slide, Presentation } from "@/stores/slides-store";

const THEME_BG: Record<Presentation["theme"], string> = {
  dark: "bg-[#1a1a2e]",
  light: "bg-white",
  neon: "bg-[#0a0a1a]",
  gradient: "bg-gradient-to-br from-[#1a1a2e] to-[#2d1b4e]",
};

const THEME_TEXT: Record<Presentation["theme"], string> = {
  dark: "text-white/80",
  light: "text-gray-800",
  neon: "text-cyan-300",
  gradient: "text-white/90",
};

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  theme: Presentation["theme"];
  onClick: () => void;
}

export function SlideThumbnail({ slide, index, isActive, theme, onClick }: SlideThumbnailProps) {
  const titleEl = slide.elements.find((e) => e.type === "title" || e.type === "quote");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col rounded-lg border transition-all",
        isActive
          ? "border-neon-orange/50 ring-1 ring-neon-orange/30"
          : "border-foreground/[0.08] hover:border-foreground/[0.15]"
      )}
    >
      <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-[10px] text-foreground/30">
        {index + 1}
      </div>
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-lg p-2",
          THEME_BG[theme]
        )}
      >
        <span className={cn("line-clamp-2 text-center text-[8px] leading-tight", THEME_TEXT[theme])}>
          {titleEl?.content || "Slide vazio"}
        </span>
      </div>
    </button>
  );
}
