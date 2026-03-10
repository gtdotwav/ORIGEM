"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpacesStore } from "@/stores/spaces-store";
import type { TextNodeData } from "@/types/spaces";

function TextNode({ data, id, selected }: NodeProps) {
  const nodeData = data as unknown as TextNodeData;
  const updateNode = useSpacesStore((s) => s.updateNodeData);
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
        "relative min-w-[200px] max-w-[400px] rounded-xl border transition-colors",
        selected
          ? "border-white/[0.16] bg-[oklch(0.11_0_0)] shadow-lg shadow-white/[0.02] ring-1 ring-white/[0.06]"
          : "border-white/[0.06] bg-[oklch(0.09_0_0)]"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!border-0 !bg-transparent"
        style={{
          top: 10,
          left: 0,
          right: "auto",
          width: 22,
          height: "calc(100% - 20px)",
          transform: "none",
          borderRadius: 16,
          background: "transparent",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!border-0 !bg-transparent"
        style={{
          top: 10,
          left: "auto",
          right: 0,
          width: 22,
          height: "calc(100% - 20px)",
          transform: "none",
          borderRadius: 16,
          background: "transparent",
        }}
      />
      <div className="pointer-events-none absolute inset-y-3 left-0 flex w-5 items-center justify-center">
        <div className="flex h-full w-px items-center justify-center bg-white/[0.08]">
          <div className="h-1.5 w-1.5 rounded-full bg-white/[0.22]" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-3 right-0 flex w-5 items-center justify-center">
        <div className="flex h-full w-px items-center justify-center bg-white/[0.08]">
          <div className="h-1.5 w-1.5 rounded-full bg-white/[0.22]" />
        </div>
      </div>

      {/* Drag handle */}
      <div className="flex items-center gap-1 border-b border-white/[0.04] px-2 py-1.5">
        <GripVertical className="h-3 w-3 text-white/10" />
        <span className="text-[9px] font-medium uppercase tracking-wider text-white/20">
          Texto
        </span>
      </div>

      {/* Text area */}
      <div className="p-3" onClick={(e) => e.stopPropagation()}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resize();
          }}
          onBlur={handleBlur}
          placeholder="Digite aqui..."
          className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-white/70 placeholder:text-white/15 outline-none"
          rows={1}
        />
      </div>
    </div>
  );
}

export default memo(TextNode);
