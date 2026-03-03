"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const GLOW_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormalDir;
varying vec3 vViewDir;
varying vec3 vLocalPos;

void main() {
  vUv = uv;
  vLocalPos = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vNormalDir = normalize(normalMatrix * normal);
  vViewDir = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const GLOW_FRAGMENT_SHADER = `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
varying vec3 vNormalDir;
varying vec3 vViewDir;
varying vec3 vLocalPos;

void main() {
  float fresnel = pow(1.0 - max(dot(normalize(vNormalDir), normalize(vViewDir)), 0.0), 2.8);
  float sideBias = smoothstep(0.7, -0.35, vLocalPos.x + (vLocalPos.y * 0.16));
  float lowerGlow = smoothstep(0.35, -0.65, vLocalPos.y);
  float shimmer = 0.85 + (sin(uTime * 1.8 + vLocalPos.y * 5.0) * 0.15);
  float alpha = fresnel * (0.3 + sideBias * 0.5 + lowerGlow * 0.2) * shimmer;
  gl_FragColor = vec4(uColor, alpha);
}
`;

const BEAM_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const BEAM_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float center = 1.0 - abs((vUv.x - 0.5) * 2.0);
  float profile = pow(center, 1.55);
  float fadeTop = 1.0 - smoothstep(0.58, 1.0, vUv.y);
  float shimmer = 0.75 + (sin((vUv.y * 14.0) - (uTime * 2.35) + uSeed) * 0.25);
  float pulse = smoothstep(0.0, 0.26, vUv.y) * (1.0 - smoothstep(0.86, 1.0, vUv.y));
  float alpha = profile * fadeTop * shimmer * pulse * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}
`;

const SHAFT_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float distX = abs(vUv.x - 0.5);
  float body = smoothstep(0.5, 0.03, distX);
  float head = smoothstep(1.0, 0.18, vUv.y);
  float tail = 1.0 - smoothstep(0.58, 1.0, vUv.y);
  float shimmer = 0.84 + (sin((uTime * 1.5) + (vUv.y * 8.0)) * 0.16);
  float alpha = body * head * tail * shimmer * uOpacity;
  gl_FragColor = vec4(vec3(0.0, 0.92, 0.88), alpha);
}
`;

interface BeamProps {
  side: -1 | 1;
  spread: number;
  radius: number;
  seed: number;
  width: number;
}

function BeamTrail({ side, spread, radius, seed, width }: BeamProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const start = new THREE.Vector3(side * (radius * 0.18), 1.01, 0.08);
    const controlA = new THREE.Vector3(side * (0.42 + spread * 0.25), 1.54, -0.28);
    const controlB = new THREE.Vector3(side * (0.66 + spread * 0.52), 2.35, -0.95);
    const end = new THREE.Vector3(side * (0.94 + spread), 3.36, -2.05);
    const curve = new THREE.CatmullRomCurve3([start, controlA, controlB, end], false, "catmullrom", 0.18);
    return new THREE.TubeGeometry(curve, 132, width, 18, false);
  }, [radius, side, spread, width]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed },
      uOpacity: { value: 0.86 },
      uColor: { value: new THREE.Color("#17f4ee") },
    }),
    [seed]
  );

  const haloUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed + 1.6 },
      uOpacity: { value: 0.35 },
      uColor: { value: new THREE.Color("#06aca9") },
    }),
    [seed]
  );

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(elapsed * 0.22 + seed) * 0.035;
      groupRef.current.rotation.y = Math.sin(elapsed * 0.14 + seed) * 0.035;
    }

    if (coreMaterialRef.current) {
      coreMaterialRef.current.uniforms.uTime.value = elapsed;
    }

    if (haloMaterialRef.current) {
      haloMaterialRef.current.uniforms.uTime.value = elapsed;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={haloMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={haloUniforms}
          vertexShader={BEAM_VERTEX_SHADER}
          fragmentShader={BEAM_FRAGMENT_SHADER}
        />
      </mesh>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={coreMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={BEAM_VERTEX_SHADER}
          fragmentShader={BEAM_FRAGMENT_SHADER}
        />
      </mesh>
    </group>
  );
}

interface ShaftProps {
  x: number;
  y: number;
  width: number;
  height: number;
  seed: number;
  opacity: number;
}

function LightShaft({ x, y, width, height, seed, opacity }: ShaftProps) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: seed },
      uOpacity: { value: opacity },
    }),
    [opacity, seed]
  );

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value = clock.getElapsedTime() + seed;
    }
  });

  return (
    <mesh position={[x, y, -0.3]}>
      <planeGeometry args={[width, height, 1, 1]} />
      <shaderMaterial
        ref={ref}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={BEAM_VERTEX_SHADER}
        fragmentShader={SHAFT_FRAGMENT_SHADER}
      />
    </mesh>
  );
}

function Orb() {
  const glowRef = useRef<THREE.ShaderMaterial>(null);

  const glowUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#05f0ed") },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 128, 128]} />
        <meshStandardMaterial
          color="#03090b"
          roughness={0.88}
          metalness={0.16}
          emissive="#010305"
          emissiveIntensity={0.14}
        />
      </mesh>

      <mesh scale={[1.035, 1.035, 1.035]}>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          ref={glowRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={glowUniforms}
          vertexShader={GLOW_VERTEX_SHADER}
          fragmentShader={GLOW_FRAGMENT_SHADER}
        />
      </mesh>
    </group>
  );
}

function HologramCore() {
  const sceneRef = useRef<THREE.Group>(null);
  const { mouse, viewport } = useThree();

  useFrame(() => {
    if (!sceneRef.current) {
      return;
    }

    const targetX = (mouse.x * viewport.width) / 840;
    const targetY = (mouse.y * viewport.height) / 1200;

    sceneRef.current.rotation.y += 0.00028;
    sceneRef.current.position.x = THREE.MathUtils.lerp(
      sceneRef.current.position.x,
      targetX,
      0.014
    );
    sceneRef.current.position.y = THREE.MathUtils.lerp(
      sceneRef.current.position.y,
      targetY,
      0.016
    );
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight color="#10fff4" position={[-2.3, 1.2, 2.8]} intensity={7.5} />
      <pointLight color="#06b4ba" position={[1.5, 1.6, 2.4]} intensity={4.8} />
      <pointLight color="#04585c" position={[0, -2.4, 2.6]} intensity={3.2} />

      <group ref={sceneRef} position={[0, 0.12, 0]}>
        <BeamTrail side={-1} spread={0.03} radius={1} seed={0.2} width={0.021} />
        <BeamTrail side={-1} spread={0.19} radius={1} seed={1.1} width={0.013} />
        <BeamTrail side={1} spread={0.06} radius={1} seed={2.2} width={0.02} />
        <BeamTrail side={1} spread={0.17} radius={1} seed={3.3} width={0.014} />
        <BeamTrail side={-1} spread={0.32} radius={1} seed={4.2} width={0.011} />

        <Orb />

        <LightShaft x={-0.35} y={-1.64} width={0.9} height={2.35} seed={0.4} opacity={0.33} />
        <LightShaft x={0.31} y={-1.52} width={0.78} height={2.1} seed={1.9} opacity={0.27} />
      </group>
    </>
  );
}

export function HologramBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#020608]" />
      <Canvas
        dpr={[1, 1.7]}
        camera={{ position: [0, 0.18, 5.2], fov: 41 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <HologramCore />
      </Canvas>
      <div className="hologram-aurora absolute inset-0" />
      <div className="hologram-noise absolute inset-0" />
      <div className="hologram-scanlines absolute inset-0" />
      <div className="hologram-vignette absolute inset-0" />
    </div>
  );
}
