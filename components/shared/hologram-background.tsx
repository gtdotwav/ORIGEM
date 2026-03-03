"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Stars, TorusKnot } from "@react-three/drei";
import * as THREE from "three";

function HologramCore() {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse, viewport } = useThree();

  useFrame(() => {
    if (!groupRef.current) {
      return;
    }

    const targetX = (mouse.x * viewport.width) / 640;
    const targetY = (mouse.y * viewport.height) / 640;

    groupRef.current.rotation.y += 0.0006;
    groupRef.current.rotation.x += 0.00015;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      0.018
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.018
    );
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight color="#00f0ff" position={[-8, 3, 8]} intensity={12} />
      <pointLight color="#8b5cf6" position={[8, -3, 8]} intensity={12} />
      <Stars
        radius={150}
        depth={90}
        count={3400}
        factor={3}
        saturation={0}
        fade
        speed={0.45}
      />
      <group ref={groupRef}>
        <Float speed={0.85} rotationIntensity={0.6} floatIntensity={0.9}>
          <TorusKnot args={[1.2, 0.42, 220, 32]} scale={0.82} position={[0, 0, -2]}>
            <meshStandardMaterial
              color="#6bb7e7"
              emissive="#00f0ff"
              emissiveIntensity={0.65}
              metalness={0.9}
              roughness={0.1}
              wireframe
              transparent
              opacity={0.92}
            />
          </TorusKnot>
        </Float>
      </group>
    </>
  );
}

export function HologramBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(139,92,246,0.16),transparent_50%),#04070d]" />
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <HologramCore />
      </Canvas>
      <div className="hologram-grid absolute inset-0" />
      <div className="hologram-scanlines absolute inset-0" />
      <div className="hologram-vignette absolute inset-0" />
    </div>
  );
}
