import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ProviderName } from "@/types/provider";
import { getSnapshotStore } from "@/lib/server/backend/store";

const MINIMAL_MODELS: Partial<Record<ProviderName, string>> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  google: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
  fireworks: "accounts/fireworks/models/llama-v3p3-70b-instruct",
  together: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
  mistral: "mistral-large-latest",
  perplexity: "sonar-pro",
  cohere: "command-r-plus",
  baseten: "moonshotai/Kimi-K2",
};

function buildModel(provider: ProviderName, apiKey: string) {
  const modelId = MINIMAL_MODELS[provider];
  if (!modelId) throw new Error("unsupported_provider");

  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "groq":
      return createOpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" })(modelId);
    case "fireworks":
      return createOpenAI({ apiKey, baseURL: "https://api.fireworks.ai/inference/v1" })(modelId);
    case "together":
      return createOpenAI({ apiKey, baseURL: "https://api.together.xyz/v1" })(modelId);
    case "mistral":
      return createOpenAI({ apiKey, baseURL: "https://api.mistral.ai/v1" })(modelId);
    case "perplexity":
      return createOpenAI({ apiKey, baseURL: "https://api.perplexity.ai" })(modelId);
    case "cohere":
      return createOpenAI({ apiKey, baseURL: "https://api.cohere.ai/compatibility/v1" })(modelId);
    case "baseten":
      return createOpenAI({ apiKey, baseURL: "https://inference.baseten.co/v1" })(modelId);
    default:
      throw new Error("unsupported_provider");
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.provider !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const provider = body.provider as ProviderName;
  let apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  // Fall back to saved key if none provided
  if (!apiKey) {
    const store = getSnapshotStore();
    const record = await store.getProviderRecord(provider);
    apiKey = record?.apiKey ?? "";
  }

  // Fall back to env var
  if (!apiKey) {
    const ENV_MAP: Partial<Record<ProviderName, string>> = {
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
    apiKey = process.env[ENV_MAP[provider] ?? ""] ?? "";
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "no_api_key", message: "Nenhuma API key disponivel." },
      { status: 400 }
    );
  }

  try {
    const model = buildModel(provider, apiKey);
    await generateText({
      model,
      messages: [{ role: "user", content: "ping" }],
      maxOutputTokens: 5,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[providers/test] ${provider} test failed:`, error);
    const message =
      error instanceof Error ? error.message : "Connection failed";
    const isAuthError =
      message.includes("401") ||
      message.includes("403") ||
      message.includes("auth") ||
      message.includes("key") ||
      message.includes("invalid");

    return NextResponse.json(
      {
        error: "connection_failed",
        reason: isAuthError ? "invalid_key" : "provider_error",
      },
      { status: 422 }
    );
  }
}
