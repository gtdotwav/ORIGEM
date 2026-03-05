"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowLeft, X, Sparkles, Rocket } from "lucide-react";
import Image from "next/image";
import { useTourStore } from "@/stores/tour-store";
import { cn } from "@/lib/utils";

/* ─── Tour step definitions ─── */

type Position = "top" | "bottom" | "left" | "right";

interface ModalStep {
  id: string;
  type: "modal";
  title: string;
  description: string;
}

interface SpotlightStep {
  id: string;
  type: "spotlight";
  target: string; // CSS selector for data-tour attribute
  title: string;
  description: string;
  position: Position;
}

type TourStep = ModalStep | SpotlightStep;

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    type: "modal",
    title: "Bem-vindo ao ORIGEM",
    description:
      "Seu motor psicossem\u00e2ntico de IA. Vamos explorar juntos as ferramentas que transformam sua forma de criar e pensar.",
  },
  {
    id: "chat-input",
    type: "spotlight",
    target: '[data-tour="chat-input"]',
    title: "Sua entrada criativa",
    description:
      "Digite qualquer ideia, conceito ou pergunta. O ORIGEM decompoe, analisa e orquestra multiplas camadas de IA para gerar respostas profundas.",
    position: "top",
  },
  {
    id: "tools-chevron",
    type: "spotlight",
    target: '[data-tour="tools-chevron"]',
    title: "Ferramentas avancadas",
    description:
      "Expanda para acessar seletor de LLM, entrada por voz, painel critico e modo de operacao.",
    position: "top",
  },
  {
    id: "floating-nav",
    type: "spotlight",
    target: '[data-tour="nav-logo"]',
    title: "Navegacao central",
    description:
      "Clique no logo para acessar todas as areas: Dashboard, Pipeline 360\u00b0, Space, Workspaces, Apps e muito mais.",
    position: "bottom",
  },
  {
    id: "theme-toggle",
    type: "spotlight",
    target: '[data-tour="theme-toggle"]',
    title: "Modo visual",
    description:
      "Alterne entre o modo escuro e o modo plain para ajustar a interface ao seu conforto.",
    position: "bottom",
  },
  {
    id: "left-toolbar",
    type: "spotlight",
    target: '[data-tour="left-toolbar"]',
    title: "Barra de ferramentas",
    description:
      "Acesso rapido ao historico de chats, conectores, calendario e ORIGEM Spaces para geracao de imagens.",
    position: "right",
  },
  {
    id: "completion",
    type: "modal",
    title: "Pronto para criar!",
    description:
      "Voce conhece as ferramentas essenciais. Explore, experimente e deixe o ORIGEM potencializar suas ideias. A jornada e infinita.",
  },
];

/* ─── Spotlight overlay ─── */

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useTargetRect(selector: string | null) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    };

    update();
    // Keep the rect updated on scroll/resize
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const interval = setInterval(update, 300);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      clearInterval(interval);
    };
  }, [selector]);

  return rect;
}

/* ─── Card positioning ─── */

function getCardPosition(
  rect: SpotlightRect,
  position: Position,
  cardWidth: number,
  cardHeight: number
) {
  const pad = 16;
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;

  let top = 0;
  let left = 0;

  switch (position) {
    case "top":
      top = rect.top - cardHeight - pad;
      left = rect.left + rect.width / 2 - cardWidth / 2;
      break;
    case "bottom":
      top = rect.top + rect.height + pad;
      left = rect.left + rect.width / 2 - cardWidth / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - cardHeight / 2;
      left = rect.left - cardWidth - pad;
      break;
    case "right":
      top = rect.top + rect.height / 2 - cardHeight / 2;
      left = rect.left + rect.width + pad;
      break;
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, viewW - cardWidth - 12));
  top = Math.max(12, Math.min(top, viewH - cardHeight - 12));

  return { top, left };
}

/* ─── Particle burst for completion ─── */

function ParticleBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const distance = 80 + Math.random() * 120;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 3 + Math.random() * 4;
    const colors = [
      "bg-neon-cyan",
      "bg-neon-purple",
      "bg-neon-green",
      "bg-neon-pink",
      "bg-neon-orange",
    ];
    const color = colors[i % colors.length];
    return { x, y, size, color, delay: i * 0.02 };
  });

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={cn("absolute rounded-full", p.color)}
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Progress dots ─── */

function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className={cn(
            "rounded-full transition-colors",
            i === current
              ? "bg-neon-cyan"
              : i < current
                ? "bg-foreground/25"
                : "bg-foreground/10"
          )}
          animate={{
            width: i === current ? 16 : 5,
            height: 5,
          }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

/* ─── Main component ─── */

export function GuidedTour() {
  const isActive = useTourStore((s) => s.isActive);
  const currentStep = useTourStore((s) => s.currentStep);
  const hasCompletedTour = useTourStore((s) => s.hasCompletedTour);
  const cameFromInvite = useTourStore((s) => s.cameFromInvite);
  const startTour = useTourStore((s) => s.startTour);
  const nextStep = useTourStore((s) => s.nextStep);
  const prevStep = useTourStore((s) => s.prevStep);
  const skipTour = useTourStore((s) => s.skipTour);
  const completeTour = useTourStore((s) => s.completeTour);

  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Auto-start tour for first-time users (after a slight delay)
  useEffect(() => {
    if (mounted && !hasCompletedTour && !isActive) {
      const timer = setTimeout(() => startTour(), 1500);
      return () => clearTimeout(timer);
    }
  }, [mounted, hasCompletedTour, isActive, startTour]);

  const rawStep = TOUR_STEPS[currentStep] as TourStep | undefined;

  // Personalize steps for invited users
  const step = rawStep ? { ...rawStep } : undefined;
  if (step && cameFromInvite) {
    if (step.id === "welcome") {
      step.title = "Que bom ter voce aqui";
      step.description =
        "Voce chegou por um convite especial. Obrigado por acreditar nesse movimento. Vamos te mostrar como o ORIGEM pode transformar sua forma de criar.";
    }
    if (step.id === "completion") {
      step.title = "A jornada comeca agora";
      step.description =
        "Voce faz parte de algo novo. Explore sem pressa, crie com liberdade. Estamos construindo isso juntos — e sua presenca faz diferenca.";
    }
  }

  const isSpotlight = step?.type === "spotlight";
  const spotlightStep = isSpotlight ? (step as SpotlightStep) : null;
  const targetRect = useTargetRect(spotlightStep?.target ?? null);

  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      completeTour();
    } else {
      nextStep();
    }
  }, [isLastStep, completeTour, nextStep]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === "Escape") skipTour();
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      if (e.key === "ArrowLeft" && !isFirstStep) prevStep();
    },
    [isActive, skipTour, handleNext, prevStep, isFirstStep]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!mounted || !isActive || !step) return null;

  const spotlightPad = 8;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="tour-overlay"
        className="fixed inset-0 z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Dark backdrop */}
        <div className="absolute inset-0 bg-black/70" onClick={skipTour} />

        {/* Spotlight cutout */}
        {isSpotlight && targetRect && (
          <motion.div
            className="absolute rounded-2xl ring-2 ring-neon-cyan/30"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: targetRect.top - spotlightPad,
              left: targetRect.left - spotlightPad,
              width: targetRect.width + spotlightPad * 2,
              height: targetRect.height + spotlightPad * 2,
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            ref={cardRef}
            className={cn(
              "absolute rounded-2xl border border-foreground/[0.10] bg-card/95 shadow-2xl shadow-black/50 backdrop-blur-xl",
              step.type === "modal"
                ? "left-1/2 top-1/2 w-[90vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2"
                : "w-[320px]"
            )}
            style={
              isSpotlight && targetRect
                ? getCardPosition(
                    targetRect,
                    spotlightStep!.position,
                    320,
                    200
                  )
                : undefined
            }
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={skipTour}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="p-6">
              {/* Welcome modal decoration */}
              {step.id === "welcome" && (
                <motion.div
                  className="mb-5 flex justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="relative">
                    <Image
                      src="/logo.png"
                      alt="ORIGEM"
                      width={80}
                      height={80}
                      className="pointer-events-none"
                    />
                    <motion.div
                      className="absolute -inset-4 rounded-full border border-neon-cyan/20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.5, 0.3] }}
                      transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute -inset-8 rounded-full border border-neon-purple/10"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [0.8, 1.3, 1.1], opacity: [0, 0.3, 0.15] }}
                      transition={{ duration: 1.8, delay: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Completion decoration */}
              {step.id === "completion" && (
                <motion.div
                  className="relative mb-5 flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <ParticleBurst />
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-green/20 bg-neon-green/10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring", bounce: 0.4 }}
                  >
                    <Rocket className="h-7 w-7 text-neon-green" />
                  </motion.div>
                </motion.div>
              )}

              {/* Step icon for spotlight steps */}
              {isSpotlight && (
                <motion.div
                  className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl border border-neon-cyan/20 bg-neon-cyan/10"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, duration: 0.4, type: "spring", bounce: 0.35 }}
                >
                  <Sparkles className="h-4 w-4 text-neon-cyan" />
                </motion.div>
              )}

              {/* Title */}
              <motion.h3
                className={cn(
                  "font-semibold text-foreground",
                  step.type === "modal" ? "mb-3 text-center text-xl" : "mb-2 text-sm"
                )}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                {step.title}
              </motion.h3>

              {/* Description */}
              <motion.p
                className={cn(
                  "text-foreground/50",
                  step.type === "modal"
                    ? "mb-6 text-center text-sm leading-relaxed"
                    : "mb-5 text-xs leading-relaxed"
                )}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {step.description}
              </motion.p>

              {/* Footer — progress + navigation */}
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <ProgressDots total={TOUR_STEPS.length} current={currentStep} />

                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-foreground/[0.08] text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all",
                      isLastStep
                        ? "border border-neon-green/30 bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
                        : isFirstStep
                          ? "border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
                          : "border border-foreground/[0.10] bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
                    )}
                  >
                    {isLastStep
                      ? "Comecar!"
                      : isFirstStep
                        ? "Iniciar tour"
                        : "Proximo"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>

              {/* Skip hint */}
              {!isLastStep && (
                <motion.p
                  className="mt-3 text-center text-[10px] text-foreground/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Pressione ESC para pular o tour
                </motion.p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
