"use client";

import { usePathname } from "next/navigation";
import { FloatingNav } from "@/components/layout/floating-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { BackendSessionBootstrap } from "@/components/layout/backend-session-bootstrap";
import { LiquidGradientBackground } from "@/components/shared/liquid-gradient-bg";
import { GuidedTour } from "@/components/tour/guided-tour";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSpaceCanvas = pathname.startsWith("/dashboard/spaces/");
  const isCodeIDE = pathname === "/dashboard/code";
  const isFullscreen = isSpaceCanvas || isCodeIDE;

  return (
    <main className="isolate relative flex min-h-screen flex-col bg-background">
      <BackendSessionBootstrap />
      {!isFullscreen && <LiquidGradientBackground />}
      {!isFullscreen && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.035),transparent_22%),linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.72))]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:128px_128px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.36)_100%)]" />
        </>
      )}

      {!isFullscreen && <FloatingNav />}
      <CommandPalette />
      {!isSpaceCanvas && <GuidedTour />}

      <div className="relative flex-1">{children}</div>
    </main>
  );
}
