import { z } from "zod";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/server/api-auth";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getRateLimitKey,
} from "@/lib/server/rate-limit";
import { ApiRouteError, parseJsonBody, toErrorResponse } from "@/lib/server/request";
import {
  buildFeedSearchContext,
  searchLiveFeed,
} from "@/lib/server/feed/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  query: z.string().trim().min(1).max(180),
  mode: z.enum(["manual", "workspace", "default"]).default("manual"),
  limit: z.number().int().min(1).max(12).optional(),
  label: z.string().trim().max(120).optional(),
  reason: z.string().trim().max(240).optional(),
  workspaceId: z.string().trim().min(1).optional(),
  workspaceName: z.string().trim().max(120).optional(),
  topics: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
});

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  const rateCheck = checkRateLimit(getRateLimitKey(request, "feed:search"));
  const rateHeaders = buildRateLimitHeaders(rateCheck);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: rateCheck.retryAfter },
      { status: 429, headers: rateHeaders }
    );
  }

  try {
    const body = await parseJsonBody(request, requestSchema, {
      maxBytes: 12_000,
    });

    const context = buildFeedSearchContext({
      mode: body.mode ?? "manual",
      label: body.label,
      reason: body.reason,
      topics: body.topics,
      workspaceId: body.workspaceId,
      workspaceName: body.workspaceName,
    });

    const result = await searchLiveFeed({
      query: body.query,
      context,
      limit: body.limit,
    });

    return NextResponse.json(result, {
      headers: {
        ...rateHeaders,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return toErrorResponse(error, {
        code: "invalid_body",
        status: 400,
      });
    }

    console.error("[feed/search] failed:", error);
    return NextResponse.json(
      { error: "feed_search_failed" },
      {
        status: 502,
        headers: {
          ...rateHeaders,
          "cache-control": "no-store",
        },
      }
    );
  }
}
