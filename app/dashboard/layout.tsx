"use client";

import { FloatingNav } from "@/components/layout/floating-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="relative flex min-h-screen flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/background.png')",
      }}
    >
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

      {/* Floating nav — always visible */}
      <FloatingNav />

      {/* Page content */}
      <div className="relative z-10 flex-1">{children}</div>
    </main>
  );
}
