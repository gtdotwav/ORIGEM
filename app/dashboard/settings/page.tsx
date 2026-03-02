"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { GradientText } from "@/components/shared/gradient-text";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-bold">
        <GradientText>Settings</GradientText>
      </h1>

      <div className="space-y-4">
        <GlassCard>
          <h2 className="mb-2 text-sm font-semibold text-foreground/80">
            General
          </h2>
          <p className="text-xs text-muted-foreground">
            Application settings will appear here.
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-2 text-sm font-semibold text-foreground/80">
            About ORIGEM
          </h2>
          <p className="text-xs text-muted-foreground">
            Psychosemantic AI Engine — Decompose language into atomic
            meaning.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            Version 0.1.0
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
