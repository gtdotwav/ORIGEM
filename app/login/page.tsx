import Link from "next/link";
import { redirect } from "next/navigation";
import { BrainCircuit, ChevronLeft, Lock, Shield } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { signIn, authEnabled, enabledProviders } from "@/lib/auth";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function LoginPage() {
  if (!authEnabled) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      <Particles
        color="#40E0D0"
        quantity={120}
        ease={25}
        size={0.4}
        className="absolute inset-0"
      />

      {/* Background gradients */}
      <div aria-hidden className="absolute inset-0 isolate -z-10 contain-strict">
        <div className="absolute left-1/2 top-0 h-[800px] w-[600px] -translate-x-1/2 -translate-y-[40%] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.72_0.035_195_/_0.08)_0%,oklch(0.58_0.008_300_/_0.04)_40%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[400px] translate-y-[30%] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.58_0.008_300_/_0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[400px] translate-y-[30%] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.72_0.035_195_/_0.04)_0%,transparent_70%)]" />
      </div>

      {/* Top nav */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 text-foreground/50 transition-colors hover:text-foreground/80">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Home</span>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-cyan/20 bg-neon-cyan/10">
            <BrainCircuit className="h-4 w-4 text-neon-cyan" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground/80">ORIGEM</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[420px]">
          {/* Glass card */}
          <div className="rounded-2xl border border-foreground/[0.08] bg-card/60 p-8 shadow-2xl shadow-black/20 backdrop-blur-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10">
                <BrainCircuit className="h-7 w-7 text-neon-cyan" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Acesse sua conta
              </h1>
              <p className="mt-1.5 text-sm text-foreground/40">
                Entre na plataforma ORIGEM para orquestrar seus agentes de IA
              </p>
            </div>

            {/* Provider buttons */}
            <div className="space-y-3">
              {enabledProviders.google && (
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/dashboard" });
                  }}
                >
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-foreground/[0.10] bg-white/[0.95] text-sm font-medium text-gray-800 transition-all hover:bg-white hover:shadow-lg hover:shadow-white/5"
                  >
                    <GoogleIcon className="h-5 w-5" />
                    Continuar com Google
                  </button>
                </form>
              )}

              {enabledProviders.github && (
                <form
                  action={async () => {
                    "use server";
                    await signIn("github", { redirectTo: "/dashboard" });
                  }}
                >
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-foreground/[0.12] bg-foreground/[0.06] text-sm font-medium text-foreground/80 backdrop-blur-sm transition-all hover:border-foreground/[0.18] hover:bg-foreground/[0.10] hover:text-foreground"
                  >
                    <GitHubIcon className="h-5 w-5" />
                    Continuar com GitHub
                  </button>
                </form>
              )}
            </div>

            {/* Security note */}
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-3.5 py-3">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-cyan/60" />
              <p className="text-[11px] leading-relaxed text-foreground/30">
                Suas credenciais sao protegidas com criptografia AES-256-GCM.
                Nunca armazenamos suas senhas.
              </p>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-foreground/[0.06]" />
              <span className="text-[10px] uppercase tracking-widest text-foreground/20">
                plataforma segura
              </span>
              <div className="h-px flex-1 bg-foreground/[0.06]" />
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "10+ Modelos", sub: "IA" },
                { label: "MCP", sub: "Conectores" },
                { label: "Workspaces", sub: "Ilimitados" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-lg border border-foreground/[0.05] bg-foreground/[0.02] px-2 py-2 text-center"
                >
                  <p className="text-[10px] font-medium text-foreground/50">
                    {f.label}
                  </p>
                  <p className="text-[9px] text-foreground/25">{f.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <p className="mt-5 text-center text-[11px] leading-relaxed text-foreground/25">
            Ao continuar, voce concorda com os{" "}
            <Link href="/terms" className="text-foreground/40 underline underline-offset-2 transition-colors hover:text-foreground/60">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-foreground/40 underline underline-offset-2 transition-colors hover:text-foreground/60">
              Politica de Privacidade
            </Link>{" "}
            da ORIGEM.
          </p>
        </div>
      </div>
    </div>
  );
}
