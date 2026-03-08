import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getLanguageModel } from "@/lib/server/ai/provider-factory";
import { getSnapshotStore } from "@/lib/server/backend/store";
import { selectModelForTier } from "@/config/token-tiers";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { ORIGEM_TOOLS } from "@/config/origem-tools";
import type { ProviderName } from "@/types/provider";
import type { TokenTier } from "@/types/chat";

const TIERS: TokenTier[] = ["short", "medium", "max", "ultra"];
const MAX_BODY_SIZE = 100_000; // 100KB

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: rateCheck.retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) },
      }
    );
  }

  // Body size check
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "body_too_large", maxBytes: MAX_BODY_SIZE },
      { status: 413 }
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "invalid_body", details: "messages array required" },
      { status: 400 }
    );
  }

  const VALID_ROLES = new Set(["user", "assistant", "system"]);
  const MAX_CONTENT_LENGTH = 32_000;
  const MAX_SYSTEM_PROMPT_LENGTH = 8_000;
  const MAX_MESSAGES = 200;

  const rawMessages = body.messages as Array<{ role: string; content: string }>;

  if (rawMessages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: "too_many_messages", max: MAX_MESSAGES },
      { status: 400 }
    );
  }

  for (const msg of rawMessages) {
    if (!VALID_ROLES.has(msg.role) || typeof msg.content !== "string") {
      return NextResponse.json(
        { error: "invalid_message", details: "each message needs valid role and string content" },
        { status: 400 }
      );
    }
    if (msg.content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: "message_too_long", maxLength: MAX_CONTENT_LENGTH },
        { status: 400 }
      );
    }
  }

  const { provider, model, tier, maxTokens, systemPrompt } = body as {
    messages: Array<{ role: string; content: string }>;
    provider?: string;
    model?: string;
    tier?: string;
    maxTokens?: number;
    systemPrompt?: string;
  };
  const messages = rawMessages;

  if (systemPrompt && (typeof systemPrompt !== "string" || systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH)) {
    return NextResponse.json(
      { error: "invalid_system_prompt", maxLength: MAX_SYSTEM_PROMPT_LENGTH },
      { status: 400 }
    );
  }

  if (maxTokens !== undefined && (typeof maxTokens !== "number" || maxTokens < 1 || maxTokens > 16_384)) {
    return NextResponse.json(
      { error: "invalid_max_tokens", range: [1, 16384] },
      { status: 400 }
    );
  }

  let resolvedProvider: ProviderName;
  let resolvedModel: string;
  let resolvedMaxTokens: number = typeof maxTokens === "number" ? maxTokens : 1024;

  try {
    if (provider && model) {
      resolvedProvider = provider as ProviderName;
      resolvedModel = model;
    } else if (tier && TIERS.includes(tier as TokenTier)) {
      const store = getSnapshotStore();
      const records = await store.listProviderRecords();
      const configured = records
        .filter((r) => r.apiKey.length > 0)
        .map((r) => r.provider);

      // Also check env var fallbacks for providers not in the store
      const ENV_PROVIDERS: Array<{ provider: ProviderName; env: string }> = [
        { provider: "baseten", env: "BASETEN_API_KEY" },
        { provider: "openai", env: "OPENAI_API_KEY" },
        { provider: "anthropic", env: "ANTHROPIC_API_KEY" },
        { provider: "google", env: "GOOGLE_API_KEY" },
        { provider: "groq", env: "GROQ_API_KEY" },
      ];
      for (const { provider: p, env } of ENV_PROVIDERS) {
        if (!configured.includes(p) && process.env[env]) {
          configured.push(p);
        }
      }

      if (configured.length === 0) {
        return NextResponse.json(
          { error: "no_configured_providers" },
          { status: 400 }
        );
      }

      const selection = selectModelForTier(tier as TokenTier, configured);
      if (!selection) {
        return NextResponse.json(
          { error: "no_model_for_tier" },
          { status: 400 }
        );
      }

      resolvedProvider = selection.provider;
      resolvedModel = selection.model.id;

      if (typeof maxTokens !== "number") {
        const { TOKEN_TIERS } = await import("@/config/token-tiers");
        resolvedMaxTokens = TOKEN_TIERS[tier as TokenTier].maxTokens;
      }
    } else {
      return NextResponse.json(
        { error: "missing_provider_or_tier" },
        { status: 400 }
      );
    }

    const languageModel = await getLanguageModel(resolvedProvider, resolvedModel);

    const allMessages = [
      ...(systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }]
        : []),
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    const result = await generateText({
      model: languageModel,
      messages: allMessages,
      tools: ORIGEM_TOOLS,
      maxOutputTokens: resolvedMaxTokens,
    });

    return NextResponse.json({
      content: result.text,
      provider: resolvedProvider,
      model: resolvedModel,
      toolCalls: result.toolCalls?.length ? result.toolCalls : undefined,
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
    });
  } catch (error) {
    console.error("[completions] LLM call failed:", error);
    return NextResponse.json(
      { error: "llm_call_failed" },
      { status: 500 }
    );
  }
}
