"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "ciencia", label: "Ciencia" },
  { id: "animais", label: "Animais" },
  { id: "espaco", label: "Espaco" },
  { id: "natureza", label: "Natureza" },
  { id: "historias", label: "Historias" },
  { id: "experiencias", label: "Experiencias" },
];

const VIDEOS = [
  { id: 1, title: "Como os vulcoes funcionam?", category: "ciencia", duration: "3:45", color: "from-red-500/30 to-orange-500/20" },
  { id: 2, title: "A vida dos golfinhos", category: "animais", duration: "4:20", color: "from-cyan-500/30 to-blue-500/20" },
  { id: 3, title: "Viagem pelo Sistema Solar", category: "espaco", duration: "5:10", color: "from-purple-500/30 to-indigo-500/20" },
  { id: 4, title: "De onde vem a chuva?", category: "natureza", duration: "2:55", color: "from-green-500/30 to-teal-500/20" },
  { id: 5, title: "O pequeno astronauta", category: "historias", duration: "6:00", color: "from-yellow-500/30 to-amber-500/20" },
  { id: 6, title: "Fazendo um vulcao de bicarbonato", category: "experiencias", duration: "4:00", color: "from-pink-500/30 to-rose-500/20" },
  { id: 7, title: "Dinossauros: gigantes do passado", category: "ciencia", duration: "5:30", color: "from-green-600/30 to-emerald-500/20" },
  { id: 8, title: "Como as abelhas fazem mel?", category: "animais", duration: "3:15", color: "from-amber-500/30 to-yellow-500/20" },
  { id: 9, title: "Estrelas e constelacoes", category: "espaco", duration: "4:45", color: "from-blue-500/30 to-violet-500/20" },
  { id: 10, title: "A floresta amazonica", category: "natureza", duration: "5:00", color: "from-emerald-500/30 to-green-500/20" },
  { id: 11, title: "A princesa e o robo", category: "historias", duration: "7:20", color: "from-fuchsia-500/30 to-pink-500/20" },
  { id: 12, title: "Arco-iris no copo", category: "experiencias", duration: "3:00", color: "from-violet-500/30 to-purple-500/20" },
];

export default function KidsVideosPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? VIDEOS
      : VIDEOS.filter((v) => v.category === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <Link
          href="/dashboard/kids"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-cyan/25 bg-neon-cyan/10">
          <span className="text-xl">{"\u{1F3AC}"}</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Videos Educativos</h1>
          <p className="mt-1 text-sm text-white/50">
            Videos curtos e divertidos para aprender brincando
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
              activeCategory === cat.id
                ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
                : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((video) => (
          <div
            key={video.id}
            className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-neutral-900/70 backdrop-blur-xl transition-all hover:border-neon-cyan/30"
          >
            {/* Thumbnail */}
            <div
              className={`relative flex h-36 items-center justify-center rounded-t-2xl bg-gradient-to-br ${video.color}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-transform group-hover:scale-110">
                <Play className="h-5 w-5 text-white" />
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                <Clock className="h-2.5 w-2.5" />
                {video.duration}
              </div>
            </div>
            {/* Info */}
            <div className="p-4">
              <h3 className="mb-1 text-sm font-medium text-white/85">
                {video.title}
              </h3>
              <div className="flex items-center justify-between">
                <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase text-white/35">
                  {video.category}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-neon-green/60">
                  <Shield className="h-2.5 w-2.5" />
                  Seguro
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
