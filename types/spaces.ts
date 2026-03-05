import type { Node, Edge } from "@xyflow/react";

/* ------------------------------------------------------------------ */
/*  ORIGEM SPACES — Type definitions                                  */
/* ------------------------------------------------------------------ */

export type ImageModel =
  | "origem-native"
  | "flux"
  | "stable-diffusion"
  | "dall-e-3"
  | "ideogram"
  | "midjourney"
  | "google-imagen";

export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "3:2" | "2:3";
export type Resolution = "512" | "1024" | "2048" | "4096";
export type GenerationStatus = "idle" | "queued" | "generating" | "done" | "error";

export interface GenerationSettings {
  model: ImageModel;
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
  model: ImageModel;
  [key: string]: unknown;
}

export interface PromptNodeData {
  type: "prompt";
  text: string;
  [key: string]: unknown;
}

export interface ReferenceNodeData {
  type: "reference";
  imageUrl: string;
  label: string;
  [key: string]: unknown;
}

export type SpacesNodeData = GenerationNodeData | PromptNodeData | ReferenceNodeData;
export type SpacesNode = Node<SpacesNodeData>;
export type SpacesEdge = Edge & { type?: "flow" | "variation" | "upscale" };

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  model: "flux",
  quantity: 4,
  resolution: "1024",
  aspectRatio: "1:1",
  styleStrength: 0.7,
  creativity: 0.5,
  seed: null,
  negativePrompt: "",
};

export const IMAGE_MODELS: { id: ImageModel; label: string; description: string }[] = [
  { id: "origem-native", label: "ORIGEM Native", description: "Modelo nativo da plataforma" },
  { id: "flux", label: "Flux", description: "Alta qualidade e velocidade" },
  { id: "stable-diffusion", label: "Stable Diffusion", description: "Versatil e open-source" },
  { id: "dall-e-3", label: "DALL-E 3", description: "OpenAI — fotorrealismo" },
  { id: "ideogram", label: "Ideogram", description: "Texto em imagens" },
  { id: "midjourney", label: "Midjourney", description: "Estetica artistica premium" },
  { id: "google-imagen", label: "Google Imagen", description: "Google DeepMind" },
];
