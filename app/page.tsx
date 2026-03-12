import Link from "next/link";
import {
  Activity,
  ArrowRight,
  LayoutGrid,
  Puzzle,
  Workflow,
  Zap,
} from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicAmbient } from "@/components/public/public-ambient";

const OPERATING_PILLARS = [
  {
    title: "Contexto persistente",
    description: "Workspaces, memoria e objetivos operando como uma unica base legivel.",
  },
  {
    title: "Execucao orquestrada",
    description: "Sessoes, skills e fluxos conectados sem atrito visual nem operacional.",
  },
  {
    title: "Conexao real",
    description: "MCP, ferramentas e dados externos tratados como parte do mesmo sistema.",
  },
];

const ARCHITECTURE_MODULES = [
  {
    icon: LayoutGrid,
    title: "Workspace",
    description:
      "A camada onde contexto, arquivos, personas e memoria institucional permanecem coerentes ao longo da operacao.",
  },
  {
    icon: Workflow,
    title: "Canvas e Orquestra",
    description:
      "O desenho operacional da execucao. Fluxos, etapas, dependencias e visibilidade da cadeia inteira em uma leitura unica.",
  },
  {
    icon: Zap,
    title: "Skills",
    description:
      "Capacidades prontas para rodar tarefas delimitadas. Menos improviso, mais repetibilidade.",
  },
  {
    icon: Puzzle,
    title: "MCP e conectores",
    description:
      "A ponte entre o sistema e suas ferramentas, bancos, APIs e dados locais sem acoplamento desnecessario.",
  },
  {
    icon: Activity,
    title: "Runtime",
    description:
      "Execucao observavel com controle, historico, retries e rastreabilidade do que cada agente fez.",
  },
];

const FEATURED_SKILLS = [
  "Auditoria de codigo",
  "Pesquisa competitiva",
  "Qualificacao de leads",
  "Planejamento de lancamento",
  "Criacao de componentes UI",
  "Analise de metricas",
];

export default function PublicHomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white selection:bg-white/16 selection:text-white">
      <PublicAmbient variant="hero" />

      <nav className="relative z-40 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-white/42">
          <span>ORIGEM</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="hidden text-white/28 sm:block">AI Operating System</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-white/58 sm:gap-4">
          <Link href="#arquitetura" className="hidden transition-colors hover:text-white sm:block">
            Arquitetura
          </Link>
          <Link href="/pricing" className="hidden transition-colors hover:text-white sm:block">
            Planos
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-all hover:border-white/18 hover:bg-white/[0.07]"
          >
            Acessar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <main className="relative z-20">
        <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl flex-col justify-center px-6 pb-20 pt-10 text-center md:px-10">
          <BrandLockup
            size="hero"
            align="center"
            eyebrow="Camada operacional para agentes"
            subtitle="Psychosemantic AI Engine"
            className="mx-auto"
            priority
          />

          <div className="mt-8">
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-[-0.07em] text-white sm:text-6xl md:text-7xl md:leading-[0.95]">
              Contexto, direcao e execucao
              <br className="hidden md:block" /> para agentes de IA.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/50 sm:text-lg">
              Uma superficie unica para operar skills, MCP, sessoes e automacoes com clareza,
              ritmo e controle real da execucao.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-white/92"
            >
              Entrar na plataforma
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#arquitetura"
              className="inline-flex min-w-[210px] items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/78 transition-all hover:border-white/18 hover:bg-white/[0.06] hover:text-white"
            >
              Ver arquitetura
            </Link>
          </div>

          <div className="mt-14 grid gap-3 text-left sm:grid-cols-3">
            {OPERATING_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/34">
                  {pillar.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/52">{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="arquitetura" className="mx-auto max-w-6xl px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/34">
              Arquitetura
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Cinco camadas, uma leitura clara.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/48">
              A plataforma foi organizada para parecer simples mesmo quando a operacao fica
              complexa. Cada camada tem um papel visivel e um limite nitido.
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            {ARCHITECTURE_MODULES.map((module, index) => {
              const Icon = module.icon;

              return (
                <article
                  key={module.title}
                  className={`relative overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.025] p-6 backdrop-blur-xl transition-all hover:border-white/14 hover:bg-white/[0.04] sm:p-8 ${
                    index < 2 ? "lg:col-span-6" : "lg:col-span-4"
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/28">
                        0{index + 1}
                      </p>
                      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                        {module.title}
                      </h3>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                      <Icon className="h-5 w-5 text-white/68" strokeWidth={1.6} />
                    </div>
                  </div>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-white/50">
                    {module.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="skills" className="mx-auto max-w-6xl px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/34">
              Skills
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Capacidades prontas para operar.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/48">
              Em vez de reconstruir processos a cada conversa, a ORIGEM transforma tarefas
              recorrentes em blocos reutilizaveis.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {FEATURED_SKILLS.map((skill, index) => (
              <div
                key={skill}
                className="rounded-[24px] border border-white/8 bg-white/[0.02] p-6 backdrop-blur-xl transition-all hover:border-white/14 hover:bg-white/[0.04]"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/28">
                  Skill 0{index + 1}
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-white">
                  {skill}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/46">
                  Estrutura pronta para rodar com contexto, criterio e padrao visual
                  consistente dentro do ecossistema.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-24 md:px-12">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-10 text-center backdrop-blur-2xl sm:px-10 sm:py-14">
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-white/34">
              Pronto para operar
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Entre no ecossistema ORIGEM.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/48">
              A marca, a interface e a operacao passam a trabalhar na mesma direcao: menos
              ruido, mais precisao.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-w-[210px] items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-white/92"
              >
                Acessar plataforma
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-w-[210px] items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/78 transition-all hover:border-white/18 hover:bg-white/[0.06] hover:text-white"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-20 border-t border-white/6 bg-black/70 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-white/30 md:flex-row md:px-12">
          <span>&copy; {new Date().getFullYear()} ORIGEM AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="transition-colors hover:text-white/72">
              Termos
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white/72">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
