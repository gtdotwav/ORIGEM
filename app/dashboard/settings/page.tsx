"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
            <Settings className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <p className="mt-1 text-sm text-white/40">
              Configuracoes gerais da plataforma
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl">
          <h2 className="mb-2 text-sm font-semibold text-white/80">
            General
          </h2>
          <p className="text-xs text-white/35">
            Application settings will appear here.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl">
          <h2 className="mb-2 text-sm font-semibold text-white/80">
            About ORIGEM
          </h2>
          <p className="text-xs text-white/35">
            Psychosemantic AI Engine — Decompose language into atomic
            meaning.
          </p>
          <p className="mt-1 text-xs text-white/20">
            Version 0.1.0
          </p>
        </div>
      </div>
    </div>
  );
}
