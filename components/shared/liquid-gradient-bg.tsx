"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ─── Touch ripple texture ─── */
class TouchTexture {
  size = 64;
  width = 64;
  height = 64;
  maxAge = 96;
  radius = 0.12;
  speed = 1 / 96;
  trail: { x: number; y: number; age: number; force: number; vx: number; vy: number }[] = [];
  last: { x: number; y: number } | null = null;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.Texture;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      const f = p.force * this.speed * (1 - p.age / this.maxAge);
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.age++;
      if (p.age > this.maxAge) this.trail.splice(i, 1);
      else this.drawPoint(p);
    }
    this.texture.needsUpdate = true;
  }

  addTouch(point: { x: number; y: number }) {
    let force = 0,
      vx = 0,
      vy = 0;
    if (this.last) {
      const dx = point.x - this.last.x;
      const dy = point.y - this.last.y;
      if (dx === 0 && dy === 0) return;
      const d = Math.sqrt(dx * dx + dy * dy);
      vx = dx / d;
      vy = dy / d;
      force = Math.min((dx * dx + dy * dy) * 18000, 1.8);
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  drawPoint(p: { x: number; y: number; age: number; force: number; vx: number; vy: number }) {
    const pos = { x: p.x * this.width, y: (1 - p.y) * this.height };
    let intensity =
      p.age < this.maxAge * 0.3
        ? Math.sin((p.age / (this.maxAge * 0.3)) * (Math.PI / 2))
        : -(
            (1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) *
            ((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) - 2)
          );
    intensity *= p.force;
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const radius = this.radius * this.width;
    this.ctx.shadowOffsetX = this.size * 5;
    this.ctx.shadowOffsetY = this.size * 5;
    this.ctx.shadowBlur = radius * 1.2;
    this.ctx.shadowColor = `rgba(${color},${0.25 * intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,1)";
    this.ctx.arc(pos.x - this.size * 5, pos.y - this.size * 5, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

/* ─── ORIGEM Nebula Shader — domain warping ─── */
const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;

/*
 * Domain warping technique: fbm(p + fbm(p + fbm(p)))
 * Creates organic, smoke/nebula patterns that flow continuously.
 * Colors mapped through noise regions, not discrete blobs.
 */
const FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform sampler2D uTouchTexture;
  varying vec2 vUv;

  /* ── simplex noise ── */
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x_) - 0.5;
    vec3 ox = floor(x_ + 0.5);
    vec3 a0 = x_ - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  /* fractal brownian motion — 5 octaves for rich detail */
  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      val += amp * snoise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return val;
  }

  /* film grain */
  float grain(vec2 uv, float t) {
    return fract(sin(dot(uv * uResolution * 0.4 + t, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    /* touch distortion — subtle warp */
    vec4 touchTex = texture2D(uTouchTexture, uv);
    p.x += (touchTex.r * 2.0 - 1.0) * 0.15 * touchTex.b;
    p.y += (touchTex.g * 2.0 - 1.0) * 0.15 * touchTex.b;

    float t = uTime * 0.08;

    /* ── triple domain warping ── */
    /* layer 1: base flow */
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + t * 0.4),
      fbm(p + vec2(5.2, 1.3) + t * 0.3)
    );

    /* layer 2: warp the warp */
    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.35),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.28)
    );

    /* layer 3: final pattern value */
    float f = fbm(p + 3.5 * r + t * 0.2);

    /* ── color palette ──
     * Not discrete blobs — colors emerge from noise topology.
     * Deep space base → cyan/blue core → purple veins → pink highlights
     */
    vec3 deepSpace  = vec3(0.008, 0.012, 0.035);
    vec3 midnight   = vec3(0.02, 0.04, 0.12);
    vec3 cyan       = vec3(0.0, 0.65, 0.78);
    vec3 blue       = vec3(0.10, 0.28, 0.85);
    vec3 purple     = vec3(0.40, 0.10, 0.80);
    vec3 pink       = vec3(0.75, 0.15, 0.45);

    /* map noise values to color — smooth transitions */
    float ff = f * f * 4.0;
    float ql = length(q);
    float rl = length(r);

    vec3 color = deepSpace;

    /* base: midnight blue tinted by pattern density */
    color = mix(color, midnight, clamp(ff * 0.6, 0.0, 1.0));

    /* primary: cyan/blue emerging from noise ridges */
    color = mix(color, mix(blue, cyan, clamp(f * 0.5 + 0.5, 0.0, 1.0)),
                clamp(ff * 0.8, 0.0, 0.65));

    /* secondary: purple in warp-dense regions */
    color = mix(color, purple,
                clamp(ql * ql * 0.9, 0.0, 0.45));

    /* accent: pink on high-energy peaks */
    color = mix(color, pink,
                clamp(rl * 0.6 * smoothstep(0.3, 0.8, f), 0.0, 0.3));

    /* subtle warm glow in sparse areas */
    float warmth = smoothstep(-0.3, 0.1, -f) * 0.15;
    color += vec3(0.08, 0.02, 0.0) * warmth;

    /* ── luminance + glow ── */
    /* soft HDR bloom on bright regions */
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 bloom = color * smoothstep(0.08, 0.25, lum) * 0.6;
    color += bloom;

    /* saturation boost — controlled */
    color = mix(vec3(lum), color, 1.35);

    /* gentle tone curve — keeps darks rich */
    color = pow(color, vec3(0.95));

    /* ── vignette — radial fade to deep space ── */
    float dist = length(uv - vec2(0.5));
    float vig = 1.0 - smoothstep(0.3, 0.95, dist);
    color *= mix(0.35, 1.0, vig);

    /* film grain — very subtle */
    color += grain(uv, uTime) * 0.03;

    color = clamp(color, vec3(0.0), vec3(1.0));
    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ─── Scene manager ─── */
class GradientScene {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  clock: THREE.Clock;
  touchTexture: TouchTexture;
  mesh: THREE.Mesh | null = null;
  uniforms: Record<string, { value: unknown }>;
  animationId: number | null = null;
  container: HTMLElement;
  resizeHandler: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    this.camera.position.z = 50;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020610);
    this.clock = new THREE.Clock();
    this.touchTexture = new TouchTexture();

    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uTouchTexture: { value: this.touchTexture.texture },
    };

    this.init();
  }

  getViewSize() {
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(this.camera.position.z * Math.tan(fov / 2) * 2);
    return { width: height * this.camera.aspect, height };
  }

  init() {
    const viewSize = this.getViewSize();
    const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    const c = this.container;
    const onMove = (x: number, y: number) => {
      this.touchTexture.addTouch({ x: x / c.clientWidth, y: 1 - y / c.clientHeight });
    };
    c.addEventListener("mousemove", (e) => onMove(e.offsetX, e.offsetY));
    c.addEventListener("touchmove", (e) => {
      const rect = c.getBoundingClientRect();
      onMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    });

    this.resizeHandler = () => {
      this.camera.aspect = c.clientWidth / c.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(c.clientWidth, c.clientHeight);
      const vs = this.getViewSize();
      if (this.mesh) {
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.PlaneGeometry(vs.width, vs.height, 1, 1);
      }
      (this.uniforms.uResolution.value as THREE.Vector2).set(c.clientWidth, c.clientHeight);
    };
    window.addEventListener("resize", this.resizeHandler);

    this.tick();
  }

  tick() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.touchTexture.update();
    (this.uniforms.uTime.value as number) += delta;
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(() => this.tick());
  }

  cleanup() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

/* ─── React component ─── */
export function LiquidGradientBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GradientScene | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion) return;

    if (sceneRef.current) sceneRef.current.cleanup();
    sceneRef.current = new GradientScene(container);

    return () => {
      if (sceneRef.current) {
        sceneRef.current.cleanup();
        sceneRef.current = null;
      }
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 70% 55% at 35% 40%, rgba(0,160,200,0.12), transparent)",
              "radial-gradient(ellipse 60% 50% at 65% 55%, rgba(90,20,180,0.10), transparent)",
              "radial-gradient(ellipse 45% 40% at 50% 75%, rgba(180,30,90,0.06), transparent)",
              "linear-gradient(180deg, #020610 0%, #040818 100%)",
            ].join(", "),
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute inset-0 -z-10 overflow-hidden"
      style={{ cursor: "default" }}
    />
  );
}
