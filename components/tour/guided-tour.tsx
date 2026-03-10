"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Blocks,
  Rocket,
  MessageSquare,
  ImageIcon,
  Code2,
  LayoutGrid,
  MessageCircle,
  Navigation,
  PanelLeft,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTourStore, type TourContextId } from "@/stores/tour-store";
import { cn } from "@/lib/utils";

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
  mobilePosition?: Position;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

type TourStep = ModalStep | SpotlightStep;

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
    ctaLabel: "Abrir chat",
  },
  {
    id: "workspaces",
    icon: LayoutGrid,
    iconColor: "text-neon-orange",
    iconBg: "bg-neon-orange/10",
    title: "Workspaces",
    subtitle: "Estruture seu ambiente",
    description: "Crie um workspace para separar projetos, sessoes, conectores e contexto operacional.",
    route: "/dashboard/workspaces",
    ctaLabel: "Ir para workspaces",
  },
  {
    id: "spaces",
    icon: ImageIcon,
    iconColor: "text-neon-purple",
    iconBg: "bg-neon-purple/10",
    title: "Spaces",
    subtitle: "Canvas visual",
    description: "Use o canvas para gerar imagens, conectar cards e iterar visualmente em um fluxo mais livre.",
    route: "/dashboard/spaces",
    ctaLabel: "Abrir Spaces",
  },
  {
    id: "code",
    icon: Code2,
    iconColor: "text-neon-green",
    iconBg: "bg-neon-green/10",
    title: "Code IDE",
    subtitle: "Editor assistido",
    description: "Entre no ambiente de codigo com chat, arquivos e preview quando a tarefa exigir execucao tecnica.",
    route: "/dashboard/code",
    ctaLabel: "Abrir IDE",
  },
];

const TOUR_STEPS_BY_CONTEXT: Record<TourContextId, TourStep[]> = {
  dashboard: [
    {
      id: "welcome",
      type: "modal",
      title: "Bem-vindo ao ORIGEM",
      description:
        "Em menos de um minuto, vamos te mostrar o que realmente importa para comecar: onde pedir, como ajustar, onde navegar e onde abrir contexto.",
    },
    {
      id: "chat-input",
      type: "spotlight",
      target: '[data-tour="chat-input"]',
      title: "Comece por aqui",
      description:
        "Escreva o pedido principal aqui. O ORIGEM usa esse campo como ponto de partida para conversar, planejar, analisar e executar.",
      position: "top",
      icon: MessageCircle,
      iconColor: "text-neon-cyan",
      iconBg: "bg-neon-cyan/10 border-neon-cyan/20",
    },
    {
      id: "chat-controls",
      type: "spotlight",
      target: '[data-tour="chat-controls"]',
      title: "Ajuste o motor antes de enviar",
      description:
        "Aqui voce troca modelo, modo de operacao e criticos. E o unico ponto de ajuste que vale aprender no inicio.",
      position: "top",
      mobilePosition: "top",
      icon: SlidersHorizontal,
      iconColor: "text-neon-purple",
      iconBg: "bg-neon-purple/10 border-neon-purple/20",
    },
    {
      id: "floating-nav",
      type: "spotlight",
      target: '[data-tour="nav-logo"]',
      title: "Abra as areas principais",
      description:
        "O logo abre a navegacao central. Use esse menu quando quiser sair do chat e entrar em Workspaces, Code, Spaces ou outras areas.",
      position: "bottom",
      icon: Navigation,
      iconColor: "text-neon-green",
      iconBg: "bg-neon-green/10 border-neon-green/20",
    },
    {
      id: "left-toolbar",
      type: "spotlight",
      target: '[data-tour="left-toolbar"]',
      title: "Contexto lateral rapido",
      description:
        "Esse dock abre historico, calendario, conectores e outros paineis de apoio. Use quando precisar de contexto sem sair do fluxo principal.",
      position: "right",
      mobilePosition: "top",
      icon: PanelLeft,
      iconColor: "text-neon-pink",
      iconBg: "bg-neon-pink/10 border-neon-pink/20",
    },
    {
      id: "completion",
      type: "modal",
      title: "Pronto para criar!",
      description:
        "Escolha por onde comecar. Cada caminho abaixo leva direto para a area certa do produto.",
    },
  ],
  code: [
    {
      id: "code-welcome",
      type: "modal",
      title: "Code sem friccao",
      description:
        "Aqui voce opera em tres frentes: pedir no chat, revisar os arquivos gerados e validar o resultado no preview.",
    },
    {
      id: "code-files",
      type: "spotlight",
      target: '[data-tour="code-files"]',
      title: "Arquivos primeiro",
      description:
        "Use o explorer para abrir a estrutura do projeto, revisar o que foi criado e navegar rapido entre os arquivos alterados.",
      position: "right",
      mobilePosition: "bottom",
      icon: Code2,
      iconColor: "text-neon-cyan",
      iconBg: "bg-neon-cyan/10 border-neon-cyan/20",
    },
    {
      id: "code-chat",
      type: "spotlight",
      target: '[data-tour="code-chat"]',
      title: "Itere pelo chat",
      description:
        "Pequenas mudancas funcionam melhor quando voce diz exatamente o que quer alterar, validar ou gerar em seguida.",
      position: "left",
      mobilePosition: "top",
      icon: MessageSquare,
      iconColor: "text-neon-green",
      iconBg: "bg-neon-green/10 border-neon-green/20",
    },
    {
      id: "code-preview",
      type: "spotlight",
      target: '[data-tour="code-preview"]',
      title: "Valide no preview",
      description:
        "Troque para Preview sempre que quiser conferir a interface renderizada sem sair do fluxo de edicao.",
      position: "left",
      mobilePosition: "bottom",
      icon: LayoutGrid,
      iconColor: "text-neon-purple",
      iconBg: "bg-neon-purple/10 border-neon-purple/20",
    },
    {
      id: "code-ready",
      type: "modal",
      title: "Pronto para editar",
      description:
        "Agora voce ja sabe pedir, revisar e validar. O melhor fluxo aqui e iterar em blocos curtos e objetivos.",
    },
  ],
  spaces: [
    {
      id: "spaces-welcome",
      type: "modal",
      title: "Spaces para fluxo visual",
      description:
        "O hub de Spaces serve para criar, reencontrar e abrir canvases visuais sem misturar isso com o chat principal.",
    },
    {
      id: "spaces-create",
      type: "spotlight",
      target: '[data-tour="spaces-create"]',
      title: "Crie o canvas certo",
      description:
        "Comece por aqui quando quiser abrir um novo fluxo visual de geracao, referencias e conexoes entre cards.",
      position: "bottom",
      mobilePosition: "top",
      icon: ImageIcon,
      iconColor: "text-neon-cyan",
      iconBg: "bg-neon-cyan/10 border-neon-cyan/20",
    },
    {
      id: "spaces-grid",
      type: "spotlight",
      target: '[data-tour="spaces-grid"]',
      title: "Retome rapido",
      description:
        "Quando voce ja tem canvases criados, esta grade vira o ponto mais rapido para reabrir, renomear ou limpar um fluxo.",
      position: "top",
      mobilePosition: "top",
      icon: Blocks,
      iconColor: "text-neon-purple",
      iconBg: "bg-neon-purple/10 border-neon-purple/20",
    },
    {
      id: "spaces-ready",
      type: "modal",
      title: "Pronto para abrir um Space",
      description:
        "O melhor caminho aqui e separar cada exploracao visual em um canvas proprio para manter contexto e historico claros.",
    },
  ],
  workspaces: [
    {
      id: "workspaces-welcome",
      type: "modal",
      title: "Workspaces organizam o ambiente",
      description:
        "Use workspaces para separar operacoes, projetos e sessoes por contexto, cliente ou linha de trabalho.",
    },
    {
      id: "workspaces-create",
      type: "spotlight",
      target: '[data-tour="workspaces-create"]',
      title: "Crie com criterio",
      description:
        "Cada workspace deve representar um contexto de trabalho claro. Isso evita misturar sessoes e filtros sem necessidade.",
      position: "bottom",
      mobilePosition: "top",
      icon: LayoutGrid,
      iconColor: "text-neon-blue",
      iconBg: "bg-neon-blue/10 border-neon-blue/20",
    },
    {
      id: "workspaces-grid",
      type: "spotlight",
      target: '[data-tour="workspaces-grid"]',
      title: "Abra pelo card",
      description:
        "Os cards sao a fonte principal daqui. E por eles que voce entra no detalhe, ativa o filtro e administra o workspace.",
      position: "top",
      mobilePosition: "top",
      icon: PanelLeft,
      iconColor: "text-neon-cyan",
      iconBg: "bg-neon-cyan/10 border-neon-cyan/20",
    },
    {
      id: "workspaces-ready",
      type: "modal",
      title: "Pronto para estruturar",
      description:
        "Agora voce ja sabe criar e abrir workspaces. O ganho real aparece quando cada frente de trabalho tem o seu proprio contexto.",
    },
  ],
};

function getTourContext(pathname: string): TourContextId | null {
  if (pathname === "/dashboard") {
    return "dashboard";
  }

  if (pathname === "/dashboard/code") {
    return "code";
  }

  if (pathname === "/dashboard/spaces") {
    return "spaces";
  }

  if (pathname === "/dashboard/workspaces") {
    return "workspaces";
  }

  return null;
}

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
      const frame = window.requestAnimationFrame(() => {
        setRect(null);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (typeof window === "undefined") {
      return;
    }

    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updateNow = () => {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }

      resizeObserver?.disconnect();
      resizeObserver = null;

      if (el && "ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => {
          window.requestAnimationFrame(updateNow);
        });
        resizeObserver.observe(el);
      }
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateNow);
    };

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [selector]);

  return rect;
}

function getResolvedPosition(step: SpotlightStep, viewportWidth: number): Position {
  if (viewportWidth < 768 && step.mobilePosition) {
    return step.mobilePosition;
  }

  return step.position;
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
    const distance = 96 + (i % 6) * 18;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 3 + (i % 4);
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

function PathCard({ path, onNavigate }: { path: StartPath; onNavigate: (route: string) => void }) {
  const Icon = path.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(path.route)}
      className="group flex h-full w-full flex-col rounded-[24px] border border-foreground/[0.08] bg-card/78 p-4 text-left shadow-lg shadow-black/30 transition-all hover:border-foreground/[0.14] hover:bg-card/92 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8", path.iconBg)}>
          <Icon className={cn("h-5 w-5", path.iconColor)} />
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-foreground/24 transition-colors group-hover:text-foreground/55" />
      </div>

      <div className="mt-4 space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground/90">{path.title}</h4>
        <p className="text-[11px] font-medium text-foreground/34">{path.subtitle}</p>
        <p className="pt-1 text-[11px] leading-6 text-foreground/48">
          {path.description}
        </p>
      </div>

      <span
        className={cn(
          "mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition-all hover:shadow-sm",
          path.iconColor,
          path.iconColor.replace("text-", "border-") + "/25",
          path.iconBg
        )}
      >
        {path.ctaLabel}
        <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

/* ─── Main component ─── */

export function GuidedTour() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = useTourStore((s) => s.isActive);
  const currentStep = useTourStore((s) => s.currentStep);
  const hasCompletedTour = useTourStore((s) => s.hasCompletedTour);
  const completedContexts = useTourStore((s) => s.completedContexts);
  const activeContext = useTourStore((s) => s.activeContext);
  const cameFromInvite = useTourStore((s) => s.cameFromInvite);
  const startTour = useTourStore((s) => s.startTour);
  const nextStep = useTourStore((s) => s.nextStep);
  const prevStep = useTourStore((s) => s.prevStep);
  const skipTour = useTourStore((s) => s.skipTour);
  const completeTour = useTourStore((s) => s.completeTour);

  const cardRef = useRef<HTMLDivElement>(null);
  const routeContext = getTourContext(pathname);
  const contextId = isActive ? activeContext ?? routeContext : routeContext;
  const steps = contextId ? TOUR_STEPS_BY_CONTEXT[contextId] : [];
  const hasCompletedContext = routeContext
    ? routeContext === "dashboard"
      ? hasCompletedTour || Boolean(completedContexts.dashboard)
      : Boolean(completedContexts[routeContext])
    : true;

  useEffect(() => {
    if (!routeContext || hasCompletedContext || isActive || steps.length === 0) {
      return;
    }

    const delay = routeContext === "dashboard" ? 1500 : 900;
    const timer = window.setTimeout(() => startTour(routeContext), delay);

    return () => window.clearTimeout(timer);
  }, [hasCompletedContext, isActive, routeContext, startTour, steps.length]);

  const rawStep = steps[currentStep] as TourStep | undefined;

  // Personalize steps for invited users
  const step = rawStep ? { ...rawStep } : undefined;
  if (step && cameFromInvite) {
    if (step.id === "welcome") {
      step.title = "Que bom ter voce aqui";
      step.description =
        "Voce chegou por um convite especial. Vamos te mostrar so o essencial para entrar rapido no fluxo e comecar a usar o ORIGEM direito.";
    }
    if (step.id === "completion") {
      step.title = "Escolha seu primeiro caminho";
      step.description =
        "Agora voce ja sabe onde operar. Escolha a area certa para a sua primeira acao.";
    }
  }

  const isSpotlight = step?.type === "spotlight";
  const spotlightStep = isSpotlight ? (step as SpotlightStep) : null;
  const targetRect = useTargetRect(spotlightStep?.target ?? null);

  const isLastStep = currentStep === steps.length - 1;
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
    if (!isActive || steps.length === 0 || currentStep < steps.length) {
      return;
    }

    completeTour();
  }, [completeTour, currentStep, isActive, steps.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isActive || !spotlightStep) {
      return;
    }

    const target = document.querySelector(spotlightStep.target);
    if (!target) {
      return;
    }

    target.scrollIntoView({
      block: "center",
      inline: "center",
      behavior: "smooth",
    });
  }, [currentStep, isActive, spotlightStep]);

  useEffect(() => {
    if (!isActive || !spotlightStep || targetRect) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (currentStep >= steps.length - 1) {
        completeTour();
        return;
      }

      nextStep();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [completeTour, currentStep, isActive, nextStep, spotlightStep, steps.length, targetRect]);

  if (!routeContext || !isActive || !step) return null;

  const spotlightPad = 8;
  const isCompletion = step.id === "completion";
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const spotlightCardWidth = Math.min(360, viewportWidth - 24);
  const spotlightCardHeight = 240;
  const spotlightPosition =
    isSpotlight && targetRect && spotlightStep
      ? getCardPosition(
          targetRect,
          getResolvedPosition(spotlightStep, viewportWidth),
          spotlightCardWidth,
          spotlightCardHeight
        )
      : undefined;

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
        <div className="absolute inset-0 bg-black/72" />

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
                className="mb-8 max-w-md text-center text-sm leading-relaxed text-foreground/48"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {step.description}
              </motion.p>

              {/* Primary paths */}
              <motion.div
                className="grid w-full max-w-4xl gap-3 sm:grid-cols-2"
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
                    <PathCard path={path} onNavigate={handleNavigate} />
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

                <ProgressDots total={steps.length} current={currentStep} />

                <button
                  type="button"
                  onClick={completeTour}
                  className="inline-flex items-center gap-2 rounded-xl border border-neon-green/30 bg-neon-green/10 px-5 py-2.5 text-xs font-semibold text-neon-green transition-all hover:bg-neon-green/20"
                >
                  Explorar depois
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
                  : "max-w-[calc(100vw-24px)] border-neon-cyan/20"
              )}
              style={isSpotlight && targetRect ? { ...spotlightPosition, width: spotlightCardWidth } : undefined}
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
                    {currentStep} / {steps.length - 1}
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
                  const StepIcon = step.icon ?? Blocks;
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
                      : "mb-6 text-[13px] leading-6"
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {step.description}
                </motion.p>

                {/* Footer — progress + navigation */}
                <motion.div
                  className="flex items-center justify-between gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <ProgressDots total={steps.length} current={currentStep} />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={skipTour}
                      className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-foreground/24 transition-colors hover:text-foreground/48 sm:inline-flex"
                    >
                      Pular
                    </button>
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
                      {isFirstStep
                        ? "Iniciar tour"
                        : isLastStep
                          ? "Concluir"
                          : "Proximo"}
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
                  Use ESC para sair do tour a qualquer momento
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
