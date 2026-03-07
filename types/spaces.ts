import type { Node, Edge } from "@xyflow/react";

/* ------------------------------------------------------------------ */
/*  ORIGEM SPACES — Type definitions                                  */
/* ------------------------------------------------------------------ */

export type ImageModel =
  | "origem-native"
  | "nano-banana-pro"
  | "google-imagen-4"
  | "gpt-image"
  | "flux-pro"
  | "flux-schnell"
  | "sdxl"
  | "dall-e-3"
  | "ideogram-3"
  | "midjourney-v6"
  | "stable-diffusion-3.5";

export type VideoModel =
  | "google-veo-2"
  | "runway-gen3"
  | "kling-2"
  | "sora"
  | "pika-2"
  | "minimax-video";

export type GenerationModel = ImageModel | VideoModel;
export type GenerationType = "image" | "video";

export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "3:2" | "2:3";
export type Resolution = "512" | "1024" | "2048" | "4096";
export type GenerationStatus = "idle" | "queued" | "generating" | "done" | "error";

export interface GenerationSettings {
  model: GenerationModel;
  generationType: GenerationType;
  quantity: number;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  styleStrength: number;
  creativity: number;
  seed: number | null;
  negativePrompt: string;
}

export interface PromptBlock {
  subject: string;
  composition: string;
  lighting: string;
  camera: string;
  style: string;
}

export interface GenerationCard {
  id: string;
  spaceId: string;
  prompt: string;
  promptBlocks: PromptBlock | null;
  settings: GenerationSettings;
  imageUrls: string[];
  status: GenerationStatus;
  parentCardId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface StylePreset {
  id: string;
  name: string;
  promptBlocks: PromptBlock;
  settings: Partial<GenerationSettings>;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  cardIds: string[];
  createdAt: number;
  updatedAt: number;
}

/* React Flow node types */

export interface GenerationNodeData {
  type: "generation";
  cardId: string;
  prompt: string;
  imageUrl: string | null;
  status: GenerationStatus;
  model: GenerationModel;
  [key: string]: unknown;
}

export interface PromptNodeData {
  type: "prompt";
  text: string;
  [key: string]: unknown;
}

export interface TextNodeData {
  type: "text";
  text: string;
  [key: string]: unknown;
}

export interface ReferenceNodeData {
  type: "reference";
  imageUrl: string;
  label: string;
  [key: string]: unknown;
}

export type SpacesNodeData = GenerationNodeData | PromptNodeData | TextNodeData | ReferenceNodeData;
export type SpacesNode = Node<SpacesNodeData>;
export type SpacesEdge = Edge & { type?: "flow" | "variation" | "upscale" };

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  model: "nano-banana-pro",
  generationType: "image",
  quantity: 4,
  resolution: "1024",
  aspectRatio: "1:1",
  styleStrength: 0.7,
  creativity: 0.5,
  seed: null,
  negativePrompt: "",
};

export interface GenerationModelInfo {
  id: GenerationModel;
  label: string;
  provider: string;
  type: GenerationType;
}

export const IMAGE_MODELS: GenerationModelInfo[] = [
  { id: "nano-banana-pro", label: "Nano Banana Pro", provider: "Banana", type: "image" },
  { id: "google-imagen-4", label: "Imagen 4", provider: "Google", type: "image" },
  { id: "gpt-image", label: "GPT Image", provider: "OpenAI", type: "image" },
  { id: "flux-pro", label: "Flux Pro 1.1", provider: "BFL", type: "image" },
  { id: "flux-schnell", label: "Flux Schnell", provider: "BFL", type: "image" },
  { id: "dall-e-3", label: "DALL-E 3", provider: "OpenAI", type: "image" },
  { id: "sdxl", label: "SDXL Turbo", provider: "Stability", type: "image" },
  { id: "stable-diffusion-3.5", label: "SD 3.5", provider: "Stability", type: "image" },
  { id: "ideogram-3", label: "Ideogram 3", provider: "Ideogram", type: "image" },
  { id: "midjourney-v6", label: "Midjourney v6", provider: "Midjourney", type: "image" },
  { id: "origem-native", label: "ORIGEM Native", provider: "ORIGEM", type: "image" },
];

export const VIDEO_MODELS: GenerationModelInfo[] = [
  { id: "google-veo-2", label: "Veo 2", provider: "Google", type: "video" },
  { id: "sora", label: "Sora", provider: "OpenAI", type: "video" },
  { id: "runway-gen3", label: "Gen-3 Alpha", provider: "Runway", type: "video" },
  { id: "kling-2", label: "Kling 2.0", provider: "Kuaishou", type: "video" },
  { id: "pika-2", label: "Pika 2.0", provider: "Pika", type: "video" },
  { id: "minimax-video", label: "Video-01", provider: "MiniMax", type: "video" },
];

export const ALL_MODELS: GenerationModelInfo[] = [...IMAGE_MODELS, ...VIDEO_MODELS];
