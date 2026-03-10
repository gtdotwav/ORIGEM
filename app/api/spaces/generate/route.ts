import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/server/api-auth";
import {
  generateSpaceImages,
  SUPPORTED_SPACE_IMAGE_MODELS,
} from "@/lib/server/spaces/image-generation";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getRateLimitKey,
} from "@/lib/server/rate-limit";
import { ApiRouteError, parseJsonBody, toErrorResponse } from "@/lib/server/request";

export const runtime = "nodejs";
const MAX_SPACE_GENERATE_BYTES = 5 * 1024 * 1024;

const SpaceGenerateSchema = z.object({
  prompt: z.string().trim().min(1),
  model: z.enum(SUPPORTED_SPACE_IMAGE_MODELS),
  quantity: z.number().int().min(1).max(2).default(1),
  aspectRatio: z.enum(["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"]),
  resolution: z.enum(["512", "1024", "2048", "4096"]).default("1024"),
  negativePrompt: z.string().optional().default(""),
  seed: z.number().int().nullable().optional(),
  referenceImages: z.array(z.string().trim().min(1)).max(4).optional().default([]),
});

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof Response) {
    return session;
  }

  const rateCheck = checkRateLimit(getRateLimitKey(request, "spaces:generate"), 6, 60_000);
  const rateHeaders = buildRateLimitHeaders(rateCheck);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: rateCheck.retryAfter },
      { status: 429, headers: rateHeaders }
    );
  }

  try {
    const body = await parseJsonBody(request, SpaceGenerateSchema, {
      maxBytes: MAX_SPACE_GENERATE_BYTES,
    });
    const result = await generateSpaceImages({
      ...body,
      quantity: body.quantity ?? 1,
      resolution: body.resolution ?? "1024",
      negativePrompt: body.negativePrompt ?? "",
      referenceImages: body.referenceImages ?? [],
    });
    return NextResponse.json({
      ok: true,
      imageUrls: result.imageUrls,
      provider: result.provider,
      modelId: result.modelId,
    }, { headers: rateHeaders });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return toErrorResponse(error, {
        code: "invalid_body",
        status: 400,
      });
    }

    const message =
      error instanceof Error ? error.message : "space_generation_failed";

    const status =
      message === "no_google_api_key"
        ? 400
        : message === "unsupported_space_model" ||
          message === "reference_images_require_nano_banana" ||
          message === "unsupported_aspect_ratio_for_imagen"
        ? 422
        : 500;

    return NextResponse.json(
      {
        error: "space_generation_failed",
        reason: message,
      },
      { status, headers: rateHeaders }
    );
  }
}
