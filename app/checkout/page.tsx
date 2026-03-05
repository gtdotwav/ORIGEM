"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { LiquidGradientBackground } from "@/components/shared/liquid-gradient-bg";

const PLAN_DATA: Record<
  string,
  { name: string; price: string; period: string; features: string[] }
> = {
  starter: {
    name: "Starter",
    price: "$12",
    period: "/mes",
    features: [
      "10 sessoes ativas",
      "Chat direto com LLM",
      "Decomposicao intermediaria",
      "3 workspaces",
      "Historico de 30 dias",
      "Modo 360 basico",
    ],
  },
  pro: {
    name: "Pro",
    price: "$29",
    period: "/mes",
    features: [
      "Sessoes ilimitadas",
      "Modo 360 com agentes reais",
      "Decomposicao avancada",
      "Workspaces ilimitados",
      "Historico permanente",
      "Critic pipeline",
      "Suporte prioritario",
    ],
  },
  creator: {
    name: "Creator",
    price: "$59",
    period: "/mes",
    features: [
      "Tudo do Pro",
      "Agentes customizados",
      "API de integracao",
      "Prioridade no processamento",
      "Analytics avancado",
      "Suporte dedicado",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "$199+",
    period: "/mes",
    features: [
      "Tudo do Creator",
      "API dedicada",
      "Integracao com sistemas internos",
      "SLA garantido",
      "Onboarding dedicado",
      "Suporte 24/7",
    ],
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planKey = searchParams.get("plan") ?? "";
  const plan = PLAN_DATA[planKey];

  const [form, setForm] = useState({
    name: "",
    card: "",
    expiry: "",
    cvc: "",
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!plan) {
    router.replace("/pricing");
    return null;
  }

  function formatCard(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2000);
  }

  const isValid =
    form.name.length > 2 &&
    form.card.replace(/\s/g, "").length === 16 &&
    form.expiry.length === 5 &&
    form.cvc.length >= 3;

  /* ── Success State ── */
  if (success) {
    return (
      <main className="isolate relative flex min-h-screen items-center justify-center bg-background text-foreground">
        <LiquidGradientBackground />

        <div className="relative z-10 mx-auto max-w-md px-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-foreground/20 bg-foreground/[0.08] backdrop-blur-xl">
            <ShieldCheck className="h-10 w-10 text-foreground/80" />
          </div>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight">
            Assinatura confirmada
          </h1>

          <p className="mt-4 text-base text-foreground/50">
            Seu plano <span className="font-medium text-foreground/80">{plan.name}</span> esta
            ativo. Voce ja pode acessar todos os recursos.
          </p>

          <div className="mt-6 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-6 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/40">Plano</span>
              <span className="text-sm font-medium">{plan.name}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-foreground/40">Valor</span>
              <span className="text-sm font-medium">
                {plan.price}
                <span className="text-foreground/30">{plan.period}</span>
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-all hover:bg-foreground/90"
          >
            Ir para o dashboard
          </Link>

          <p className="mt-4 text-xs text-foreground/25">
            Um email de confirmacao foi enviado para sua conta.
          </p>
        </div>
      </main>
    );
  }

  /* ── Checkout Form ── */
  return (
    <main className="isolate relative min-h-screen bg-background text-foreground">
      <LiquidGradientBackground />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6 md:px-10">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[11px] text-foreground/60 backdrop-blur-md transition-all hover:border-foreground/20 hover:text-foreground/80 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
        >
          <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Voltar
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/logo.png"
            alt="ORIGEM"
            width={48}
            height={48}
            className="sm:h-[72px] sm:w-[72px]"
          />
          <span className="text-[10px] font-semibold tracking-[0.25em] text-foreground/40 sm:text-xs">
            ORIGEM
          </span>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16 md:px-10">
        <h1 className="mb-8 text-center text-2xl font-semibold tracking-tight sm:mb-12 sm:text-3xl">
          Finalizar assinatura
        </h1>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] p-6 backdrop-blur-xl sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/30">
                Resumo do pedido
              </p>

              <div className="mt-6">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {plan.name}
                </h2>
                <div className="mt-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-sm text-foreground/30">
                    {plan.period}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-foreground/[0.06] pt-6">
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-xs text-foreground/50"
                    >
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-foreground/30" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 border-t border-foreground/[0.06] pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/40">Total mensal</span>
                  <span className="text-lg font-semibold">{plan.price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] p-6 backdrop-blur-xl sm:p-8"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-foreground/40" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/30">
                  Dados de pagamento
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs text-foreground/40"
                  >
                    Nome no cartao
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-foreground/[0.1] bg-foreground/[0.05] px-4 text-sm text-foreground placeholder:text-foreground/20 focus:border-foreground/25 focus:outline-none focus:ring-1 focus:ring-white/10"
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label
                    htmlFor="card"
                    className="mb-1.5 block text-xs text-foreground/40"
                  >
                    Numero do cartao
                  </label>
                  <input
                    id="card"
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={form.card}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        card: formatCard(e.target.value),
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-foreground/[0.1] bg-foreground/[0.05] px-4 font-mono text-sm tracking-wider text-foreground placeholder:text-foreground/20 focus:border-foreground/25 focus:outline-none focus:ring-1 focus:ring-white/10"
                  />
                </div>

                {/* Expiry + CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expiry"
                      className="mb-1.5 block text-xs text-foreground/40"
                    >
                      Validade
                    </label>
                    <input
                      id="expiry"
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/AA"
                      value={form.expiry}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          expiry: formatExpiry(e.target.value),
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-foreground/[0.1] bg-foreground/[0.05] px-4 font-mono text-sm tracking-wider text-foreground placeholder:text-foreground/20 focus:border-foreground/25 focus:outline-none focus:ring-1 focus:ring-white/10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cvc"
                      className="mb-1.5 block text-xs text-foreground/40"
                    >
                      CVC
                    </label>
                    <input
                      id="cvc"
                      type="text"
                      inputMode="numeric"
                      placeholder="123"
                      maxLength={4}
                      value={form.cvc}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-foreground/[0.1] bg-foreground/[0.05] px-4 font-mono text-sm tracking-wider text-foreground placeholder:text-foreground/20 focus:border-foreground/25 focus:outline-none focus:ring-1 focus:ring-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isValid || processing}
                className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Processando...
                  </span>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Confirmar pagamento
                  </>
                )}
              </button>

              {/* Security note */}
              <p className="mt-4 text-center text-[11px] text-foreground/25">
                <Lock className="mr-1 inline-block h-3 w-3" />
                Pagamento seguro com criptografia de ponta a ponta
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-sm text-foreground/30">Carregando...</div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
