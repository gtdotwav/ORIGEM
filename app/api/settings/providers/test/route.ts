import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { requireApiSession } from "@/lib/server/api-auth";
import type { ProviderName } from "@/types/provider";
import { getProviderApiKey } from "@/lib/server/ai/provider-factory";
import { ApiRouteError, parseJsonBody, toErrorResponse } from "@/lib/server/request";

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

const ProviderTestBodySchema = z.object({
  provider: z.enum([
    "anthropic",
    "openai",
    "google",
    "groq",
    "fireworks",
    "mistral",
    "baseten",
    "perplexity",
    "together",
    "cohere",
  ]),
  apiKey: z.string().optional(),
});

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
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  let providerForLog = "unknown";

  try {
    const body = await parseJsonBody(request, ProviderTestBodySchema, {
      maxBytes: 8_000,
    });
    const provider = body.provider as ProviderName;
    providerForLog = provider;
    const apiKey =
      (typeof body.apiKey === "string" ? body.apiKey.trim() : "") ||
      (await getProviderApiKey(provider)) ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "no_api_key", message: "Nenhuma API key disponivel." },
        { status: 400 }
      );
    }

    const model = buildModel(provider, apiKey);
    await generateText({
      model,
      messages: [{ role: "user", content: "ping" }],
      maxOutputTokens: 5,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return toErrorResponse(error, {
        code: "invalid_body",
        status: 400,
      });
    }

    console.error(`[providers/test] ${providerForLog} test failed:`, error);
    const message =
      error instanceof Error ? error.message : "Connection failed";
    if (message.includes("ORIGEM_ENCRYPT_SECRET")) {
      return NextResponse.json(
        { error: "storage_unavailable", reason: "encryption_not_configured" },
        { status: 503 }
      );
    }
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
