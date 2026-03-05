"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { Rss, Heart, Share2, Newspaper } from "lucide-react";
import { useFeedStore } from "@/stores/feed-store";
import { FeedSearchBar } from "@/components/feed/feed-search-bar";
import { FeedCard } from "@/components/feed/feed-card";
import { ShareDialog } from "@/components/feed/share-dialog";
import { CosmicEmptyState } from "@/components/shared/cosmic-empty-state";
import { MetricSkeleton, CardSkeleton } from "@/components/shared/cosmic-skeleton";
import type { FeedItem } from "@/types/feed";

function FeedPageFallback() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-3 gap-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

function FeedPageContent() {
  const items = useFeedStore((s) => s.items);
  const interactions = useFeedStore((s) => s.interactions);
  const searchQuery = useFeedStore((s) => s.searchQuery);
  const activeFilter = useFeedStore((s) => s.activeFilter);
  const seedFeedData = useFeedStore((s) => s.seedFeedData);

  const [shareItem, setShareItem] = useState<FeedItem | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Auto-seed on first load
  useEffect(() => {
    seedFeedData();
  }, [seedFeedData]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (activeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return [...filtered].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [items, searchQuery, activeFilter]);

  // Metrics
  const totalLikes = interactions.filter((i) => i.type === "like").length;
  const totalShares = interactions.filter((i) => i.type === "share").length;

  function handleShare(item: FeedItem) {
    setShareItem(item);
    setShareOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neon-blue/10 border border-neon-blue/20">
          <Rss className="h-6 w-6 text-neon-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground/95">Feed</h1>
          <p className="text-sm text-foreground/40">
            Notícias, tweets e conteúdo em tempo real
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-neon-cyan/60" />
            <span className="text-xs text-foreground/30">Total</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{items.length}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 text-pink-400/60" />
            <span className="text-xs text-foreground/30">Curtidas</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{totalLikes}</p>
        </div>
        <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-3.5 w-3.5 text-neon-cyan/60" />
            <span className="text-xs text-foreground/30">Compartilhamentos</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground/90">{totalShares}</p>
        </div>
      </div>

      {/* Search bar */}
      <FeedSearchBar />

      {/* Feed grid */}
      {filteredItems.length === 0 ? (
        <CosmicEmptyState
          icon={Rss}
          title="Nenhum item encontrado"
          description={
            searchQuery
              ? "Tente ajustar sua busca ou filtro."
              : "O feed está vazio. Os itens aparecerão aqui."
          }
          neonColor="blue"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <FeedCard key={item.id} item={item} onShare={handleShare} />
          ))}
        </div>
      )}

      {/* Share dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        item={shareItem}
      />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedPageFallback />}>
      <FeedPageContent />
    </Suspense>
  );
}
