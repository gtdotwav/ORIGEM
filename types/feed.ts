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
}

export interface FeedInteraction {
  id: string;
  feedItemId: string;
  type: "like" | "repost" | "context" | "share";
  connectionId?: string;
  contextRef?: string;
  createdAt: string;
}
