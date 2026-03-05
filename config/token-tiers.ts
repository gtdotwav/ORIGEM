import type { TokenTier, TokenTierConfig } from "@/types/chat";
import type { ModelInfo, ProviderName } from "@/types/provider";
import { PROVIDER_CATALOG } from "@/config/providers";

export const TOKEN_TIERS: Record<TokenTier, TokenTierConfig> = {
  short: {
    tier: "short",
    label: "Rapido",
    description: "Resposta curta e objetiva (~256 tokens)",
    maxTokens: 256,
    preferredCostTiers: ["free", "low"],
    icon: "Zap",
    color: "neon-green",
  },
  medium: {
    tier: "medium",
    label: "Medio",
    description: "Resposta equilibrada (~1024 tokens)",
    maxTokens: 1024,
    preferredCostTiers: ["low", "medium"],
    icon: "MessageSquare",
    color: "neon-cyan",
  },
  max: {
    tier: "max",
    label: "Maximo",
    description: "Resposta completa (~4096 tokens)",
    maxTokens: 4096,
    preferredCostTiers: ["medium", "high"],
    icon: "Sparkles",
    color: "neon-purple",
  },
  ultra: {
    tier: "ultra",
    label: "Agent \u221E",
    description: "Sem limite pratico (~16K tokens)",
    maxTokens: 16384,
    preferredCostTiers: ["high", "medium"],
    icon: "Flame",
    color: "neon-orange",
  },
};

export const TIER_ORDER: TokenTier[] = ["short", "medium", "max", "ultra"];

/**
 * Given configured providers (those with API keys), pick the best model for a tier.
 * Matches models by costTier preference order.
 */
export function selectModelForTier(
  tier: TokenTier,
  configuredProviders: ProviderName[]
): { provider: ProviderName; model: ModelInfo } | null {
  const tierConfig = TOKEN_TIERS[tier];
  const candidates: Array<{
    provider: ProviderName;
    model: ModelInfo;
    rank: number;
  }> = [];

  for (const providerMeta of PROVIDER_CATALOG) {
    if (!configuredProviders.includes(providerMeta.name)) continue;
    for (const model of providerMeta.models) {
      const costIndex = tierConfig.preferredCostTiers.indexOf(model.costTier);
      if (costIndex !== -1) {
        candidates.push({
          provider: providerMeta.name,
          model,
          rank: costIndex,
        });
      }
    }
  }

  // If no preferred match, try any model from configured providers
  if (candidates.length === 0) {
    for (const providerMeta of PROVIDER_CATALOG) {
      if (!configuredProviders.includes(providerMeta.name)) continue;
      if (providerMeta.models.length > 0) {
        candidates.push({
          provider: providerMeta.name,
          model: providerMeta.models[0],
          rank: 99,
        });
      }
    }
  }

  candidates.sort((a, b) => a.rank - b.rank);
  return candidates[0] ?? null;
}
