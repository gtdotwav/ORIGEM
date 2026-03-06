"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Headphones, Blocks, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "aventura", label: "Aventura" },
  { id: "amizade", label: "Amizade" },
  { id: "educativa", label: "Educativas" },
  { id: "animais", label: "Animais" },
  { id: "espaco", label: "Espaco" },
];

type StoryFormat = "narrada" | "interativa" | "animada";

const FORMAT_META: Record<StoryFormat, { icon: typeof BookOpen; label: string; color: string }> = {
  narrada: { icon: Headphones, label: "Narrada", color: "text-neon-cyan border-neon-cyan/25 bg-neon-cyan/10" },
  interativa: { icon: MousePointerClick, label: "Interativa", color: "text-neon-purple border-neon-purple/25 bg-neon-purple/10" },
  animada: { icon: Blocks, label: "Animada", color: "text-neon-pink border-neon-pink/25 bg-neon-pink/10" },
};

const STORIES = [
  { id: 1, title: "A Grande Aventura Espacial", category: "espaco", format: "interativa" as StoryFormat, duration: "8 min", gradient: "from-indigo-500/25 to-purple-500/15" },
  { id: 2, title: "O Gato e a Estrela", category: "amizade", format: "narrada" as StoryFormat, duration: "5 min", gradient: "from-amber-500/25 to-yellow-500/15" },
  { id: 3, title: "Como as Plantas Crescem", category: "educativa", format: "animada" as StoryFormat, duration: "4 min", gradient: "from-green-500/25 to-emerald-500/15" },
  { id: 4, title: "O Oceano Misterioso", category: "aventura", format: "interativa" as StoryFormat, duration: "10 min", gradient: "from-cyan-500/25 to-blue-500/15" },
  { id: 5, title: "A Raposa e o Coelho", category: "animais", format: "narrada" as StoryFormat, duration: "6 min", gradient: "from-orange-500/25 to-red-500/15" },
  { id: 6, title: "Viagem ao Centro da Terra", category: "aventura", format: "animada" as StoryFormat, duration: "7 min", gradient: "from-rose-500/25 to-pink-500/15" },
  { id: 7, title: "Amigos da Floresta", category: "amizade", format: "narrada" as StoryFormat, duration: "5 min", gradient: "from-teal-500/25 to-green-500/15" },
  { id: 8, title: "O Robo que Aprendeu a Sonhar", category: "educativa", format: "interativa" as StoryFormat, duration: "9 min", gradient: "from-violet-500/25 to-indigo-500/15" },
];

export default function KidsStoriesPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered =
    activeFilter === "all"
      ? STORIES
      : STORIES.filter((s) => s.category === activeFilter);

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
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-purple/25 bg-neon-purple/10">
          <BookOpen className="h-5 w-5 text-neon-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Historias Interativas</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Aventuras magicas para ler, ouvir e explorar
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
              activeFilter === f.id
                ? "border-neon-purple/30 bg-neon-purple/10 text-neon-purple"
                : "border-foreground/[0.08] bg-foreground/[0.03] text-foreground/40 hover:bg-foreground/[0.06] hover:text-foreground/60"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Story grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((story) => {
          const fmt = FORMAT_META[story.format];
          const FmtIcon = fmt.icon;
          return (
            <div
              key={story.id}
              className="group cursor-pointer rounded-2xl border border-foreground/[0.08] bg-card/70 backdrop-blur-xl transition-all hover:border-neon-purple/30"
            >
              <div
                className={`flex h-32 items-center justify-center rounded-t-2xl bg-gradient-to-br ${story.gradient}`}
              >
                <BookOpen className="h-10 w-10 text-foreground/40 transition-transform group-hover:scale-110" />
              </div>
              <div className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground/85">
                  {story.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] ${fmt.color}`}
                  >
                    <FmtIcon className="h-2.5 w-2.5" />
                    {fmt.label}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-foreground/30">
                    <Clock className="h-2.5 w-2.5" />
                    {story.duration}
                  </span>
                  <span className="text-[10px] text-foreground/20">
                    ORIGEM Kids
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
