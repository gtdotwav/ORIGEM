import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { FeedItem, FeedItemType, FeedInteraction } from "@/types/feed";
import { generateSeedFeedItems } from "@/lib/feed-seed";

interface FeedState {
  items: FeedItem[];
  interactions: FeedInteraction[];
  searchQuery: string;
  activeFilter: FeedItemType | "all";

  seedFeedData: () => void;
  toggleLike: (feedItemId: string) => void;
  addRepost: (feedItemId: string) => void;
  addToContext: (feedItemId: string, contextRef: string) => void;
  shareWith: (feedItemId: string, connectionId: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: FeedItemType | "all") => void;
}

export const useFeedStore = create<FeedState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        interactions: [],
        searchQuery: "",
        activeFilter: "all",

        seedFeedData: () => {
          if (get().items.length > 0) return;
          set({ items: generateSeedFeedItems() });
        },

        toggleLike: (feedItemId) =>
          set((s) => {
            const existing = s.interactions.find(
              (i) => i.feedItemId === feedItemId && i.type === "like"
            );
            return {
              interactions: existing
                ? s.interactions.filter((i) => i.id !== existing.id)
                : [
                    ...s.interactions,
                    {
                      id: nanoid(),
                      feedItemId,
                      type: "like",
                      createdAt: new Date().toISOString(),
                    },
                  ],
            };
          }),

        addRepost: (feedItemId) =>
          set((s) => ({
            interactions: [
              ...s.interactions,
              {
                id: nanoid(),
                feedItemId,
                type: "repost",
                createdAt: new Date().toISOString(),
              },
            ],
          })),

        addToContext: (feedItemId, contextRef) =>
          set((s) => ({
            interactions: [
              ...s.interactions,
              {
                id: nanoid(),
                feedItemId,
                type: "context",
                contextRef,
                createdAt: new Date().toISOString(),
              },
            ],
          })),

        shareWith: (feedItemId, connectionId) =>
          set((s) => ({
            interactions: [
              ...s.interactions,
              {
                id: nanoid(),
                feedItemId,
                type: "share",
                connectionId,
                createdAt: new Date().toISOString(),
              },
            ],
          })),

        setSearchQuery: (query) => set({ searchQuery: query }),
        setActiveFilter: (filter) => set({ activeFilter: filter }),
      }),
      {
        name: "origem-feed",
        partialize: (state) => ({
          items: state.items,
          interactions: state.interactions,
        }),
      }
    ),
    { name: "feed-store" }
  )
);

/** Check if a feed item is liked */
export function isLiked(feedItemId: string): boolean {
  return useFeedStore
    .getState()
    .interactions.some((i) => i.feedItemId === feedItemId && i.type === "like");
}

/** Get interaction counts for a feed item */
export function getInteractionCounts(feedItemId: string) {
  const interactions = useFeedStore.getState().interactions;
  return {
    likes: interactions.filter((i) => i.feedItemId === feedItemId && i.type === "like").length,
    reposts: interactions.filter((i) => i.feedItemId === feedItemId && i.type === "repost").length,
    shares: interactions.filter((i) => i.feedItemId === feedItemId && i.type === "share").length,
    contexts: interactions.filter((i) => i.feedItemId === feedItemId && i.type === "context").length,
  };
}

/** Filter items based on current query and filter */
export function getFilteredItems(): FeedItem[] {
  const { items, searchQuery, activeFilter } = useFeedStore.getState();
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

  return filtered.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Get search suggestions based on partial query */
export function getSuggestions(query: string): { label: string; type: "tag" | "source" }[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const { items } = useFeedStore.getState();

  const tagSet = new Set<string>();
  const sourceSet = new Set<string>();

  for (const item of items) {
    for (const tag of item.tags) {
      if (tag.toLowerCase().includes(q)) tagSet.add(tag);
    }
    if (item.source.toLowerCase().includes(q)) sourceSet.add(item.source);
  }

  const suggestions: { label: string; type: "tag" | "source" }[] = [];
  for (const tag of tagSet) suggestions.push({ label: tag, type: "tag" });
  for (const source of sourceSet) suggestions.push({ label: source, type: "source" });
  return suggestions.slice(0, 8);
}
