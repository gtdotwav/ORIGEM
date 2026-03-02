"use client";

import Link from "next/link";
import {
  Orbit,
  Plus,
  Maximize2,
  Clock,
  Layers,
  GitFork,
} from "lucide-react";

const SAMPLE_CANVASES = [
  {
    id: "canvas-1",
    title: "Auth System Architecture",
    nodeCount: 14,
    edgeCount: 18,
    agentCount: 5,
    lastEdited: "5 min atras",
    preview: {
      inputNode: "OAuth2 + refresh tokens",
      agents: ["Coder", "Planner", "Critic"],
    },
  },
  {
    id: "canvas-2",
    title: "Landing Page Design",
    nodeCount: 9,
    edgeCount: 11,
    agentCount: 3,
    lastEdited: "1h atras",
    preview: {
      inputNode: "Modern landing with animations",
      agents: ["Designer", "Coder"],
    },
  },
  {
    id: "canvas-3",
    title: "Data Pipeline Flow",
    nodeCount: 22,
    edgeCount: 28,
    agentCount: 6,
    lastEdited: "2 dias atras",
    preview: {
      inputNode: "Real-time ETL processing",
      agents: ["Planner", "Coder", "Researcher"],
    },
  },
];

export default function SpacePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <Orbit className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Space</h1>
              <p className="mt-1 text-sm text-white/40">
                Canvas infinito para orquestracao visual — nodes, agentes e fluxos em tempo real
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/orchestra/new"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 backdrop-blur-sm transition-all hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Novo Canvas
          </Link>
        </div>
      </div>

      {/* New canvas hero */}
      <Link
        href="/dashboard/orchestra/new"
        className="group mb-6 flex items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-neutral-900/40 py-16 backdrop-blur-sm transition-all hover:border-blue-400/20 hover:bg-blue-400/[0.03]"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] transition-all group-hover:border-blue-400/20 group-hover:bg-blue-400/10">
            <Orbit className="h-8 w-8 text-white/20 transition-colors group-hover:text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/50 transition-colors group-hover:text-white/80">
              Criar canvas em branco
            </p>
            <p className="mt-1 text-xs text-white/25">
              Comece com um canvas vazio e adicione nodes manualmente
            </p>
          </div>
        </div>
      </Link>

      {/* Recent canvases */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-white/50">Canvases recentes</h2>
        <span className="text-[10px] text-white/20">
          {SAMPLE_CANVASES.length} canvases
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_CANVASES.map((canvas) => (
          <Link
            key={canvas.id}
            href={`/dashboard/orchestra/${canvas.id}`}
            className="group rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-neutral-900/70"
          >
            {/* Canvas preview placeholder */}
            <div className="mb-4 flex h-28 items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.02]">
              <div className="flex items-center gap-3 text-white/15">
                {/* Mini node visualization */}
                <div className="flex flex-col items-center gap-1">
                  <div className="h-5 w-14 rounded border border-cyan-400/20 bg-cyan-400/10" />
                  <div className="h-px w-px" />
                  <div className="flex gap-2">
                    <div className="h-4 w-4 rounded-full border border-green-400/20 bg-green-400/10" />
                    <div className="h-4 w-4 rounded-full border border-purple-400/20 bg-purple-400/10" />
                    <div className="h-4 w-4 rounded-full border border-orange-400/20 bg-orange-400/10" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title + expand */}
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-sm font-semibold text-white/90">
                {canvas.title}
              </h3>
              <Maximize2 className="h-3.5 w-3.5 text-white/15 transition-colors group-hover:text-white/40" />
            </div>

            {/* Agent pills */}
            <div className="mb-3 flex flex-wrap gap-1">
              {canvas.preview.agents.map((agent) => (
                <span
                  key={agent}
                  className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-white/35"
                >
                  {agent}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 border-t border-white/[0.05] pt-3">
              <span className="flex items-center gap-1 text-[10px] text-white/25">
                <Layers className="h-3 w-3" />
                {canvas.nodeCount} nodes
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/25">
                <GitFork className="h-3 w-3" />
                {canvas.edgeCount} edges
              </span>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-white/20">
                <Clock className="h-3 w-3" />
                {canvas.lastEdited}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
