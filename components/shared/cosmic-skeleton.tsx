"use client";

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/[0.04]",
        className
      )}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-5 backdrop-blur-xl",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <Shimmer className="h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-2/3" />
          <Shimmer className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <Shimmer className="h-3 w-4/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <Shimmer className="h-7 w-20 rounded-lg" />
        <Shimmer className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function MetricSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl",
        className
      )}
    >
      <Shimmer className="mb-2 h-3 w-1/2" />
      <Shimmer className="mb-1 h-7 w-16" />
      <Shimmer className="h-2.5 w-2/3" />
    </div>
  );
}

export function MessageSkeleton({
  align = "left",
  className,
}: {
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full",
        align === "right" ? "justify-end" : "justify-start",
        className
      )}
    >
      <div className="max-w-[88%] space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <Shimmer className="h-3 w-48" />
        <Shimmer className="h-3 w-36" />
        <Shimmer className="h-2.5 w-16" />
      </div>
    </div>
  );
}

export function TaskRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Shimmer className="h-3.5 w-3.5 rounded" />
        <div className="flex-1 space-y-1.5">
          <Shimmer className="h-3 w-3/4" />
          <Shimmer className="h-2.5 w-1/2" />
        </div>
        <Shimmer className="h-1.5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SessionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-4 backdrop-blur-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <Shimmer className="h-4 w-2/5" />
            <Shimmer className="h-5 w-14 rounded-full" />
          </div>
          <Shimmer className="mb-2 h-3 w-3/4" />
          <Shimmer className="h-1.5 w-full rounded-full" />
          <div className="mt-3 flex gap-2">
            <Shimmer className="h-7 w-20 rounded-lg" />
            <Shimmer className="h-7 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PipelineSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <Shimmer className="h-5 w-5 rounded" />
        <Shimmer className="h-5 w-40" />
      </div>
      <Shimmer className="mb-4 h-1.5 w-full rounded-full" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function ContextSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-neutral-900/70 px-4 py-3 backdrop-blur-xl">
        <Shimmer className="h-4 w-4 rounded" />
        <Shimmer className="h-4 w-full" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
