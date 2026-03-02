"use client";

import { cn } from "@/lib/utils";

interface LoadingOrbProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "cyan" | "purple" | "green" | "white";
}

const sizeMap = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
const dotSizeMap = { sm: "h-1 w-1", md: "h-1.5 w-1.5", lg: "h-2 w-2" };
const radiusMap = { sm: 6, md: 12, lg: 18 };

const colorMap = {
  cyan: "bg-neon-cyan",
  purple: "bg-neon-purple",
  green: "bg-neon-green",
  white: "bg-white",
};

export function LoadingOrb({
  className,
  size = "md",
  color = "cyan",
}: LoadingOrbProps) {
  const dotCount = 8;
  const radius = radiusMap[size];

  return (
    <div
      className={cn(
        "relative animate-spin",
        sizeMap[size],
        className
      )}
      style={{ animationDuration: "1.5s" }}
    >
      {Array.from({ length: dotCount }, (_, i) => {
        const angle = (i / dotCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const opacity = 0.3 + (i / dotCount) * 0.7;

        return (
          <div
            key={i}
            className={cn(
              "absolute left-1/2 top-1/2 rounded-full",
              dotSizeMap[size],
              colorMap[color]
            )}
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
