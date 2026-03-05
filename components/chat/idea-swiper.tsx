"use client";

import { useState, useRef, useEffect, useCallback, type CSSProperties } from "react";
import {
  Brain,
  Bot,
  Workflow,
  Sparkles,
  Target,
  Layers,
  Lightbulb,
  Rocket,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface Idea {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  prompt: string;
  description: string;
  tags: string[];
  gradient: string;
  neonColor: string;
}

const IDEAS: Idea[] = [
  {
    id: 1,
    icon: Brain,
    title: "Decompor conceito complexo",
    prompt:
      "Decomponha o conceito de [tema] em seus componentes fundamentais, mapeando relações semânticas, dependências e hierarquias conceituais.",
    description:
      "Quebre qualquer ideia em partes fundamentais com mapeamento semântico completo.",
    tags: ["contexto", "decomposição"],
    gradient: "from-neon-purple/20 to-neon-blue/10",
    neonColor: "text-neon-purple",
  },
  {
    id: 2,
    icon: Bot,
    title: "Montar equipe de agentes",
    prompt:
      "Crie uma equipe de agentes especializados para [objetivo]: defina papéis, competências, estratégia de colaboração e pipeline de execução.",
    description:
      "Configure uma orquestra de agentes IA especializados para resolver qualquer desafio.",
    tags: ["agentes", "orquestração"],
    gradient: "from-neon-orange/20 to-neon-pink/10",
    neonColor: "text-neon-orange",
  },
  {
    id: 3,
    icon: Workflow,
    title: "Pipeline de automação",
    prompt:
      "Projete um pipeline completo para automatizar [processo]: etapas, triggers, validações, fallbacks e métricas de sucesso.",
    description:
      "Desenhe fluxos de automação end-to-end com validação e monitoramento.",
    tags: ["fluxos", "automação"],
    gradient: "from-neon-cyan/20 to-neon-green/10",
    neonColor: "text-neon-cyan",
  },
  {
    id: 4,
    icon: Target,
    title: "Análise estratégica 360º",
    prompt:
      "Realize uma análise estratégica 360º de [empresa/produto/ideia]: SWOT, posicionamento, oportunidades de mercado e roadmap de execução.",
    description:
      "Visão holística completa com análise de mercado, riscos e oportunidades.",
    tags: ["estratégia", "análise"],
    gradient: "from-neon-green/20 to-neon-cyan/10",
    neonColor: "text-neon-green",
  },
  {
    id: 5,
    icon: Lightbulb,
    title: "Brainstorm criativo",
    prompt:
      "Gere 10 ideias inovadoras para [problema/oportunidade] usando técnicas de pensamento lateral, analogias cross-industry e SCAMPER.",
    description:
      "Explosão criativa com técnicas avançadas de ideação e pensamento lateral.",
    tags: ["criatividade", "inovação"],
    gradient: "from-neon-pink/20 to-neon-purple/10",
    neonColor: "text-neon-pink",
  },
  {
    id: 6,
    icon: Layers,
    title: "Arquitetura de sistema",
    prompt:
      "Projete a arquitetura de um sistema para [descrição]: componentes, APIs, banco de dados, autenticação, deploy e escalabilidade.",
    description:
      "Design técnico completo de stack moderna com best practices.",
    tags: ["arquitetura", "tech"],
    gradient: "from-neon-blue/20 to-neon-purple/10",
    neonColor: "text-neon-blue",
  },
  {
    id: 7,
    icon: Rocket,
    title: "Plano de lançamento",
    prompt:
      "Crie um plano de lançamento para [produto/feature]: timeline, canais, mensagem, métricas de sucesso e contingências.",
    description:
      "Go-to-market completo com timeline, canais e métricas de sucesso.",
    tags: ["produto", "lançamento"],
    gradient: "from-neon-orange/20 to-neon-green/10",
    neonColor: "text-neon-orange",
  },
  {
    id: 8,
    icon: Zap,
    title: "Otimizar performance",
    prompt:
      "Analise e otimize a performance de [sistema/processo]: identifique gargalos, proponha soluções, estime impacto e priorize por ROI.",
    description:
      "Diagnóstico de gargalos com soluções priorizadas por retorno.",
    tags: ["performance", "otimização"],
    gradient: "from-neon-cyan/20 to-neon-orange/10",
    neonColor: "text-neon-cyan",
  },
];

interface IdeaSwiperProps {
  onSelectIdea: (prompt: string) => void;
  onStartChat: (prompt: string) => void;
  onClose: () => void;
}

export function IdeaSwiper({ onSelectIdea, onStartChat, onClose }: IdeaSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef(0);
  const totalCards = IDEAS.length;

  const navigate = useCallback(
    (newIndex: number) => {
      setActiveIndex((newIndex + totalCards) % totalCards);
    },
    [totalCards]
  );

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartRef.current = clientX;
  };

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      setDragOffset(clientX - dragStartRef.current);
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    if (Math.abs(dragOffset) > 50) {
      navigate(activeIndex + (dragOffset < 0 ? 1 : -1));
    }
    setIsDragging(false);
    setDragOffset(0);
  }, [isDragging, dragOffset, activeIndex, navigate]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") navigate(activeIndex - 1);
      if (e.key === "ArrowRight") navigate(activeIndex + 1);
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onStartChat(IDEAS[activeIndex].prompt);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, navigate, onClose, onStartChat]);

  const idea = IDEAS[activeIndex];
  const IdeaIcon = idea.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-3"
    >
      {/* Card stack */}
      <div className="relative mx-auto h-[220px] select-none" style={{ perspective: "1000px" }}>
        {IDEAS.map((item, index) => {
          const displayOrder = (index - activeIndex + totalCards) % totalCards;
          const style: CSSProperties = {};

          if (displayOrder === 0) {
            style.transform = `translateX(${dragOffset}px)`;
            style.opacity = 1;
            style.zIndex = totalCards;
          } else if (displayOrder <= 2) {
            const scale = 1 - 0.04 * displayOrder;
            const translateY = -8 * displayOrder;
            style.transform = `scale(${scale}) translateY(${translateY}px)`;
            style.opacity = 1 - 0.25 * displayOrder;
            style.zIndex = totalCards - displayOrder;
          } else if (displayOrder >= totalCards - 2) {
            const reverseOrder = totalCards - displayOrder;
            const scale = 1 - 0.04 * reverseOrder;
            const translateY = -8 * reverseOrder;
            style.transform = `scale(${scale}) translateY(${translateY}px)`;
            style.opacity = 1 - 0.25 * reverseOrder;
            style.zIndex = reverseOrder;
          } else {
            style.transform = "scale(0.85)";
            style.opacity = 0;
            style.zIndex = 0;
            style.pointerEvents = "none";
          }

          const ItemIcon = item.icon;

          return (
            <div
              key={item.id}
              className={cn(
                "absolute inset-0 cursor-grab rounded-xl border border-foreground/[0.08] bg-card/80 backdrop-blur-xl transition-all",
                displayOrder === 0 && isDragging && "cursor-grabbing",
                displayOrder !== 0 && "pointer-events-none"
              )}
              style={{
                ...style,
                transitionDuration: isDragging && displayOrder === 0 ? "0ms" : "300ms",
                transitionProperty: "transform, opacity",
              }}
              onMouseDown={displayOrder === 0 ? handleDragStart : undefined}
              onTouchStart={displayOrder === 0 ? handleDragStart : undefined}
            >
              <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-40", item.gradient)} />

              <div className="relative h-full p-4 flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-3 mb-2">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    "bg-foreground/[0.06] border border-foreground/[0.08]"
                  )}>
                    <ItemIcon className={cn("h-4.5 w-4.5", item.neonColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground/90 leading-tight">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-foreground/35 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Prompt preview */}
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs leading-relaxed text-foreground/55 line-clamp-3">
                    {item.prompt}
                  </p>
                </div>

                {/* Footer: tags + actions */}
                <div className="flex items-center justify-between pt-2 border-t border-foreground/[0.05]">
                  <div className="flex gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[10px] text-foreground/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {displayOrder === 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIdea(item.prompt);
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-foreground/40 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/60"
                      >
                        <Wand2 className="h-3 w-3" />
                        Usar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartChat(item.prompt);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-neon-cyan/10 px-2 py-1 text-[10px] font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/15"
                      >
                        Iniciar
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(activeIndex - 1)}
          className="rounded-lg p-1.5 text-foreground/25 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {IDEAS.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => navigate(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                activeIndex === index
                  ? "w-4 bg-neon-cyan"
                  : "w-1.5 bg-foreground/15 hover:bg-foreground/25"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate(activeIndex + 1)}
          className="rounded-lg p-1.5 text-foreground/25 transition-colors hover:bg-foreground/[0.05] hover:text-foreground/50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Hint */}
      <p className="mt-1 text-center text-[10px] text-foreground/15">
        Arraste para navegar · Enter para iniciar · Esc para fechar
      </p>
    </motion.div>
  );
}
