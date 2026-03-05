"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  neon?: "cyan" | "purple" | "green" | "orange" | "pink" | "blue";
  hover?: boolean;
}

const neonGlowMap: Record<string, string> = {
  cyan: "hover:shadow-[0_0_30px_oklch(0.78_0.15_195/0.15)]",
  purple: "hover:shadow-[0_0_30px_oklch(0.65_0.25_290/0.15)]",
  green: "hover:shadow-[0_0_30px_oklch(0.78_0.2_145/0.15)]",
  orange: "hover:shadow-[0_0_30px_oklch(0.75_0.18_55/0.15)]",
  pink: "hover:shadow-[0_0_30px_oklch(0.70_0.22_340/0.15)]",
  blue: "hover:shadow-[0_0_30px_oklch(0.65_0.2_250/0.15)]",
};

export function GlassCard({
  children,
  className,
  neon,
  hover = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-4 shadow-xl shadow-black/10",
        hover && "transition-all duration-300",
        hover && neon && neonGlowMap[neon],
        hover && !neon && "hover:border-foreground/15 hover:bg-foreground/[0.07]",
        className
      )}
    >
      {children}
    </div>
  );
}
