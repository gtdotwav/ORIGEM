export type FeedItemType = "news" | "tweet" | "blog" | "announcement";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  content: string;
  summary?: string;
  source: string;
  sourceUrl?: string;
  author: string;
  authorAvatar?: string;
  imageUrl?: string;
  tags: string[];
  publishedAt: string;
  createdAt: string;
  relevance?: number;
  matchedTerms?: string[];
}

export interface FeedInteraction {
  id: string;
  feedItemId: string;
  type: "like" | "repost" | "context" | "share";
  connectionId?: string;
  contextRef?: string;
  createdAt: string;
}

export type FeedSearchMode = "manual" | "workspace" | "default";

export interface FeedSearchContext {
  mode: FeedSearchMode;
  label: string | null;
  reason: string | null;
  topics: string[];
  workspaceId?: string;
  workspaceName?: string;
}

export interface FeedSearchResponse {
  items: FeedItem[];
  resolvedQuery: string;
  fetchedAt: string;
  context: FeedSearchContext;
}
