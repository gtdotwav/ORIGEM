import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ProviderName } from "@/types/provider";
import { getSnapshotStore } from "@/lib/server/backend/store";

/**
 * Returns a Vercel AI SDK language model instance for the given provider + model.
 * Reads API key from server-side SnapshotStore.
 */
export async function getLanguageModel(
  provider: ProviderName,
  modelId: string
) {
  const store = getSnapshotStore();
  const record = await store.getProviderRecord(provider);

  if (!record || !record.apiKey) {
    throw new Error(`no_api_key_for_${provider}`);
  }

  const { apiKey } = record;

  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(modelId);

    case "anthropic":
      return createAnthropic({ apiKey })(modelId);

    // OpenAI-compatible providers via custom baseURL
    case "groq":
      return createOpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      })(modelId);

    case "fireworks":
      return createOpenAI({
        apiKey,
        baseURL: "https://api.fireworks.ai/inference/v1",
      })(modelId);

    case "together":
      return createOpenAI({
        apiKey,
        baseURL: "https://api.together.xyz/v1",
      })(modelId);

    case "mistral":
      return createOpenAI({
        apiKey,
        baseURL: "https://api.mistral.ai/v1",
      })(modelId);

    case "perplexity":
      return createOpenAI({
        apiKey,
        baseURL: "https://api.perplexity.ai",
      })(modelId);

    case "cohere":
      return createOpenAI({
        apiKey,
        baseURL: "https://api.cohere.ai/compatibility/v1",
      })(modelId);

    case "google":
      throw new Error("google_provider_requires_sdk_install");

    case "baseten":
      return createOpenAI({
        apiKey,
        baseURL: "https://inference.baseten.co/v1",
      })(modelId);

    default:
      throw new Error(`unsupported_provider_${provider as string}`);
  }
}
