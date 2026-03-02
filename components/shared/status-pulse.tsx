"use client";

import { cn } from "@/lib/utils";

interface StatusPulseProps {
  status: "idle" | "active" | "success" | "error" | "warning";
  className?: string;
  size?: "sm" | "md";
}

const statusColors = {
  idle: "bg-muted-foreground/50",
  active: "bg-neon-cyan",
  success: "bg-neon-green",
  error: "bg-destructive",
  warning: "bg-neon-orange",
};

const pulseColors = {
  idle: "",
  active: "bg-neon-cyan",
  success: "bg-neon-green",
  error: "bg-destructive",
  warning: "bg-neon-orange",
};

export function StatusPulse({
  status,
  className,
  size = "sm",
}: StatusPulseProps) {
  const s = size === "sm" ? "h-2 w-2" : "h-3 w-3";
  const ps = size === "sm" ? "h-2 w-2" : "h-3 w-3";

  return (
    <span className={cn("relative inline-flex", className)}>
      {status !== "idle" && (
        <span
          className={cn(
            "absolute inline-flex rounded-full opacity-75 animate-ping",
            ps,
            pulseColors[status]
          )}
        />
      )}
      <span
        className={cn("relative inline-flex rounded-full", s, statusColors[status])}
      />
    </span>
  );
}
