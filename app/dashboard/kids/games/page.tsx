"use client";

import Link from "next/link";
import { ArrowLeft, Star, Trophy } from "lucide-react";

const GAMES = [
  { id: "math", emoji: "\u{1F522}", name: "Matematica Divertida", description: "Somas, subtracoes e multiplicacoes", difficulty: "Facil", stars: 2, color: "border-neon-cyan/20 hover:border-neon-cyan/50" },
  { id: "memory", emoji: "\u{1F9E0}", name: "Jogo da Memoria", description: "Encontre os pares escondidos", difficulty: "Facil", stars: 3, color: "border-neon-purple/20 hover:border-neon-purple/50" },
  { id: "puzzle", emoji: "\u{1F9E9}", name: "Quebra-Cabeca", description: "Monte as imagens divertidas", difficulty: "Medio", stars: 1, color: "border-neon-green/20 hover:border-neon-green/50" },
  { id: "spell", emoji: "\u{1F524}", name: "Soletrar", description: "Forme palavras com as letras", difficulty: "Medio", stars: 0, color: "border-neon-orange/20 hover:border-neon-orange/50" },
  { id: "logic", emoji: "\u{1F4A1}", name: "Logica", description: "Resolva enigmas e sequencias", difficulty: "Dificil", stars: 1, color: "border-neon-pink/20 hover:border-neon-pink/50" },
  { id: "colors", emoji: "\u{1F308}", name: "Cores e Formas", description: "Aprenda cores, formas e padroes", difficulty: "Facil", stars: 3, color: "border-neon-blue/20 hover:border-neon-blue/50" },
  { id: "animals", emoji: "\u{1F981}", name: "Montar Animais", description: "Monte animais com pecas", difficulty: "Facil", stars: 2, color: "border-neon-green/20 hover:border-neon-green/50" },
  { id: "geo", emoji: "\u{1F30D}", name: "Geografia", description: "Descubra paises e capitais", difficulty: "Medio", stars: 0, color: "border-neon-cyan/20 hover:border-neon-cyan/50" },
  { id: "music", emoji: "\u{1F3B5}", name: "Musica e Ritmo", description: "Siga o ritmo e crie melodias", difficulty: "Facil", stars: 2, color: "border-neon-purple/20 hover:border-neon-purple/50" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Facil: "text-neon-green border-neon-green/25 bg-neon-green/10",
  Medio: "text-neon-orange border-neon-orange/25 bg-neon-orange/10",
  Dificil: "text-neon-pink border-neon-pink/25 bg-neon-pink/10",
};

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < count
              ? "fill-amber-400 text-amber-400"
              : "text-foreground/15"
          }`}
        />
      ))}
    </div>
  );
}

export default function KidsGamesPage() {
  const totalStars = GAMES.reduce((sum, g) => sum + g.stars, 0);

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
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-green/25 bg-neon-green/10">
          <span className="text-xl">{"\u{1F3AE}"}</span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Minigames Educativos</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Aprenda brincando com jogos didaticos
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-1.5">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">{totalStars}</span>
          <span className="text-[10px] text-amber-400/60">estrelas</span>
        </div>
      </div>

      {/* Games grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`group cursor-pointer rounded-2xl border bg-card/70 p-5 backdrop-blur-xl transition-all ${game.color}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-3xl">{game.emoji}</span>
              <Stars count={game.stars} />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-foreground/85">
              {game.name}
            </h3>
            <p className="mb-3 text-xs text-foreground/40">{game.description}</p>
            <span
              className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                DIFFICULTY_COLORS[game.difficulty]
              }`}
            >
              {game.difficulty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
