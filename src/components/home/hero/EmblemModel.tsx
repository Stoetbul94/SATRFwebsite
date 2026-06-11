'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HERO_COLORS, TARGET_RADIUS } from './heroTheme';
import { useHeroScene } from './HeroSceneContext';

const RADIUS = TARGET_RADIUS;

let emblemTexture: THREE.Texture | null = null;
function getEmblemTexture() {
  if (!emblemTexture) {
    emblemTexture = new THREE.TextureLoader().load('/brand/satrf-emblem-transparent.png');
    emblemTexture.colorSpace = THREE.SRGBColorSpace;
  }
  return emblemTexture;
}

function MedallionFallback() {
  const tex = useMemo(() => getEmblemTexture(), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        metalness: 0.35,
        roughness: 0.5,
      }),
    [tex],
  );

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[RADIUS * 0.96, RADIUS * 0.96, 0.16, 96]} />
        <meshStandardMaterial
          color={HERO_COLORS.navy}
          metalness={0.75}
          roughness={0.35}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[RADIUS * 0.96, 0.045, 24, 120]} />
        <meshStandardMaterial
          color={HERO_COLORS.gold}
          metalness={1}
          roughness={0.25}
          emissive={HERO_COLORS.gold}
          emissiveIntensity={0.15}
        />
      </mesh>
      <mesh position={[0, 0, 0.085]} material={mat}>
        <circleGeometry args={[RADIUS * 0.88, 80]} />
      </mesh>
      <mesh position={[0, 0, -0.085]} rotation={[0, Math.PI, 0]} material={mat}>
        <circleGeometry args={[RADIUS * 0.88, 80]} />
      </mesh>
    </group>
  );
}

function GlbEmblemInner() {
  const { scene } = useGLTF('/models/satrf-emblem.web.glb');
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    const s = (RADIUS * 2 * 0.98) / Math.max(size.x, size.y, 0.001);
    clone.scale.setScalar(s);
    groupRef.current.clear();
    groupRef.current.add(clone);
  }, [scene]);

  return <group ref={groupRef} />;
}

function GlbEmblem() {
  const { setGlbFailed } = useHeroScene();
  return (
    <Suspense fallback={<MedallionFallback />}>
      <GlbEmblemInner />
    </Suspense>
  );
}

export default function EmblemModel({
  groupRef,
  visible,
}: {
  groupRef: React.RefObject<THREE.Group>;
  visible: boolean;
}) {
  const { glbFailed, reduceMotion } = useHeroScene();
  const spin = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current || !visible) return;
    if (!reduceMotion) {
      spin.current += delta * 0.5;
      groupRef.current.rotation.y = spin.current;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {glbFailed ? <MedallionFallback /> : <GlbEmblem />}
    </group>
  );
}

useGLTF.preload('/models/satrf-emblem.web.glb');
