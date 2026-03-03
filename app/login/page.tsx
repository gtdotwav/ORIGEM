"use client";

import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4"
      style={{
        backgroundImage: "url('/images/background.png')",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/30" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 backdrop-blur-xl">
        <div className="mb-4 inline-flex items-center gap-2 text-neon-cyan">
          <LogIn className="h-4 w-4" />
          <span className="text-sm font-medium">Login</span>
        </div>

        <h1 className="text-xl font-semibold text-white">Acesso da Plataforma</h1>
        <p className="mt-2 text-sm text-white/55">
          Fluxo de autenticacao em preparacao. Use o acesso atual para continuar
          no dashboard.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
        >
          Ir para Dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}
