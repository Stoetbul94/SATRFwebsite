'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HERO_COLORS } from './heroTheme';

const DURATION_MS = 500;

export interface ShotRippleData {
  id: number;
  x: number;
  y: number;
  score: number;
  bornAt: number;
}

export default function ShotRipple({
  x,
  y,
  score,
  bornAt,
  onComplete,
}: ShotRippleData & { onComplete: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const doneRef = useRef(false);

  useFrame(() => {
    if (doneRef.current) return;
    const elapsed = performance.now() - bornAt;
    const p = Math.min(1, elapsed / DURATION_MS);

    if (meshRef.current) {
      const scale = 0.3 + p * 1.5;
      meshRef.current.scale.setScalar(scale);
    }
    if (matRef.current) {
      matRef.current.opacity = 0.7 * (1 - p);
    }
    if (p >= 1) {
      doneRef.current = true;
      onComplete();
    }
  });

  const color = score >= 10 ? HERO_COLORS.goldHi : HERO_COLORS.paper;

  return (
    <mesh ref={meshRef} position={[x, y, 0.13]}>
      <ringGeometry args={[0.06, 0.11, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0.7}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
