"use client";

import { useState } from "react";
import { Zap, Plus, Search, BookOpen, Fingerprint, GitBranch } from "lucide-react";
import { motion } from "motion/react";
import { LeftToolbar } from "@/components/layout/left-toolbar";

const SKILLS_MARKETPLACE = [
  { id: 1, title: "Auditoria de Projeto", desc: "Varre repositorios em busca de debito tecnico e oportunidades arquiteturais.", level: "Nivel 1", icon: Fingerprint, color: "text-neon-cyan" },
  { id: 2, title: "Qualificacao de Lead", desc: "Avalia intent e maturidade comercial baseada nos registros do seu CRM.", level: "Nivel 2", icon: BookOpen, color: "text-neon-pink" },
  { id: 3, title: "Geracao de Landing Page", desc: "Escreve e compila um React Server Component funcional a partir de um briefing de marketing.", level: "Nivel 3", icon: GitBranch, color: "text-neon-purple" },
  { id: 4, title: "Analise de Metricas", desc: "Consome bancos Postgres e Snowflake e levanta anomalias de funil.", level: "Nivel 2", icon: Zap, color: "text-neon-green" },
  { id: 5, title: "Pesquisa Competitiva", desc: "Agrega features, precificacao e limitacoes de produtos dos sites concorrentes.", level: "Nivel 1", icon: BookOpen, color: "text-neon-orange" },
];

export default function SkillsPage() {
  const [search, setSearch] = useState("");

  const filtered = SKILLS_MARKETPLACE.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl flex-col px-4 pb-[8.5rem] pt-4 md:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-neon-orange" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground/45">
                Biblioteca
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground/90 md:text-4xl">
              Skills
            </h1>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-foreground/50 md:text-[15px]">
              Blocos atômicos e encapsulados. Use skills em chats nativos, orquestre no Canvas,
              desenhe suas versões em código e expanda a autonomia de seus Agentes.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-neon-cyan/20 bg-neon-cyan/10 px-4 py-2 text-[13px] font-medium text-neon-cyan transition-all hover:bg-neon-cyan/20">
              <Plus className="h-4 w-4" />
              Nova Skill
            </button>
          </div>
        </motion.div>
      </div>

      {/* Global Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            placeholder="Buscar por nome, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-foreground/[0.08] bg-black/40 py-2 pl-9 pr-4 text-sm text-foreground/90 backdrop-blur-md outline-none transition-colors hover:bg-black/60 focus:border-foreground/[0.15] focus:bg-black/80"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:pb-0">
          <button className="whitespace-nowrap rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-1.5 text-[11px] font-medium text-foreground/75 hover:bg-foreground/[0.06]">
            Todas
          </button>
          <button className="whitespace-nowrap rounded-lg border border-transparent px-3 py-1.5 text-[11px] font-medium text-foreground/45 hover:bg-foreground/[0.04]">
            Meus Builds
          </button>
          <button className="whitespace-nowrap rounded-lg border border-transparent px-3 py-1.5 text-[11px] font-medium text-foreground/45 hover:bg-foreground/[0.04]">
            Oficiais
          </button>
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((skill) => (
          <div
            key={skill.id}
            className="group relative flex flex-col items-start overflow-hidden rounded-[20px] border border-foreground/[0.06] bg-card/60 p-5 shadow-sm backdrop-blur-2xl transition-all hover:border-foreground/[0.15] hover:bg-card/90"
          >
            {/* Background Accent */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-foreground/[0.01] blur-3xl transition-colors group-hover:bg-foreground/[0.04]" />
            
            <div className="mb-4 flex w-full items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/[0.04] group-hover:bg-foreground/[0.08]">
                <skill.icon className={`h-5 w-5 ${skill.color} opacity-80`} />
              </div>
              <span className="rounded-md border border-foreground/[0.05] bg-background/50 px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-foreground/45">
                {skill.level}
              </span>
            </div>

            <h3 className="mb-1.5 text-base font-medium text-foreground/90">
              {skill.title}
            </h3>
            <p className="mb-6 flex-1 text-[13px] leading-relaxed text-foreground/50">
              {skill.desc}
            </p>

            <div className="flex w-full items-center justify-between border-t border-foreground/[0.04] pt-4">
              <button className="text-[12px] font-medium text-foreground/40 transition-colors hover:text-foreground/80">
                Visualizar Arquitetura
              </button>
              <button className="rounded-md bg-foreground/[0.08] px-3 py-1.5 text-[11px] font-medium text-foreground/85 transition-colors hover:bg-foreground/[0.15]">
                Executar
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-sm text-foreground/40">Nenhuma skill encontrada.</p>
          </div>
        )}
      </motion.div>

      <LeftToolbar />
    </div>
  );
}
