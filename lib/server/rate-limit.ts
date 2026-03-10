interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let lastPruneAt = 0;

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 20;
const PRUNE_INTERVAL_MS = 30_000;
const MAX_STORE_SIZE = 10_000;

function pruneExpiredEntries(now: number) {
  if (
    store.size < MAX_STORE_SIZE &&
    now - lastPruneAt < PRUNE_INTERVAL_MS
  ) {
    return;
  }

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
  lastPruneAt = now;
}

export function checkRateLimit(
  key: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS
): {
  allowed: boolean;
  retryAfter?: number;
  remaining: number;
  limit: number;
  resetAt: number;
} {
  const now = Date.now();
  pruneExpiredEntries(now);

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      limit: maxRequests,
      resetAt,
    };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      remaining: 0,
      limit: maxRequests,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.count),
    limit: maxRequests,
    resetAt: entry.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const directHeaders = [
    "x-vercel-forwarded-for",
    "cf-connecting-ip",
    "x-real-ip",
    "x-forwarded-for",
  ];

  for (const headerName of directHeaders) {
    const value = request.headers.get(headerName);
    if (!value) {
      continue;
    }

    const first = value.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const forwarded = request.headers.get("forwarded");
  if (forwarded) {
    const match = forwarded.match(/for="?([^;,\s"]+)/i);
    if (match?.[1]) {
      return match[1].replace(/^\[|\]$/g, "");
    }
  }

  return "unknown";
}

export function getRateLimitKey(request: Request, scope = "global"): string {
  const ip = getClientIp(request);

  if (ip !== "unknown") {
    return `${scope}:${ip}`;
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 120) ?? "unknown";
  const acceptLanguage =
    request.headers.get("accept-language")?.split(",")[0]?.trim() ?? "unknown";

  return `${scope}:ua:${userAgent}:lang:${acceptLanguage}`;
}

export function buildRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfter ? { "Retry-After": String(result.retryAfter) } : {}),
  };
}
