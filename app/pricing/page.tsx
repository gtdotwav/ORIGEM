"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicAmbient } from "@/components/public/public-ambient";

const PLANS = [
  {
    name: "Free",
    description:
      "Explore a ORIGEM sem compromisso. Ideal para conhecer a plataforma e testar suas possibilidades.",
    price: "$0",
    priceSub: "para sempre",
    features: [
      "2 sessoes ativas",
      "Chat direto com LLM",
      "Decomposicao basica",
      "1 workspace",
      "Historico de 3 dias",
    ],
    cta: "Comecar gratis",
    href: "/dashboard",
    highlight: false,
  },
  {
    name: "Starter",
    description:
      "Para criadores independentes e projetos pessoais que querem ir alem do basico.",
    price: "$12",
    priceSub: "/mes",
    features: [
      "10 sessoes ativas",
      "Chat direto com LLM",
      "Decomposicao intermediaria",
      "3 workspaces",
      "Historico de 30 dias",
      "Execucao assistida basica",
    ],
    cta: "Assinar Starter",
    href: "/checkout?plan=starter",
    highlight: false,
  },
  {
    name: "Pro",
    description:
      "Para profissionais que precisam de chat, agentes e execucao conectados na mesma operacao.",
    price: "$29",
    priceSub: "/mes",
    features: [
      "Sessoes ilimitadas",
      "Execucao multiagente",
      "Decomposicao avancada",
      "Workspaces ilimitados",
      "Historico permanente",
      "Critic para revisao",
      "Suporte prioritario",
    ],
    cta: "Assinar Pro",
    href: "/checkout?plan=pro",
    highlight: true,
  },
  {
    name: "Creator",
    description:
      "Para criadores e equipes que exigem performance maxima e recursos exclusivos.",
    price: "$59",
    priceSub: "/mes",
    features: [
      "Tudo do Pro",
      "Agentes customizados",
      "API de integracao",
      "Prioridade no processamento",
      "Analytics avancado",
      "Suporte dedicado",
    ],
    cta: "Assinar Creator",
    href: "/checkout?plan=creator",
    highlight: false,
  },
  {
    name: "Enterprise",
    description:
      "Para organizacoes que precisam de solucoes customizadas, integracao dedicada e suporte premium.",
    price: "$199+",
    priceSub: "/mes",
    features: [
      "Tudo do Creator",
      "API dedicada",
      "Integracao com sistemas internos",
      "SLA garantido",
      "Onboarding dedicado",
      "Suporte 24/7",
    ],
    cta: "Falar com vendas",
    href: "/checkout?plan=enterprise",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="isolate relative min-h-screen overflow-hidden bg-black text-white">
      <PublicAmbient />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6 md:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/58 backdrop-blur-md transition-all hover:border-white/18 hover:text-white sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
        >
          <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Voltar
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/72 transition-all hover:border-white/18 hover:bg-white/[0.06] hover:text-white"
        >
          Entrar
          <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      <header className="relative z-10 mx-auto max-w-5xl px-4 pt-12 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16 md:px-10">
        <BrandLockup
          size="page"
          align="center"
          eyebrow="Planos de acesso"
          subtitle="Estrutura clara para escalar com a ORIGEM"
          description="Da exploracao individual a orquestracao enterprise, os planos foram organizados para manter a experiencia limpa e proporcional ao seu momento."
          className="mx-auto"
          priority
        />
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
          Planos que acompanham a maturidade da operacao.
        </h1>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:px-10">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.filter((p) => p.name !== "Free").map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[28px] border p-7 backdrop-blur-2xl transition-all sm:p-8 ${
                plan.highlight
                  ? "border-white/16 bg-white/[0.07] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
                  : "border-white/[0.08] bg-white/[0.025]"
              }`}
            >
              {plan.highlight ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-white/16 bg-white/[0.08] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/76 backdrop-blur-md">
                  Mais Popular
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/28">
                    Plano
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                    {plan.name}
                  </h3>
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/36">
                  {plan.priceSub}
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-white/46">{plan.description}</p>

              <div className="mt-7">
                <span className="text-4xl font-semibold tracking-[-0.05em] text-white">
                  {plan.price}
                </span>
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-white/58">
                    <Check className="h-4 w-4 flex-shrink-0 text-white/34" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-all ${
                  plan.highlight
                    ? "bg-white text-black hover:bg-white/92"
                    : "border border-white/10 bg-white/[0.04] text-white/74 hover:border-white/18 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-16 sm:px-6 md:px-10">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-6 text-center backdrop-blur-2xl sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/32">
            Entrada inicial
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            {PLANS[0].name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/46">{PLANS[0].description}</p>
          <div className="mt-5 text-white">
            <span className="text-3xl font-semibold tracking-[-0.04em]">{PLANS[0].price}</span>
            <span className="ml-1.5 text-sm text-white/35">{PLANS[0].priceSub}</span>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {PLANS[0].features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/52"
              >
                {feature}
              </span>
            ))}
          </div>
          <Link
            href={PLANS[0].href}
            className="mt-7 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/74 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-white"
          >
            {PLANS[0].cta}
          </Link>
        </div>
      </section>
    </main>
  );
}
