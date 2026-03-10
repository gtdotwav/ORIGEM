import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getLanguageModel } from "@/lib/server/ai/provider-factory";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getRateLimitKey,
} from "@/lib/server/rate-limit";
import { ORIGEM_TOOLS } from "@/config/origem-tools";
import { executeWithTools } from "@/lib/mcp/tool-executor";
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

  const rateCheck = checkRateLimit(getRateLimitKey(request, "chat:completions"));
  const rateHeaders = buildRateLimitHeaders(rateCheck);

  if (!rateCheck.allowed) {
    return NextResponse.json(
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

    const allMessages = [
      ...(body.systemPrompt
        ? [{ role: "system" as const, content: body.systemPrompt }]
        : []),
      ...body.messages,
    ];

    if (body.workspaceId) {
      const result = await executeWithTools({
        provider: selection.provider,
        model: selection.model,
        messages: allMessages,
        maxOutputTokens: selection.maxTokens,
        workspaceId: body.workspaceId,
        sessionId: body.sessionId,
        agentId: body.agentId,
      });

      return NextResponse.json({
        content: result.content,
        provider: result.provider,
        model: result.model,
        toolCallsExecuted: result.toolCallsExecuted.length > 0 ? result.toolCallsExecuted : undefined,
        usage: result.usage,
      }, { headers: rateHeaders });
    }

    const languageModel = await getLanguageModel(selection.provider, selection.model);

    const result = await generateText({
      model: languageModel,
      messages: allMessages,
      tools: ORIGEM_TOOLS,
      maxOutputTokens: selection.maxTokens,
    });

    return NextResponse.json({
      content: result.text,
      provider: selection.provider,
      model: selection.model,
      toolCalls: result.toolCalls?.length ? result.toolCalls : undefined,
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
    }, { headers: rateHeaders });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return toErrorResponse(error, {
        code: "invalid_body",
        status: 400,
      });
    }

    console.error("[completions] LLM call failed:", error);
    return NextResponse.json(
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
