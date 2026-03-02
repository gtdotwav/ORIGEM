"use client";

import { Plus, Orbit, Zap, Brain } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { GradientText } from "@/components/shared/gradient-text";
import { CosmicBackground } from "@/components/shared/cosmic-background";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-8">
      <CosmicBackground starCount={100} />

      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          <GradientText variant="primary">ORIGEM</GradientText>
        </h1>
        <p className="mb-8 max-w-md text-sm text-muted-foreground">
          Decompose language into atomic meaning. Orchestrate AI agents
          on an infinite canvas. Return to the psychosemantic origin.
        </p>

        <Button
          size="lg"
          className="mb-12 gap-2 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 border border-neon-cyan/20"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Button>

        {/* Feature cards */}
        <div className="grid w-full grid-cols-3 gap-4">
          <GlassCard neon="cyan" hover className="text-center">
            <Brain className="mx-auto mb-2 h-6 w-6 text-neon-cyan" />
            <h3 className="mb-1 text-xs font-semibold text-foreground/80">
              Decompose
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Atomic linguistic analysis with semantic weight and polarity
            </p>
          </GlassCard>

          <GlassCard neon="purple" hover className="text-center">
            <Zap className="mx-auto mb-2 h-6 w-6 text-neon-purple" />
            <h3 className="mb-1 text-xs font-semibold text-foreground/80">
              Orchestrate
            </h3>
            <p className="text-[10px] text-muted-foreground">
              AI agents work in parallel, spawning and branching
            </p>
          </GlassCard>

          <GlassCard neon="green" hover className="text-center">
            <Orbit className="mx-auto mb-2 h-6 w-6 text-neon-green" />
            <h3 className="mb-1 text-xs font-semibold text-foreground/80">
              Visualize
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Infinite canvas with live agent nodes and output branches
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
