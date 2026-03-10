import Link from "next/link";
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
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_34%),linear-gradient(180deg,#0a0a0a_0%,#030303_56%,#020202_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-8 pt-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/58 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/52">
            ORIGEM
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="max-w-md space-y-5">
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                  Acesso institucional
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  Entre para acessar o ORIGEM.
                </h1>
                <p className="text-sm leading-7 text-white/50">
                  Login e cadastro em uma unica entrada, com fluxo limpo e sessao
                  segura para workspaces, projetos e historico.
                </p>
              </div>

              <div className="space-y-3 text-sm text-white/42">
                <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
                  Acesso centralizado para o ambiente inteiro.
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
                  OAuth segue opcional quando configurado.
                </div>
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

        <p className="text-center text-[11px] leading-6 text-white/30">
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
