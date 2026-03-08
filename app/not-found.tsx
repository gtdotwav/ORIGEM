import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-2xl border border-foreground/[0.08] bg-card/70 px-8 py-6 backdrop-blur-xl">
        <p className="text-5xl font-bold text-foreground/20">404</p>
        <h2 className="mt-2 text-lg font-semibold text-foreground/90">
          Pagina nao encontrada
        </h2>
        <p className="mt-1 text-sm text-foreground/55">
          O recurso solicitado nao existe ou foi movido.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
