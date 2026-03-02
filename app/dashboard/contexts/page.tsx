"use client";

import {
  Brain,
  Plus,
  Target,
  Gauge,
  Tags,
  Search,
} from "lucide-react";

const SAMPLE_CONTEXTS = [
  {
    id: "ctx-1",
    input: "Crie um sistema de autenticacao com OAuth2 e refresh tokens",
    intent: "create",
    confidence: 0.94,
    tokenCount: 9,
    domains: ["backend", "security", "auth"],
    polarity: { complexity: 0.82, urgency: 0.6, certainty: 0.88 },
    agentsRequired: 3,
    createdAt: "2 min atras",
  },
  {
    id: "ctx-2",
    input: "Analise a performance do algoritmo de sorting e sugira otimizacoes",
    intent: "analyze",
    confidence: 0.91,
    tokenCount: 8,
    domains: ["algorithms", "performance"],
    polarity: { complexity: 0.65, urgency: 0.4, certainty: 0.72 },
    agentsRequired: 2,
    createdAt: "15 min atras",
  },
  {
    id: "ctx-3",
    input: "Desenhe uma landing page moderna com animacoes e gradientes",
    intent: "design",
    confidence: 0.97,
    tokenCount: 8,
    domains: ["frontend", "design", "UI/UX"],
    polarity: { complexity: 0.55, urgency: 0.3, certainty: 0.9 },
    agentsRequired: 2,
    createdAt: "1h atras",
  },
];

const INTENT_COLORS: Record<string, string> = {
  create: "text-green-400 bg-green-400/10 border-green-400/20",
  analyze: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  design: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  transform: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  question: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  explore: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  fix: "text-red-400 bg-red-400/10 border-red-400/20",
};

function PolarityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[10px] text-white/30">{label}</span>
      <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-blue-400/60 transition-all"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="w-8 text-right text-[10px] text-white/40">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function ContextsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <Brain className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Contextos</h1>
              <p className="mt-1 text-sm text-white/40">
                Mapeie e decomponha contextos semanticos — tokens, intencoes, polaridade e dominio
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 backdrop-blur-sm transition-all hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Novo Contexto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-neutral-900/60 px-4 py-3 backdrop-blur-xl">
        <Search className="h-4 w-4 text-white/20" />
        <input
          type="text"
          placeholder="Buscar contextos por texto, intencao ou dominio..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
        />
      </div>

      {/* Context cards */}
      <div className="space-y-3">
        {SAMPLE_CONTEXTS.map((ctx) => (
          <div
            key={ctx.id}
            className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-neutral-900/70"
          >
            {/* Top row */}
            <div className="mb-3 flex items-start justify-between">
              <p className="flex-1 text-sm font-medium text-white/90">
                &ldquo;{ctx.input}&rdquo;
              </p>
              <span className="ml-4 shrink-0 text-[10px] text-white/25">
                {ctx.createdAt}
              </span>
            </div>

            {/* Badges row */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase ${
                  INTENT_COLORS[ctx.intent] || INTENT_COLORS.question
                }`}
              >
                <Target className="h-3 w-3" />
                {ctx.intent}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                <Gauge className="h-3 w-3" />
                {(ctx.confidence * 100).toFixed(0)}% confianca
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                {ctx.tokenCount} tokens
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                {ctx.agentsRequired} agentes
              </span>
            </div>

            {/* Bottom: domains + polarity */}
            <div className="flex items-end justify-between gap-6">
              {/* Domains */}
              <div className="flex items-center gap-1.5">
                <Tags className="h-3 w-3 text-white/25" />
                {ctx.domains.map((d) => (
                  <span
                    key={d}
                    className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/40"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Mini polarity */}
              <div className="w-48 space-y-1">
                <PolarityBar
                  label="Complexidade"
                  value={ctx.polarity.complexity}
                />
                <PolarityBar label="Urgencia" value={ctx.polarity.urgency} />
                <PolarityBar label="Certeza" value={ctx.polarity.certainty} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
