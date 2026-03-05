"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LiquidGradientBackground } from "@/components/shared/liquid-gradient-bg";

const PILLARS = [
  {
    title: "Plataforma de Inteligencia",
    text: "Uma infraestrutura onde multiplas inteligencias artificiais convivem e colaboram.",
  },
  {
    title: "Criacao Sem Limites",
    text: "Crie apps, ideias, conteudos e solucoes usando IA como parceira.",
  },
  {
    title: "Evolucao Continua",
    text: "A ORIGEM aprende, evolui e se adapta com cada interacao.",
  },
];

const ECOSYSTEM = [
  "Criadores de Conteudo",
  "Mentores Inteligentes",
  "Desenvolvedores IA",
  "Ferramentas Criativas",
  "Companheiros Digitais",
  "Ambientes de Aprendizado",
];

export default function AboutPage() {
  return (
    <main className="isolate relative min-h-screen bg-[#04070d] text-white">
      <LiquidGradientBackground />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 pt-6 md:px-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition-all hover:border-white/20 hover:text-white/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>

        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="ORIGEM" width={72} height={72} />
          <span className="text-xs font-semibold tracking-[0.25em] text-white/40">
            ORIGEM
          </span>
        </div>
      </nav>

      {/* ════════════════════════════════════════════
          HERO
         ════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto flex min-h-[85vh] max-w-4xl flex-col items-center justify-center px-6 text-center md:px-10">
        <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
          A nova origem
          <br />
          da inteligencia.
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
          ORIGEM e a plataforma onde pessoas e inteligencias artificiais se
          encontram para criar, aprender e expandir possibilidades.
        </p>

        <p className="mt-6 text-sm leading-relaxed text-white/30 md:text-base">
          Nao e apenas uma IA.
          <br />
          E um novo ponto de partida.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-all hover:bg-white/90"
          >
            Explorar ORIGEM
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#visao"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-white/70 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            Conheca a visao
          </a>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          NOSSA VISAO
         ════════════════════════════════════════════ */}
      <section
        id="visao"
        className="relative z-10 mx-auto max-w-3xl px-6 py-32 md:px-10"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/30">
          Nossa visao
        </p>

        <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Acreditamos que a inteligencia pode evoluir.
        </h2>

        <div className="mt-10 space-y-6 text-base leading-[1.8] text-white/50 md:text-lg">
          <p>
            A ORIGEM nasceu da ideia de que a inteligencia artificial nao deve
            apenas responder perguntas — ela deve expandir o potencial humano.
          </p>
          <p>
            Nossa missao e construir um ambiente onde qualquer pessoa possa
            criar, aprender, pensar e resolver problemas com o apoio de
            inteligencias artificiais avancadas.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          O QUE E A ORIGEM — 3 Pillars
         ════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:px-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/30">
          O que e a ORIGEM
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_0_60px_rgba(255,255,255,0.04)] sm:p-10"
            >
              <h3 className="text-xl font-semibold tracking-tight">
                {p.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-white/40">
                {p.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FILOSOFIA
         ════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-32 text-center md:px-10">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          A tecnologia mais poderosa e aquela que amplia o pensamento humano.
        </h2>

        <div className="mx-auto mt-10 max-w-2xl space-y-6 text-base leading-[1.8] text-white/45 md:text-lg">
          <p>
            A ORIGEM foi construida para ser simples na superficie e profunda em
            suas possibilidades.
          </p>
          <p>
            Uma plataforma onde criatividade, conhecimento e inteligencia
            artificial convergem.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          ECOSSISTEMA
         ════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:px-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/30">
          Ecossistema
        </p>

        <div className="mt-14 flex flex-wrap justify-center gap-4">
          {ECOSYSTEM.map((item) => (
            <div
              key={item}
              className="group cursor-default rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-6 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(255,255,255,0.04)]"
            >
              <span className="text-sm font-medium text-white/60 transition-colors group-hover:text-white/90">
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          O FUTURO
         ════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-32 md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/30">
          O futuro
        </p>

        <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Estamos apenas no comeco.
        </h2>

        <div className="mt-10 space-y-6 text-base leading-[1.8] text-white/50 md:text-lg">
          <p>
            A ORIGEM representa o inicio de uma nova era de interacao entre
            humanos e inteligencia artificial.
          </p>
          <p>
            Nos proximos anos, veremos novas formas de criatividade, aprendizado
            e colaboracao emergirem — e a ORIGEM estara no centro dessa
            transformacao.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA FINAL
         ════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-32 pt-16 text-center md:px-10">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] px-8 py-20 backdrop-blur-xl sm:px-16">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Explore o que pode nascer
            <br />
            da inteligencia.
          </h2>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-all hover:bg-white/90"
            >
              Entrar na ORIGEM
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-white/70 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/10 hover:text-white"
            >
              Descobrir mais
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-10 text-center md:px-10">
        <span className="text-xs tracking-[0.2em] text-white/20">
          ORIGEM &mdash; A nova origem da inteligencia.
        </span>
      </footer>
    </main>
  );
}
