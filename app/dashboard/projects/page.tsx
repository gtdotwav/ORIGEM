"use client";

import {
  FolderKanban,
  Plus,
  MessageSquare,
  Bot,
  Clock,
  MoreHorizontal,
} from "lucide-react";

const SAMPLE_PROJECTS = [
  {
    id: "prj-1",
    name: "E-commerce Platform",
    description: "Sistema completo de e-commerce com checkout, pagamentos e gestao de estoque",
    sessionCount: 8,
    agentCount: 12,
    lastActive: "Agora",
    status: "active" as const,
    color: "bg-cyan-400",
  },
  {
    id: "prj-2",
    name: "AI Research Paper",
    description: "Pesquisa sobre modelos de linguagem e decomposicao semantica",
    sessionCount: 4,
    agentCount: 6,
    lastActive: "2h atras",
    status: "active" as const,
    color: "bg-purple-400",
  },
  {
    id: "prj-3",
    name: "Mobile App Redesign",
    description: "Redesign completo da interface mobile com novo design system",
    sessionCount: 3,
    agentCount: 5,
    lastActive: "1 dia atras",
    status: "paused" as const,
    color: "bg-orange-400",
  },
  {
    id: "prj-4",
    name: "Data Pipeline",
    description: "Pipeline de ETL para processamento de dados em tempo real",
    sessionCount: 6,
    agentCount: 8,
    lastActive: "3 dias atras",
    status: "completed" as const,
    color: "bg-green-400",
  },
];

const STATUS_STYLES = {
  active: "text-green-400 bg-green-400/10",
  paused: "text-yellow-400 bg-yellow-400/10",
  completed: "text-white/40 bg-white/[0.06]",
};

const STATUS_LABELS = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluido",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <FolderKanban className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Projetos</h1>
              <p className="mt-1 text-sm text-white/40">
                Organize sessoes e workflows em projetos — agrupe conversas, agentes e outputs
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 backdrop-blur-sm transition-all hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Project grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SAMPLE_PROJECTS.map((project) => (
          <div
            key={project.id}
            className="group rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-neutral-900/70"
          >
            {/* Top row */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${project.color}`}
                />
                <h3 className="text-sm font-semibold text-white/90">
                  {project.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    STATUS_STYLES[project.status]
                  }`}
                >
                  {STATUS_LABELS[project.status]}
                </span>
                <button
                  type="button"
                  className="rounded-lg p-1 text-white/20 opacity-0 transition-all hover:bg-white/[0.06] hover:text-white/50 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-white/35">
              {project.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 border-t border-white/[0.05] pt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                <MessageSquare className="h-3 w-3" />
                {project.sessionCount} sessoes
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                <Bot className="h-3 w-3" />
                {project.agentCount} agentes
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-white/25">
                <Clock className="h-3 w-3" />
                {project.lastActive}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
