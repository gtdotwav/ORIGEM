import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoginShell } from "@/components/auth/login-shell";
import { auth, authEnabled, enabledProviders } from "@/lib/auth";
import { getAuthSetupState } from "@/lib/server/auth/service";

function sanitizeCallbackUrl(input?: string) {
  if (input?.startsWith("/") && !input.startsWith("//")) {
    return input;
  }

  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; setup?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl);

  if (authEnabled && auth) {
    const session = await auth();
    if (session?.user) {
      redirect(callbackUrl);
    }
  }

  const setupState = authEnabled
    ? await getAuthSetupState()
    : {
        bootstrap: false,
        registrationOpen: false,
      };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,#090909_0%,#040404_52%,#020202_100%)]"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-28 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_72%)] blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-8 pt-6 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] shadow-[0_12px_48px_rgba(255,255,255,0.05)]">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.10)_0%,transparent_72%)]"
              />
              <Image src="/logo.png" alt="ORIGEM" width={34} height={34} className="pointer-events-none relative z-10" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/28">
                ORIGEM
              </p>
              <p className="text-sm font-medium text-white/72">Identity Access</p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/58 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="mx-auto flex w-full max-w-[420px] flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/36">
                Camada privada
              </div>

              <div className="mt-7 space-y-4">
                <div className="relative mx-auto h-20 w-20 lg:mx-0">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,transparent_70%)] blur-2xl"
                  />
                  <Image
                    src="/logo.png"
                    alt="ORIGEM"
                    width={80}
                    height={80}
                    className="pointer-events-none relative z-10"
                  />
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-[3.2rem] sm:leading-[1.02]">
                    Entre para continuar no ecossistema ORIGEM.
                  </h1>
                  <p className="text-sm leading-7 text-white/48 sm:text-[15px]">
                    Uma entrada unica para acessar seus workspaces, sessoes, codigo,
                    automacoes e geracao com o contexto da sua operacao.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
                  Sessao segura
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
                  Cadastro e login no mesmo fluxo
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
                  OAuth opcional
                </span>
              </div>
            </div>

            <div className="w-full max-w-xl justify-self-end">
              <LoginShell
                authReady={authEnabled}
                callbackUrl={callbackUrl}
                bootstrap={setupState.bootstrap}
                registrationOpen={setupState.registrationOpen}
                initialMode={setupState.bootstrap ? "sign-up" : "sign-in"}
                initialError={params.error ?? (params.setup === "auth" ? "SessionRequired" : null)}
                providers={enabledProviders}
              />
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] leading-6 text-white/28">
          Ao continuar, voce concorda com os{" "}
          <Link href="/terms" className="text-white/48 underline underline-offset-4">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacy" className="text-white/48 underline underline-offset-4">
            Politica de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
