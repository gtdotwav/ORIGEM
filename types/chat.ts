import type { ProviderName } from "@/types/provider";
import type { RuntimeLanguage } from "@/types/runtime";

/* ── Token Tier System ── */

export type TokenTier = "short" | "medium" | "max" | "ultra";

export interface TokenTierConfig {
  tier: TokenTier;
  label: string;
  description: string;
  maxTokens: number;
  preferredCostTiers: Array<"free" | "low" | "medium" | "high">;
  icon: string;
  color: string;
}

/* ── Critic System ── */

export type CriticType =
  | "logica"
  | "clareza"
  | "profundidade"
  | "criatividade"
  | "precisao";

export interface CriticConfig {
  type: CriticType;
  label: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  guidance: string;
}

export interface CriticResult {
  criticType: CriticType;
  verdict: "approved" | "revised" | "flagged";
  annotation: string;
  revisedContent?: string;
}

/* ── Chat Completion ── */

export interface ChatCompletionRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  provider?: ProviderName;
  model?: string;
  tier?: TokenTier;
  language?: RuntimeLanguage | "origem";
  maxTokens?: number;
  systemPrompt?: string;
  workspaceId?: string;
  /** @deprecated legacy MCP context field */
  spaceId?: string;
  sessionId?: string;
  agentId?: string;
}

export interface ChatCompletionResponse {
  content: string;
  provider: ProviderName;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/* ── 360 Ecosystem Config ── */

export interface EcosystemConfig {
  provider: ProviderName | null;
  model: string;
  language: RuntimeLanguage | "origem";
}
