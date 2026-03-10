"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Slide, SlideElement, Presentation } from "@/types/slides";

const THEME_STYLES: Record<Presentation["theme"], Record<string, string>> = {
  dark: {
    bg: "bg-[#1a1a2e]",
    title: "text-white text-3xl font-bold",
    subtitle: "text-white/50 text-lg",
    body: "text-white/70 text-base",
    image: "text-white/40 text-sm",
    quote: "text-white/80 text-xl italic",
    author: "text-white/40 text-sm",
  },
  light: {
    bg: "bg-white",
    title: "text-gray-900 text-3xl font-bold",
    subtitle: "text-gray-500 text-lg",
    body: "text-gray-700 text-base",
    image: "text-gray-400 text-sm",
    quote: "text-gray-800 text-xl italic",
    author: "text-gray-400 text-sm",
  },
  neon: {
    bg: "bg-[#0a0a1a]",
    title: "text-cyan-300 text-3xl font-bold",
    subtitle: "text-purple-400 text-lg",
    body: "text-cyan-100/70 text-base",
    image: "text-cyan-100/40 text-sm",
    quote: "text-cyan-200 text-xl italic",
    author: "text-purple-300/60 text-sm",
  },
  gradient: {
    bg: "bg-gradient-to-br from-[#1a1a2e] to-[#2d1b4e]",
    title: "text-white text-3xl font-bold",
    subtitle: "text-purple-200/60 text-lg",
    body: "text-white/70 text-base",
    image: "text-white/30 text-sm",
    quote: "text-white/90 text-xl italic",
    author: "text-purple-200/50 text-sm",
  },
};

interface EditableTextProps {
  element: SlideElement;
  themeClass: string;
  onUpdate: (content: string) => void;
}

function EditableText({ element, themeClass, onUpdate }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(element.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setValue(element.content);
    });
  }, [element.content]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onUpdate(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
            e.preventDefault();
            setEditing(false);
            onUpdate(value);
          }
        }}
        className={cn(
          themeClass,
          "w-full resize-none bg-transparent outline-none ring-1 ring-neon-orange/40 rounded px-2 py-1"
        )}
        rows={element.type === "body" ? 4 : 2}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={cn(
        themeClass,
        "cursor-text rounded px-2 py-1 transition-colors hover:ring-1 hover:ring-foreground/20",
        !element.content && "opacity-40"
      )}
    >
      {element.content || `Clique para editar ${element.type}`}
    </div>
  );
}

interface SlideCanvasProps {
  slide: Slide;
  theme: Presentation["theme"];
  slideIndex: number;
  onUpdateElement: (slideIndex: number, elementId: string, content: string) => void;
}

export function SlideCanvas({ slide, theme, slideIndex, onUpdateElement }: SlideCanvasProps) {
  const styles = THEME_STYLES[theme];

  const renderElement = (el: SlideElement) => {
    const cls = styles[el.type] || styles.body;
    return (
      <EditableText
        key={el.id}
        element={el}
        themeClass={cls}
        onUpdate={(content) => onUpdateElement(slideIndex, el.id, content)}
      />
    );
  };

  const renderLayout = () => {
    switch (slide.layout) {
      case "title":
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            {slide.elements.map(renderElement)}
          </div>
        );
      case "content":
        return (
          <div className="flex flex-1 flex-col gap-6 p-10">
            {slide.elements.map(renderElement)}
          </div>
        );
      case "two-column": {
        const [title, ...cols] = slide.elements;
        return (
          <div className="flex flex-1 flex-col gap-6 p-10">
            {title && renderElement(title)}
            <div className="grid flex-1 grid-cols-2 gap-6">
              {cols.map(renderElement)}
            </div>
          </div>
        );
      }
      case "image":
        return (
          <div className="flex flex-1 flex-col gap-4 p-10">
            {slide.elements.map((el) =>
              el.type === "image" ? (
                <div
                  key={el.id}
                  className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-foreground/20"
                >
                  <span className="text-sm text-foreground/30">Arraste uma imagem ou cole uma URL</span>
                </div>
              ) : (
                renderElement(el)
              )
            )}
          </div>
        );
      case "quote":
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-16 text-center">
            <div className="text-4xl opacity-20">&ldquo;</div>
            {slide.elements.map(renderElement)}
          </div>
        );
      case "blank":
        return (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-foreground/20">Slide em branco</span>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "relative flex aspect-video w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-foreground/[0.08] shadow-lg",
        styles.bg
      )}
    >
      {renderLayout()}
    </div>
  );
}
