import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ProviderName } from "@/types/provider";
import { getSnapshotStore } from "@/lib/server/backend/store";

/** Env var fallback map — checked when no key in store */
const ENV_KEY_MAP: Partial<Record<ProviderName, string>> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_API_KEY",
  groq: "GROQ_API_KEY",
  fireworks: "FIREWORKS_API_KEY",
  together: "TOGETHER_API_KEY",
  mistral: "MISTRAL_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  cohere: "COHERE_API_KEY",
  baseten: "BASETEN_API_KEY",
};

/**
 * Returns a Vercel AI SDK language model instance for the given provider + model.
 * Reads API key from SnapshotStore first, falls back to env var.
 */
export async function getLanguageModel(
  provider: ProviderName,
  modelId: string
) {
  const store = getSnapshotStore();
  const record = await store.getProviderRecord(provider);

  const apiKey =
    record?.apiKey ||
    (ENV_KEY_MAP[provider] ? process.env[ENV_KEY_MAP[provider]!] : undefined);

  if (!apiKey) {
    throw new Error(`no_api_key_for_${provider}`);
  }

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
