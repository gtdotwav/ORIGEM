"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "neon" | "warm";
}

const gradients = {
  primary:
    "from-foreground/80 via-foreground/50 to-foreground/30",
  neon: "from-neon-cyan via-foreground/60 to-neon-green",
  warm: "from-neon-orange via-foreground/50 to-neon-cyan",
};

export function GradientText({
  children,
  className,
  variant = "primary",
}: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        gradients[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
