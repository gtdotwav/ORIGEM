"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface NeonGlowProps {
  children: ReactNode;
  color: "cyan" | "purple" | "green" | "orange" | "pink" | "blue";
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
}

const glowMap = {
  cyan: {
    subtle: "shadow-[0_0_10px_oklch(0.78_0.15_195/0.1)]",
    medium: "shadow-[0_0_20px_oklch(0.78_0.15_195/0.2)]",
    strong: "shadow-[0_0_30px_oklch(0.78_0.15_195/0.3),0_0_60px_oklch(0.78_0.15_195/0.1)]",
  },
  purple: {
    subtle: "shadow-[0_0_10px_oklch(0.65_0.25_290/0.1)]",
    medium: "shadow-[0_0_20px_oklch(0.65_0.25_290/0.2)]",
    strong: "shadow-[0_0_30px_oklch(0.65_0.25_290/0.3),0_0_60px_oklch(0.65_0.25_290/0.1)]",
  },
  green: {
    subtle: "shadow-[0_0_10px_oklch(0.78_0.2_145/0.1)]",
    medium: "shadow-[0_0_20px_oklch(0.78_0.2_145/0.2)]",
    strong: "shadow-[0_0_30px_oklch(0.78_0.2_145/0.3),0_0_60px_oklch(0.78_0.2_145/0.1)]",
  },
  orange: {
    subtle: "shadow-[0_0_10px_oklch(0.75_0.18_55/0.1)]",
    medium: "shadow-[0_0_20px_oklch(0.75_0.18_55/0.2)]",
    strong: "shadow-[0_0_30px_oklch(0.75_0.18_55/0.3),0_0_60px_oklch(0.75_0.18_55/0.1)]",
  },
  pink: {
    subtle: "shadow-[0_0_10px_oklch(0.70_0.22_340/0.1)]",
    medium: "shadow-[0_0_20px_oklch(0.70_0.22_340/0.2)]",
    strong: "shadow-[0_0_30px_oklch(0.70_0.22_340/0.3),0_0_60px_oklch(0.70_0.22_340/0.1)]",
  },
  blue: {
    subtle: "shadow-[0_0_10px_oklch(0.65_0.2_250/0.1)]",
    medium: "shadow-[0_0_20px_oklch(0.65_0.2_250/0.2)]",
    strong: "shadow-[0_0_30px_oklch(0.65_0.2_250/0.3),0_0_60px_oklch(0.65_0.2_250/0.1)]",
  },
};

export function NeonGlow({
  children,
  color,
  className,
  intensity = "medium",
}: NeonGlowProps) {
  return (
    <div className={cn(glowMap[color][intensity], className)}>
      {children}
    </div>
  );
}
