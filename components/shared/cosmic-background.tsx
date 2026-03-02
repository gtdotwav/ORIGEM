"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CosmicBackgroundProps {
  className?: string;
  starCount?: number;
  showNebula?: boolean;
}

export function CosmicBackground({
  className,
  starCount = 150,
  showNebula = true,
}: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    let animationId: number;
    let time = 0;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      // Stars
      for (const star of stars) {
        const twinkle =
          Math.sin(time * star.twinkleSpeed + star.twinkleOffset) *
            0.3 +
          0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 255, ${star.opacity * twinkle})`;
        ctx.fill();
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [starCount]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[oklch(0.06_0.02_270)]" />

      {/* Nebula gradients */}
      {showNebula && (
        <>
          <div
            className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full opacity-[0.07]"
            style={{
              background:
                "radial-gradient(circle, oklch(0.65 0.25 290), transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full opacity-[0.05]"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.15 195), transparent 70%)",
            }}
          />
          <div
            className="absolute left-1/3 top-1/2 h-[400px] w-[400px] rounded-full opacity-[0.04]"
            style={{
              background:
                "radial-gradient(circle, oklch(0.70 0.22 340), transparent 70%)",
            }}
          />
        </>
      )}

      {/* Star canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
