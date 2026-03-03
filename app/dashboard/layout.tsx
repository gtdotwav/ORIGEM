"use client";

import { FloatingNav } from "@/components/layout/floating-nav";
import { BackendSessionBootstrap } from "@/components/layout/backend-session-bootstrap";
import { HologramBackground } from "@/components/shared/hologram-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col bg-[#04070d]">
      <BackendSessionBootstrap />
      <HologramBackground />

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/10" />

      {/* Floating nav — always visible */}
      <FloatingNav />

      {/* Page content */}
      <div className="relative z-10 flex-1">{children}</div>
    </main>
  );
}
