"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HologramBackground — Lightweight CSS + Canvas hybrid
 *
 * Layers (bottom to top):
 *  1. Deep space base (#02060c)
 *  2. Canvas starfield with twinkling stars
 *  3. Animated nebula gradients (CSS)
 *  4. Central hologram core glow
 *  5. Aurora overlay (CSS animation)
 *  6. Scanline sweep (CSS animation)
 *  7. Subtle noise texture (CSS)
 *  8. Vignette (CSS)
 */

const STAR_COUNT = 220;
const NEBULA_STAR_COUNT = 40;

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  hue: number;
}

function createStars(count: number, width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.003 + 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.7 ? 185 + Math.random() * 20 : 0,
    });
  }
  return stars;
}

function createNebulaStars(
  count: number,
  width: number,
  height: number
): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const cx = width * (0.35 + Math.random() * 0.3);
    const cy = height * (0.3 + Math.random() * 0.25);
    const spread = Math.min(width, height) * 0.25;
    stars.push({
      x: cx + (Math.random() - 0.5) * spread * 2,
      y: cy + (Math.random() - 0.5) * spread * 2,
      radius: Math.random() * 1.6 + 0.5,
      alpha: Math.random() * 0.4 + 0.3,
      twinkleSpeed: Math.random() * 0.004 + 0.002,
      twinkleOffset: Math.random() * Math.PI * 2,
      hue: 185 + Math.random() * 30,
    });
  }
  return stars;
}

function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const nebulaStarsRef = useRef<Star[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(STAR_COUNT, rect.width, rect.height);
      nebulaStarsRef.current = createNebulaStars(
        NEBULA_STAR_COUNT,
        rect.width,
        rect.height
      );
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let running = true;

    const draw = (time: number) => {
      if (!running) return;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const allStars = [...starsRef.current, ...nebulaStarsRef.current];
      for (const star of allStars) {
        const twinkle =
          Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const alpha = star.alpha * (0.4 + twinkle * 0.6);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        if (star.hue > 0) {
          ctx.fillStyle = `hsla(${star.hue}, 80%, 80%, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        }

        ctx.fill();

        // Glow for larger stars
        if (star.radius > 1.0) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
          if (star.hue > 0) {
            ctx.fillStyle = `hsla(${star.hue}, 80%, 70%, ${alpha * 0.08})`;
          } else {
            ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.06})`;
          }
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.85 }}
    />
  );
}

export function HologramBackground() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* 1. Deep space base */}
      <div className="absolute inset-0 bg-[#02060c]" />

      {/* 2. Starfield canvas */}
      {!reducedMotion && <Starfield />}

      {/* 3. Nebula gradients */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.55,
          background: [
            "radial-gradient(ellipse 55% 40% at 45% 35%, rgba(20, 180, 200, 0.12), transparent)",
            "radial-gradient(ellipse 45% 35% at 55% 60%, rgba(100, 60, 180, 0.08), transparent)",
            "radial-gradient(ellipse 35% 30% at 30% 70%, rgba(0, 130, 150, 0.06), transparent)",
          ].join(", "),
        }}
      />

      {/* 4. Central hologram core glow */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "min(480px, 50vw)",
          height: "min(480px, 50vw)",
          background:
            "radial-gradient(circle, rgba(30, 220, 240, 0.10) 0%, rgba(30, 220, 240, 0.04) 35%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute left-[52%] top-[52%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "min(320px, 35vw)",
          height: "min(320px, 35vw)",
          background:
            "radial-gradient(circle, rgba(120, 60, 220, 0.07) 0%, transparent 60%)",
          filter: "blur(50px)",
        }}
      />

      {/* 5. Aurora overlay */}
      {!reducedMotion && <div className="hologram-aurora absolute inset-0" />}

      {/* 6. Scanline sweep */}
      {!reducedMotion && (
        <div className="hologram-scanlines absolute inset-0" />
      )}

      {/* 7. Noise texture */}
      <div className="hologram-noise absolute inset-0" />

      {/* 8. Vignette — strong edges, open center */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 20%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.85) 100%)",
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.4) 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
