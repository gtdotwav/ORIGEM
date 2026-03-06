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
