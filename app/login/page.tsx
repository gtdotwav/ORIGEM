import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LoginShell } from "@/components/auth/login-shell";
import { PublicAmbient } from "@/components/public/public-ambient";
import { auth, authEnabled, enabledProviders, previewAccessEnabled } from "@/lib/auth";
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
      <PublicAmbient />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-8 pt-6 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/58 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white/36">
            Acesso seguro
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-2xl">
            <div className="mx-auto max-w-xl text-center">
              <BrandLockup
                size="page"
                align="center"
                eyebrow="Camada privada"
                subtitle="Identity Access"
                description="Uma entrada unica para seus workspaces, sessoes, codigo, automacoes e geracao com o contexto da sua operacao."
                className="mx-auto"
                priority
              />

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
                  Sessao segura
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
                  Cadastro e login no mesmo fluxo
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
                  OAuth opcional
                </span>
                {authEnabled && previewAccessEnabled ? (
                  <span className="rounded-full border border-[rgba(208,186,143,0.18)] bg-[rgba(208,186,143,0.06)] px-3 py-1.5 text-[11px] text-[#e0cfad]/72">
                    Preview sem credenciais
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mx-auto mt-10 w-full max-w-xl">
              <LoginShell
                authReady={authEnabled}
                previewAccessAvailable={authEnabled && previewAccessEnabled}
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
