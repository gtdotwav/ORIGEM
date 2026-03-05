"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ─── Touch ripple texture ─── */
class TouchTexture {
  size = 64;
  width = 64;
  height = 64;
  maxAge = 80;
  radius = 0.15;
  speed = 1 / 80;
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
      force = Math.min((dx * dx + dy * dy) * 25000, 2.5);
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
    this.ctx.shadowBlur = radius * 1.5;
    this.ctx.shadowColor = `rgba(${color},${0.3 * intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,1)";
    this.ctx.arc(pos.x - this.size * 5, pos.y - this.size * 5, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

/* ─── ORIGEM Neon Gradient Shader v2 ─── */
const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;

const FRAGMENT_SHADER = `
  uniform float uTime, uSpeed, uIntensity, uGrainIntensity;
  uniform vec2 uResolution;
  uniform vec3 uColor1, uColor2, uColor3, uColor4, uColor5, uColor6, uDarkBase;
  uniform sampler2D uTouchTexture;
  varying vec2 vUv;

  /* ── simplex-style noise ── */
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

  float fbm(vec2 uv, float t) {
    float val = 0.0;
    float amp = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 4; i++) {
      val += amp * snoise(uv + t * 0.15);
      uv = uv * 2.0 + shift;
      amp *= 0.5;
    }
    return val;
  }

  float grain(vec2 uv, float t) {
    return fract(sin(dot(uv * uResolution * 0.5 + t, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
  }

  vec3 getGradientColor(vec2 uv, float time) {
    float t = time * uSpeed;

    /* organic noise displacement */
    float n1 = fbm(uv * 2.0, t * 0.6);
    float n2 = fbm(uv * 2.5 + 5.0, t * 0.4);
    vec2 distorted = uv + vec2(n1, n2) * 0.12;

    /* blob centers with noise-perturbed orbits */
    vec2 c1 = vec2(0.3 + sin(t * 0.3) * 0.25 + n1 * 0.08,
                   0.4 + cos(t * 0.4) * 0.3);
    vec2 c2 = vec2(0.7 + cos(t * 0.35) * 0.25,
                   0.6 + sin(t * 0.28) * 0.3 + n2 * 0.06);
    vec2 c3 = vec2(0.5 + sin(t * 0.22) * 0.35,
                   0.3 + cos(t * 0.38) * 0.25);
    vec2 c4 = vec2(0.6 + cos(t * 0.32) * 0.3 + n1 * 0.05,
                   0.7 + sin(t * 0.25) * 0.2);
    vec2 c5 = vec2(0.35 + sin(t * 0.42) * 0.2,
                   0.65 + cos(t * 0.35) * 0.25 + n2 * 0.07);
    vec2 c6 = vec2(0.65 + cos(t * 0.28) * 0.3,
                   0.35 + sin(t * 0.45) * 0.25);

    /* primary blobs — large, soft */
    float r1 = 0.45 + sin(t * 0.5) * 0.08;
    float r2 = 0.50 + cos(t * 0.4) * 0.06;
    float r3 = 0.42 + sin(t * 0.6) * 0.07;
    float r4 = 0.38 + cos(t * 0.55) * 0.05;
    float r5 = 0.40 + sin(t * 0.35) * 0.06;
    float r6 = 0.44 + cos(t * 0.48) * 0.07;

    float i1 = 1.0 - smoothstep(0.0, r1, length(distorted - c1));
    float i2 = 1.0 - smoothstep(0.0, r2, length(distorted - c2));
    float i3 = 1.0 - smoothstep(0.0, r3, length(distorted - c3));
    float i4 = 1.0 - smoothstep(0.0, r4, length(distorted - c4));
    float i5 = 1.0 - smoothstep(0.0, r5, length(distorted - c5));
    float i6 = 1.0 - smoothstep(0.0, r6, length(distorted - c6));

    /* secondary accent layer — smaller, faster, adds depth */
    vec2 a1 = vec2(0.4 + sin(t * 0.8) * 0.3, 0.5 + cos(t * 0.7) * 0.3);
    vec2 a2 = vec2(0.6 + cos(t * 0.9) * 0.25, 0.4 + sin(t * 0.6) * 0.3);
    vec2 a3 = vec2(0.5 + sin(t * 0.65) * 0.35, 0.6 + cos(t * 0.85) * 0.25);
    float ai1 = 1.0 - smoothstep(0.0, 0.25, length(distorted - a1));
    float ai2 = 1.0 - smoothstep(0.0, 0.22, length(distorted - a2));
    float ai3 = 1.0 - smoothstep(0.0, 0.20, length(distorted - a3));

    /* color mixing — primary */
    float pulse1 = 0.6 + 0.4 * sin(t * 0.7);
    float pulse2 = 0.6 + 0.4 * cos(t * 0.8);
    float pulse3 = 0.6 + 0.4 * sin(t * 0.55);

    vec3 color = vec3(0.0);
    color += uColor1 * i1 * pulse1 * 1.0;
    color += uColor2 * i2 * pulse2 * 1.2;
    color += uColor3 * i3 * pulse3 * 0.9;
    color += uColor4 * i4 * pulse1 * 0.8;
    color += uColor5 * i5 * pulse2 * 0.7;
    color += uColor6 * i6 * pulse3 * 0.6;

    /* accent layer — cross-color glow */
    color += uColor2 * ai1 * 0.35;
    color += uColor1 * ai2 * 0.3;
    color += uColor4 * ai3 * 0.25;

    /* intensity + tone mapping */
    color = clamp(color, vec3(0.0), vec3(1.5)) * uIntensity;

    /* boost saturation */
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(lum), color, 1.5);

    /* soft tone curve */
    color = pow(color, vec3(0.88));

    /* bloom glow — bleed bright areas outward */
    float brightness = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 bloom = color * smoothstep(0.3, 0.8, brightness) * 0.3;
    color += bloom;

    /* dark base blending — deep space with glow emergence */
    float totalBrightness = length(color);
    color = mix(uDarkBase, color, max(totalBrightness * 1.4, 0.08));

    return color;
  }

  void main() {
    vec2 uv = vUv;

    /* touch distortion */
    vec4 touchTex = texture2D(uTouchTexture, uv);
    uv.x -= (touchTex.r * 2.0 - 1.0) * 1.0 * touchTex.b;
    uv.y -= (touchTex.g * 2.0 - 1.0) * 1.0 * touchTex.b;
    float dist = length(uv - vec2(0.5));
    float ripple = sin(dist * 25.0 - uTime * 4.0) * 0.05 * touchTex.b;
    uv += vec2(ripple);

    vec3 color = getGradientColor(uv, uTime);

    /* vignette — darkens edges for depth */
    float vignette = 1.0 - smoothstep(0.4, 1.1, dist * 1.3);
    color *= mix(0.5, 1.0, vignette);

    /* film grain */
    color += grain(uv, uTime) * uGrainIntensity;
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
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
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

    /* ORIGEM neon palette — boosted vibrancy
     * Cyan:   oklch(0.80 0.18 195)
     * Purple: oklch(0.55 0.30 290)
     * Blue:   oklch(0.60 0.25 255)
     * Pink:   oklch(0.68 0.25 340)
     * Green:  oklch(0.75 0.22 150)
     * Orange: oklch(0.72 0.20 55)
     */
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uColor1: { value: new THREE.Vector3(0.0, 0.82, 0.88) },    // cyan — vivid
      uColor2: { value: new THREE.Vector3(0.50, 0.15, 1.0) },    // purple — deep neon
      uColor3: { value: new THREE.Vector3(0.15, 0.40, 1.0) },    // blue — electric
      uColor4: { value: new THREE.Vector3(0.95, 0.25, 0.50) },   // pink — hot
      uColor5: { value: new THREE.Vector3(0.15, 0.85, 0.35) },   // green — neon
      uColor6: { value: new THREE.Vector3(0.95, 0.50, 0.10) },   // orange — amber
      uDarkBase: { value: new THREE.Vector3(0.008, 0.016, 0.045) }, // deeper space
      uSpeed: { value: 0.55 },
      uIntensity: { value: 1.1 },
      uTouchTexture: { value: this.touchTexture.texture },
      uGrainIntensity: { value: 0.04 },
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
              "radial-gradient(ellipse 60% 50% at 30% 30%, rgba(0,200,220,0.18), transparent)",
              "radial-gradient(ellipse 55% 45% at 70% 60%, rgba(80,30,220,0.14), transparent)",
              "radial-gradient(ellipse 40% 35% at 50% 80%, rgba(200,50,100,0.08), transparent)",
              "linear-gradient(180deg, #020610 0%, #060a1e 100%)",
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
