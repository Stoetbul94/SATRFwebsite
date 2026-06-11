'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HERO_COLORS, TARGET_RADIUS } from './heroTheme';
import { createIssfTargetTexture } from './createTargetTexture';
import ShotRipple, { type ShotRippleData } from './ShotRipple';
import ShotTracer, { type ShotTracerData } from './ShotTracer';

const RADIUS = TARGET_RADIUS;
const BASE_EMISSIVE = 0.5;

export default function IssfTarget({
  groupRef,
  visible,
  shots,
  ripples = [],
  tracers = [],
  lastImpactAt = 0,
  reduceMotion = false,
  onRippleComplete,
  onTracerComplete,
}: {
  groupRef: React.RefObject<THREE.Group>;
  visible: boolean;
  shots: { x: number; y: number; id: number }[];
  ripples?: ShotRippleData[];
  tracers?: ShotTracerData[];
  lastImpactAt?: number;
  reduceMotion?: boolean;
  onRippleComplete?: (id: number) => void;
  onTracerComplete?: (id: number) => void;
}) {
  const faceMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const faceTex = useMemo(
    () => (typeof document !== 'undefined' ? createIssfTargetTexture() : null),
    [],
  );

  useEffect(() => {
    return () => {
      faceTex?.dispose();
    };
  }, [faceTex]);

  useFrame(() => {
    const mat = faceMatRef.current;
    if (!mat) return;

    if (reduceMotion || !lastImpactAt) {
      mat.emissiveIntensity = BASE_EMISSIVE;
      return;
    }

    const elapsed = performance.now() - lastImpactAt;
    if (elapsed < 300) {
      const p = 1 - elapsed / 300;
      mat.emissiveIntensity = BASE_EMISSIVE + 0.35 * Math.sin(p * Math.PI);
    } else {
      mat.emissiveIntensity = BASE_EMISSIVE;
    }
  });

  if (!visible || !faceTex) return null;

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[RADIUS, RADIUS, 0.14, 96]} />
        <meshStandardMaterial color={0x0a1226} metalness={0.6} roughness={0.45} />
      </mesh>

      <mesh position={[0, 0, 0.073]} name="targetFace">
        <circleGeometry args={[RADIUS * 0.995, 96]} />
        <meshStandardMaterial
          ref={faceMatRef}
          map={faceTex}
          metalness={0.15}
          roughness={0.6}
          emissive={0x33270c}
          emissiveMap={faceTex}
          emissiveIntensity={BASE_EMISSIVE}
        />
      </mesh>

      <mesh>
        <torusGeometry args={[RADIUS + 0.03, 0.025, 16, 120]} />
        <meshBasicMaterial color={HERO_COLORS.goldHi} transparent opacity={0.8} />
      </mesh>

      {[1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0, -i * 0.55]}>
          <torusGeometry args={[RADIUS + i * 0.5, 0.006, 8, 100]} />
          <meshBasicMaterial color={HERO_COLORS.gold} transparent opacity={0.12 / i} />
        </mesh>
      ))}

      {shots.map((shot) => (
        <mesh key={shot.id} position={[shot.x, shot.y, 0.12]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={HERO_COLORS.flagRed} />
        </mesh>
      ))}

      {!reduceMotion &&
        ripples.map((ripple) => (
          <ShotRipple
            key={ripple.id}
            {...ripple}
            onComplete={() => onRippleComplete?.(ripple.id)}
          />
        ))}

      {!reduceMotion &&
        tracers.map((tracer) => (
          <ShotTracer
            key={tracer.id}
            {...tracer}
            onComplete={() => onTracerComplete?.(tracer.id)}
          />
        ))}
    </group>
  );
}
