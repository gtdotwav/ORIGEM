"use client";

import { usePathname } from "next/navigation";
import { FloatingNav } from "@/components/layout/floating-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { BackendSessionBootstrap } from "@/components/layout/backend-session-bootstrap";
import { LiquidGradientBackground } from "@/components/shared/liquid-gradient-bg";
import { GuidedTour } from "@/components/tour/guided-tour";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";

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

      {/* Floating nav — hidden inside Spaces canvas */}
      {!isFullscreen && <FloatingNav />}
      {!isFullscreen && (
        <div className="pointer-events-none absolute left-3 top-3 z-40 md:left-6 md:top-6">
          <div className="pointer-events-auto">
            <WorkspaceSwitcher />
          </div>
        </div>
      )}
      <CommandPalette />
      {!isSpaceCanvas && <GuidedTour />}

      {/* Page content */}
      <div className="relative flex-1">
        {children}
      </div>
    </main>
  );
}
