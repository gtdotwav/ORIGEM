import { streamText } from "ai";
import { getLanguageModel } from "@/lib/server/ai/provider-factory";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getRateLimitKey,
} from "@/lib/server/rate-limit";
import { requireApiSession } from "@/lib/server/api-auth";
import {
  parseChatRequest,
  resolveChatModelSelection,
} from "@/lib/server/chat/request";
import { ApiRouteError, toErrorResponse } from "@/lib/server/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  const rateCheck = checkRateLimit(getRateLimitKey(request, "chat:stream"));
  const rateHeaders = buildRateLimitHeaders(rateCheck);
  if (!rateCheck.allowed) {
    return Response.json(
      { error: "rate_limited", retryAfter: rateCheck.retryAfter },
      {
        status: 429,
        headers: rateHeaders,
      }
    );
  }

  try {
    const body = await parseChatRequest(request);
    const selection = await resolveChatModelSelection(body);
    const languageModel = await getLanguageModel(selection.provider, selection.model);

    const allMessages = [
      ...(body.systemPrompt
        ? [{ role: "system" as const, content: body.systemPrompt }]
        : []),
      ...body.messages,
    ];

    const result = streamText({
      model: languageModel,
      messages: allMessages,
      maxOutputTokens: selection.maxTokens,
      abortSignal: request.signal,
    });

    return result.toTextStreamResponse({
      headers: {
        ...rateHeaders,
        "X-Provider": selection.provider,
        "X-Model": selection.model,
      },
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      if (error.code === "invalid_body") {
        console.error("[stream] Bad Request:", JSON.stringify(error.details, null, 2));
      }
      return toErrorResponse(error, {
        code: "invalid_body",
        status: 400,
      });
    }

    console.error("[stream] LLM call failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error &&
          error.message.includes("ORIGEM_ENCRYPT_SECRET")
            ? "storage_unavailable"
            : "llm_call_failed",
      },
      { status: error instanceof Error && error.message.includes("ORIGEM_ENCRYPT_SECRET") ? 503 : 500 }
    );
  }
}
