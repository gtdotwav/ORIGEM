export type SlideCreationMode = "manual" | "prompt" | "basics" | "enhance";

export type SlideElementType = "text" | "image" | "shape" | "title" | "subtitle" | "body" | "quote" | "author";

export type SlideLayout = "title" | "content" | "two-column" | "blank" | "image-full" | "image" | "quote";

export interface SlideElementStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  opacity?: number;
  borderRadius?: number;
  backgroundColor?: string;
}

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: SlideElementStyle;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  layout: SlideLayout;
  notes?: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: "dark" | "light" | "gradient" | "neon";
  createdAt: string;
  updatedAt: string;
}
