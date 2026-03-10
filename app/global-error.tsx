"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorReference = error.digest ?? error.name;

  return (
    <html lang="pt-BR">
      <body className="bg-black text-white">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-xl font-semibold">Erro critico</h2>
          <p className="max-w-md text-sm text-white/60">
            A aplicacao encontrou um erro inesperado. Tente recarregar a pagina.
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-white/30">
            Ref {errorReference}
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium transition-colors hover:bg-white/20"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
