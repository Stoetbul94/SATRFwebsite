'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HERO_COLORS, TARGET_RADIUS } from './heroTheme';
import { createIssfTargetTexture } from './createTargetTexture';

const RADIUS = TARGET_RADIUS;

export default function IssfTarget({
  groupRef,
  visible,
  shots,
}: {
  groupRef: React.RefObject<THREE.Group>;
  visible: boolean;
  shots: { x: number; y: number; id: number }[];
}) {
  const faceTex = useMemo(
    () => (typeof document !== 'undefined' ? createIssfTargetTexture() : null),
    [],
  );

  useEffect(() => {
    return () => {
      faceTex?.dispose();
    };
  }, [faceTex]);

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
          map={faceTex}
          metalness={0.15}
          roughness={0.6}
          emissive={0x33270c}
          emissiveMap={faceTex}
          emissiveIntensity={0.5}
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
    </group>
  );
}
