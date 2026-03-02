"use client";

import { cn } from "@/lib/utils";

interface OrigemLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizes = {
  sm: { icon: 24, text: "text-sm" },
  md: { icon: 32, text: "text-lg" },
  lg: { icon: 48, text: "text-2xl" },
};

export function OrigemLogo({
  className,
  size = "md",
  showText = true,
}: OrigemLogoProps) {
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        {/* Core circle */}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer glow ring */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="url(#logoGradient)"
            strokeWidth="1.5"
            opacity="0.6"
          />
          {/* Middle ring */}
          <circle
            cx="24"
            cy="24"
            r="16"
            stroke="url(#logoGradient)"
            strokeWidth="2"
            opacity="0.8"
          />
          {/* Inner core */}
          <circle cx="24" cy="24" r="8" fill="url(#logoGradient)" />
          {/* Center dot */}
          <circle cx="24" cy="24" r="3" fill="white" opacity="0.9" />
          {/* Orbital lines */}
          <ellipse
            cx="24"
            cy="24"
            rx="20"
            ry="8"
            stroke="url(#logoGradient)"
            strokeWidth="0.8"
            opacity="0.4"
            transform="rotate(-30 24 24)"
          />
          <ellipse
            cx="24"
            cy="24"
            rx="20"
            ry="8"
            stroke="url(#logoGradient)"
            strokeWidth="0.8"
            opacity="0.4"
            transform="rotate(30 24 24)"
          />
          <defs>
            <linearGradient
              id="logoGradient"
              x1="0"
              y1="0"
              x2="48"
              y2="48"
            >
              <stop stopColor="oklch(0.78 0.15 195)" />
              <stop offset="0.5" stopColor="oklch(0.65 0.25 290)" />
              <stop offset="1" stopColor="oklch(0.70 0.22 340)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            s.text,
            "font-bold tracking-[0.2em] text-foreground/90"
          )}
        >
          ORIGEM
        </span>
      )}
    </div>
  );
}
