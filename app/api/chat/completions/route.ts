import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getLanguageModel } from "@/lib/server/ai/provider-factory";
import { getSnapshotStore } from "@/lib/server/backend/store";
import { selectModelForTier } from "@/config/token-tiers";
import type { ProviderName } from "@/types/provider";
import type { TokenTier } from "@/types/chat";

const TIERS: TokenTier[] = ["short", "medium", "max", "ultra"];

export async function POST(request: Request) {
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

  const { messages, provider, model, tier, maxTokens, systemPrompt } = body as {
    messages: Array<{ role: string; content: string }>;
    provider?: string;
    model?: string;
    tier?: string;
    maxTokens?: number;
    systemPrompt?: string;
  };

  let resolvedProvider: ProviderName;
  let resolvedModel: string;
  let resolvedMaxTokens: number = typeof maxTokens === "number" ? maxTokens : 1024;

  try {
    if (provider && model) {
      // Explicit provider + model
      resolvedProvider = provider as ProviderName;
      resolvedModel = model;
    } else if (tier && TIERS.includes(tier as TokenTier)) {
      // Auto-select based on tier
      const store = getSnapshotStore();
      const records = await store.listProviderRecords();
      const configured = records
        .filter((r) => r.apiKey.length > 0)
        .map((r) => r.provider);

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

      // Use tier max tokens if no explicit override
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
      maxTokens: resolvedMaxTokens,
    });

    return NextResponse.json({
      content: result.text,
      provider: resolvedProvider,
      model: resolvedModel,
      usage: result.usage
        ? {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json(
      { error: "llm_call_failed", details: message },
      { status: 500 }
    );
  }
}
