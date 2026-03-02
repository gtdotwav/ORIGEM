"use client";

import Link from "next/link";
import {
  Users,
  ArrowLeft,
  Plus,
  Layers,
  ArrowDownUp,
  Vote,
  Bot,
  Clock,
  Zap,
} from "lucide-react";

const STRATEGY_INFO = {
  parallel: {
    icon: Layers,
    label: "Paralelo",
    description: "Todos os agentes executam simultaneamente",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/20",
  },
  sequential: {
    icon: ArrowDownUp,
    label: "Sequencial",
    description: "Agentes executam em cadeia, passando outputs adiante",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
  },
  consensus: {
    icon: Vote,
    label: "Consenso",
    description: "Agentes votam e convergem em uma resposta final",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/20",
  },
};

const SAMPLE_GROUPS = [
  {
    id: "grp-1",
    name: "Code Review Pipeline",
    strategy: "sequential" as const,
    agents: [
      { name: "Coder", color: "bg-green-400" },
      { name: "Critic", color: "bg-pink-400" },
      { name: "Synthesizer", color: "bg-white/60" },
    ],
    status: "active" as const,
    executionCount: 12,
    lastRun: "3 min atras",
  },
  {
    id: "grp-2",
    name: "Research & Analysis",
    strategy: "parallel" as const,
    agents: [
      { name: "Researcher", color: "bg-cyan-400" },
      { name: "Writer", color: "bg-purple-400" },
    ],
    status: "active" as const,
    executionCount: 8,
    lastRun: "20 min atras",
  },
  {
    id: "grp-3",
    name: "Design Consensus",
    strategy: "consensus" as const,
    agents: [
      { name: "Designer", color: "bg-orange-400" },
      { name: "Critic", color: "bg-pink-400" },
      { name: "Planner", color: "bg-blue-400" },
    ],
    status: "idle" as const,
    executionCount: 4,
    lastRun: "2h atras",
  },
  {
    id: "grp-4",
    name: "Full Stack Build",
    strategy: "sequential" as const,
    agents: [
      { name: "Planner", color: "bg-blue-400" },
      { name: "Coder", color: "bg-green-400" },
      { name: "Designer", color: "bg-orange-400" },
      { name: "Critic", color: "bg-pink-400" },
    ],
    status: "idle" as const,
    executionCount: 2,
    lastRun: "1 dia atras",
  },
];

export default function GroupsPage() {
  return (
    <div className="relative min-h-screen bg-[oklch(0.08_0.02_270)]">
      {/* Gradient bg */}
      <div className="absolute inset-0">
        <div
          className="absolute -top-1/4 left-1/3 h-[500px] w-[500px] rounded-full opacity-[0.05]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 55), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.25 290), transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white/60"
          >
            <ArrowLeft className="h-3 w-3" />
            Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Grupos</h1>
                <p className="mt-1 text-sm text-white/40">
                  Coordene grupos de agentes — paralelo, sequencial ou consenso
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition-all hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Novo Grupo
            </button>
          </div>
        </div>

        {/* Strategy legend */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {Object.entries(STRATEGY_INFO).map(([key, strat]) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${strat.borderColor} ${strat.bgColor}`}
              >
                <strat.icon className={`h-4 w-4 ${strat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">{strat.label}</p>
                <p className="text-[10px] text-white/30">{strat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Groups */}
        <div className="space-y-3">
          {SAMPLE_GROUPS.map((group) => {
            const strat = STRATEGY_INFO[group.strategy];
            return (
              <div
                key={group.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all hover:border-white/[0.1] hover:bg-white/[0.05]"
              >
                {/* Top */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white/90">
                      {group.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${strat.borderColor} ${strat.bgColor} ${strat.color}`}
                      >
                        <strat.icon className="h-3 w-3" />
                        {strat.label}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] ${
                          group.status === "active"
                            ? "bg-green-400/10 text-green-400"
                            : "bg-white/[0.04] text-white/30"
                        }`}
                      >
                        {group.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="flex items-center gap-1 text-[11px] text-white/25">
                      <Clock className="h-3 w-3" />
                      {group.lastRun}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/20">
                      <Zap className="h-3 w-3" />
                      {group.executionCount} execucoes
                    </p>
                  </div>
                </div>

                {/* Agent chain */}
                <div className="flex items-center gap-1">
                  {group.agents.map((agent, i) => (
                    <div key={agent.name} className="flex items-center gap-1">
                      <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
                        <div className={`h-2 w-2 rounded-full ${agent.color}`} />
                        <span className="text-xs text-white/60">{agent.name}</span>
                      </div>
                      {i < group.agents.length - 1 && (
                        <span className="mx-1 text-white/15">
                          {group.strategy === "parallel" ? "+" : "\u2192"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
