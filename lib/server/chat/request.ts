import { z } from "zod";
import { selectModelForTier, TOKEN_TIERS } from "@/config/token-tiers";
import { listConfiguredProviders } from "@/lib/server/ai/provider-factory";
import { parseJsonBody, ApiRouteError } from "@/lib/server/request";
import { ProviderNameSchema } from "@/lib/server/backend/provider-schemas";
import type { ProviderName } from "@/types/provider";
import type { TokenTier } from "@/types/chat";

export const MAX_CHAT_BODY_SIZE = 100_000;
const CHAT_TIERS = ["short", "medium", "max", "ultra"] as const;

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(32_000),
});

const ChatRequestSchema = z
  .object({
    messages: z.array(ChatMessageSchema).min(1).max(200),
    provider: ProviderNameSchema.optional(),
    model: z.string().trim().min(1).optional(),
    tier: z.enum(CHAT_TIERS).optional(),
    maxTokens: z.number().int().min(1).max(16_384).optional(),
    systemPrompt: z.string().max(8_000).optional(),
    workspaceId: z.string().trim().min(1).optional(),
    spaceId: z.string().trim().min(1).optional(),
    sessionId: z.string().trim().min(1).optional(),
    agentId: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const hasManualSelection = Boolean(value.provider && value.model);
    const hasIncompleteManualSelection =
      (value.provider && !value.model) || (!value.provider && value.model);

    if (hasIncompleteManualSelection) {
      ctx.addIssue({
        code: "custom",
        message: "provider and model must be provided together",
        path: ["provider"],
      });
    }

    if (!hasManualSelection && !value.tier) {
      ctx.addIssue({
        code: "custom",
        message: "tier or provider/model selection is required",
        path: ["tier"],
      });
    }
  });

export type ParsedChatRequest = z.infer<typeof ChatRequestSchema> & {
  workspaceId?: string;
};

export async function parseChatRequest(request: Request): Promise<ParsedChatRequest> {
  const parsed = await parseJsonBody(request, ChatRequestSchema, {
    maxBytes: MAX_CHAT_BODY_SIZE,
  });

  return {
    ...parsed,
    workspaceId: parsed.workspaceId ?? parsed.spaceId,
  };
}

export async function resolveChatModelSelection(input: ParsedChatRequest): Promise<{
  provider: ProviderName;
  model: string;
  maxTokens: number;
}> {
  if (input.provider && input.model) {
    return {
      provider: input.provider,
      model: input.model,
      maxTokens: typeof input.maxTokens === "number" ? input.maxTokens : 1024,
    };
  }

  const tier = input.tier as TokenTier | undefined;
  if (!tier) {
    throw new ApiRouteError("missing_provider_or_tier", { status: 400 });
  }

  const configuredProviders = await listConfiguredProviders();

  if (configuredProviders.length === 0) {
    throw new ApiRouteError("no_configured_providers", { status: 400 });
  }

  const selection = selectModelForTier(tier, configuredProviders);
  if (!selection) {
    throw new ApiRouteError("no_model_for_tier", { status: 400 });
  }

  return {
    provider: selection.provider,
    model: selection.model.id,
    maxTokens:
      typeof input.maxTokens === "number"
        ? input.maxTokens
        : TOKEN_TIERS[tier].maxTokens,
  };
}
