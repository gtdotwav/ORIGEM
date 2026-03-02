"use client";

import {
  GitBranch,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";

const PIPELINE_STAGES = [
  { key: "intake", label: "Intake" },
  { key: "decomposing", label: "Decomposicao" },
  { key: "routing", label: "Roteamento" },
  { key: "spawning", label: "Spawn" },
  { key: "executing", label: "Execucao" },
  { key: "branching", label: "Branching" },
  { key: "aggregating", label: "Agregacao" },
];

const SAMPLE_FLOWS = [
  {
    id: "flow-1",
    name: "Full Decomposition Pipeline",
    description: "Pipeline completo: chat \u2192 decompose \u2192 route \u2192 spawn \u2192 execute \u2192 branch \u2192 aggregate",
    currentStage: "executing",
    stageIndex: 4,
    status: "running" as const,
    agentCount: 4,
    progress: 65,
    duration: "2m 34s",
    createdAt: "3 min atras",
  },
  {
    id: "flow-2",
    name: "Quick Analysis",
    description: "Pipeline rapido: intake \u2192 decompose \u2192 single agent execution",
    currentStage: "complete",
    stageIndex: 7,
    status: "completed" as const,
    agentCount: 1,
    progress: 100,
    duration: "45s",
    createdAt: "15 min atras",
  },
  {
    id: "flow-3",
    name: "Multi-Agent Research",
    description: "Pipeline de pesquisa com multiplos agentes em paralelo e consenso",
    currentStage: "aggregating",
    stageIndex: 6,
    status: "running" as const,
    agentCount: 3,
    progress: 88,
    duration: "4m 12s",
    createdAt: "5 min atras",
  },
  {
    id: "flow-4",
    name: "Code Generation Flow",
    description: "Pipeline de geracao de codigo: planner \u2192 coder \u2192 critic \u2192 synthesizer",
    currentStage: "error",
    stageIndex: 4,
    status: "error" as const,
    agentCount: 4,
    progress: 52,
    duration: "1m 58s",
    createdAt: "30 min atras",
  },
];

const STATUS_CONFIG = {
  running: {
    icon: Play,
    label: "Em execucao",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/20",
  },
  completed: {
    icon: CheckCircle2,
    label: "Concluido",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
  },
  paused: {
    icon: Pause,
    label: "Pausado",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/20",
  },
  error: {
    icon: AlertCircle,
    label: "Erro",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/20",
  },
};

export default function FlowsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <GitBranch className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Fluxos</h1>
              <p className="mt-1 text-sm text-white/40">
                Pipelines de execucao e automacao — acompanhe cada estagio em tempo real
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 backdrop-blur-sm transition-all hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Novo Fluxo
          </button>
        </div>
      </div>

      {/* Pipeline stages legend */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-xl border border-white/[0.05] bg-neutral-900/60 px-4 py-3 backdrop-blur-xl">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-1">
            <span className="whitespace-nowrap rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-white/35">
              {stage.label}
            </span>
            {i < PIPELINE_STAGES.length - 1 && (
              <ArrowRight className="h-3 w-3 shrink-0 text-white/10" />
            )}
          </div>
        ))}
      </div>

      {/* Flows */}
      <div className="space-y-3">
        {SAMPLE_FLOWS.map((flow) => {
          const statusCfg = STATUS_CONFIG[flow.status];
          return (
            <div
              key={flow.id}
              className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-neutral-900/70"
            >
              {/* Top row */}
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white/90">
                    {flow.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/30">
                    {flow.description}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusCfg.borderColor} ${statusCfg.bgColor} ${statusCfg.color}`}
                >
                  <statusCfg.icon className="h-3 w-3" />
                  {statusCfg.label}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-3 mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-white/30">Progresso</span>
                  <span className="text-[10px] text-white/40">
                    {flow.progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      flow.status === "error"
                        ? "bg-red-400/60"
                        : flow.status === "completed"
                        ? "bg-blue-400/60"
                        : "bg-green-400/60"
                    }`}
                    style={{ width: `${flow.progress}%` }}
                  />
                </div>
              </div>

              {/* Stage dots */}
              <div className="mb-4 flex items-center gap-1">
                {PIPELINE_STAGES.map((stage, i) => {
                  const isPast = i < flow.stageIndex;
                  const isCurrent = i === flow.stageIndex;
                  return (
                    <div key={stage.key} className="flex items-center gap-1">
                      <div
                        className={`h-2 w-2 rounded-full transition-all ${
                          isPast
                            ? "bg-blue-400/60"
                            : isCurrent
                            ? flow.status === "error"
                              ? "bg-red-400"
                              : "bg-green-400 shadow-[0_0_6px_oklch(0.78_0.2_145/0.4)]"
                            : "bg-white/[0.08]"
                        }`}
                        title={stage.label}
                      />
                      {i < PIPELINE_STAGES.length - 1 && (
                        <div
                          className={`h-px w-4 ${
                            isPast ? "bg-blue-400/30" : "bg-white/[0.06]"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer stats */}
              <div className="flex items-center gap-4 border-t border-white/[0.05] pt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <Zap className="h-3 w-3" />
                  {flow.agentCount} agentes
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <Clock className="h-3 w-3" />
                  {flow.duration}
                </span>
                <span className="ml-auto text-[10px] text-white/20">
                  {flow.createdAt}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
