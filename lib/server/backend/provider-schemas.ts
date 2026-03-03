import { z } from "zod";

const PROVIDER_NAMES = [
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
] as const;

export const ProviderNameSchema = z.enum(PROVIDER_NAMES);

export const ProviderConfigUpsertSchema = z.object({
  provider: ProviderNameSchema,
  apiKey: z.string().optional().default(""),
  selectedModel: z.string().min(1),
});

export type ProviderConfigUpsertInput = z.infer<typeof ProviderConfigUpsertSchema>;
