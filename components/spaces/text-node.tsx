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
        "group relative min-w-[220px] max-w-[420px] rounded-[24px] border transition-all duration-500",
        selected
          ? "border-white/20 bg-black/40 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-2xl"
          : "border-white/[0.06] bg-black/20 hover:border-white/10 hover:bg-black/30 backdrop-blur-xl"
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.03]">
        <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-white/15" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Texto
        </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/40">
          <ArrowRightLeft className="h-3 w-3" />
          {incomingConnections}/{outgoingConnections}
        </span>
      </div>

      {/* Text area */}
      <div className="nodrag nopan p-2" onClick={(e) => e.stopPropagation()}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resize();
          }}
          onBlur={handleBlur}
          placeholder="Digite aqui..."
          className="nodrag nopan w-full resize-none rounded-xl border border-transparent bg-transparent px-3 py-3 text-[13px] leading-relaxed text-white/80 placeholder:text-white/20 outline-none transition-all duration-300 focus:bg-white/[0.03] focus:shadow-[0_0_15px_rgba(255,255,255,0.02)]"
          rows={1}
        />
      </div>
    </div>
  );
}

export default memo(TextNode);
