"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Orbit,
  Settings,
  Plus,
  LayoutDashboard,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrigemLogo } from "@/components/icons/origem-logo";
import { useUIStore } from "@/stores/ui-store";
import { useSessionStore } from "@/stores/session-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Providers",
    href: "/dashboard/settings/providers",
    icon: Key,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sessions = useSessionStore((s) => s.sessions);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        sidebarOpen ? "w-[260px]" : "w-[60px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <OrigemLogo size="sm" showText={sidebarOpen} />
      </div>

      {/* New Session Button */}
      <div className="p-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full gap-2 border-dashed border-white/10 bg-white/[0.03] text-muted-foreground hover:border-neon-cyan/30 hover:bg-white/[0.06] hover:text-neon-cyan",
                  !sidebarOpen && "px-2"
                )}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>New Session</span>}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">New Session</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-2">
          {sidebarOpen && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Sessions
            </p>
          )}
          {sessions.length === 0 && sidebarOpen && (
            <p className="px-2 text-xs text-muted-foreground/40">
              No sessions yet
            </p>
          )}
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/dashboard/chat/${session.id}`}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname?.startsWith(`/dashboard/chat/${session.id}`) &&
                  "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              {sidebarOpen && (
                <span className="truncate">
                  {session.title || "Untitled"}
                </span>
              )}
            </Link>
          ))}
        </div>
      </ScrollArea>

      {/* Navigation */}
      <div className="border-t border-sidebar-border p-2">
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
