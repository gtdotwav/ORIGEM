import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bot, Zap, Puzzle, Activity, LayoutGrid, Workflow, Layers, Terminal } from "lucide-react";

export default function PublicHomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white selection:bg-neon-cyan/20 selection:text-neon-cyan">
      {/* Background Ambience */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_40%),linear-gradient(180deg,#050505_0%,#000000_100%)]"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,255,0.03)_0%,transparent_60%)] blur-3xl"
      />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] shadow-[0_12px_48px_rgba(255,255,255,0.05)]">
            <Image src="/logo.png" alt="ORIGEM Logo" width={24} height={24} className="relative z-10" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              ORIGEM
            </p>
            <p className="text-xs font-medium text-white/80">Psychosemantic Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-white/60 transition-colors hover:text-white">
            Acessar Plataforma
          </Link>
          <Link
            href="/login"
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-white/[0.08]"
          >
            Comecar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-20 mx-auto max-w-7xl px-6 pt-24 pb-16 text-center md:px-12 md:pt-32 lg:pt-40">
        <div className="mx-auto max-w-4xl space-y-8 animate-appear-stagger">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-white/50 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-cyan opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-cyan"></span>
            </span>
            A Camada de Operacao para Agentes de IA
          </div>

          <h1 className="text-display tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 sm:text-6xl md:text-7xl">
            Crie, orquestre e escale <br className="hidden md:block" />
            <span className="text-white">Agentes de IA.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/50 sm:text-xl">
            ORIGEM é a infraestrutura completa para integrar contexto, skills, MCP e automações num canvas invisível que processa linguagem em significado atômico.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-[13px] font-medium tracking-wide text-white/40 uppercase sm:gap-12">
            <span className="flex items-center gap-2"><div className="h-px w-6 bg-white/20" />Entender</span>
            <span className="flex items-center gap-2"><div className="h-px w-6 bg-white/20" />Orquestrar</span>
            <span className="flex items-center gap-2"><div className="h-px w-6 bg-white/20" />Executar</span>
            <span className="flex items-center gap-2"><div className="h-px w-6 bg-white/20" />Reutilizar</span>
          </div>
        </div>

        {/* 5 Modules Diagram Section */}
        <div className="mx-auto mt-32 max-w-6xl animate-appear-stagger">
          <div className="mb-12 text-left">
            <h2 className="text-title-lg text-white">Arquitetura Modular</h2>
            <p className="text-sm text-white/50">Separação estrita de infraestrutura para poder máximo.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: LayoutGrid, title: "Workspace", desc: "Onde vive o contexto de negócio, arquivos, threads, personas, memória e objetivos institucionais." },
              { icon: Workflow, title: "Canvas / Orquestra", desc: "Ambiente visual onde fluxos são desenhados, encadeando etapas e organizando os agentes de forma visual." },
              { icon: Zap, title: "Skills", desc: "Blocos reutilizáveis de capacidade: pesquisar, resumir, qualificar lead ou auditar código. A ponte entre o chat e a esteira operacional." },
              { icon: Puzzle, title: "Connectors / MCP", desc: "Ponte agnóstica de conexão com dados locais, bancos de dados corporativos, ferramentas e APIs externas." },
              { icon: Activity, title: "Runtime / Sessions", desc: "Execução controlada, logs observados, custos traçados, roteamento de modelos e retries de segurança." },
            ].map((mod, i) => (
              <div key={i} className="group relative flex flex-col items-start justify-between overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04]">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/[0.02] blur-3xl transition-colors group-hover:bg-neon-cyan/10" />
                <mod.icon className="mb-6 h-8 w-8 text-white/40 transition-colors group-hover:text-neon-cyan" strokeWidth={1.5} />
                <div>
                  <h3 className="mb-2 text-base font-semibold text-white/90">{mod.title}</h3>
                  <p className="text-[13px] leading-relaxed text-white/50">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Section */}
        <div className="mx-auto mt-40 max-w-6xl animate-appear-stagger pb-40">
          <div className="mb-12 text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-3">Skills da ORIGEM</h2>
            <p className="text-lg text-white/50 max-w-2xl">
              Não comece do zero. Execute tarefas delimitadas e parametrizadas. Skills rodam em chats, canvases ou agendadas. Transforme uma ferramenta em um bloco atômico.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[
              { title: "Auditoria de Código", tag: "Engenharia" },
              { title: "Geração de Landing Page", tag: "Marketing" },
              { title: "Qualificação de Leads", tag: "Vendas" },
              { title: "Planejamento de Lançamento", tag: "Produto" },
              { title: "Pesquisa Competitiva", tag: "Business" },
              { title: "Atendimento C/ Base Conhecimento", tag: "CX" },
              { title: "Análise de Métricas", tag: "Dados" },
              { title: "Extração de Requisitos", tag: "Sistemas" },
              { title: "Social Listening", tag: "Mídias" },
              { title: "Criação de Componentes UI", tag: "Design" },
            ].map((skill, i) => (
              <div key={i} className="flex h-full min-h-32 flex-col justify-between rounded-2xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:border-white/10 hover:bg-white/[0.03]">
                <span className="text-[10px] font-medium tracking-wider text-white/30 uppercase">{skill.tag}</span>
                <span className="text-[14px] font-medium leading-snug text-white/80">{skill.title}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-xs text-white/30 md:px-12">
          <span>&copy; {new Date().getFullYear()} ORIGEM AI. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white/80">Termos</Link>
            <Link href="/privacy" className="hover:text-white/80">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
