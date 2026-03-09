import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  Presentation,
  Slide,
  SlideElement,
  SlideCreationMode,
} from "@/types/slides";

function createId() {
  return `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankSlide(layout: Slide["layout"] = "blank"): Slide {
  return {
    id: createId(),
    elements: [],
    background: "transparent",
    layout,
  };
}

export function createTitleSlide(title: string, subtitle?: string): Slide {
  const elements: SlideElement[] = [
    {
      id: createId(),
      type: "text",
      x: 80,
      y: 160,
      width: 800,
      height: 80,
      content: title,
      style: { fontSize: 44, fontWeight: "bold", color: "#ffffff", textAlign: "center" },
    },
  ];

  if (subtitle) {
    elements.push({
      id: createId(),
      type: "text",
      x: 120,
      y: 260,
      width: 720,
      height: 48,
      content: subtitle,
      style: { fontSize: 20, fontWeight: "normal", color: "rgba(255,255,255,0.5)", textAlign: "center" },
    });
  }

  return {
    id: createId(),
    elements,
    background: "linear-gradient(135deg, oklch(0.15 0.02 260) 0%, oklch(0.10 0.01 200) 100%)",
    layout: "title",
  };
}

export function createContentSlide(title: string, bullets: string[]): Slide {
  const elements: SlideElement[] = [
    {
      id: createId(),
      type: "text",
      x: 60,
      y: 40,
      width: 840,
      height: 56,
      content: title,
      style: { fontSize: 32, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
    },
    {
      id: createId(),
      type: "text",
      x: 60,
      y: 120,
      width: 840,
      height: 320,
      content: bullets.map((b) => `• ${b}`).join("\n"),
      style: { fontSize: 18, fontWeight: "normal", color: "rgba(255,255,255,0.7)", textAlign: "left" },
    },
  ];

  return {
    id: createId(),
    elements,
    background: "linear-gradient(135deg, oklch(0.12 0.015 240) 0%, oklch(0.09 0.01 210) 100%)",
    layout: "content",
  };
}

export function createTwoColumnSlide(title: string, left: string[], right: string[]): Slide {
  return {
    id: createId(),
    elements: [
      {
        id: createId(),
        type: "text",
        x: 60,
        y: 36,
        width: 840,
        height: 50,
        content: title,
        style: { fontSize: 30, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      },
      {
        id: createId(),
        type: "text",
        x: 60,
        y: 110,
        width: 400,
        height: 340,
        content: left.map((b) => `• ${b}`).join("\n"),
        style: { fontSize: 16, fontWeight: "normal", color: "rgba(255,255,255,0.7)", textAlign: "left" },
      },
      {
        id: createId(),
        type: "text",
        x: 500,
        y: 110,
        width: 400,
        height: 340,
        content: right.map((b) => `• ${b}`).join("\n"),
        style: { fontSize: 16, fontWeight: "normal", color: "rgba(255,255,255,0.7)", textAlign: "left" },
      },
      {
        id: createId(),
        type: "shape",
        x: 480,
        y: 110,
        width: 2,
        height: 320,
        content: "",
        style: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 1 },
      },
    ],
    background: "linear-gradient(135deg, oklch(0.13 0.012 200) 0%, oklch(0.09 0.008 230) 100%)",
    layout: "two-column",
  };
}

export function createQuoteSlide(quote: string, author: string): Slide {
  return {
    id: createId(),
    elements: [
      {
        id: createId(),
        type: "shape",
        x: 100,
        y: 80,
        width: 760,
        height: 300,
        content: "",
        style: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 24 },
      },
      {
        id: createId(),
        type: "text",
        x: 80,
        y: 100,
        width: 60,
        height: 60,
        content: "\u201C",
        style: { fontSize: 64, fontWeight: "bold", color: "rgba(0,210,210,0.4)", textAlign: "left" },
      },
      {
        id: createId(),
        type: "text",
        x: 140,
        y: 140,
        width: 680,
        height: 160,
        content: quote,
        style: { fontSize: 22, fontWeight: "normal", color: "rgba(255,255,255,0.85)", textAlign: "center" },
      },
      {
        id: createId(),
        type: "text",
        x: 140,
        y: 320,
        width: 680,
        height: 40,
        content: `— ${author}`,
        style: { fontSize: 14, fontWeight: "normal", color: "rgba(255,255,255,0.35)", textAlign: "center" },
      },
    ],
    background: "linear-gradient(135deg, oklch(0.10 0.02 260) 0%, oklch(0.08 0.015 200) 100%)",
    layout: "quote",
  };
}

export function createSectionSlide(title: string, subtitle: string): Slide {
  return {
    id: createId(),
    elements: [
      {
        id: createId(),
        type: "shape",
        x: 0,
        y: 230,
        width: 960,
        height: 3,
        content: "",
        style: { backgroundColor: "rgba(0,210,210,0.15)", borderRadius: 0 },
      },
      {
        id: createId(),
        type: "text",
        x: 80,
        y: 180,
        width: 800,
        height: 60,
        content: title,
        style: { fontSize: 38, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      },
      {
        id: createId(),
        type: "text",
        x: 80,
        y: 250,
        width: 800,
        height: 40,
        content: subtitle,
        style: { fontSize: 16, fontWeight: "normal", color: "rgba(255,255,255,0.4)", textAlign: "left" },
      },
    ],
    background: "linear-gradient(135deg, oklch(0.11 0.018 250) 0%, oklch(0.08 0.01 220) 100%)",
    layout: "title",
  };
}

export function createImageSlide(title: string, description: string): Slide {
  return {
    id: createId(),
    elements: [
      {
        id: createId(),
        type: "shape",
        x: 40,
        y: 40,
        width: 500,
        height: 460,
        content: "",
        style: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16 },
      },
      {
        id: createId(),
        type: "text",
        x: 70,
        y: 230,
        width: 440,
        height: 40,
        content: "[Imagem]",
        style: { fontSize: 14, fontWeight: "normal", color: "rgba(255,255,255,0.15)", textAlign: "center" },
      },
      {
        id: createId(),
        type: "text",
        x: 580,
        y: 60,
        width: 340,
        height: 60,
        content: title,
        style: { fontSize: 28, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      },
      {
        id: createId(),
        type: "text",
        x: 580,
        y: 140,
        width: 340,
        height: 280,
        content: description,
        style: { fontSize: 15, fontWeight: "normal", color: "rgba(255,255,255,0.6)", textAlign: "left" },
      },
    ],
    background: "linear-gradient(135deg, oklch(0.11 0.01 210) 0%, oklch(0.08 0.008 240) 100%)",
    layout: "image",
  };
}

interface SlidesState {
  presentations: Presentation[];
  activePresentationId: string | null;
  activeSlideIndex: number;
  creationMode: SlideCreationMode | null;
  phase: "modes" | "input" | "editor";

  setCreationMode: (mode: SlideCreationMode | null) => void;
  setPhase: (phase: SlidesState["phase"]) => void;
  setActiveSlideIndex: (index: number) => void;

  addPresentation: (title: string, slides: Slide[]) => string;
  setActivePresentation: (id: string | null) => void;
  removePresentation: (id: string) => void;

  addSlide: (slide: Slide) => void;
  updateSlide: (slideId: string, updates: Partial<Slide>) => void;
  removeSlide: (slideId: string) => void;
  duplicateSlide: (slideId: string) => void;

  addElement: (slideId: string, element: SlideElement) => void;
  updateElement: (slideId: string, elementId: string, updates: Partial<SlideElement>) => void;
  removeElement: (slideId: string, elementId: string) => void;

  setActiveSlide: (index: number) => void;
  moveSlide: (fromIndex: number, toIndex: number) => void;
  updatePresentationTheme: (theme: Presentation["theme"]) => void;
  updatePresentationTitle: (title: string) => void;

  getActivePresentation: () => Presentation | undefined;
}

export const useSlidesStore = create<SlidesState>()(
  devtools(
    persist(
      (set, get) => ({
        presentations: [],
        activePresentationId: null,
        activeSlideIndex: 0,
        creationMode: null,
        phase: "modes",

        setCreationMode: (mode) => set({ creationMode: mode }),
        setPhase: (phase) => set({ phase }),
        setActiveSlideIndex: (index) => set({ activeSlideIndex: index }),

        addPresentation: (title, slides) => {
          const id = createId();
          const now = new Date().toISOString();
          const presentation: Presentation = {
            id,
            title,
            slides,
            theme: "dark",
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({
            presentations: [presentation, ...s.presentations],
            activePresentationId: id,
            activeSlideIndex: 0,
          }));
          return id;
        },

        setActivePresentation: (id) => set({ activePresentationId: id, activeSlideIndex: 0 }),

        removePresentation: (id) =>
          set((s) => ({
            presentations: s.presentations.filter((p) => p.id !== id),
            activePresentationId: s.activePresentationId === id ? null : s.activePresentationId,
          })),

        addSlide: (slide) =>
          set((s) => {
            const pres = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!pres) return s;
            return {
              presentations: s.presentations.map((p) =>
                p.id === s.activePresentationId
                  ? { ...p, slides: [...p.slides, slide], updatedAt: new Date().toISOString() }
                  : p
              ),
            };
          }),

        updateSlide: (slideId, updates) =>
          set((s) => ({
            presentations: s.presentations.map((p) =>
              p.id === s.activePresentationId
                ? {
                    ...p,
                    slides: p.slides.map((sl) =>
                      sl.id === slideId ? { ...sl, ...updates } : sl
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),

        removeSlide: (slideId) =>
          set((s) => {
            const pres = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!pres) return s;
            const newSlides = pres.slides.filter((sl) => sl.id !== slideId);
            return {
              presentations: s.presentations.map((p) =>
                p.id === s.activePresentationId
                  ? { ...p, slides: newSlides, updatedAt: new Date().toISOString() }
                  : p
              ),
              activeSlideIndex: Math.min(s.activeSlideIndex, Math.max(0, newSlides.length - 1)),
            };
          }),

        duplicateSlide: (slideId) =>
          set((s) => {
            const pres = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!pres) return s;
            const idx = pres.slides.findIndex((sl) => sl.id === slideId);
            if (idx < 0) return s;
            const dup: Slide = {
              ...pres.slides[idx],
              id: createId(),
              elements: pres.slides[idx].elements.map((el) => ({ ...el, id: createId() })),
            };
            const newSlides = [...pres.slides];
            newSlides.splice(idx + 1, 0, dup);
            return {
              presentations: s.presentations.map((p) =>
                p.id === s.activePresentationId
                  ? { ...p, slides: newSlides, updatedAt: new Date().toISOString() }
                  : p
              ),
              activeSlideIndex: idx + 1,
            };
          }),

        addElement: (slideId, element) =>
          set((s) => ({
            presentations: s.presentations.map((p) =>
              p.id === s.activePresentationId
                ? {
                    ...p,
                    slides: p.slides.map((sl) =>
                      sl.id === slideId
                        ? { ...sl, elements: [...sl.elements, element] }
                        : sl
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),

        updateElement: (slideId, elementId, updates) =>
          set((s) => ({
            presentations: s.presentations.map((p) =>
              p.id === s.activePresentationId
                ? {
                    ...p,
                    slides: p.slides.map((sl) =>
                      sl.id === slideId
                        ? {
                            ...sl,
                            elements: sl.elements.map((el) =>
                              el.id === elementId ? { ...el, ...updates } : el
                            ),
                          }
                        : sl
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),

        removeElement: (slideId, elementId) =>
          set((s) => ({
            presentations: s.presentations.map((p) =>
              p.id === s.activePresentationId
                ? {
                    ...p,
                    slides: p.slides.map((sl) =>
                      sl.id === slideId
                        ? { ...sl, elements: sl.elements.filter((el) => el.id !== elementId) }
                        : sl
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),

        setActiveSlide: (index) => set({ activeSlideIndex: index }),

        moveSlide: (fromIndex, toIndex) =>
          set((s) => {
            const pres = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!pres) return s;
            const slides = [...pres.slides];
            const [moved] = slides.splice(fromIndex, 1);
            slides.splice(toIndex, 0, moved);
            return {
              presentations: s.presentations.map((p) =>
                p.id === s.activePresentationId
                  ? { ...p, slides, updatedAt: new Date().toISOString() }
                  : p
              ),
              activeSlideIndex: toIndex,
            };
          }),

        updatePresentationTheme: (theme) =>
          set((s) => ({
            presentations: s.presentations.map((p) =>
              p.id === s.activePresentationId
                ? { ...p, theme, updatedAt: new Date().toISOString() }
                : p
            ),
          })),

        updatePresentationTitle: (title) =>
          set((s) => ({
            presentations: s.presentations.map((p) =>
              p.id === s.activePresentationId
                ? { ...p, title, updatedAt: new Date().toISOString() }
                : p
            ),
          })),

        getActivePresentation: () => {
          const s = get();
          return s.presentations.find((p) => p.id === s.activePresentationId);
        },
      }),
      {
        name: "origem-slides",
        partialize: (state) => ({
          presentations: state.presentations,
          activePresentationId: state.activePresentationId,
        }),
      }
    ),
    { name: "slides-store" }
  )
);
