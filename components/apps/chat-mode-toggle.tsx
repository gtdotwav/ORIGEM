"use client";

import { MessageCircle, Workflow } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePersonaStore } from "@/stores/persona-store";
import { cn } from "@/lib/utils";

export function ChatModeToggle() {
  const chatMode = usePersonaStore((s) => s.chatMode);
  const setChatMode = usePersonaStore((s) => s.setChatMode);
  const isEcosystem = chatMode === "ecosystem";

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5">
        <MessageCircle
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            !isEcosystem ? "text-neon-cyan" : "text-white/25"
          )}
        />
        <span
          className={cn(
            "text-[11px] transition-colors",
            !isEcosystem ? "text-white/70" : "text-white/30"
          )}
        >
          Chat
        </span>
      </div>
      <Switch
        checked={isEcosystem}
        onCheckedChange={(checked) =>
          setChatMode(checked ? "ecosystem" : "direct")
        }
      />
      <div className="flex items-center gap-1.5">
        <Workflow
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            isEcosystem ? "text-neon-purple" : "text-white/25"
          )}
        />
        <span
          className={cn(
            "text-[11px] transition-colors",
            isEcosystem ? "text-white/70" : "text-white/30"
          )}
        >
          Ecossistema
        </span>
      </div>
    </div>
  );
}
