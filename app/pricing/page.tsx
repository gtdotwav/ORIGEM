"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { LiquidGradientBackground } from "@/components/shared/liquid-gradient-bg";

const PLANS = [
  {
    name: "Starter",
    description:
      "Para criadores independentes e projetos pessoais que querem explorar o poder da IA psicossemantica.",
    price: "Gratis",
    priceSub: "para sempre",
    features: [
      "3 sessoes ativas",
      "Chat direto com LLM",
      "Decomposicao basica",
      "1 workspace",
      "Historico de 7 dias",
    ],
    cta: "Comecar agora",
    href: "/dashboard",
    highlight: false,
  },
  {
    name: "Pro",
    description:
      "Para profissionais e equipes que precisam do ecossistema 360 completo com agentes, orquestracao e analise profunda.",
    price: "R$97",
    priceSub: "/mes",
    features: [
      "Sessoes ilimitadas",
      "Modo 360 com agentes reais",
      "Decomposicao avancada",
      "Workspaces ilimitados",
      "Historico permanente",
      "Critic pipeline",
      "Suporte prioritario",
    ],
    cta: "Assinar Pro",
    href: "#",
    highlight: true,
  },
  {
    name: "Enterprise",
    description:
      "Para organizacoes que precisam de solucoes customizadas, integracao dedicada e suporte premium.",
    price: "Custom",
    priceSub: "sob consulta",
    features: [
      "Tudo do Pro",
      "API dedicada",
      "Agentes customizados",
      "Integracao com sistemas internos",
      "SLA garantido",
      "Onboarding dedicado",
      "Suporte 24/7",
    ],
    cta: "Falar com vendas",
    href: "#",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="isolate relative min-h-screen overflow-hidden bg-[#04070d] text-white">
      <LiquidGradientBackground />

      {/* Top bar */}
      <nav className="relative z-10 flex items-center justify-between px-6 pt-6 md:px-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition-all hover:border-white/20 hover:text-white/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>

        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="ORIGEM" width={36} height={36} />
          <span className="text-xs font-semibold tracking-[0.25em] text-white/40">
            ORIGEM
          </span>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 mx-auto max-w-4xl px-6 pt-20 pb-16 text-center md:px-10">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Planos
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/50">
          Solucoes flexiveis de IA psicossemantica para cada etapa do seu
          projeto. Da exploracao individual a orquestracao enterprise.
        </p>
      </header>

      {/* Pricing grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-24 md:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 backdrop-blur-xl transition-all sm:p-10 ${
                plan.highlight
                  ? "border-white/20 bg-white/[0.08] shadow-[0_0_60px_rgba(255,255,255,0.06)]"
                  : "border-white/[0.08] bg-white/[0.03]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/70 backdrop-blur-md">
                  Mais popular
                </div>
              )}

              <h3 className="text-2xl font-semibold tracking-tight">
                {plan.name}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/40">
                {plan.description}
              </p>

              <div className="mt-8">
                <span className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {plan.price}
                </span>
                <span className="ml-2 text-base text-white/30">
                  {plan.priceSub}
                </span>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-white/60"
                  >
                    <Check className="h-4 w-4 flex-shrink-0 text-white/40" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-10 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all ${
                  plan.highlight
                    ? "bg-white text-black hover:bg-white/90"
                    : "border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
