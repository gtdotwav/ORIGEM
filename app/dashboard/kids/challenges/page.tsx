"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Star,
  Trophy,
  Blocks,
  Paintbrush,
  Calculator,
  Lightbulb,
  Search,
  BookOpen,
  Target,
  Check,
} from "lucide-react";

const TODAY_CHALLENGE = {
  icon: Paintbrush,
  title: "Desenhe um animal fantastico",
  description:
    "Use sua imaginacao para criar um animal que nao existe. Pode ter asas, tentaculos, chifres — o que voce quiser!",
  category: "Desenho",
  reward: 3,
};

type Category = {
  icon: LucideIcon;
  name: string;
  color: string;
};

const CATEGORIES: Category[] = [
  { icon: Paintbrush, name: "Desenho", color: "border-neon-pink/20 bg-neon-pink/5 text-neon-pink" },
  { icon: Calculator, name: "Matematica", color: "border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan" },
  { icon: Lightbulb, name: "Logica", color: "border-neon-purple/20 bg-neon-purple/5 text-neon-purple" },
  { icon: Search, name: "Curiosidades", color: "border-neon-orange/20 bg-neon-orange/5 text-neon-orange" },
  { icon: BookOpen, name: "Leitura", color: "border-neon-green/20 bg-neon-green/5 text-neon-green" },
];

const PAST_CHALLENGES = [
  { id: 1, title: "Quanto e 7 x 8?", category: "Matematica", completed: true, reward: 1 },
  { id: 2, title: "Desenhe sua familia", category: "Desenho", completed: true, reward: 2 },
  { id: 3, title: "Qual animal e mais rapido?", category: "Curiosidades", completed: false, reward: 1 },
  { id: 4, title: "Complete a sequencia: 2, 4, 8, ?", category: "Logica", completed: true, reward: 2 },
  { id: 5, title: "Leia uma historia de 5 minutos", category: "Leitura", completed: false, reward: 1 },
  { id: 6, title: "Desenhe um planeta imaginario", category: "Desenho", completed: false, reward: 3 },
];

export default function KidsChallengesPage() {
  const totalStars = PAST_CHALLENGES.filter((c) => c.completed).reduce(
    (sum, c) => sum + c.reward,
    0
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <Link
          href="/dashboard/kids"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.04] text-foreground/40 transition-colors hover:text-foreground/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-blue/25 bg-neon-blue/10">
          <Target className="h-5 w-5 text-neon-blue" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Desafios do Dia</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Complete desafios educativos e ganhe estrelas
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-1.5">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">{totalStars}</span>
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
        </div>
      </div>

      {/* Today's challenge — featured */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-neon-blue/25 bg-gradient-to-r from-neon-blue/10 via-neon-purple/5 to-neon-cyan/10 p-6 backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-2">
          <Blocks className="h-4 w-4 text-neon-blue" />
          <span className="text-xs font-semibold uppercase tracking-wide text-neon-blue">
            Desafio de Hoje
          </span>
        </div>
        <div className="flex items-center gap-4">
          <TODAY_CHALLENGE.icon className="h-8 w-8 text-neon-blue" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {TODAY_CHALLENGE.title}
            </h2>
            <p className="mt-1 text-sm text-foreground/55">
              {TODAY_CHALLENGE.description}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-md border border-foreground/[0.08] bg-foreground/[0.04] px-2 py-0.5 text-[10px] text-foreground/40">
                {TODAY_CHALLENGE.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
                +{TODAY_CHALLENGE.reward} estrelas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <h2 className="mb-3 text-sm font-semibold text-foreground/60">Categorias</h2>
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.name}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${cat.color}`}
          >
            <cat.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Past challenges */}
      <h2 className="mb-3 text-sm font-semibold text-foreground/60">
        Desafios Anteriores
      </h2>
      <div className="space-y-2">
        {PAST_CHALLENGES.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center gap-3 rounded-xl border border-foreground/[0.06] bg-card/70 px-4 py-3 backdrop-blur-xl"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${challenge.completed
                ? "border border-neon-green/25 bg-neon-green/10"
                : "border border-foreground/[0.08] bg-foreground/[0.04]"
                }`}
            >
              {challenge.completed ? (
                <Check className="h-3.5 w-3.5 text-neon-green" />
              ) : (
                <span className="text-xs text-foreground/25">?</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground/75">{challenge.title}</p>
              <span className="text-[10px] text-foreground/30">
                {challenge.category}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(challenge.reward)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${challenge.completed
                    ? "fill-amber-400 text-amber-400"
                    : "text-foreground/15"
                    }`}
                />
              ))}
            </div>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${challenge.completed
                ? "border-neon-green/25 bg-neon-green/10 text-neon-green"
                : "border-foreground/[0.08] bg-foreground/[0.04] text-foreground/35"
                }`}
            >
              {challenge.completed ? "Completo" : "Novo"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
