import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, GithubIcon, BrainCircuit } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="relative w-full bg-background md:h-screen md:overflow-hidden">
      <Particles
        color="#40E0D0"
        quantity={150}
        ease={20}
        size={0.5}
        className="absolute inset-0"
      />
      <div
        aria-hidden
        className="absolute inset-0 isolate -z-10 contain-strict"
      >
        <div className="absolute left-0 top-0 h-[1280px] w-[560px] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,oklch(0.78_0.15_195_/_0.08)_0%,oklch(0.65_0.25_290_/_0.03)_50%,oklch(0.78_0.15_195_/_0.01)_80%)]" />
        <div className="absolute left-0 top-0 h-[1280px] w-[240px] translate-x-[5%] -translate-y-[50%] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.65_0.25_290_/_0.06)_0%,oklch(0.65_0.25_290_/_0.01)_80%,transparent_100%)]" />
        <div className="absolute left-0 top-0 h-[1280px] w-[240px] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.78_0.15_195_/_0.05)_0%,oklch(0.78_0.15_195_/_0.01)_80%,transparent_100%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4">
        <Button
          variant="ghost"
          className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon className="me-1 size-4" />
            Home
          </Link>
        </Button>

        <div className="mx-auto space-y-6 sm:w-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neon-cyan/20 bg-neon-cyan/10">
              <BrainCircuit className="size-5 text-neon-cyan" />
            </div>
            <p className="text-xl font-semibold tracking-tight">ORIGEM</p>
          </div>
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-bold tracking-wide">
              Entre com sua Conta
            </h1>
            <p className="text-base text-muted-foreground">
              Acesse a plataforma ORIGEM para gerenciar seus agentes de IA.
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full border border-white/[0.10] bg-white/[0.06] text-foreground backdrop-blur-sm hover:border-white/[0.15] hover:bg-white/[0.10]"
            >
              <GithubIcon strokeWidth={2.5} className="me-2 size-4" />
              Continuar com GitHub
            </Button>
          </form>
          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            Ao continuar, voce concorda com os termos de uso da plataforma
            ORIGEM.
          </p>
        </div>
      </div>
    </div>
  );
}
