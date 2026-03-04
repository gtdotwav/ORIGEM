"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CosmicEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  neonColor?: "cyan" | "purple" | "green" | "orange" | "blue" | "pink";
  action?:
    | { label: string; href: string }
    | { label: string; onClick: () => void };
  className?: string;
}

const neonMap = {
  cyan: {
    icon: "text-neon-cyan",
    border: "border-neon-cyan/20",
    bg: "bg-neon-cyan/5",
    btn: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:border-neon-cyan/60 hover:bg-neon-cyan/20",
  },
  purple: {
    icon: "text-neon-purple",
    border: "border-neon-purple/20",
    bg: "bg-neon-purple/5",
    btn: "border-neon-purple/30 bg-neon-purple/10 text-neon-purple hover:border-neon-purple/60 hover:bg-neon-purple/20",
  },
  green: {
    icon: "text-neon-green",
    border: "border-neon-green/20",
    bg: "bg-neon-green/5",
    btn: "border-neon-green/30 bg-neon-green/10 text-neon-green hover:border-neon-green/60 hover:bg-neon-green/20",
  },
  orange: {
    icon: "text-neon-orange",
    border: "border-neon-orange/20",
    bg: "bg-neon-orange/5",
    btn: "border-neon-orange/30 bg-neon-orange/10 text-neon-orange hover:border-neon-orange/60 hover:bg-neon-orange/20",
  },
  blue: {
    icon: "text-neon-blue",
    border: "border-neon-blue/20",
    bg: "bg-neon-blue/5",
    btn: "border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:border-neon-blue/60 hover:bg-neon-blue/20",
  },
  pink: {
    icon: "text-neon-pink",
    border: "border-neon-pink/20",
    bg: "bg-neon-pink/5",
    btn: "border-neon-pink/30 bg-neon-pink/10 text-neon-pink hover:border-neon-pink/60 hover:bg-neon-pink/20",
  },
};

export function CosmicEmptyState({
  icon: Icon,
  title,
  description,
  neonColor = "cyan",
  action,
  className,
}: CosmicEmptyStateProps) {
  const colors = neonMap[neonColor];

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-8 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-xl border",
            colors.border,
            colors.bg
          )}
        >
          <Icon className={cn("h-6 w-6", colors.icon)} />
        </div>
        <h3 className="mb-1 text-sm font-semibold text-white/85">{title}</h3>
        <p className="mb-4 max-w-sm text-xs text-white/50">{description}</p>
        {action &&
          ("href" in action ? (
            <Link
              href={action.href}
              className={cn(
                "inline-flex items-center rounded-lg border px-4 py-2 text-xs font-medium transition-all",
                colors.btn
              )}
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center rounded-lg border px-4 py-2 text-xs font-medium transition-all",
                colors.btn
              )}
            >
              {action.label}
            </button>
          ))}
      </div>
    </div>
  );
}
