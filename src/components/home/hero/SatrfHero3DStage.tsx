'use client';

import dynamic from 'next/dynamic';
import { usePrefersReducedMotion } from '@chakra-ui/react';
import { HeroSceneProvider, useHeroScene } from './HeroSceneContext';
import HeroHud from './HeroHud';
import styles from './hero.module.css';

const SatrfHeroScene = dynamic(() => import('./SatrfHeroScene'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden
    >
      <img
        src="/brand/satrf-emblem-transparent.png"
        alt=""
        style={{ height: '40%', width: 'auto', opacity: 0.6 }}
      />
    </div>
  ),
});

function MonitorShell() {
  const { isTargetMode } = useHeroScene();
  return (
    <div
      className={`${styles.monitor} ${isTargetMode ? styles.monitorRangeLive : ''} ${styles.reveal} ${styles.revealD3}`}
      aria-label="Interactive 3D SATRF emblem that transforms into an electronic scoring target — click to take a shot"
    >
      <div className={styles.canvasBleed}>
        <SatrfHeroScene />
      </div>
      <HeroHud />
    </div>
  );
}

export default function SatrfHero3DStage() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <HeroSceneProvider reduceMotion={reduceMotion}>
      <MonitorShell />
    </HeroSceneProvider>
  );
}
