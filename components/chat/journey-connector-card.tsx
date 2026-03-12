"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleDashed, Milestone } from "lucide-react";
import { JOURNEY_STEPS, type JourneyStepDescriptor } from "@/lib/journey";
import { useRuntimeStore } from "@/stores/runtime-store";

interface JourneyConnectorCardProps {
  sessionId: string;
  onStepOpen?: (step: JourneyStepDescriptor) => void;
}

export function JourneyConnectorCard({
  sessionId,
  onStepOpen,
}: JourneyConnectorCardProps) {
  const router = useRouter();
  const runtime = useRuntimeStore((state) => state.sessions[sessionId]);
  const markJourneyStepVisited = useRuntimeStore(
    (state) => state.markJourneyStepVisited
  );

  const journeyCursor = runtime?.journeyCursor ?? 0;
  const visitedSet = useMemo(
    () => new Set(runtime?.journeyVisited ?? []),
    [runtime?.journeyVisited]
  );
  const nextStep = journeyCursor < JOURNEY_STEPS.length
    ? JOURNEY_STEPS[journeyCursor]
    : null;

  const openNextStep = () => {
    if (!nextStep) {
      const finalStep = JOURNEY_STEPS[JOURNEY_STEPS.length - 1];
      router.push(finalStep.href(sessionId));
      return;
    }

    markJourneyStepVisited(sessionId, nextStep.key);
    onStepOpen?.(nextStep);
    router.push(nextStep.href(sessionId));
  };

  return (
    <div className="mt-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-3">
      <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-neon-cyan">
        <Milestone className="h-3.5 w-3.5" />
        Jornada conectada da execucao
      </div>

      <p className="mb-2 text-xs text-foreground/65">
        Siga a trilha recomendada para transformar a conversa em execucao: Contexto → Agentes → Projeto → Grupos → Fluxos → Orquestra.
      </p>

      <div className="mb-3 grid gap-1.5">
        {JOURNEY_STEPS.map((step, index) => {
          const isVisited = visitedSet.has(step.key);
          const isCurrent = nextStep?.key === step.key;

          return (
            <div
              key={step.key}
              className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-[11px] ${
                isCurrent
                  ? "border-neon-cyan/35 bg-neon-cyan/10 text-neon-cyan"
                  : isVisited
                    ? "border-green-400/25 bg-green-400/10 text-green-200"
                    : "border-foreground/[0.08] bg-foreground/[0.03] text-foreground/50"
              }`}
            >
              <span>
                {index + 1}. {step.label}
              </span>
              {isVisited ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <CircleDashed className="h-3.5 w-3.5" />
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={openNextStep}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/35 bg-neon-cyan/15 px-3 py-1.5 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/25"
      >
        {nextStep ? nextStep.cta : "Abrir Orquestra"}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
