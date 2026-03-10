"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

function edgeLabel(type?: string) {
  if (type === "variation") {
    return "variacao";
  }

  if (type === "upscale") {
    return "upscale";
  }

  return "fluxo";
}

export default function SpaceConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  style,
  type,
}: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 18,
    offset: 24,
  });

  const strokeColor =
    type === "variation"
      ? "rgba(255,255,255,0.38)"
      : selected
      ? "rgba(255,255,255,0.72)"
      : "rgba(255,255,255,0.24)";

  return (
    <>
      <BaseEdge
        id={`${id}-glow`}
        path={path}
        interactionWidth={34}
        style={{
          stroke: "rgba(255,255,255,0.08)",
          strokeWidth: type === "variation" ? 4.4 : 4,
          filter: "blur(4px)",
          ...style,
        }}
      />
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={34}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 2.8 : 2.2,
          strokeDasharray: type === "variation" ? "7 6" : undefined,
          strokeLinecap: "round",
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] bg-[oklch(0.11_0_0)]/92 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-white/42 shadow-[0_8px_30px_rgba(0,0,0,0.32)] backdrop-blur-xl"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {edgeLabel(type)}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
