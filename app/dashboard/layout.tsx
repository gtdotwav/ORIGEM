"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { X } from "lucide-react";
import { FloatingNav } from "@/components/layout/floating-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { BackendSessionBootstrap } from "@/components/layout/backend-session-bootstrap";
import { LiquidGradientBackground } from "@/components/shared/liquid-gradient-bg";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { WORKSPACE_COLORS } from "@/components/workspace/workspace-card";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWorkspace = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId)
  );
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  return (
    <main className="isolate relative flex min-h-screen flex-col bg-[#04070d]">
      <BackendSessionBootstrap />
      <LiquidGradientBackground />

      {/* Floating nav — always visible */}
      <FloatingNav />
      <CommandPalette />

      {/* Workspace active context bar */}
      {activeWorkspace && (
        <div className="relative z-20 flex items-center justify-center gap-3 border-b border-white/[0.04] bg-black/30 px-4 py-1.5 backdrop-blur-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${WORKSPACE_COLORS[activeWorkspace.color].bg} ${WORKSPACE_COLORS[activeWorkspace.color].border} border`}
          />
          <span className="text-xs text-white/45">
            Workspace:{" "}
            <Link
              href={`/dashboard/workspaces/${activeWorkspace.id}`}
              className="text-white/65 hover:text-white/80"
            >
              {activeWorkspace.name}
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setActiveWorkspace(null)}
            className="rounded p-0.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
            title="Limpar filtro de workspace"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Page content with fade transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex-1"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
