'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HERO_COLORS } from './heroTheme';

const DURATION_MS = 350;
const ORIGIN = new THREE.Vector3(-3.2, 0.4, 0.5);

export interface ShotTracerData {
  id: number;
  x: number;
  y: number;
  bornAt: number;
}

export default function ShotTracer({
  x,
  y,
  bornAt,
  onComplete,
}: ShotTracerData & { onComplete: () => void }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const doneRef = useRef(false);

  const positions = useMemo(() => {
    const end = new THREE.Vector3(x, y, 0.13);
    return new Float32Array([ORIGIN.x, ORIGIN.y, ORIGIN.z, end.x, end.y, end.z]);
  }, [x, y]);

  useFrame(() => {
    if (doneRef.current) return;
    const elapsed = performance.now() - bornAt;
    const p = Math.min(1, elapsed / DURATION_MS);

    if (matRef.current) {
      matRef.current.opacity = 1 - p;
    }

    if (p >= 1) {
      doneRef.current = true;
      onComplete();
    }
  });

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        ref={matRef}
        color={HERO_COLORS.goldHi}
        transparent
        opacity={1}
        depthTest={false}
      />
    </line>
  );
}
