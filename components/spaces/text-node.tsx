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
  }, []);

  const handleBlur = () => {
    if (updateNode) {
      updateNode(id, { text });
    }
  };

  return (
    <div
      className={cn(
        "group min-w-[200px] max-w-[400px] rounded-xl border transition-all duration-200",
        selected
          ? "border-white/[0.16] bg-[oklch(0.11_0_0)] shadow-lg shadow-white/[0.02] ring-1 ring-white/[0.06]"
          : "border-white/[0.06] bg-[oklch(0.09_0_0)] hover:border-white/[0.10]"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !rounded-full !border-2 !border-white/15 !bg-white/[0.08] !transition-colors hover:!border-white/30"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !rounded-full !border-2 !border-white/15 !bg-white/[0.08] !transition-colors hover:!border-white/30"
      />

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
