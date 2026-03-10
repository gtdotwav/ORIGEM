"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Newspaper,
  MessageCircle,
  FileText,
  Megaphone,
  Loader2,
  Tag,
  Globe,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeedStore, getSuggestions } from "@/stores/feed-store";
import type { FeedItemType } from "@/types/feed";

const FILTERS: { value: FeedItemType | "all"; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: "all", label: "Todos", icon: Globe, color: "text-foreground/50 border-foreground/10 hover:border-foreground/20" },
  { value: "news", label: "Notícias", icon: Newspaper, color: "text-neon-cyan border-neon-cyan/20 hover:border-neon-cyan/40" },
  { value: "tweet", label: "Tweets", icon: MessageCircle, color: "text-neon-blue border-neon-blue/20 hover:border-neon-blue/40" },
  { value: "blog", label: "Blog", icon: FileText, color: "text-neon-purple border-neon-purple/20 hover:border-neon-purple/40" },
  { value: "announcement", label: "Anúncios", icon: Megaphone, color: "text-neon-green border-neon-green/20 hover:border-neon-green/40" },
];

const ACTIVE_COLORS: Record<string, string> = {
  all: "bg-foreground/10 border-foreground/20 text-foreground",
  news: "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan",
  tweet: "bg-neon-blue/10 border-neon-blue/30 text-neon-blue",
  blog: "bg-neon-purple/10 border-neon-purple/30 text-neon-purple",
  announcement: "bg-neon-green/10 border-neon-green/30 text-neon-green",
};

export function FeedSearchBar() {
  const searchQuery = useFeedStore((s) => s.searchQuery);
  const setSearchQuery = useFeedStore((s) => s.setSearchQuery);
  const activeFilter = useFeedStore((s) => s.activeFilter);
  const setActiveFilter = useFeedStore((s) => s.setActiveFilter);
  const isLoading = useFeedStore((s) => s.isLoading);
  const context = useFeedStore((s) => s.context);
  const resolvedQuery = useFeedStore((s) => s.resolvedQuery);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ label: string; type: "tag" | "source" }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (value: string) => {
      setLocalQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(value);
        const sugg = getSuggestions(value);
        setSuggestions(sugg);
        setShowSuggestions(sugg.length > 0 && value.length >= 2);
      }, 300);
    },
    [setSearchQuery]
  );

  const handleSelectSuggestion = useCallback(
    (label: string) => {
      setLocalQuery(label);
      setSearchQuery(label);
      setShowSuggestions(false);
    },
    [setSearchQuery]
  );

  const handleClear = useCallback(() => {
    setLocalQuery("");
    setSearchQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [setSearchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div className="space-y-3">
      {context.mode === "workspace" && !searchQuery.trim() ? (
        <div className="rounded-xl border border-neon-cyan/15 bg-neon-cyan/[0.04] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-neon-cyan/80">
                Feed guiado pelo workspace {context.label ? `"${context.label}"` : ""}
              </p>
              <p className="mt-0.5 text-[11px] text-foreground/45">
                {context.reason ?? "Usando o contexto do trabalho atual para buscar resultados."}
              </p>
            </div>
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-neon-cyan/70" />
            ) : null}
          </div>
          {context.topics.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {context.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-neon-cyan/20 bg-black/20 px-2 py-0.5 text-[10px] text-foreground/60"
                >
                  {topic}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          {isLoading ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neon-cyan/60" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 && localQuery.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowSuggestions(false);
            }}
            placeholder="Escreva um tema para buscar notícias, blogs e anúncios em tempo real..."
            className="w-full rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] py-2.5 pl-10 pr-10 text-sm text-foreground/90 placeholder:text-foreground/25 backdrop-blur-sm transition-colors focus:border-foreground/20 focus:outline-none focus:ring-0"
          />
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-foreground/[0.08] bg-card/95 p-1.5 shadow-xl backdrop-blur-xl">
            {suggestions.map((s) => (
              <button
                key={`${s.type}-${s.label}`}
                type="button"
                onClick={() => handleSelectSuggestion(s.label)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-foreground/[0.05]"
              >
                {s.type === "tag" ? (
                  <Tag className="h-3 w-3 text-neon-purple/60" />
                ) : (
                  <Globe className="h-3 w-3 text-neon-cyan/60" />
                )}
                <span className="text-foreground/70">{s.label}</span>
                <span className="ml-auto text-[10px] text-foreground/25">
                  {s.type === "tag" ? "tag" : "fonte"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {resolvedQuery && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground/35">
          <span className="text-foreground/25">Busca atual</span>
          <span className="rounded-full border border-foreground/[0.08] bg-foreground/[0.03] px-2.5 py-1 text-foreground/65">
            {resolvedQuery}
          </span>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                isActive ? ACTIVE_COLORS[filter.value] : filter.color
              )}
            >
              <filter.icon className="h-3 w-3" />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
