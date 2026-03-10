import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  FeedItem,
  FeedItemType,
  FeedInteraction,
  FeedSearchContext,
} from "@/types/feed";

interface FeedState {
  items: FeedItem[];
  interactions: FeedInteraction[];
  searchQuery: string;
  activeFilter: FeedItemType | "all";
  isLoading: boolean;
  error: string | null;
  resolvedQuery: string;
  lastFetchedAt: string | null;
  context: FeedSearchContext;

  setLiveResults: (payload: {
    items: FeedItem[];
    resolvedQuery: string;
    fetchedAt: string;
    context: FeedSearchContext;
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleLike: (feedItemId: string) => void;
  addRepost: (feedItemId: string) => void;
  addToContext: (feedItemId: string, contextRef: string) => void;
  shareWith: (feedItemId: string, connectionId: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: FeedItemType | "all") => void;
}

const EMPTY_CONTEXT: FeedSearchContext = {
  mode: "default",
  label: null,
  reason: null,
  topics: [],
};

export const useFeedStore = create<FeedState>()(
  devtools(
    persist(
      (set) => ({
        items: [],
        interactions: [],
        searchQuery: "",
        activeFilter: "all",
        isLoading: false,
        error: null,
        resolvedQuery: "",
        lastFetchedAt: null,
        context: EMPTY_CONTEXT,

        setLiveResults: ({ items, resolvedQuery, fetchedAt, context }) =>
          set({
            items,
            resolvedQuery,
            lastFetchedAt: fetchedAt,
            context,
            error: null,
            isLoading: false,
          }),

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error, isLoading: false }),

        toggleLike: (feedItemId) =>
          set((state) => {
            const existing = state.interactions.find(
              (interaction) =>
                interaction.feedItemId === feedItemId &&
                interaction.type === "like"
            );

            return {
              interactions: existing
                ? state.interactions.filter(
                    (interaction) => interaction.id !== existing.id
                  )
                : [
                    ...state.interactions,
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
          set((state) => ({
            interactions: [
              ...state.interactions,
              {
                id: nanoid(),
                feedItemId,
                type: "repost",
                createdAt: new Date().toISOString(),
              },
            ],
          })),

        addToContext: (feedItemId, contextRef) =>
          set((state) => ({
            interactions: [
              ...state.interactions,
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
          set((state) => ({
            interactions: [
              ...state.interactions,
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
          interactions: state.interactions,
          searchQuery: state.searchQuery,
          activeFilter: state.activeFilter,
        }),
      }
    ),
    { name: "feed-store" }
  )
);

export function getSuggestions(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase();
  const { items } = useFeedStore.getState();

  const tagSet = new Set<string>();
  const sourceSet = new Set<string>();

  for (const item of items) {
    for (const tag of item.tags) {
      if (tag.toLowerCase().includes(normalizedQuery)) {
        tagSet.add(tag);
      }
    }

    if (item.source.toLowerCase().includes(normalizedQuery)) {
      sourceSet.add(item.source);
    }
  }

  const suggestions: Array<{ label: string; type: "tag" | "source" }> = [];

  for (const tag of tagSet) {
    suggestions.push({ label: tag, type: "tag" });
  }

  for (const source of sourceSet) {
    suggestions.push({ label: source, type: "source" });
  }

  return suggestions.slice(0, 8);
}
