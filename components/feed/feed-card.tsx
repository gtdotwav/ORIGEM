"use client";

import { useState } from "react";
import {
  Heart,
  Repeat2,
  Brain,
  Share2,
  Newspaper,
  MessageCircle,
  FileText,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeedStore } from "@/stores/feed-store";
import type { FeedItem, FeedItemType } from "@/types/feed";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const TYPE_STYLES: Record<
  FeedItemType,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  news: {
    label: "Notícia",
    color: "text-neon-cyan",
    bg: "bg-neon-cyan/10",
    border: "border-neon-cyan/20",
    icon: Newspaper,
  },
  tweet: {
    label: "Tweet",
    color: "text-neon-blue",
    bg: "bg-neon-blue/10",
    border: "border-neon-blue/20",
    icon: MessageCircle,
  },
  blog: {
    label: "Blog",
    color: "text-neon-purple",
    bg: "bg-neon-purple/10",
    border: "border-neon-purple/20",
    icon: FileText,
  },
  announcement: {
    label: "Anúncio",
    color: "text-neon-green",
    bg: "bg-neon-green/10",
    border: "border-neon-green/20",
    icon: Megaphone,
  },
};

interface FeedCardProps {
  item: FeedItem;
  onShare: (item: FeedItem) => void;
}

export function FeedCard({ item, onShare }: FeedCardProps) {
  const interactions = useFeedStore((s) => s.interactions);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const addRepost = useFeedStore((s) => s.addRepost);
  const addToContext = useFeedStore((s) => s.addToContext);

  const isLiked = interactions.some(
    (i) => i.feedItemId === item.id && i.type === "like"
  );
  const likeCount = interactions.filter(
    (i) => i.feedItemId === item.id && i.type === "like"
  ).length;
  const repostCount = interactions.filter(
    (i) => i.feedItemId === item.id && i.type === "repost"
  ).length;
  const shareCount = interactions.filter(
    (i) => i.feedItemId === item.id && i.type === "share"
  ).length;

  const style = TYPE_STYLES[item.type];
  const TypeIcon = style.icon;
  const timeAgo = formatDistanceToNow(new Date(item.publishedAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl transition-all hover:border-white/[0.12] hover:bg-neutral-900/80">
      {/* Header: type badge + time */}
      <div className="mb-3 flex items-center justify-between">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            style.bg,
            style.border,
            style.color
          )}
        >
          <TypeIcon className="h-3 w-3" />
          {style.label}
        </div>
        <span className="text-[11px] text-white/25">{timeAgo}</span>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 text-[15px] font-semibold leading-snug text-white/90">
        {item.title}
      </h3>

      {/* Content */}
      <p
        className={cn(
          "mb-3 text-sm leading-relaxed text-white/50",
          !expanded && "line-clamp-3"
        )}
      >
        {item.content}
      </p>
      {item.content.length > 200 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-3 text-xs text-neon-cyan/60 hover:text-neon-cyan/80"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}

      {/* Author + source */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-white/50">
          {item.author
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <span className="text-xs text-white/50">{item.author}</span>
        <span className="text-white/15">·</span>
        <span className="text-xs text-white/30">{item.source}</span>
        {item.sourceUrl && (
          <ExternalLink className="h-3 w-3 text-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/35"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 border-t border-white/[0.05] pt-3">
        {/* Like */}
        <button
          type="button"
          onClick={() => toggleLike(item.id)}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-all",
            isLiked
              ? "bg-pink-500/10 text-pink-400"
              : "text-white/30 hover:bg-white/[0.05] hover:text-white/50"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Repost */}
        <button
          type="button"
          onClick={() => {
            addRepost(item.id);
            toast.success("Repostado!");
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/30 transition-all hover:bg-neon-green/5 hover:text-neon-green/60"
        >
          <Repeat2 className="h-3.5 w-3.5" />
          {repostCount > 0 && <span>{repostCount}</span>}
        </button>

        {/* Add to context */}
        <button
          type="button"
          onClick={() => {
            addToContext(item.id, item.title);
            toast.success("Adicionado ao contexto!");
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/30 transition-all hover:bg-neon-purple/5 hover:text-neon-purple/60"
        >
          <Brain className="h-3.5 w-3.5" />
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={() => onShare(item)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/30 transition-all hover:bg-neon-cyan/5 hover:text-neon-cyan/60"
        >
          <Share2 className="h-3.5 w-3.5" />
          {shareCount > 0 && <span>{shareCount}</span>}
        </button>
      </div>
    </div>
  );
}
