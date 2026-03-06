"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Rocket,
  MessageSquare,
  ImageIcon,
  Code2,
  CalendarDays,
  LayoutGrid,
  Workflow,
  Palette,
  Users,
  Bot,
  Layers,
  MessageCircle,
  ChevronUp,
  Navigation,
  SunMoon,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTourStore } from "@/stores/tour-store";
import { cn } from "@/lib/utils";
import { FlippingCard } from "@/components/ui/flipping-card";

/* ─── Tour step definitions ─── */

type Position = "top" | "bottom" | "left" | "right";

interface ModalStep {
  id: string;
  type: "modal";
  title: string;
  description: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

interface SpotlightStep {
  id: string;
  type: "spotlight";
  target: string;
  title: string;
  description: string;
  position: Position;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
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
    icon: MessageCircle,
    iconColor: "text-neon-cyan",
    iconBg: "bg-neon-cyan/10 border-neon-cyan/20",
  },
  {
    id: "tools-chevron",
    type: "spotlight",
    target: '[data-tour="tools-chevron"]',
    title: "Ferramentas avancadas",
    description:
      "Expanda para acessar seletor de LLM, entrada por voz, painel critico e modo de operacao.",
    position: "top",
    icon: ChevronUp,
    iconColor: "text-neon-purple",
    iconBg: "bg-neon-purple/10 border-neon-purple/20",
  },
  {
    id: "floating-nav",
    type: "spotlight",
    target: '[data-tour="nav-logo"]',
    title: "Navegacao central",
    description:
      "Clique no logo para acessar todas as areas: Dashboard, Pipeline 360\u00b0, Space, Workspaces, Apps e muito mais.",
    position: "bottom",
    icon: Navigation,
    iconColor: "text-neon-green",
    iconBg: "bg-neon-green/10 border-neon-green/20",
  },
  {
    id: "theme-toggle",
    type: "spotlight",
    target: '[data-tour="theme-toggle"]',
    title: "Modo visual",
    description:
      "Alterne entre o modo escuro e o modo plain para ajustar a interface ao seu conforto.",
    position: "bottom",
    icon: SunMoon,
    iconColor: "text-neon-orange",
    iconBg: "bg-neon-orange/10 border-neon-orange/20",
  },
  {
    id: "left-toolbar",
    type: "spotlight",
    target: '[data-tour="left-toolbar"]',
    title: "Barra de ferramentas",
    description:
      "Acesso rapido ao historico de chats, conectores, calendario e ORIGEM Spaces para geracao de imagens.",
    position: "right",
    icon: PanelLeft,
    iconColor: "text-neon-pink",
    iconBg: "bg-neon-pink/10 border-neon-pink/20",
  },
  {
    id: "completion",
    type: "modal",
    title: "Pronto para criar!",
    description:
      "Escolha por onde comecar. Passe o mouse nos cards para descobrir mais sobre cada caminho.",
  },
];

/* ─── Starting paths data ─── */

interface StartPath {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  ctaLabel: string;
}

const START_PATHS: StartPath[] = [
  {
    id: "chat",
    icon: MessageSquare,
    iconColor: "text-neon-cyan",
    iconBg: "bg-neon-cyan/10",
    title: "Chat IA",
    subtitle: "Conversa inteligente",
    description: "Converse com multiplas IAs orquestradas. Pergunte, crie, analise — o ORIGEM entende o contexto e gera respostas profundas.",
    route: "/dashboard",
    ctaLabel: "Iniciar conversa",
  },
  {
    id: "spaces",
    icon: ImageIcon,
    iconColor: "text-neon-purple",
    iconBg: "bg-neon-purple/10",
    title: "Spaces",
    subtitle: "Geracao de imagens",
    description: "Canvas visual com multiplos modelos de imagem. Gere, compare e itere com Nano Banana Pro, DALL-E 3, Flux, Midjourney e mais.",
    route: "/dashboard/spaces",
    ctaLabel: "Abrir Spaces",
  },
  {
    id: "code",
    icon: Code2,
    iconColor: "text-neon-green",
    iconBg: "bg-neon-green/10",
    title: "Code IDE",
    subtitle: "Editor assistido por IA",
    description: "IDE completa com preview ao vivo, tabs, terminal e assistencia de IA. Crie projetos web diretamente no navegador.",
    route: "/dashboard/code",
    ctaLabel: "Abrir IDE",
  },
  {
    id: "calendar",
    icon: CalendarDays,
    iconColor: "text-neon-orange",
    iconBg: "bg-neon-orange/10",
    title: "Calendario",
    subtitle: "Agenda inteligente",
    description: "Planeje com IA. Use prompt natural para agendar, visualize em grade, lista ou kanban. Atribua tarefas a agentes.",
    route: "/dashboard/calendar",
    ctaLabel: "Ver calendario",
  },
  {
    id: "workspaces",
    icon: LayoutGrid,
    iconColor: "text-neon-pink",
    iconBg: "bg-neon-pink/10",
    title: "Workspaces",
    subtitle: "Projetos organizados",
    description: "Organize tudo em workspaces com cores, filtros e projetos. Cada workspace isola contexto para manter o foco.",
    route: "/dashboard/workspaces",
    ctaLabel: "Criar workspace",
  },
  {
    id: "flows",
    icon: Workflow,
    iconColor: "text-neon-cyan",
    iconBg: "bg-neon-cyan/10",
    title: "Flows",
    subtitle: "Automacao visual",
    description: "Monte pipelines de IA conectando blocos visuais. Automatize processos criativos e de analise com drag-and-drop.",
    route: "/dashboard/flows",
    ctaLabel: "Criar flow",
  },
  {
    id: "design",
    icon: Palette,
    iconColor: "text-neon-purple",
    iconBg: "bg-neon-purple/10",
    title: "UX/UI",
    subtitle: "Criacao visual",
    description: "Ferramentas de UX/UI assistidas por IA. Gere layouts, paletas, tipografia e componentes visuais automaticamente.",
    route: "/dashboard/uxui",
    ctaLabel: "Explorar UX/UI",
  },
  {
    id: "agents",
    icon: Bot,
    iconColor: "text-neon-green",
    iconBg: "bg-neon-green/10",
    title: "Agentes",
    subtitle: "IA especializada",
    description: "6 agentes com personalidades unicas: Planner, Builder, Researcher, Analyst, Designer e Critic. Cada um domina uma area.",
    route: "/dashboard/agents",
    ctaLabel: "Conhecer agentes",
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

/* ─── Flipping card content for completion step ─── */

function PathCardFront({ path }: { path: StartPath }) {
  const Icon = path.icon;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", path.iconBg)}>
        <Icon className={cn("h-6 w-6", path.iconColor)} />
      </div>
      <h4 className="text-[13px] font-bold text-foreground/90">{path.title}</h4>
      <p className="text-[10px] font-medium text-foreground/35">{path.subtitle}</p>
    </div>
  );
}

function PathCardBack({ path, onNavigate }: { path: StartPath; onNavigate: (route: string) => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
      <p className="text-center text-[10px] leading-relaxed text-foreground/50">
        {path.description}
      </p>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNavigate(path.route); }}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition-all hover:shadow-sm",
          path.iconColor,
          path.iconColor.replace("text-", "border-") + "/25",
          path.iconBg
        )}
      >
        {path.ctaLabel}
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ─── Main component ─── */

export function GuidedTour() {
  const router = useRouter();
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
        "Explore cada caminho. Passe o mouse nos cards para descobrir como o ORIGEM transforma sua forma de criar.";
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

  const handleNavigate = useCallback((route: string) => {
    completeTour();
    router.push(route);
  }, [completeTour, router]);

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
  const isCompletion = step.id === "completion";

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
            className="absolute rounded-2xl ring-2 ring-neon-cyan/40"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.78), 0 0 30px 4px rgba(64,224,208,0.15)",
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
          {isCompletion ? (
            /* ─── Completion step — fullscreen with flipping cards ─── */
            <motion.div
              key={step.id}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto px-6 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                className="relative mb-2 flex justify-center"
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

              <motion.h2
                className="mb-1 text-center text-2xl font-bold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {step.title}
              </motion.h2>
              <motion.p
                className="mb-8 max-w-md text-center text-sm leading-relaxed text-foreground/45"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {step.description}
              </motion.p>

              {/* Flipping cards grid */}
              <motion.div
                className="flex max-w-5xl flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {START_PATHS.map((path, i) => (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <FlippingCard
                      width={180}
                      height={160}
                      className="!border-foreground/[0.08] !bg-card !shadow-lg !shadow-black/30 dark:!bg-card"
                      frontContent={<PathCardFront path={path} />}
                      backContent={<PathCardBack path={path} onNavigate={handleNavigate} />}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Footer */}
              <motion.div
                className="mt-8 flex items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-foreground/[0.08] text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <ProgressDots total={TOUR_STEPS.length} current={currentStep} />

                <button
                  type="button"
                  onClick={completeTour}
                  className="inline-flex items-center gap-2 rounded-xl border border-neon-green/30 bg-neon-green/10 px-5 py-2.5 text-xs font-semibold text-neon-green transition-all hover:bg-neon-green/20"
                >
                  Explorar livremente
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>

              {/* Close */}
              <button
                type="button"
                onClick={skipTour}
                className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-xl text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            /* ─── Normal step card ─── */
            <motion.div
              key={step.id}
              ref={cardRef}
              className={cn(
                "absolute rounded-2xl border bg-card/95 shadow-2xl shadow-black/50 backdrop-blur-xl",
                step.type === "modal"
                  ? "left-1/2 top-1/2 w-[90vw] max-w-[460px] -translate-x-1/2 -translate-y-1/2 border-foreground/[0.12]"
                  : "w-[360px] border-neon-cyan/20"
              )}
              style={
                isSpotlight && targetRect
                  ? getCardPosition(
                      targetRect,
                      spotlightStep!.position,
                      360,
                      240
                    )
                  : undefined
              }
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Glow accent line at top */}
              {isSpotlight && (
                <div className={cn("absolute inset-x-0 top-0 h-px rounded-t-2xl", step.iconColor?.replace("text-", "bg-") ?? "bg-neon-cyan")} style={{ opacity: 0.5 }} />
              )}

              {/* Step counter badge */}
              {!isFirstStep && !isLastStep && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-foreground/[0.10] bg-card px-3 py-0.5 shadow-lg"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                >
                  <span className="text-[10px] font-bold tabular-nums text-foreground/50">
                    {currentStep} / {TOUR_STEPS.length - 1}
                  </span>
                </motion.div>
              )}

              {/* Close button */}
              <button
                type="button"
                onClick={skipTour}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-foreground/25 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="p-7">
                {/* Welcome modal decoration */}
                {step.id === "welcome" && (
                  <motion.div
                    className="mb-6 flex justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="relative">
                      <Image
                        src="/logo.png"
                        alt="ORIGEM"
                        width={88}
                        height={88}
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

                {/* Step icon — unique per step */}
                {isSpotlight && (() => {
                  const StepIcon = step.icon ?? Sparkles;
                  const iconColor = step.iconColor ?? "text-neon-cyan";
                  const iconBg = step.iconBg ?? "bg-neon-cyan/10 border-neon-cyan/20";
                  return (
                    <motion.div
                      className={cn("mb-4 flex h-10 w-10 items-center justify-center rounded-xl border", iconBg)}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, duration: 0.4, type: "spring", bounce: 0.35 }}
                    >
                      <StepIcon className={cn("h-5 w-5", iconColor)} />
                    </motion.div>
                  );
                })()}

                {/* Title */}
                <motion.h3
                  className={cn(
                    "font-bold text-foreground",
                    step.type === "modal" ? "mb-3 text-center text-xl" : "mb-2 text-base"
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
                    "text-foreground/55",
                    step.type === "modal"
                      ? "mb-6 text-center text-sm leading-relaxed"
                      : "mb-6 text-[13px] leading-relaxed"
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
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-foreground/[0.08] text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNext}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all",
                        isFirstStep
                          ? "border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
                          : "border border-foreground/[0.10] bg-foreground/[0.06] text-foreground/70 hover:bg-foreground/[0.10]"
                      )}
                    >
                      {isFirstStep ? "Iniciar tour" : "Proximo"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>

                {/* Skip hint */}
                <motion.p
                  className="mt-4 text-center text-[10px] text-foreground/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Pressione ESC para pular o tour
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
