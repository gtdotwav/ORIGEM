"use client";

import { Sparkles, MessageSquare } from "lucide-react";
import { AppCard } from "@/components/apps/app-card";

export default function AppsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
          <Sparkles className="h-5 w-5 text-neon-cyan" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Apps</h1>
          <p className="mt-1 text-sm text-white/50">
            Experiencias especializadas com IA — agentes unicos para criar
            diferencial e engajamento
          </p>
        </div>
      </div>

      {/* Apps grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard
          title="Converse com uma Celebridade IA"
          description="Escolha uma persona historica e converse com ela. A IA responde em personagem, usando analise psicossemantica para criar uma experiencia didatica e imersiva."
          emoji="🎭"
          color="purple"
          href="/dashboard/apps/celebrity-chat"
          badge="Novo"
        />

        <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-neutral-900/30 p-6">
          <div className="text-center">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-white/10" />
            <p className="text-xs text-white/20">Mais apps em breve</p>
          </div>
        </div>
      </div>
    </div>
  );
}
