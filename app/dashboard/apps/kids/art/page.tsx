"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Paintbrush,
  Pencil,
  SprayCan,
  Stamp,
  Circle,
  Eraser,
  PawPrint,
  Rocket,
  Bone,
  Waves,
  Wand2,
  UtensilsCrossed,
} from "lucide-react";

const TOOLS = [
  { icon: Paintbrush, label: "Pincel", color: "text-neon-pink" },
  { icon: Pencil, label: "Lapis", color: "text-neon-cyan" },
  { icon: SprayCan, label: "Spray", color: "text-neon-purple" },
  { icon: Stamp, label: "Carimbo", color: "text-neon-orange" },
  { icon: Circle, label: "Formas", color: "text-neon-green" },
  { icon: Eraser, label: "Borracha", color: "text-foreground/50" },
];

type Theme = {
  id: string;
  icon: LucideIcon;
  title: string;
  count: number;
  gradient: string;
};

const THEMES: Theme[] = [
  { id: "animals", icon: PawPrint, title: "Animais", count: 8, gradient: "from-amber-500/20 to-orange-500/15" },
  { id: "space", icon: Rocket, title: "Espaco", count: 6, gradient: "from-purple-500/20 to-indigo-500/15" },
  { id: "dinos", icon: Bone, title: "Dinossauros", count: 5, gradient: "from-green-500/20 to-emerald-500/15" },
  { id: "ocean", icon: Waves, title: "Oceano", count: 7, gradient: "from-cyan-500/20 to-blue-500/15" },
  { id: "fairy", icon: Wand2, title: "Fantasia", count: 6, gradient: "from-pink-500/20 to-fuchsia-500/15" },
  { id: "food", icon: UtensilsCrossed, title: "Comidas", count: 9, gradient: "from-rose-500/20 to-red-500/15" },
];

export default function KidsArtPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <Link
          href="/dashboard/apps/kids"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/40 transition-colors hover:text-foreground/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-pink/25 bg-neon-pink/10">
          <Paintbrush className="h-5 w-5 text-neon-pink" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Arte & Pintura</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Solte a criatividade! Desenhe, pinte e crie
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-foreground/[0.08] bg-card/70 p-3 backdrop-blur-xl">
        {TOOLS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            className="flex flex-col items-center gap-1 rounded-xl border border-foreground/[0.06] bg-foreground/[0.03] px-4 py-3 transition-all hover:border-foreground/15 hover:bg-foreground/[0.06]"
          >
            <tool.icon className={`h-5 w-5 ${tool.color}`} />
            <span className="text-[10px] text-foreground/40">{tool.label}</span>
          </button>
        ))}

        {/* Color palette */}
        <div className="ml-auto flex items-center gap-1.5 px-2">
          {["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-cyan-400", "bg-blue-400", "bg-purple-400", "bg-pink-400", "bg-foreground", "bg-neutral-600"].map(
            (color) => (
              <button
                key={color}
                type="button"
                className={`h-6 w-6 rounded-full ${color} border-2 border-foreground/10 transition-transform hover:scale-110`}
              />
            )
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div className="mb-8 flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-foreground/[0.08] bg-card/50">
        <div className="text-center">
          <Paintbrush className="mb-2 h-8 w-8 text-foreground/30" />
          <p className="text-sm text-foreground/30">
            Selecione um tema abaixo para comecar a colorir
          </p>
        </div>
      </div>

      {/* Coloring themes */}
      <h2 className="mb-4 text-sm font-semibold text-foreground/60">
        Paginas para Colorir
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((theme) => (
          <div
            key={theme.id}
            className="group cursor-pointer rounded-2xl border border-foreground/[0.08] bg-card/70 backdrop-blur-xl transition-all hover:border-neon-pink/30"
          >
            <div
              className={`flex h-28 items-center justify-center rounded-t-2xl bg-gradient-to-br ${theme.gradient}`}
            >
              <theme.icon className="h-8 w-8 text-foreground/60 transition-transform group-hover:scale-110" />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-foreground/80">
                {theme.title}
              </h3>
              <p className="text-[11px] text-foreground/35">
                {theme.count} desenhos disponiveis
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
