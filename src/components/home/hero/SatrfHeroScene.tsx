'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HERO_COLORS, TARGET_RADIUS } from './heroTheme';
import { useHeroScene } from './HeroSceneContext';
import EmblemModel from './EmblemModel';
import IssfTarget from './IssfTarget';

const RADIUS = TARGET_RADIUS;
const EMBLEM_MS = 8000;
const TARGET_MS = 8000;
const FLIP_MS = 900;

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function SceneContent() {
  const {
    phase,
    setPhase,
    reduceMotion,
    placeShot,
    triggerFlash,
    setHintHidden,
    isTargetMode,
  } = useHeroScene();

  const containerRef = useRef<THREE.Group>(null);
  const emblemRef = useRef<THREE.Group>(null);
  const targetRef = useRef<THREE.Group>(null);
  const sweepRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const faceMeshRef = useRef<THREE.Mesh | null>(null);

  const phaseTRef = useRef(0);
  const lastTRef = useRef(0);
  const flipBaseRef = useRef(0);
  const swappedRef = useRef(false);
  const entranceRef = useRef(0);
  const impulseRef = useRef(0);
  const shotNoRef = useRef(0);
  const nextAutoShotRef = useRef(1200);
  const emblemSpinRef = useRef(0);
  const tiltRef = useRef({ x: 0, y: 0 });
  const [shots, setShots] = useState<{ x: number; y: number; id: number }[]>([]);
  const [showEmblem, setShowEmblem] = useState(true);
  const [showTarget, setShowTarget] = useState(false);

  const { camera, gl } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 7.4);
  }, [camera]);

  const addShot = useCallback(
    (localX: number, localY: number) => {
      const dist = Math.hypot(localX, localY);
      if (dist > RADIUS * 1.02) return;
      placeShot(localX, localY);
      setShots((prev) => [...prev.slice(-9), { x: localX, y: localY, id: Date.now() }]);
      impulseRef.current = 0.06;
      shotNoRef.current += 1;
    },
    [placeShot],
  );

  const gauss = () => (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  const autoShot = useCallback(() => {
    const spread = Math.max(0.18, 0.8 - shotNoRef.current * 0.06);
    addShot(gauss() * spread * RADIUS, gauss() * spread * RADIUS);
  }, [addShot]);

  const midSwap = useCallback(
    (toTarget: boolean) => {
      setShowEmblem(!toTarget);
      setShowTarget(toTarget);
      if (toTarget && targetRef.current) {
        targetRef.current.rotation.y = Math.PI;
      } else if (emblemRef.current) {
        emblemRef.current.rotation.y = Math.PI;
      }
      triggerFlash();
    },
    [triggerFlash],
  );

  const startFlip = useCallback(
    (toTarget: boolean) => {
      setPhase(toTarget ? 'toTarget' : 'toEmblem');
      phaseTRef.current = 0;
      swappedRef.current = false;
      setHintHidden(true);
    },
    [setPhase, setHintHidden],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (reduceMotion) return;
      tiltRef.current.y = (e.clientX / window.innerWidth - 0.5) * 0.4;
      tiltRef.current.x = (e.clientY / window.innerHeight - 0.5) * 0.28;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduceMotion]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onPointerDown = (e: PointerEvent) => {
      if (reduceMotion) return;

      if (phase === 'emblem') {
        startFlip(true);
        return;
      }
      if (phase !== 'target') return;

      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);

      if (!faceMeshRef.current && targetRef.current) {
        targetRef.current.traverse((obj) => {
          if (obj.name === 'targetFace') faceMeshRef.current = obj as THREE.Mesh;
        });
      }
      if (!faceMeshRef.current) return;

      const hit = raycaster.intersectObject(faceMeshRef.current)[0];
      if (!hit || !targetRef.current) return;

      const local = targetRef.current.worldToLocal(hit.point.clone());
      addShot(local.x, local.y);
      triggerFlash(
        `${((e.clientX - rect.left) / rect.width) * 100}%`,
        `${((e.clientY - rect.top) / rect.height) * 100}%`,
      );
      setHintHidden(true);
      phaseTRef.current = Math.min(phaseTRef.current, TARGET_MS - 3500);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    return () => canvas.removeEventListener('pointerdown', onPointerDown);
  }, [
    gl,
    camera,
    phase,
    reduceMotion,
    startFlip,
    addShot,
    triggerFlash,
    setHintHidden,
  ]);

  useEffect(() => {
    if (!reduceMotion) return;
    const canvas = gl.domElement;
    const onClick = () => {
      const toTarget = !showTarget;
      setShowEmblem(!toTarget);
      setShowTarget(toTarget);
      setPhase(toTarget ? 'target' : 'emblem');
      if (targetRef.current) targetRef.current.rotation.y = 0;
      if (containerRef.current) containerRef.current.rotation.y = 0;
      if (toTarget && shots.length === 0) {
        addShot(0.05, -0.07);
      }
    };
    canvas.addEventListener('pointerdown', onClick);
    return () => canvas.removeEventListener('pointerdown', onClick);
  }, [reduceMotion, gl, showTarget, shots.length, addShot, setPhase]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 1000;
    const dt = lastTRef.current ? Math.min(50, t - lastTRef.current) : 16;
    lastTRef.current = t;

    entranceRef.current = Math.min(1, entranceRef.current + 0.016);
    const ent = 1 - Math.pow(1 - entranceRef.current, 3);

    if (!reduceMotion) {
      phaseTRef.current += dt;

      if (phase === 'emblem') {
        flipBaseRef.current = 0;
        emblemSpinRef.current += dt * 0.0005;
        if (emblemRef.current) emblemRef.current.rotation.y = emblemSpinRef.current;
        if (phaseTRef.current >= EMBLEM_MS) startFlip(true);
      } else if (phase === 'toTarget' || phase === 'toEmblem') {
        const toTarget = phase === 'toTarget';
        const p = Math.min(1, phaseTRef.current / FLIP_MS);
        const e = ease(p);
        flipBaseRef.current = (toTarget ? 0 : Math.PI) + e * Math.PI;
        if (!swappedRef.current && p >= 0.5) {
          swappedRef.current = true;
          midSwap(toTarget);
        }
        if (p >= 1) {
          setPhase(toTarget ? 'target' : 'emblem');
          phaseTRef.current = 0;
          nextAutoShotRef.current = 900;
          if (!toTarget) {
            emblemSpinRef.current = Math.PI;
            flipBaseRef.current = 0;
            if (containerRef.current) containerRef.current.rotation.y = 0;
          }
        }
      } else if (phase === 'target') {
        flipBaseRef.current = Math.PI;
        if (phaseTRef.current >= nextAutoShotRef.current) {
          autoShot();
          nextAutoShotRef.current += 2600;
        }
        if (phaseTRef.current >= TARGET_MS) startFlip(false);
      }

      if (sweepRef.current) {
        sweepRef.current.position.x = Math.cos(t * 0.0007) * 5.5;
        sweepRef.current.position.y = Math.sin(t * 0.0005) * 3 + 1;
        sweepRef.current.position.z = 4.5 + Math.sin(t * 0.0007) * 1.5;
      }
      if (particlesRef.current) {
        particlesRef.current.rotation.y = t * 0.00004;
        particlesRef.current.position.y = Math.sin(t * 0.0003) * 0.15;
      }
    }

    if (containerRef.current) {
      const targetY = flipBaseRef.current + tiltRef.current.y;
      const targetX = tiltRef.current.x;
      containerRef.current.rotation.y += (targetY - containerRef.current.rotation.y) * 0.14;
      containerRef.current.rotation.x += (targetX - containerRef.current.rotation.x) * 0.06;
      const scale = ent * (1 - impulseRef.current);
      containerRef.current.scale.setScalar(scale);
      containerRef.current.position.z = impulseRef.current * -0.4;
    }
    impulseRef.current *= 0.88;
  });

  const particlePositions = useMemo(() => {
    const pCount = 150;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 10;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
    }
    return pPos;
  }, []);

  return (
    <>
      <ambientLight color={0xbfc8dd} intensity={0.55} />
      <pointLight
        ref={sweepRef}
        color={HERO_COLORS.goldHi}
        intensity={1.35}
        distance={40}
        position={[4, 3, 5]}
      />
      <pointLight color={0x2e6b4c} intensity={0.8} distance={30} position={[-5, -3, 4]} />
      <directionalLight color={0xffffff} intensity={0.35} position={[0, 6, -4]} />

      <group ref={containerRef}>
        <EmblemModel groupRef={emblemRef} visible={showEmblem} />
        <IssfTarget groupRef={targetRef} visible={showTarget} shots={shots} />
      </group>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={HERO_COLORS.goldHi} size={0.024} transparent opacity={0.45} />
      </points>
    </>
  );
}

export default function SatrfHeroScene() {
  return (
    <Canvas
      camera={{ fov: 34, near: 0.1, far: 100, position: [0, 0, 7.4] }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
}
