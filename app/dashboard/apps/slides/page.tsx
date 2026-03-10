"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Copy,
  Image as ImageIcon,
  PenTool,
  Plus,
  Presentation,
  Send,
  Blocks,
  Square,
  Trash2,
  Type,
  Upload,
  Zap,
} from "lucide-react";
import {
  useSlidesStore,
  createBlankSlide,
  createTitleSlide,
  createContentSlide,
  createTwoColumnSlide,
  createQuoteSlide,
  createSectionSlide,
  createImageSlide,
} from "@/stores/slides-store";
import type { SlideCreationMode, Slide } from "@/types/slides";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const MODES: {
  id: SlideCreationMode;
  icon: typeof PenTool;
  title: string;
  description: string;
  color: string;
  accent: string;
  glow: string;
}[] = [
  {
    id: "manual",
    icon: PenTool,
    title: "Manual",
    description: "Crie seus slides do zero, um a um, com total controle.",
    color: "text-neon-cyan",
    accent: "border-neon-cyan/20 bg-neon-cyan/5 hover:border-neon-cyan/40 hover:bg-neon-cyan/10",
    glow: "group-hover:shadow-[0_0_24px_rgba(0,210,210,0.12)]",
  },
  {
    id: "prompt",
    icon: Blocks,
    title: "Por Prompt",
    description: "Descreva o que quer e a IA gera seus slides em tempo real.",
    color: "text-neon-purple",
    accent: "border-neon-purple/20 bg-neon-purple/5 hover:border-neon-purple/40 hover:bg-neon-purple/10",
    glow: "group-hover:shadow-[0_0_24px_rgba(168,85,247,0.12)]",
  },
  {
    id: "basics",
    icon: Zap,
    title: "Basicos",
    description: "Informe titulo, topico e numero de slides. A IA faz o resto.",
    color: "text-neon-green",
    accent: "border-neon-green/20 bg-neon-green/5 hover:border-neon-green/40 hover:bg-neon-green/10",
    glow: "group-hover:shadow-[0_0_24px_rgba(34,197,94,0.12)]",
  },
  {
    id: "enhance",
    icon: Upload,
    title: "Aprimorar",
    description: "Cole o conteudo de uma apresentacao existente e a IA melhora.",
    color: "text-neon-orange",
    accent: "border-neon-orange/20 bg-neon-orange/5 hover:border-neon-orange/40 hover:bg-neon-orange/10",
    glow: "group-hover:shadow-[0_0_24px_rgba(255,160,0,0.12)]",
  },
];

function createId() {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/*  Smart Slide Generation                                             */
/* ------------------------------------------------------------------ */

/** Split text into meaningful sentences/phrases */
function extractTopics(text: string): string[] {
  return text
    .split(/[.!?\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

/** Pick a key phrase from text (first N words, up to a natural break) */
function extractTitle(text: string, maxWords = 8): string {
  const clean = text.replace(/^(crie|faca|gere|monte|cria|elabore|apresentacao|slides?|sobre)\s+/gi, "").trim();
  const words = clean.split(/\s+/);
  if (words.length <= maxWords) return capitalize(clean);
  // Find a natural break
  const sub = words.slice(0, maxWords).join(" ");
  return capitalize(sub);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const LAYOUT_CYCLE: Array<"content" | "two-column" | "image" | "quote" | "content"> = [
  "content", "two-column", "content", "quote", "image",
];

function generateSlidesFromPrompt(prompt: string): Slide[] {
  const topics = extractTopics(prompt);
  const mainTitle = extractTitle(prompt);
  const slides: Slide[] = [createTitleSlide(mainTitle, "Apresentacao gerada por IA")];

  // If very short prompt, expand into sections
  if (topics.length <= 1) {
    slides.push(createContentSlide("Contexto", [
      `Introducao ao tema: ${mainTitle}`,
      "Cenario atual e relevancia",
      "Objetivo desta apresentacao",
    ]));
    slides.push(createTwoColumnSlide("Analise", [
      "Pontos fortes identificados",
      "Oportunidades de melhoria",
      "Dados de suporte",
    ], [
      "Desafios encontrados",
      "Riscos potenciais",
      "Mitigacoes propostas",
    ]));
    slides.push(createQuoteSlide(
      `${mainTitle} representa uma oportunidade transformadora para quem souber aproveitar.`,
      "Insight estrategico"
    ));
    slides.push(createContentSlide("Plano de Acao", [
      "Fase 1: Pesquisa e planejamento",
      "Fase 2: Implementacao e testes",
      "Fase 3: Lancamento e iteracao",
    ]));
    slides.push(createSectionSlide("Conclusao", "Proximos passos e chamada para acao"));
    return slides;
  }

  // Rich prompt — distribute topics across varied layouts
  for (let i = 0; i < topics.length; i++) {
    const layout = LAYOUT_CYCLE[i % LAYOUT_CYCLE.length];
    const topic = topics[i];
    const nextTopic = topics[i + 1];

    if (layout === "two-column" && nextTopic) {
      slides.push(createTwoColumnSlide(
        extractTitle(topic, 5),
        [capitalize(topic), "Analise detalhada", "Impacto esperado"],
        [capitalize(nextTopic), "Comparacao pratica", "Resultados projetados"]
      ));
      i++; // consume next topic
    } else if (layout === "quote") {
      slides.push(createQuoteSlide(capitalize(topic), mainTitle));
    } else if (layout === "image") {
      slides.push(createImageSlide(
        extractTitle(topic, 5),
        capitalize(topic) + ".\n\nEste ponto merece destaque visual para comunicar o impacto de forma clara e memoravel."
      ));
    } else {
      // Content slide — try to create 3 bullets from the topic
      const words = topic.split(/\s+/);
      const mid = Math.ceil(words.length / 3);
      const bullets = words.length > 8
        ? [
            capitalize(words.slice(0, mid).join(" ")),
            capitalize(words.slice(mid, mid * 2).join(" ")),
            capitalize(words.slice(mid * 2).join(" ")),
          ]
        : [capitalize(topic), "Detalhamento e contexto", "Aplicacao pratica"];
      slides.push(createContentSlide(extractTitle(topic, 5), bullets));
    }
  }

  // Always end with a conclusion
  slides.push(createSectionSlide("Conclusao", "Resumo e proximos passos"));
  return slides;
}

function generateSlidesFromBasics(title: string, topic: string, numSlides: number): Slide[] {
  const slides: Slide[] = [createTitleSlide(title, topic)];
  const remaining = numSlides - 1;

  const sections: Array<{ make: () => Slide }> = [
    { make: () => createContentSlide("Introducao", [
      `Contexto sobre ${topic}`,
      "Por que este tema e relevante agora",
      "Objetivos e escopo da apresentacao",
    ])},
    { make: () => createTwoColumnSlide("Panorama Atual", [
      "Cenario do mercado",
      "Tendencias emergentes",
      `Dados sobre ${topic}`,
    ], [
      "Desafios identificados",
      "Oportunidades reais",
      "Benchmark competitivo",
    ])},
    { make: () => createContentSlide("Estrategia", [
      "Abordagem recomendada",
      "Recursos e investimento necessarios",
      "Cronograma de execucao",
    ])},
    { make: () => createQuoteSlide(
      `Investir em ${topic} hoje e garantir competitividade amanha.`,
      title
    )},
    { make: () => createImageSlide("Implementacao", [
      `Fases do projeto de ${topic}:`,
      "",
      "1. Planejamento e pesquisa",
      "2. Prototipacao e validacao",
      "3. Desenvolvimento e testes",
      "4. Lancamento e monitoramento",
    ].join("\n"))},
    { make: () => createTwoColumnSlide("Resultados Esperados", [
      "Metricas de sucesso",
      "KPIs principais",
      "ROI projetado",
    ], [
      "Impacto no negocio",
      "Beneficios indiretos",
      "Valor a longo prazo",
    ])},
    { make: () => createContentSlide("Proximos Passos", [
      "Acoes imediatas recomendadas",
      "Responsaveis e prazos",
      "Pontos de revisao e ajuste",
    ])},
    { make: () => createSectionSlide("Conclusao", `${title} — Resumo executivo e agradecimentos`)},
  ];

  for (let i = 0; i < Math.min(remaining, sections.length); i++) {
    slides.push(sections[i].make());
  }

  return slides;
}

function generateSlidesFromContent(content: string): Slide[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return [createTitleSlide("Apresentacao", "Gerada por IA")];

  const title = lines[0].replace(/^(slide\s*\d+\s*[:.-]?\s*)/i, "").trim();
  const slides: Slide[] = [createTitleSlide(title || "Apresentacao Aprimorada", "Conteudo reestruturado por IA")];

  let currentTitle = "";
  let currentBullets: string[] = [];
  let slideCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTitle = /^(slide\s*\d+|#{1,3}\s|[A-Z][^.!?]*$)/.test(line) && line.length < 60;
    const isBullet = /^[-•*]\s/.test(line);

    if (isTitle) {
      // Flush previous
      if (currentTitle && currentBullets.length > 0) {
        const layout = LAYOUT_CYCLE[slideCount % LAYOUT_CYCLE.length];
        if (layout === "two-column" && currentBullets.length >= 4) {
          const mid = Math.ceil(currentBullets.length / 2);
          slides.push(createTwoColumnSlide(currentTitle, currentBullets.slice(0, mid), currentBullets.slice(mid)));
        } else if (layout === "quote" && currentBullets.length >= 1) {
          slides.push(createQuoteSlide(currentBullets[0], currentTitle));
        } else {
          slides.push(createContentSlide(currentTitle, currentBullets));
        }
        slideCount++;
      }
      currentTitle = line.replace(/^(slide\s*\d+\s*[:.-]?\s*|#{1,3}\s*)/i, "").trim();
      currentBullets = [];
    } else {
      currentBullets.push(isBullet ? line.replace(/^[-•*]\s+/, "") : line);
    }
  }

  // Flush last section
  if (currentTitle && currentBullets.length > 0) {
    slides.push(createContentSlide(currentTitle, currentBullets));
  } else if (currentBullets.length > 0) {
    slides.push(createContentSlide("Conteudo", currentBullets));
  }

  return slides;
}

/* ------------------------------------------------------------------ */
/*  AI-Powered Generation (calls /api/chat/completions if available)   */
/* ------------------------------------------------------------------ */
interface AISlideData {
  layout: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  left?: string[];
  right?: string[];
  quote?: string;
  author?: string;
  description?: string;
}

function aiDataToSlides(data: AISlideData[]): Slide[] {
  return data.map((s) => {
    switch (s.layout) {
      case "title":
        return createTitleSlide(s.title ?? "Sem titulo", s.subtitle);
      case "two-column":
        return createTwoColumnSlide(s.title ?? "", s.left ?? [], s.right ?? []);
      case "quote":
        return createQuoteSlide(s.quote ?? "", s.author ?? "");
      case "image":
        return createImageSlide(s.title ?? "", s.description ?? "");
      case "section":
        return createSectionSlide(s.title ?? "", s.subtitle ?? "");
      default:
        return createContentSlide(s.title ?? "", s.bullets ?? []);
    }
  });
}

async function generateWithAI(prompt: string): Promise<Slide[] | null> {
  try {
    const res = await fetch("/api/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Voce e um designer de apresentacoes profissional. Gere slides em JSON.
Cada slide deve ter um "layout" e campos relevantes. Layouts disponiveis:
- "title": { layout, title, subtitle }
- "content": { layout, title, bullets: string[] }
- "two-column": { layout, title, left: string[], right: string[] }
- "quote": { layout, quote, author }
- "image": { layout, title, description }
- "section": { layout, title, subtitle }

Regras:
- Comece com um slide "title"
- Varie os layouts (nao use so "content")
- Use pelo menos um "two-column" e um "quote"
- Termine com "section" de conclusao
- Gere entre 5-10 slides
- Conteudo em portugues
- Responda SOMENTE com o array JSON, sem markdown, sem explicacao.`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? json.content ?? "";
    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as AISlideData[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return aiDataToSlides(parsed);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Mode Selection Phase                                               */
/* ------------------------------------------------------------------ */
function ModeSelection({
  onSelect,
}: {
  onSelect: (mode: SlideCreationMode) => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-center gap-2"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04]">
          <Presentation className="h-7 w-7 text-foreground/30" />
        </div>
        <h1 className="text-xl font-semibold text-foreground/80">
          Criar Apresentacao
        </h1>
        <p className="text-sm text-foreground/35">
          Escolha como deseja comecar
        </p>
      </motion.div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {MODES.map((mode, i) => (
          <motion.button
            key={mode.id}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: "spring", damping: 25, stiffness: 300 }}
            onClick={() => onSelect(mode.id)}
            className={`group relative rounded-2xl border p-5 text-left transition-all ${mode.accent} ${mode.glow}`}
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.03) 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <div className="mb-3 flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border border-current/20 bg-current/10 ${mode.color}`}
                style={{ borderColor: "currentColor", backgroundColor: "transparent" }}
              >
                <mode.icon className={`h-4 w-4 ${mode.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-foreground/80">
                {mode.title}
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-foreground/35">
              {mode.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Input Phase                                                        */
/* ------------------------------------------------------------------ */
function InputPhase({
  mode,
  onBack,
  onGenerate,
}: {
  mode: SlideCreationMode;
  onBack: () => void;
  onGenerate: (slides: Slide[], title: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [numSlides, setNumSlides] = useState(5);
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const modeMeta = MODES.find((m) => m.id === mode)!;

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    let slides: Slide[] | null = null;
    let presTitle: string;

    if (mode === "prompt") {
      presTitle = extractTitle(prompt);
      // Try AI generation first, fallback to client-side
      slides = await generateWithAI(prompt);
      if (!slides) slides = generateSlidesFromPrompt(prompt);
    } else if (mode === "basics") {
      presTitle = title || "Sem titulo";
      slides = await generateWithAI(`Crie uma apresentacao com titulo "${title}" sobre o topico "${topic}" com ${numSlides} slides.`);
      if (!slides) slides = generateSlidesFromBasics(title, topic, numSlides);
    } else {
      presTitle = content.split("\n")[0]?.slice(0, 40) ?? "Aprimorada";
      slides = await generateWithAI(`Reestruture e aprimore este conteudo de apresentacao em slides profissionais:\n\n${content}`);
      if (!slides) slides = generateSlidesFromContent(content);
    }

    setIsGenerating(false);
    onGenerate(slides, presTitle);
  }, [mode, prompt, title, topic, numSlides, content, onGenerate]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-foreground/35 transition-colors hover:text-foreground/60"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar
        </button>

        <div className="mb-6 flex items-center gap-2.5">
          <modeMeta.icon className={`h-5 w-5 ${modeMeta.color}`} />
          <h2 className="text-lg font-semibold text-foreground/80">
            {modeMeta.title}
          </h2>
        </div>

        <div
          className="rounded-2xl border border-foreground/[0.08] p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.03) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          {mode === "prompt" && (
            <div className="space-y-3">
              <p className="text-xs text-foreground/40">
                Descreva o que deseja apresentar. A IA vai criar slides
                estruturados.
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Uma apresentacao sobre o futuro da inteligencia artificial no Brasil, com dados de mercado, cases de sucesso e proximos passos para empresas..."
                rows={5}
                className="w-full resize-none rounded-xl border border-foreground/[0.06] bg-black/20 p-3 text-sm text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-purple/30"
                autoFocus
              />
            </div>
          )}

          {mode === "basics" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-foreground/30">
                  Titulo
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Estrategia de Growth 2026"
                  className="w-full rounded-lg border border-foreground/[0.06] bg-black/20 px-3 py-2 text-sm text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-green/30"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-foreground/30">
                  Topico principal
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Marketing digital e aquisicao de clientes"
                  className="w-full rounded-lg border border-foreground/[0.06] bg-black/20 px-3 py-2 text-sm text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-green/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-foreground/30">
                  Numero de slides
                </label>
                <input
                  type="number"
                  value={numSlides}
                  onChange={(e) =>
                    setNumSlides(Math.max(2, Math.min(20, Number(e.target.value))))
                  }
                  min={2}
                  max={20}
                  className="w-24 rounded-lg border border-foreground/[0.06] bg-black/20 px-3 py-2 text-sm tabular-nums text-foreground/80 outline-none focus:border-neon-green/30"
                />
              </div>
            </div>
          )}

          {mode === "enhance" && (
            <div className="space-y-3">
              <p className="text-xs text-foreground/40">
                Cole o conteudo da sua apresentacao existente. A IA vai
                reestruturar e aprimorar.
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"Slide 1: Titulo da apresentacao\nSlide 2: Introducao ao tema\n- Ponto 1\n- Ponto 2\nSlide 3: Desenvolvimento\n..."}
                rows={8}
                className="w-full resize-none rounded-xl border border-foreground/[0.06] bg-black/20 p-3 font-mono text-xs text-foreground/80 placeholder:text-foreground/20 outline-none focus:border-neon-orange/30"
                autoFocus
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              (mode === "prompt" && !prompt.trim()) ||
              (mode === "basics" && !title.trim()) ||
              (mode === "enhance" && !content.trim())
            }
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              mode === "prompt"
                ? "border-neon-purple/30 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20"
                : mode === "basics"
                  ? "border-neon-green/30 bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
                  : "border-neon-orange/30 bg-neon-orange/10 text-neon-orange hover:bg-neon-orange/20"
            }`}
          >
            {isGenerating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gerando...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                {mode === "prompt"
                  ? "Gerar Apresentacao"
                  : mode === "basics"
                    ? "Criar Slides"
                    : "Aprimorar"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide Thumbnail                                                    */
/* ------------------------------------------------------------------ */
function SlideThumbnail({
  slide,
  index,
  isActive,
  onClick,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const titleEl = slide.elements.find(
    (el) => el.type === "text" && (el.style.fontSize ?? 0) >= 28
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full rounded-lg border p-1 transition-all ${
        isActive
          ? "border-neon-cyan/40 bg-neon-cyan/8"
          : "border-foreground/[0.06] hover:border-foreground/[0.15]"
      }`}
    >
      <div
        className="flex aspect-video w-full items-center justify-center overflow-hidden rounded"
        style={{ background: slide.background || "oklch(0.12 0.01 240)" }}
      >
        {titleEl ? (
          <p className="px-1 text-center text-[7px] font-medium leading-tight text-white/70">
            {titleEl.content.slice(0, 60)}
          </p>
        ) : (
          <span className="text-[6px] text-white/20">Vazio</span>
        )}
      </div>
      <p
        className={`mt-0.5 text-center text-[8px] tabular-nums ${
          isActive ? "text-neon-cyan" : "text-foreground/25"
        }`}
      >
        {index + 1}
      </p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide Canvas                                                       */
/* ------------------------------------------------------------------ */
function SlideCanvas({ slide }: { slide: Slide }) {
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-foreground/[0.06]"
      style={{ background: slide.background || "oklch(0.12 0.01 240)" }}
    >
      {slide.elements.map((el) => (
        <div
          key={el.id}
          className="absolute"
          style={{
            left: `${(el.x / 960) * 100}%`,
            top: `${(el.y / 540) * 100}%`,
            width: `${(el.width / 960) * 100}%`,
            height: `${(el.height / 540) * 100}%`,
          }}
        >
          {el.type === "text" && (
            <p
              className="whitespace-pre-wrap"
              style={{
                fontSize: `${Math.max(8, (el.style.fontSize ?? 16) * 0.6)}px`,
                fontWeight: el.style.fontWeight,
                color: el.style.color ?? "#fff",
                textAlign: el.style.textAlign,
                lineHeight: 1.4,
              }}
            >
              {el.content}
            </p>
          )}
          {el.type === "shape" && (
            <div
              className="h-full w-full"
              style={{
                backgroundColor: el.style.backgroundColor ?? "rgba(255,255,255,0.1)",
                borderRadius: el.style.borderRadius ?? 0,
                opacity: el.style.opacity ?? 1,
              }}
            />
          )}
        </div>
      ))}

      {slide.elements.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-white/15">Slide vazio</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide Editor                                                       */
/* ------------------------------------------------------------------ */
function SlideEditor({ onBack }: { onBack: () => void }) {
  const presentation = useSlidesStore((s) => s.getActivePresentation());
  const activeSlideIndex = useSlidesStore((s) => s.activeSlideIndex);
  const setActiveSlideIndex = useSlidesStore((s) => s.setActiveSlideIndex);
  const addSlide = useSlidesStore((s) => s.addSlide);
  const removeSlide = useSlidesStore((s) => s.removeSlide);
  const duplicateSlide = useSlidesStore((s) => s.duplicateSlide);
  const addElement = useSlidesStore((s) => s.addElement);

  if (!presentation) return null;

  const activeSlide = presentation.slides[activeSlideIndex];

  const handleAddText = () => {
    if (!activeSlide) return;
    addElement(activeSlide.id, {
      id: createId(),
      type: "text",
      x: 60,
      y: 200,
      width: 400,
      height: 60,
      content: "Novo texto",
      style: { fontSize: 24, fontWeight: "normal", color: "#ffffff", textAlign: "left" },
    });
  };

  const handleAddShape = () => {
    if (!activeSlide) return;
    addElement(activeSlide.id, {
      id: createId(),
      type: "shape",
      x: 300,
      y: 180,
      width: 200,
      height: 120,
      content: "",
      style: { backgroundColor: "rgba(0,210,210,0.15)", borderRadius: 12, opacity: 1 },
    });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between border-b border-foreground/[0.06] px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/30 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div>
            <p className="text-sm font-medium text-foreground/70">
              {presentation.title}
            </p>
            <p className="text-[10px] text-foreground/25">
              {presentation.slides.length} slides
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleAddText}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
          >
            <Type className="h-3 w-3" />
            Texto
          </button>
          <button
            type="button"
            onClick={handleAddShape}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
          >
            <Square className="h-3 w-3" />
            Forma
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground/40 transition-all hover:bg-foreground/[0.06] hover:text-foreground/60"
          >
            <ImageIcon className="h-3 w-3" />
            Imagem
          </button>
          <div className="mx-1 h-4 w-px bg-foreground/[0.06]" />
          {activeSlide && (
            <>
              <button
                type="button"
                onClick={() => duplicateSlide(activeSlide.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/25 transition-all hover:bg-foreground/[0.06] hover:text-foreground/50"
                title="Duplicar slide"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (presentation.slides.length > 1) {
                    removeSlide(activeSlide.id);
                  }
                }}
                disabled={presentation.slides.length <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/25 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                title="Remover slide"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — thumbnails */}
        <div className="w-28 shrink-0 space-y-1.5 overflow-y-auto border-r border-foreground/[0.06] p-2">
          {presentation.slides.map((slide, i) => (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
            >
              <SlideThumbnail
                slide={slide}
                index={i}
                isActive={i === activeSlideIndex}
                onClick={() => setActiveSlideIndex(i)}
              />
            </motion.div>
          ))}
          <button
            type="button"
            onClick={() => addSlide(createBlankSlide())}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-foreground/[0.08] py-2 text-[10px] text-foreground/20 transition-all hover:border-neon-cyan/30 hover:text-neon-cyan"
          >
            <Plus className="h-2.5 w-2.5" />
            Novo
          </button>
        </div>

        {/* Center — canvas */}
        <div className="flex flex-1 items-center justify-center bg-black/20 p-8">
          {activeSlide && (
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl"
            >
              <SlideCanvas slide={activeSlide} />
            </motion.div>
          )}
        </div>

        {/* Right — properties */}
        <div className="w-56 shrink-0 space-y-3 overflow-y-auto border-l border-foreground/[0.06] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/25">
            Propriedades
          </p>

          {activeSlide && (
            <>
              <div>
                <p className="mb-1 text-[10px] text-foreground/30">Layout</p>
                <p className="rounded-md border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-1.5 text-[11px] text-foreground/50">
                  {activeSlide.layout}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[10px] text-foreground/30">Elementos</p>
                <p className="text-xs tabular-nums text-foreground/50">
                  {activeSlide.elements.length}
                </p>
              </div>

              {activeSlide.elements.length > 0 && (
                <div className="space-y-1">
                  <p className="mb-1 text-[10px] text-foreground/30">Lista</p>
                  {activeSlide.elements.map((el) => (
                    <div
                      key={el.id}
                      className="rounded-md border border-foreground/[0.04] bg-foreground/[0.02] px-2 py-1.5"
                    >
                      <p className="text-[10px] text-foreground/40">
                        {el.type === "text" ? "Texto" : el.type === "shape" ? "Forma" : "Imagem"}
                      </p>
                      {el.type === "text" && (
                        <p className="mt-0.5 truncate text-[9px] text-foreground/20">
                          {el.content.slice(0, 30)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function SlidesPage() {
  const phase = useSlidesStore((s) => s.phase);
  const creationMode = useSlidesStore((s) => s.creationMode);
  const setCreationMode = useSlidesStore((s) => s.setCreationMode);
  const setPhase = useSlidesStore((s) => s.setPhase);
  const addPresentation = useSlidesStore((s) => s.addPresentation);

  const handleModeSelect = (mode: SlideCreationMode) => {
    setCreationMode(mode);
    if (mode === "manual") {
      addPresentation("Sem titulo", [createBlankSlide("title")]);
      setPhase("editor");
    } else {
      setPhase("input");
    }
  };

  const handleGenerate = (slides: Slide[], title: string) => {
    addPresentation(title, slides);
    setPhase("editor");
  };

  const handleBackToModes = () => {
    setCreationMode(null);
    setPhase("modes");
  };

  return (
    <AnimatePresence mode="wait">
      {phase === "modes" && (
        <motion.div
          key="modes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ModeSelection onSelect={handleModeSelect} />
        </motion.div>
      )}

      {phase === "input" && creationMode && (
        <motion.div
          key="input"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <InputPhase
            mode={creationMode}
            onBack={handleBackToModes}
            onGenerate={handleGenerate}
          />
        </motion.div>
      )}

      {phase === "editor" && (
        <motion.div
          key="editor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SlideEditor onBack={handleBackToModes} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
