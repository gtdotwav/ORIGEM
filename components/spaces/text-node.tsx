"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, useConnection, type NodeProps } from "@xyflow/react";
import { ArrowRightLeft, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import type { TextNodeData } from "@/types/spaces";

function TextNode({ data, id, selected }: NodeProps) {
  const nodeData = data as unknown as TextNodeData;
  const updateNode = useSpacesStore((s) => s.updateNodeData);
  const incomingConnections = useSpacesStore(
    (s) => s.edges.filter((edge) => edge.target === id).length
  );
  const outgoingConnections = useSpacesStore(
    (s) => s.edges.filter((edge) => edge.source === id).length
  );
  const connection = useConnection();
  const isConnecting = connection.inProgress && connection.fromNode?.id !== id;
  const [text, setText] = useState(nodeData.text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [text, resize]);

  // Focus on creation if empty
  useEffect(() => {
    if (!nodeData.text && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [nodeData.text]);

  const handleBlur = () => {
    if (updateNode) {
      updateNode(id, { text });
    }
  };

  return (
    <div
      className={cn(
        "relative min-w-[220px] max-w-[420px] rounded-2xl border transition-colors",
        selected
          ? "border-white/[0.16] bg-[oklch(0.11_0_0)] shadow-lg shadow-white/[0.02] ring-1 ring-white/[0.06]"
          : "border-white/[0.06] bg-[oklch(0.09_0_0)] hover:border-white/[0.10]"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectableStart={false}
        className={cn(
          "!border-0 !bg-transparent",
          !isConnecting && "!pointer-events-none"
        )}
        style={{
          inset: 0,
          width: "100%",
          height: "100%",
          transform: "none",
          borderRadius: 16,
          background: "transparent",
          zIndex: isConnecting ? 10 : -1,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!border-0 !bg-transparent"
        style={{
          top: 0,
          left: "auto",
          right: 0,
          width: 32,
          height: "100%",
          transform: "none",
          borderRadius: "0 16px 16px 0",
          background: "transparent",
          zIndex: 10,
        }}
      />
      
      {/* Target indicator */}
      <div className="pointer-events-none absolute inset-y-0 -left-[4px] z-20 flex items-center justify-center">
        <div
          className={cn(
            "h-2 w-2 rounded-full border transition-all duration-300",
            incomingConnections > 0 || selected
              ? "scale-110 border-white/60 bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
              : "scale-100 border-white/20 bg-white/10"
          )}
        />
      </div>

      {/* Source indicator */}
      <div className="pointer-events-none absolute inset-y-0 -right-[4px] z-20 flex items-center justify-center">
        <div
          className={cn(
            "h-2 w-2 rounded-full border transition-all duration-300",
            outgoingConnections > 0 || selected
              ? "scale-110 border-white/60 bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
              : "scale-100 border-white/20 bg-white/10"
          )}
        />
      </div>

      {/* Drag handle */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-2.5 py-2">
        <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-white/10" />
        <span className="text-[9px] font-medium uppercase tracking-wider text-white/20">
          Texto
        </span>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-white/28">
          <ArrowRightLeft className="h-2.5 w-2.5" />
          {incomingConnections}/{outgoingConnections}
        </span>
      </div>

      {/* Text area */}
      <div className="nodrag nopan p-3" onClick={(e) => e.stopPropagation()}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resize();
          }}
          onBlur={handleBlur}
          placeholder="Digite aqui..."
          className="nodrag nopan w-full resize-none bg-transparent text-[13px] leading-relaxed text-white/70 placeholder:text-white/15 outline-none"
          rows={1}
        />
      </div>
    </div>
  );
}

export default memo(TextNode);
