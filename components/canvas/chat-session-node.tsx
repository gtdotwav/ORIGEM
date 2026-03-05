"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSessionNodeData } from "@/types/canvas";
import type { OrigemNode } from "@/types/canvas";

const STATUS_DOT: Record<string, string> = {
  active: "bg-neon-green",
  completed: "bg-foreground/30",
  archived: "bg-foreground/15",
};

function ChatSessionNodeInner({ data, selected }: NodeProps<OrigemNode>) {
  const d = data as ChatSessionNodeData;
  return (
    <div
      className={cn(
        "w-[220px] rounded-xl border bg-card/80 p-3 backdrop-blur-xl transition-all",
        selected
          ? "border-neon-cyan/40 shadow-[0_0_20px_-4px] shadow-neon-cyan/20"
          : "border-foreground/[0.08] hover:border-foreground/[0.14]"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-neon-cyan/40 !bg-neon-cyan"
      />

      <div className="mb-2 flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/10">
          <MessageSquare className="h-3.5 w-3.5 text-neon-cyan" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground/85">
            {d.title}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[d.status] ?? STATUS_DOT.active)} />
            <span className="text-[10px] text-foreground/30">
              {d.messageCount} msgs
            </span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-foreground/20">
        {new Date(d.lastUpdated).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-neon-cyan/40 !bg-neon-cyan"
      />
    </div>
  );
}

export const ChatSessionNode = memo(ChatSessionNodeInner);
