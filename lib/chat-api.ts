"use client";

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  CriticConfig,
  CriticResult,
  TokenTier,
} from "@/types/chat";
import { buildCriticSystemPrompt } from "@/config/critics";

export async function callChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const response = await fetch("/api/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "unknown" })) as { error?: string };
    throw new Error(error.error ?? `api_error_${response.status}`);
  }

  return response.json() as Promise<ChatCompletionResponse>;
}

/* ── Streaming Chat ── */

export async function callChatStream(
  request: ChatCompletionRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<{ content: string; provider: string; model: string }> {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "unknown" })) as { error?: string };
    throw new Error(error.error ?? `api_error_${response.status}`);
  }

  const provider = response.headers.get("X-Provider") ?? "unknown";
  const model = response.headers.get("X-Model") ?? "unknown";

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("no_stream_body");
  }

  const decoder = new TextDecoder();
  let fullContent = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullContent += chunk;
    onChunk(fullContent);
  }

  return { content: fullContent, provider, model };
}

/* ── Critic Pipeline ── */

function parseCriticResponse(raw: string): Omit<CriticResult, "criticType"> {
  const upper = raw.toUpperCase();

  let verdict: CriticResult["verdict"] = "approved";
  if (upper.includes("REVISADO") || upper.includes("REVISED")) {
    verdict = "revised";
  } else if (upper.includes("SINALIZADO") || upper.includes("FLAGGED")) {
    verdict = "flagged";
  }

  // Extract revised content after "REVISAO:" marker
  let revisedContent: string | undefined;
  const revisionMatch = raw.match(/REVIS[ÃA]O:\s*([\s\S]+)$/i);
  if (revisionMatch && verdict === "revised") {
    revisedContent = revisionMatch[1].trim();
  }

  return { verdict, annotation: raw, revisedContent };
}

export async function runCriticPipeline(
  originalResponse: string,
  activeCritics: CriticConfig[],
  tier: TokenTier
): Promise<{ finalContent: string; results: CriticResult[] }> {
  const results: CriticResult[] = [];
  let currentContent = originalResponse;

  for (const critic of activeCritics) {
    try {
      const criticPrompt = buildCriticSystemPrompt(critic);
      const result = await callChatCompletion({
        messages: [{ role: "user", content: currentContent }],
        tier,
        systemPrompt: criticPrompt,
      });

      const parsed = parseCriticResponse(result.content);
      results.push({ criticType: critic.type, ...parsed });

      if (parsed.verdict === "revised" && parsed.revisedContent) {
        currentContent = parsed.revisedContent;
      }
    } catch {
      results.push({
        criticType: critic.type,
        verdict: "approved",
        annotation: "Critico nao disponivel no momento.",
      });
    }
  }

  return { finalContent: currentContent, results };
}
