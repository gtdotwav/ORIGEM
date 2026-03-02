"use client";

import { useParams } from "next/navigation";
import { CosmicBackground } from "@/components/shared/cosmic-background";

export default function OrchestraPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="relative h-full w-full bg-canvas-bg">
      <CosmicBackground starCount={200} showNebula />
      <div className="relative z-10 flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground/40">
          Infinite Canvas — Session {sessionId?.slice(0, 8)}
        </p>
      </div>
    </div>
  );
}
