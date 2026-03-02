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
    "from-neon-cyan via-neon-purple to-neon-pink",
  neon: "from-neon-green via-neon-cyan to-neon-blue",
  warm: "from-neon-orange via-neon-pink to-neon-purple",
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
