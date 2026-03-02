"use client";

import {
  Bot,
  Code2,
  Pen,
  Search,
  Palette,
  ShieldAlert,
  Map,
  Sparkles,
  Zap,
  Settings2,
} from "lucide-react";

const AGENT_TEMPLATES = [
  {
    id: "coder",
    name: "Coder",
    role: "Engenheiro de Software",
    description:
      "Gera, refatora e depura codigo. Domina multiplas linguagens e frameworks.",
    icon: Code2,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/20",
    glowColor: "hover:shadow-[0_0_30px_oklch(0.78_0.2_145/0.12)]",
    capabilities: ["Code generation", "Debugging", "Refactoring", "Testing"],
    outputTypes: ["code", "text"],
    activeInstances: 3,
  },
  {
    id: "writer",
    name: "Writer",
    role: "Redator & Copywriter",
    description:
      "Produz textos, documentacao, artigos e conteudo criativo com precisao.",
    icon: Pen,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
    glowColor: "hover:shadow-[0_0_30px_oklch(0.65_0.25_290/0.12)]",
    capabilities: ["Content writing", "Documentation", "Copywriting", "Editing"],
    outputTypes: ["text", "html"],
    activeInstances: 1,
  },
  {
    id: "researcher",
    name: "Researcher",
    role: "Analista de Pesquisa",
    description:
      "Investiga, compara e sintetiza informacoes de multiplas fontes e dominios.",
    icon: Search,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/20",
    glowColor: "hover:shadow-[0_0_30px_oklch(0.78_0.15_195/0.12)]",
    capabilities: ["Research", "Analysis", "Comparison", "Synthesis"],
    outputTypes: ["text", "thought"],
    activeInstances: 2,
  },
  {
    id: "designer",
    name: "Designer",
    role: "Designer Visual & UX",
    description:
      "Cria interfaces, layouts, design systems e prototipos visuais com HTML/CSS.",
    icon: Palette,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/20",
    glowColor: "hover:shadow-[0_0_30px_oklch(0.75_0.18_55/0.12)]",
    capabilities: ["UI Design", "Prototyping", "HTML/CSS", "Design Systems"],
    outputTypes: ["html", "code", "image"],
    activeInstances: 0,
  },
  {
    id: "critic",
    name: "Critic",
    role: "Revisor & Avaliador",
    description:
      "Avalia qualidade, identifica problemas e sugere melhorias em outputs de outros agentes.",
    icon: ShieldAlert,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    borderColor: "border-pink-400/20",
    glowColor: "hover:shadow-[0_0_30px_oklch(0.70_0.22_340/0.12)]",
    capabilities: ["Code review", "Quality check", "Security audit", "Feedback"],
    outputTypes: ["text", "thought"],
    activeInstances: 1,
  },
  {
    id: "planner",
    name: "Planner",
    role: "Estrategista & Planejador",
    description:
      "Planeja arquiteturas, define estrategias e cria roadmaps de execucao.",
    icon: Map,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    glowColor: "hover:shadow-[0_0_30px_oklch(0.65_0.2_250/0.12)]",
    capabilities: ["Architecture", "Strategy", "Roadmaps", "Task breakdown"],
    outputTypes: ["text", "thought"],
    activeInstances: 0,
  },
  {
    id: "synthesizer",
    name: "Synthesizer",
    role: "Sintetizador Final",
    description:
      "Combina outputs de multiplos agentes em uma resposta coesa e unificada.",
    icon: Sparkles,
    color: "text-white/80",
    bgColor: "bg-white/[0.06]",
    borderColor: "border-white/20",
    glowColor: "hover:shadow-[0_0_30px_oklch(0.95_0.02_270/0.08)]",
    capabilities: ["Aggregation", "Merging", "Summarization", "Formatting"],
    outputTypes: ["text", "html", "code"],
    activeInstances: 0,
  },
];

export default function AgentsPage() {
  const totalActive = AGENT_TEMPLATES.reduce(
    (sum, a) => sum + a.activeInstances,
    0
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <Bot className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Agentes</h1>
              <p className="mt-1 text-sm text-white/40">
                Configure e gerencie agentes especializados — 7 templates, {totalActive} instancias ativas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_TEMPLATES.map((agent) => (
          <div
            key={agent.id}
            className={`group rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-neutral-900/70 ${agent.glowColor}`}
          >
            {/* Icon + name */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${agent.borderColor} ${agent.bgColor}`}
                >
                  <agent.icon className={`h-5 w-5 ${agent.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90">
                    {agent.name}
                  </h3>
                  <p className="text-[10px] text-white/35">{agent.role}</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-white/15 transition-colors hover:bg-white/[0.06] hover:text-white/40"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-white/35">
              {agent.description}
            </p>

            {/* Capabilities */}
            <div className="mb-4 flex flex-wrap gap-1">
              {agent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/30"
                >
                  {cap}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
              <div className="flex items-center gap-1.5">
                <Zap className={`h-3 w-3 ${agent.activeInstances > 0 ? agent.color : "text-white/15"}`} />
                <span className="text-[11px] text-white/30">
                  {agent.activeInstances > 0
                    ? `${agent.activeInstances} ativa${agent.activeInstances > 1 ? "s" : ""}`
                    : "Inativo"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {agent.outputTypes.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-white/[0.04] px-1 py-0.5 text-[8px] uppercase text-white/25"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
