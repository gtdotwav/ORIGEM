export type ProviderName =
  | "anthropic"
  | "openai"
  | "google"
  | "groq"
  | "fireworks"
  | "mistral"
  | "baseten"
  | "perplexity"
  | "together"
  | "cohere";

export interface ProviderConfig {
  id: string;
  provider: ProviderName;
  apiKey: string;
  isActive: boolean;
  defaultModel: string;
  config?: Record<string, unknown>;
  createdAt: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderName;
  contextWindow: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  costTier: "free" | "low" | "medium" | "high";
  bestFor: string[];
}

export interface ProviderMeta {
  name: ProviderName;
  displayName: string;
  icon: string;
  color: string;
  website: string;
  models: ModelInfo[];
}
