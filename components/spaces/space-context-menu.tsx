"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Clock,
  LayoutGrid,
  Type,
  ImageIcon,
  Video,
  Box,
  Music,
  Frame,
  Shapes,
  Bot,
  ArrowUpFromLine,
  List,
  Upload,
  FolderOpen,
  SearchIcon,
  Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: typeof Type;
  color: string;
  section: string;
  category: string[];
  action: (position: { x: number; y: number }) => void;
}

interface SpaceContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Category tabs                                                      */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: "recent", label: "Recentes", icon: Clock },
  { id: "all", label: "Todos", icon: LayoutGrid },
  { id: "text", label: "Texto", icon: Type },
  { id: "image", label: "Imagem", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "3d", label: "3D", icon: Box },
  { id: "audio", label: "Audio", icon: Music },
  { id: "frames", label: "Frames", icon: Frame },
  { id: "shapes", label: "Formas", icon: Shapes },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SpaceContextMenu({ items, position, onClose }: SpaceContextMenuProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!position) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [position, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!position) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [position, onClose]);

  // Auto-focus search
  useEffect(() => {
    if (position) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch("");
      setActiveCategory("all");
    }
  }, [position]);

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search || item.label.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "all" ||
      activeCategory === "recent" ||
      item.category.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  // Group by section
  const sections = filtered.reduce<Record<string, ContextMenuItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  if (!position) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-[100] w-[280px] overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl shadow-black/60"
        style={{
          left: position.x,
          top: position.y,
          background: "linear-gradient(180deg, rgba(22,22,22,0.98) 0%, rgba(18,18,18,0.99) 100%)",
          backdropFilter: "blur(40px) saturate(1.5)",
        }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-white/20" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-[13px] text-white/70 placeholder:text-white/25 outline-none"
          />
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto border-b border-white/[0.06] px-2 py-1.5 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all",
                  isActive
                    ? "bg-white/[0.10] text-white/70"
                    : "text-white/25 hover:bg-white/[0.05] hover:text-white/45"
                )}
                title={cat.label}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        {/* Items list */}
        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {Object.keys(sections).length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-white/20">
              <SearchIcon className="h-5 w-5" />
              <span className="text-[11px]">Nenhum resultado</span>
            </div>
          )}

          {Object.entries(sections).map(([sectionName, sectionItems]) => (
            <div key={sectionName}>
              <div className="px-3 pb-1 pt-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
                  {sectionName}
                </span>
              </div>
              {sectionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.action(position);
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/[0.05]"
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", item.color)} />
                    </div>
                    <span className="text-[13px] font-medium text-white/65">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Default menu items for Spaces                                      */
/* ------------------------------------------------------------------ */

export function useSpaceContextMenuItems(
  createCard: (spaceId: string, prompt: string, position?: { x: number; y: number }) => string,
  addTextNode: (spaceId: string, position?: { x: number; y: number }) => string,
  spaceId: string | undefined
): ContextMenuItem[] {
  return [
    // BASICS
    {
      id: "text",
      label: "Text",
      icon: Type,
      color: "text-neon-cyan/70",
      section: "Basics",
      category: ["text"],
      action: (pos) => spaceId && addTextNode(spaceId, pos),
    },
    {
      id: "image-gen",
      label: "Image Generator",
      icon: ImageIcon,
      color: "text-neon-purple/70",
      section: "Basics",
      category: ["image"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    {
      id: "video-gen",
      label: "Video Generator",
      icon: Video,
      color: "text-neon-green/70",
      section: "Basics",
      category: ["video"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    {
      id: "assistant",
      label: "Assistant",
      icon: Sparkle,
      color: "text-neon-orange/70",
      section: "Basics",
      category: ["text"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    {
      id: "image-upscaler",
      label: "Image Upscaler",
      icon: ArrowUpFromLine,
      color: "text-neon-pink/70",
      section: "Basics",
      category: ["image"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    {
      id: "list",
      label: "List",
      icon: List,
      color: "text-white/40",
      section: "Basics",
      category: ["text"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    // MEDIA
    {
      id: "upload",
      label: "Upload",
      icon: Upload,
      color: "text-white/40",
      section: "Media",
      category: ["image", "video", "audio"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    {
      id: "assets",
      label: "Assets",
      icon: FolderOpen,
      color: "text-white/40",
      section: "Media",
      category: ["image", "video", "audio"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    {
      id: "stock",
      label: "Stock",
      icon: SearchIcon,
      color: "text-white/40",
      section: "Media",
      category: ["image", "video"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    // IMAGE
    {
      id: "remove-bg",
      label: "Remove Background",
      icon: ImageIcon,
      color: "text-neon-cyan/60",
      section: "Image",
      category: ["image"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    {
      id: "ai-edit",
      label: "AI Edit",
      icon: Bot,
      color: "text-neon-purple/60",
      section: "Image",
      category: ["image"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
    {
      id: "style-transfer",
      label: "Style Transfer",
      icon: Shapes,
      color: "text-neon-orange/60",
      section: "Image",
      category: ["image"],
      action: (pos) => spaceId && createCard(spaceId, "", pos),
    },
  ];
}
