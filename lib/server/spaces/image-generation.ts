import { generateImage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getSnapshotStore } from "@/lib/server/backend/store";
import { getProviderApiKey } from "@/lib/server/ai/provider-factory";
import type { AspectRatio, Resolution } from "@/types/spaces";

type SpaceImagePrompt = Parameters<typeof generateImage>[0]["prompt"];

export const SUPPORTED_SPACE_IMAGE_MODELS = [
  "nano-banana-pro",
  "nano-banana-2",
  "google-imagen-4",
] as const;

export type SupportedSpaceImageModel =
  (typeof SUPPORTED_SPACE_IMAGE_MODELS)[number];

const GOOGLE_MODEL_MAP: Record<SupportedSpaceImageModel, string> = {
  "nano-banana-pro": "imagen-3.0-generate-001",
  "nano-banana-2": "imagen-3.0-generate-001",
  "google-imagen-4": "imagen-3.0-generate-001",
};

const IMAGEN_SUPPORTED_RATIOS = new Set<AspectRatio>([
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
]);

function appendNegativePrompt(prompt: string, negativePrompt?: string) {
  const cleanPrompt = prompt.trim();
  const cleanNegative = negativePrompt?.trim();

  if (!cleanNegative) {
    return cleanPrompt;
  }

  return `${cleanPrompt}\n\nAvoid: ${cleanNegative}`;
}

function toGoogleImageSize(resolution: Resolution): "512" | "1K" | "2K" | "4K" {
  switch (resolution) {
    case "512":
      return "512";
    case "2048":
      return "2K";
    case "4096":
      return "4K";
    case "1024":
    default:
      return "1K";
  }
}

async function resolveGoogleApiKey(): Promise<string> {
  try {
    const store = getSnapshotStore();
    const record = await store.getProviderRecord("google");
    if (record?.apiKey.trim()) {
      return record.apiKey.trim();
    }
  } catch (error) {
    console.warn("[spaces] Failed to load saved Google API key:", error);
  }

  return (await getProviderApiKey("google"))?.trim() ?? "";
}

async function persistImage(
  base64: string,
  mediaType: string
): Promise<string> {
  try {
    const { put } = await import("@vercel/blob");
    const ext =
      mediaType === "image/webp"
        ? "webp"
        : mediaType === "image/jpeg"
        ? "jpg"
        : "png";

    const path = `spaces/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const result = await put(path, Buffer.from(base64, "base64"), {
      access: "public",
      addRandomSuffix: false,
      contentType: mediaType,
    });

    return result.url;
  } catch {
    return `data:${mediaType};base64,${base64}`;
  }
}

async function generateGoogleImageBatch(input: {
  modelId: string;
  prompt: SpaceImagePrompt;
  aspectRatio: AspectRatio;
  quantity: number;
  resolution: Resolution;
  seed?: number | null;
}): Promise<Array<{ url: string; mediaType: string }>> {
  const apiKey = await resolveGoogleApiKey();

  if (!apiKey) {
    throw new Error("no_google_api_key");
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const isImagenModel = input.modelId.startsWith("imagen-");

  let safeRatio = input.aspectRatio;
  if (isImagenModel && !IMAGEN_SUPPORTED_RATIOS.has(safeRatio)) {
    if (safeRatio === "3:2") safeRatio = "4:3";
    else if (safeRatio === "2:3") safeRatio = "3:4";
    else safeRatio = "1:1";
  }

  const safePrompt = typeof input.prompt === "string" 
    ? input.prompt 
    : (input.prompt as any).text;

  const providerOptions = isImagenModel
    ? {
        google: {
          aspectRatio: safeRatio,
          personGeneration: "allow_adult" as const,
        },
      }
    : {
        google: {
          imageConfig: {
            imageSize: toGoogleImageSize(input.resolution),
          },
        },
      };

  if (isImagenModel) {
    const result = await generateImage({
      model: google.image(input.modelId),
      prompt: safePrompt as any,
      n: input.quantity,
      aspectRatio: safeRatio,
      providerOptions,
      maxRetries: 1,
    });

    return Promise.all(
      result.images.map(async (image) => ({
        mediaType: image.mediaType,
        url: await persistImage(image.base64, image.mediaType),
      }))
    );
  }

  const batches = await Promise.all(
    Array.from({ length: input.quantity }, () =>
      generateImage({
        model: google.image(input.modelId),
        prompt: safePrompt as any,
        aspectRatio: safeRatio,
        seed: input.seed ?? undefined,
        providerOptions,
        maxRetries: 1,
      })
    )
  );

  return Promise.all(
    batches.flatMap((batch) =>
      batch.images.map(async (image) => ({
        mediaType: image.mediaType,
        url: await persistImage(image.base64, image.mediaType),
      }))
    )
  );
}

export async function generateSpaceImages(input: {
  model: SupportedSpaceImageModel;
  prompt: string;
  quantity: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  negativePrompt?: string;
  seed?: number | null;
  referenceImages?: string[];
}): Promise<{
  imageUrls: string[];
  provider: "google";
  modelId: string;
}> {
  const modelId = GOOGLE_MODEL_MAP[input.model];

  if (!modelId) {
    throw new Error("unsupported_space_model");
  }

  const promptText = appendNegativePrompt(input.prompt, input.negativePrompt);
  const promptPayload: SpaceImagePrompt =
    input.referenceImages && input.referenceImages.length > 0
      ? {
          text: promptText,
          images: input.referenceImages,
        }
      : promptText;

  const images = await generateGoogleImageBatch({
    modelId,
    prompt: promptPayload,
    aspectRatio: input.aspectRatio,
    quantity: input.quantity,
    resolution: input.resolution,
    seed: input.seed,
  });

  return {
    imageUrls: images.map((image) => image.url),
    provider: "google",
    modelId,
  };
}
