"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PRISM_SHELL_VERTEX_SHADER = `
varying vec3 vNormalDir;
varying vec3 vViewDir;
varying vec3 vWorldPos;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormalDir = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const PRISM_SHELL_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uMotion;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vNormalDir;
varying vec3 vViewDir;
varying vec3 vWorldPos;

void main() {
  float fresnel = pow(1.0 - max(dot(normalize(vNormalDir), normalize(vViewDir)), 0.0), 2.45);
  float ripple = sin((vWorldPos.y * 7.0) + (uTime * 1.7 * uMotion)) * 0.5 + 0.5;
  float drift = sin(((vWorldPos.x + vWorldPos.z) * 4.6) - (uTime * 1.2 * uMotion)) * 0.5 + 0.5;
  vec3 color = mix(uColorA, uColorB, clamp((ripple * 0.7) + (drift * 0.3), 0.0, 1.0));
  float alpha = fresnel * (0.45 + (ripple * 0.35) + (drift * 0.2));
  gl_FragColor = vec4(color, alpha * 0.78);
}
`;

const RING_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RING_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
uniform float uMotion;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;

void main() {
  float center = 1.0 - abs((vUv.y - 0.5) * 2.0);
  float arc = smoothstep(0.28, 0.9, sin((vUv.x * 72.0) + (uSeed * 9.0) - (uTime * 2.1 * uMotion)) * 0.5 + 0.5);
  float pulse = 0.66 + (sin((uTime * 1.5 * uMotion) + (uSeed * 6.0)) * 0.34);
  vec3 color = mix(uColorA, uColorB, vUv.x);
  float alpha = pow(center, 1.95) * arc * pulse * uOpacity;
  gl_FragColor = vec4(color, alpha);
}
`;

const PARTICLE_VERTEX_SHADER = `
attribute float aSeed;
uniform float uTime;
uniform float uMotion;
varying float vAlpha;

void main() {
  vec3 p = position;
  float radius = length(p.xz);
  float angle = atan(p.z, p.x);
  float swirl = (0.2 + (radius * 0.045)) * (uTime * uMotion);
  angle += swirl + (aSeed * 4.0);

  p.x = cos(angle) * radius;
  p.z = sin(angle) * radius;
  p.y += sin((uTime * 0.95 * uMotion) + (aSeed * 12.0)) * 0.12;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float pulse = sin((uTime * 1.25 * uMotion) + (aSeed * 20.0)) * 0.5 + 0.5;
  float size = 1.8 + (pulse * 2.4);
  gl_PointSize = size * (260.0 / -mvPosition.z);
  vAlpha = 0.4 + (pulse * 0.6);
}
`;

const PARTICLE_FRAGMENT_SHADER = `
uniform vec3 uColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
  gl_FragColor = vec4(uColor, alpha);
}
`;

const WELL_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uMotion;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float beam = exp(-pow((vUv.x - 0.5) * 2.5, 2.0) * 3.2);
  float streak = 0.72 + (sin((vUv.y * 20.0) - (uTime * 2.15 * uMotion)) * 0.28);
  float fade = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.76, 1.0, vUv.y));
  float alpha = beam * streak * fade * uOpacity;
  vec3 color = mix(vec3(0.01, 0.22, 0.28), vec3(0.19, 1.0, 0.9), vUv.y);
  gl_FragColor = vec4(color, alpha);
}
`;

interface EnergyRingProps {
  radius: number;
  tube: number;
  tiltX: number;
  tiltY: number;
  seed: number;
  speed: number;
  opacity: number;
  colorA: string;
  colorB: string;
  motionScale: number;
}

function EnergyRing({
  radius,
  tube,
  tiltX,
  tiltY,
  seed,
  speed,
  opacity,
  colorA,
  colorB,
  motionScale,
}: EnergyRingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(
    () => new THREE.TorusGeometry(radius, tube, 72, 240),
    [radius, tube]
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed },
      uOpacity: { value: opacity },
      uMotion: { value: 1 },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    }),
    [colorA, colorB, opacity, seed]
  );

  const haloUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed + 0.6 },
      uOpacity: { value: opacity * 0.5 },
      uMotion: { value: 1 },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    }),
    [colorA, colorB, opacity, seed]
  );

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const motion = Math.max(motionScale, 0.2);

    if (groupRef.current) {
      groupRef.current.rotation.z += 0.00055 * speed * motion;
      groupRef.current.rotation.y += 0.00032 * speed * motion;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uMotion.value = motion;
    }

    if (haloMaterialRef.current) {
      haloMaterialRef.current.uniforms.uTime.value = time;
      haloMaterialRef.current.uniforms.uMotion.value = motion;
    }
  });

  return (
    <group ref={groupRef} rotation={[tiltX, tiltY, 0]}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={haloMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={haloUniforms}
          vertexShader={RING_VERTEX_SHADER}
          fragmentShader={RING_FRAGMENT_SHADER}
        />
      </mesh>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={RING_VERTEX_SHADER}
          fragmentShader={RING_FRAGMENT_SHADER}
        />
      </mesh>
    </group>
  );
}

function PhotonField({ count, motionScale }: { count: number; motionScale: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 2.8;
      const y = (Math.random() - 0.5) * 3.8;
      const drift = (Math.random() - 0.5) * 0.28;

      positions[index * 3] = Math.cos(theta) * radius + drift;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = Math.sin(theta) * radius + drift;
      seeds[index] = Math.random();
    }

    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    next.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return next;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uColor: { value: new THREE.Color("#7ffff4") },
    }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uMotion.value = Math.max(motionScale, 0.25);
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={PARTICLE_VERTEX_SHADER}
        fragmentShader={PARTICLE_FRAGMENT_SHADER}
      />
    </points>
  );
}

function LightWell({ motionScale }: { motionScale: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uOpacity: { value: 0.36 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uMotion.value = Math.max(motionScale, 0.25);
  });

  return (
    <mesh position={[0, -1.35, -0.85]}>
      <planeGeometry args={[2.7, 3.4, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={RING_VERTEX_SHADER}
        fragmentShader={WELL_FRAGMENT_SHADER}
      />
    </mesh>
  );
}

function PrismCore({ motionScale }: { motionScale: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const shellMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const shellUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uColorA: { value: new THREE.Color("#17f3ff") },
      uColorB: { value: new THREE.Color("#9affd0") },
    }),
    []
  );

  useFrame(({ clock }) => {
    const motion = Math.max(motionScale, 0.2);

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0031 * motion;
      groupRef.current.rotation.x += 0.0012 * motion;
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.65 * motion) * 0.04;
    }

    if (shellMaterialRef.current) {
      shellMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      shellMaterialRef.current.uniforms.uMotion.value = motion;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[0.88, 3]} />
        <meshPhysicalMaterial
          color="#030b12"
          roughness={0.2}
          metalness={0.28}
          transmission={0.1}
          thickness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
          reflectivity={1}
          emissive="#01070b"
          emissiveIntensity={0.24}
        />
      </mesh>

      <mesh scale={[1.02, 1.02, 1.02]}>
        <icosahedronGeometry args={[0.88, 2]} />
        <meshBasicMaterial
          color="#67fff0"
          wireframe
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh scale={[1.11, 1.11, 1.11]}>
        <icosahedronGeometry args={[0.88, 2]} />
        <shaderMaterial
          ref={shellMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={shellUniforms}
          vertexShader={PRISM_SHELL_VERTEX_SHADER}
          fragmentShader={PRISM_SHELL_FRAGMENT_SHADER}
        />
      </mesh>
    </group>
  );
}

function HologramCore({ motionScale }: { motionScale: number }) {
  const sceneRef = useRef<THREE.Group>(null);
  const { mouse, viewport } = useThree();

  useFrame(({ clock }) => {
    if (!sceneRef.current) {
      return;
    }

    const motion = Math.max(motionScale, 0.2);
    const targetX = ((mouse.x * viewport.width) / 900) * motion;
    const targetY = ((mouse.y * viewport.height) / 1280) * motion;

    sceneRef.current.rotation.y += 0.0004 * motion;
    sceneRef.current.position.x = THREE.MathUtils.lerp(
      sceneRef.current.position.x,
      targetX,
      0.013
    );
    sceneRef.current.position.y = THREE.MathUtils.lerp(
      sceneRef.current.position.y,
      targetY,
      0.016
    );
    sceneRef.current.position.z = Math.sin(clock.getElapsedTime() * 0.22 * motion) * 0.03;
  });

  return (
    <>
      <ambientLight intensity={0.07} />
      <pointLight color="#24f8ff" position={[-1.9, 2.4, 2.8]} intensity={7.2} />
      <pointLight color="#8effcf" position={[2.1, 1.7, 2.6]} intensity={6.1} />
      <pointLight color="#0a666d" position={[0, -2.0, 2.2]} intensity={3.8} />

      <group ref={sceneRef} position={[0, 0.08, 0]}>
        <EnergyRing
          radius={1.35}
          tube={0.035}
          tiltX={0.42}
          tiltY={0.16}
          seed={0.25}
          speed={1}
          opacity={0.72}
          colorA="#27f6ff"
          colorB="#95ffd2"
          motionScale={motionScale}
        />
        <EnergyRing
          radius={1.1}
          tube={0.022}
          tiltX={1.1}
          tiltY={0.3}
          seed={1.1}
          speed={0.85}
          opacity={0.62}
          colorA="#00dfff"
          colorB="#65f0ff"
          motionScale={motionScale}
        />
        <EnergyRing
          radius={1.55}
          tube={0.018}
          tiltX={2.05}
          tiltY={0.65}
          seed={2.4}
          speed={1.15}
          opacity={0.5}
          colorA="#3efcd1"
          colorB="#0ee1ff"
          motionScale={motionScale}
        />

        <PrismCore motionScale={motionScale} />
        <LightWell motionScale={motionScale} />
      </group>

      <PhotonField count={1500} motionScale={motionScale} />
    </>
  );
}

export function HologramBackground() {
  const [motionScale, setMotionScale] = useState(1);
  const [canvasDpr, setCanvasDpr] = useState<[number, number]>([1, 1.75]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateQuality = () => {
      const reduceMotion = motionQuery.matches;
      const narrowViewport = window.innerWidth < 980;

      setMotionScale(reduceMotion ? 0 : 1);
      setCanvasDpr(narrowViewport ? [1, 1.35] : [1, 1.75]);
    };

    updateQuality();

    window.addEventListener("resize", updateQuality);
    motionQuery.addEventListener("change", updateQuality);

    return () => {
      window.removeEventListener("resize", updateQuality);
      motionQuery.removeEventListener("change", updateQuality);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#01060a]" />
      {motionScale > 0 ? (
        <Canvas
          dpr={canvasDpr}
          camera={{ position: [0, 0.18, 5.1], fov: 43 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          performance={{ min: 0.5 }}
        >
          <HologramCore motionScale={motionScale} />
        </Canvas>
      ) : (
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-[46%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 bg-black/55 shadow-[0_0_120px_rgba(36,248,255,0.22)]" />
          <div className="absolute left-1/2 top-[37%] h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-[90px]" />
        </div>
      )}
      <div className="hologram-aurora absolute inset-0" />
      <div className="hologram-noise absolute inset-0" />
      <div className="hologram-scanlines absolute inset-0" />
      <div className="hologram-vignette absolute inset-0" />
    </div>
  );
}
