"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-8 py-6">
        <h2 className="text-lg font-semibold text-foreground/90">
          Algo deu errado
        </h2>
        <p className="mt-2 max-w-md text-sm text-foreground/55">
          Ocorreu um erro inesperado. Tente novamente ou volte para o dashboard.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-foreground/20 bg-foreground/5 px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/10"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
