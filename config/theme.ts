export const NEON_COLORS = {
  cyan: "oklch(0.78 0.15 195)",
  purple: "oklch(0.65 0.25 290)",
  green: "oklch(0.78 0.2 145)",
  orange: "oklch(0.75 0.18 55)",
  pink: "oklch(0.70 0.22 340)",
  blue: "oklch(0.65 0.2 250)",
  white: "oklch(0.95 0.02 270)",
} as const;

export const AGENT_COLORS: Record<string, string> = {
  coder: NEON_COLORS.green,
  writer: NEON_COLORS.purple,
  researcher: NEON_COLORS.cyan,
  designer: NEON_COLORS.orange,
  critic: NEON_COLORS.pink,
  planner: NEON_COLORS.blue,
  synthesizer: NEON_COLORS.white,
};

export const GLOW_CLASSES: Record<string, string> = {
  cyan: "glow-cyan",
  purple: "glow-purple",
  green: "glow-green",
  orange: "glow-orange",
  pink: "glow-pink",
  blue: "glow-blue",
};
