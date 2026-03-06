import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export type SlideLayout = "title" | "content" | "two-column" | "image" | "quote" | "blank";

export interface SlideElement {
  id: string;
  type: "title" | "subtitle" | "body" | "image" | "quote" | "author";
  content: string;
  style?: {
    fontSize?: string;
    textAlign?: "left" | "center" | "right";
    fontWeight?: string;
    color?: string;
  };
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  elements: SlideElement[];
  bg: string;
}

export interface Presentation {
  id: string;
  title: string;
  theme: "dark" | "light" | "neon" | "gradient";
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

function createDefaultSlide(layout: SlideLayout): Slide {
  const id = nanoid();
  const elements: SlideElement[] = [];

  switch (layout) {
    case "title":
      elements.push(
        { id: nanoid(), type: "title", content: "Titulo da Apresentacao" },
        { id: nanoid(), type: "subtitle", content: "Subtitulo aqui" },
      );
      break;
    case "content":
      elements.push(
        { id: nanoid(), type: "title", content: "Titulo do Slide" },
        { id: nanoid(), type: "body", content: "Adicione seu conteudo aqui. Clique para editar." },
      );
      break;
    case "two-column":
      elements.push(
        { id: nanoid(), type: "title", content: "Titulo" },
        { id: nanoid(), type: "body", content: "Coluna esquerda" },
        { id: nanoid(), type: "body", content: "Coluna direita" },
      );
      break;
    case "image":
      elements.push(
        { id: nanoid(), type: "title", content: "Titulo" },
        { id: nanoid(), type: "image", content: "" },
      );
      break;
    case "quote":
      elements.push(
        { id: nanoid(), type: "quote", content: "Sua citacao aqui..." },
        { id: nanoid(), type: "author", content: "— Autor" },
      );
      break;
    case "blank":
      break;
  }

  return { id, layout, elements, bg: "" };
}

interface SlidesState {
  presentations: Presentation[];
  activePresentationId: string | null;
  activeSlideIndex: number;

  createPresentation: (title: string) => string;
  deletePresentation: (id: string) => void;
  setActivePresentation: (id: string | null) => void;
  setActiveSlide: (index: number) => void;

  addSlide: (layout: SlideLayout) => void;
  removeSlide: (index: number) => void;
  moveSlide: (from: number, to: number) => void;
  duplicateSlide: (index: number) => void;

  updateElement: (slideIndex: number, elementId: string, content: string) => void;
  updateSlideLayout: (slideIndex: number, layout: SlideLayout) => void;
  updatePresentationTheme: (theme: Presentation["theme"]) => void;
  updatePresentationTitle: (title: string) => void;
}

export const useSlidesStore = create<SlidesState>()(
  devtools(
    persist(
      (set, get) => ({
        presentations: [],
        activePresentationId: null,
        activeSlideIndex: 0,

        createPresentation: (title) => {
          const id = nanoid();
          const now = new Date().toISOString();
          const presentation: Presentation = {
            id,
            title,
            theme: "dark",
            slides: [createDefaultSlide("title")],
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({
            presentations: [...s.presentations, presentation],
            activePresentationId: id,
            activeSlideIndex: 0,
          }));
          return id;
        },

        deletePresentation: (id) =>
          set((s) => ({
            presentations: s.presentations.filter((p) => p.id !== id),
            activePresentationId: s.activePresentationId === id ? null : s.activePresentationId,
            activeSlideIndex: s.activePresentationId === id ? 0 : s.activeSlideIndex,
          })),

        setActivePresentation: (id) => set({ activePresentationId: id, activeSlideIndex: 0 }),
        setActiveSlide: (index) => set({ activeSlideIndex: index }),

        addSlide: (layout) =>
          set((s) => {
            const p = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!p) return s;
            const newSlide = createDefaultSlide(layout);
            const newSlides = [...p.slides];
            newSlides.splice(s.activeSlideIndex + 1, 0, newSlide);
            return {
              presentations: s.presentations.map((pr) =>
                pr.id === p.id ? { ...pr, slides: newSlides, updatedAt: new Date().toISOString() } : pr
              ),
              activeSlideIndex: s.activeSlideIndex + 1,
            };
          }),

        removeSlide: (index) =>
          set((s) => {
            const p = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!p || p.slides.length <= 1) return s;
            const newSlides = p.slides.filter((_, i) => i !== index);
            return {
              presentations: s.presentations.map((pr) =>
                pr.id === p.id ? { ...pr, slides: newSlides, updatedAt: new Date().toISOString() } : pr
              ),
              activeSlideIndex: Math.min(s.activeSlideIndex, newSlides.length - 1),
            };
          }),

        moveSlide: (from, to) =>
          set((s) => {
            const p = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!p) return s;
            const newSlides = [...p.slides];
            const [moved] = newSlides.splice(from, 1);
            newSlides.splice(to, 0, moved);
            return {
              presentations: s.presentations.map((pr) =>
                pr.id === p.id ? { ...pr, slides: newSlides, updatedAt: new Date().toISOString() } : pr
              ),
              activeSlideIndex: to,
            };
          }),

        duplicateSlide: (index) =>
          set((s) => {
            const p = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!p) return s;
            const original = p.slides[index];
            const dup: Slide = {
              ...original,
              id: nanoid(),
              elements: original.elements.map((e) => ({ ...e, id: nanoid() })),
            };
            const newSlides = [...p.slides];
            newSlides.splice(index + 1, 0, dup);
            return {
              presentations: s.presentations.map((pr) =>
                pr.id === p.id ? { ...pr, slides: newSlides, updatedAt: new Date().toISOString() } : pr
              ),
              activeSlideIndex: index + 1,
            };
          }),

        updateElement: (slideIndex, elementId, content) =>
          set((s) => {
            const p = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!p) return s;
            return {
              presentations: s.presentations.map((pr) =>
                pr.id === p.id
                  ? {
                      ...pr,
                      updatedAt: new Date().toISOString(),
                      slides: pr.slides.map((sl, i) =>
                        i === slideIndex
                          ? { ...sl, elements: sl.elements.map((el) => (el.id === elementId ? { ...el, content } : el)) }
                          : sl
                      ),
                    }
                  : pr
              ),
            };
          }),

        updateSlideLayout: (slideIndex, layout) =>
          set((s) => {
            const p = s.presentations.find((p) => p.id === s.activePresentationId);
            if (!p) return s;
            const newSlide = createDefaultSlide(layout);
            return {
              presentations: s.presentations.map((pr) =>
                pr.id === p.id
                  ? {
                      ...pr,
                      updatedAt: new Date().toISOString(),
                      slides: pr.slides.map((sl, i) => (i === slideIndex ? { ...sl, ...newSlide, id: sl.id } : sl)),
                    }
                  : pr
              ),
            };
          }),

        updatePresentationTheme: (theme) =>
          set((s) => ({
            presentations: s.presentations.map((p) =>
              p.id === s.activePresentationId ? { ...p, theme, updatedAt: new Date().toISOString() } : p
            ),
          })),

        updatePresentationTitle: (title) =>
          set((s) => ({
            presentations: s.presentations.map((p) =>
              p.id === s.activePresentationId ? { ...p, title, updatedAt: new Date().toISOString() } : p
            ),
          })),
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
