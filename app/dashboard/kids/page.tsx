"use client";

import Link from "next/link";
import { Shield, Lock } from "lucide-react";

const SECTIONS = [
  {
    emoji: "\u{1F3AC}",
    title: "Videos Educativos",
    description: "Videos curtos, curiosidades e desenhos animados",
    href: "/dashboard/kids/videos",
    color: "cyan",
  },
  {
    emoji: "\u{1F3AE}",
    title: "Minigames",
    description: "Jogos didaticos de matematica, memoria e logica",
    href: "/dashboard/kids/games",
    color: "green",
  },
  {
    emoji: "\u{1F3A8}",
    title: "Arte & Pintura",
    description: "Desenhe, pinte e solte a criatividade",
    href: "/dashboard/kids/art",
    color: "pink",
  },
  {
    emoji: "\u{1F4D6}",
    title: "Historias",
    description: "Historias interativas, narradas e animadas",
    href: "/dashboard/kids/stories",
    color: "purple",
  },
  {
    emoji: "\u{1F916}",
    title: "Companheiro IA",
    description: "Seu amigo virtual inteligente e divertido",
    href: "/dashboard/kids/companion",
    color: "orange",
  },
  {
    emoji: "\u2B50",
    title: "Desafios do Dia",
    description: "Desafios educativos diarios com recompensas",
    href: "/dashboard/kids/challenges",
    color: "blue",
  },
] as const;

const COLOR_CLASSES: Record<
  string,
  { border: string; hoverBorder: string; bg: string; text: string; glow: string }
> = {
  cyan: {
    border: "border-neon-cyan/20",
    hoverBorder: "hover:border-neon-cyan/50",
    bg: "bg-neon-cyan/5",
    text: "text-neon-cyan",
    glow: "hover:shadow-[0_0_30px_rgba(0,200,220,0.12)]",
  },
  green: {
    border: "border-neon-green/20",
    hoverBorder: "hover:border-neon-green/50",
    bg: "bg-neon-green/5",
    text: "text-neon-green",
    glow: "hover:shadow-[0_0_30px_rgba(0,220,120,0.12)]",
  },
  pink: {
    border: "border-neon-pink/20",
    hoverBorder: "hover:border-neon-pink/50",
    bg: "bg-neon-pink/5",
    text: "text-neon-pink",
    glow: "hover:shadow-[0_0_30px_rgba(220,0,140,0.12)]",
  },
  purple: {
    border: "border-neon-purple/20",
    hoverBorder: "hover:border-neon-purple/50",
    bg: "bg-neon-purple/5",
    text: "text-neon-purple",
    glow: "hover:shadow-[0_0_30px_rgba(160,0,220,0.12)]",
  },
  orange: {
    border: "border-neon-orange/20",
    hoverBorder: "hover:border-neon-orange/50",
    bg: "bg-neon-orange/5",
    text: "text-neon-orange",
    glow: "hover:shadow-[0_0_30px_rgba(220,150,0,0.12)]",
  },
  blue: {
    border: "border-neon-blue/20",
    hoverBorder: "hover:border-neon-blue/50",
    bg: "bg-neon-blue/5",
    text: "text-neon-blue",
    glow: "hover:shadow-[0_0_30px_rgba(0,120,220,0.12)]",
  },
};

export default function KidsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-green/25 bg-neon-green/10">
          <span className="text-xl">{"\u{1F31F}"}</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">ORIGEM Kids</h1>
          <p className="mt-1 text-sm text-white/50">
            Mundo magico de aprendizado e diversao
          </p>
        </div>
      </div>

      {/* Welcome banner */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-neon-green/15 bg-gradient-to-r from-neon-green/8 via-neon-cyan/5 to-neon-purple/8 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{"\u{1F680}"}</span>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Ola, explorador! {"\u{1F44B}"}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Escolha uma aventura para comecar. Aprenda, brinque e descubra
              coisas incriveis com a inteligencia artificial!
            </p>
          </div>
        </div>
      </div>

      {/* Section grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const colors = COLOR_CLASSES[section.color];
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`group rounded-2xl border ${colors.border} ${colors.hoverBorder} bg-neutral-900/70 p-6 backdrop-blur-xl transition-all ${colors.glow}`}
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl border ${colors.border} ${colors.bg}`}
              >
                <span className="text-3xl">{section.emoji}</span>
              </div>
              <h3 className={`mb-1 text-sm font-semibold ${colors.text}`}>
                {section.title}
              </h3>
              <p className="text-xs text-white/40">{section.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Footer — safety + parental */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-neutral-900/50 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-neon-green" />
          <span className="text-xs text-neon-green/80">
            Modo Seguro Ativo
          </span>
        </div>
        <Link
          href="/dashboard/kids/parental"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/60"
        >
          <Lock className="h-3 w-3" />
          Controle Parental
        </Link>
      </div>
    </div>
  );
}
