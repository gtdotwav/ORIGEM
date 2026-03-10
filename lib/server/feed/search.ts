import { nanoid } from "nanoid";
import type {
  FeedItem,
  FeedItemType,
  FeedSearchContext,
  FeedSearchMode,
} from "@/types/feed";

const SEARCH_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

const BLOG_HOST_HINTS = [
  "medium.com",
  "dev.to",
  "substack.com",
  "hashnode.com",
  "blog.",
  "/blog/",
  "smashingmagazine.com",
  "uxdesign.cc",
];

const ANNOUNCEMENT_HINTS = [
  "announce",
  "announcement",
  "beta",
  "launch",
  "release",
  "released",
  "introduces",
  "lanca",
  "lancamento",
  "anuncia",
  "announces",
  "updates",
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    const normalized = String(code).toLowerCase();

    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }

    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }

    return NAMED_HTML_ENTITIES[normalized] ?? entity;
  });
}

function stripTags(value: string) {
  return normalizeWhitespace(
    decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
  );
}

function decodeDuckDuckGoUrl(rawHref: string) {
  const href = rawHref.startsWith("//") ? `https:${rawHref}` : rawHref;
  const parsed = new URL(href, "https://duckduckgo.com");
  const redirected = parsed.searchParams.get("uddg");
  return redirected ? decodeURIComponent(redirected) : href;
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function titleCaseHostname(hostname: string) {
  const base = hostname.replace(/^www\./, "").split("/")[0].split(".")[0];
  return base
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function scoreMatchedTerms(value: string, contextTopics: string[]) {
  const normalizedValue = value.toLowerCase();
  return contextTopics.filter((topic) =>
    normalizedValue.includes(topic.toLowerCase())
  );
}

function inferFeedType(url: string, title: string, source: string): FeedItemType {
  const haystack = `${url} ${title} ${source}`.toLowerCase();

  if (
    haystack.includes("x.com") ||
    haystack.includes("twitter.com") ||
    haystack.includes("threads.net")
  ) {
    return "tweet";
  }

  if (BLOG_HOST_HINTS.some((hint) => haystack.includes(hint))) {
    return "blog";
  }

  if (ANNOUNCEMENT_HINTS.some((hint) => haystack.includes(hint))) {
    return "announcement";
  }

  return "news";
}

function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return null;
}

function extractTitle(html: string) {
  const metaTitle =
    extractMetaContent(html, "og:title") ??
    extractMetaContent(html, "twitter:title");

  if (metaTitle) {
    return normalizeWhitespace(metaTitle);
  }

  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) {
    return null;
  }

  return stripTags(match[1]);
}

function extractJsonLdDate(html: string) {
  const match = html.match(/"datePublished"\s*:\s*"([^"]+)"/i);
  return match?.[1] ?? null;
}

function extractPublishedAt(html: string) {
  return (
    extractMetaContent(html, "article:published_time") ??
    extractMetaContent(html, "og:published_time") ??
    extractMetaContent(html, "pubdate") ??
    extractMetaContent(html, "publish-date") ??
    extractJsonLdDate(html)
  );
}

function extractAuthor(html: string) {
  const directAuthor =
    extractMetaContent(html, "author") ??
    extractMetaContent(html, "article:author");

  if (directAuthor) {
    return normalizeWhitespace(directAuthor);
  }

  const match = html.match(/"author"\s*:\s*(?:\{[^}]*"name"\s*:\s*"([^"]+)"|"([^"]+)")/i);
  return normalizeWhitespace(match?.[1] ?? match?.[2] ?? "");
}

function extractDescription(html: string) {
  return (
    extractMetaContent(html, "description") ??
    extractMetaContent(html, "og:description") ??
    extractMetaContent(html, "twitter:description")
  );
}

function extractImageUrl(html: string) {
  return (
    extractMetaContent(html, "og:image") ??
    extractMetaContent(html, "twitter:image")
  );
}

function coercePublishedAt(value: string | null, fallbackOffsetMinutes: number) {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date(Date.now() - fallbackOffsetMinutes * 60_000).toISOString();
}

function extractArticleTags(
  title: string,
  contextTopics: string[],
  source: string
) {
  const tags = new Set<string>();

  for (const topic of contextTopics) {
    if (topic.length >= 3) {
      tags.add(topic);
    }
  }

  for (const token of stripTags(title).split(/[^0-9A-Za-zÀ-ÿ#+.-]+/)) {
    const normalized = token.trim();
    if (normalized.length >= 4 && tags.size < 6) {
      tags.add(normalized.toLowerCase());
    }
  }

  if (tags.size < 6) {
    tags.add(source.toLowerCase());
  }

  return [...tags].slice(0, 6);
}

interface SearchResultCandidate {
  title: string;
  url: string;
  snippet: string;
  displayedSource: string;
  rank: number;
}

function parseDuckDuckGoResults(html: string): SearchResultCandidate[] {
  const blocks = html.match(/<div class="result results_links[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi) ?? [];
  const items: SearchResultCandidate[] = [];

  for (const [index, block] of blocks.entries()) {
    const linkMatch = block.match(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch?.[1] || !linkMatch[2]) {
      continue;
    }

    const snippetMatch = block.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);
    const sourceMatch = block.match(/<a[^>]+class="result__url"[^>]*>([\s\S]*?)<\/a>/i);

    items.push({
      title: stripTags(linkMatch[2]),
      url: decodeDuckDuckGoUrl(linkMatch[1]),
      snippet: stripTags(snippetMatch?.[1] ?? ""),
      displayedSource: stripTags(sourceMatch?.[1] ?? ""),
      rank: index,
    });
  }

  return items;
}

async function fetchSearchResults(query: string) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
      "user-agent": SEARCH_USER_AGENT,
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`search_failed:${response.status}`);
  }

  const html = await response.text();
  return parseDuckDuckGoResults(html);
}

async function enrichCandidate(
  candidate: SearchResultCandidate,
  contextTopics: string[],
  fallbackMinutes: number
): Promise<FeedItem> {
  let finalUrl = candidate.url;
  let title = candidate.title;
  let content = candidate.snippet;
  let author = candidate.displayedSource || titleCaseHostname(getHostname(candidate.url));
  let imageUrl: string | undefined;
  let publishedAt = coercePublishedAt(null, fallbackMinutes);

  try {
    const response = await fetch(candidate.url, {
      cache: "no-store",
      headers: {
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
        "user-agent": SEARCH_USER_AGENT,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6_000),
    });

    if (response.ok) {
      finalUrl = response.url || finalUrl;
      const html = await response.text();
      title = extractTitle(html) ?? title;
      content = normalizeWhitespace(extractDescription(html) ?? content);
      author = normalizeWhitespace(extractAuthor(html) || author);
      imageUrl = extractImageUrl(html) ?? undefined;
      publishedAt = coercePublishedAt(extractPublishedAt(html), fallbackMinutes);
    }
  } catch {
    // Best-effort scraping: keep the original candidate data if enrichment fails.
  }

  const source = titleCaseHostname(getHostname(finalUrl));
  const matchedTerms = scoreMatchedTerms(`${title} ${content}`, contextTopics);

  return {
    id: nanoid(),
    type: inferFeedType(finalUrl, title, source),
    title,
    content,
    summary: candidate.snippet || content,
    source,
    sourceUrl: finalUrl,
    author,
    imageUrl,
    tags: extractArticleTags(title, contextTopics, source),
    publishedAt,
    createdAt: new Date().toISOString(),
    relevance: Math.max(0, 100 - candidate.rank * 6 + matchedTerms.length * 8),
    matchedTerms,
  };
}

function dedupeCandidates(candidates: SearchResultCandidate[]) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = candidate.url;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function searchLiveFeed(params: {
  query: string;
  context: FeedSearchContext;
  limit?: number;
}): Promise<{
  items: FeedItem[];
  resolvedQuery: string;
  fetchedAt: string;
  context: FeedSearchContext;
}> {
  const baseQuery = normalizeWhitespace(params.query);
  const contextTopics = params.context.topics.map((topic) => normalizeWhitespace(topic));
  const limit = Math.min(Math.max(params.limit ?? 8, 1), 12);

  const queryVariants = [baseQuery];
  if (!/\bnoticias?\b/i.test(baseQuery)) {
    queryVariants.push(`${baseQuery} noticias`);
  }
  if (!/\bblog\b/i.test(baseQuery)) {
    queryVariants.push(`${baseQuery} blog`);
  }

  const candidateLists = await Promise.all(
    queryVariants.map((query) => fetchSearchResults(query).catch(() => []))
  );

  const candidates = dedupeCandidates(candidateLists.flat()).slice(0, limit);

  if (candidates.length === 0) {
    return {
      items: [],
      resolvedQuery: baseQuery,
      fetchedAt: new Date().toISOString(),
      context: params.context,
    };
  }

  const enriched = await Promise.all(
    candidates.map((candidate, index) =>
      enrichCandidate(candidate, contextTopics, index * 20)
    )
  );

  const items = enriched
    .sort((a, b) => {
      const dateDiff =
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return (b.relevance ?? 0) - (a.relevance ?? 0);
    })
    .slice(0, limit);

  return {
    items,
    resolvedQuery: baseQuery,
    fetchedAt: new Date().toISOString(),
    context: params.context,
  };
}

export function buildFeedSearchContext(params: {
  mode: FeedSearchMode;
  label?: string | null;
  reason?: string | null;
  topics?: string[];
  workspaceId?: string;
  workspaceName?: string;
}): FeedSearchContext {
  return {
    mode: params.mode,
    label: params.label ?? null,
    reason: params.reason ?? null,
    topics: (params.topics ?? []).map((topic) => normalizeWhitespace(topic)).filter(Boolean).slice(0, 8),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
    ...(params.workspaceName ? { workspaceName: params.workspaceName } : {}),
  };
}
