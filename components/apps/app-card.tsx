"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { PersonaColor } from "@/types/persona";
import { PERSONA_COLORS } from "@/lib/personas";
import { cn } from "@/lib/utils";

interface AppCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  color: PersonaColor;
  href: string;
  badge?: string;
}

export function AppCard({ title, description, icon: Icon, color, href, badge }: AppCardProps) {
  const colors = PERSONA_COLORS[color];

  return (
    <Link
      href={href}
      className={cn(
        "group relative rounded-2xl border bg-card/70 p-6 backdrop-blur-xl transition-all",
        "border-foreground/[0.08] hover:border-foreground/[0.15]",
        colors.bgHover
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border",
            colors.border,
            colors.bg
          )}
        >
          {Icon && <Icon className={cn("h-6 w-6", colors.text)} />}
        </div>
        {badge && (
          <span className="rounded-md border border-foreground/[0.10] bg-foreground/[0.05] px-2 py-0.5 text-[10px] text-foreground/40">
            {badge}
          </span>
        )}
      </div>

      <h3 className="mb-1.5 text-sm font-semibold text-foreground/90 transition-colors group-hover:text-foreground">
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-foreground/40">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all",
            colors.border,
            colors.bg,
            colors.text,
            colors.borderHover
          )}
        >
          Abrir App
        </span>
      </div>
    </Link>
  );
}
