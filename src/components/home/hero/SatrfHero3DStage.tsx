'use client';

import dynamic from 'next/dynamic';
import { usePrefersReducedMotion } from '@chakra-ui/react';
import { useIdleReady } from '@/lib/useIdleReady';
import { HeroSceneProvider, useHeroScene } from './HeroSceneContext';
import HeroHud from './HeroHud';
import styles from './hero.module.css';

const SatrfHeroScene = dynamic(() => import('./SatrfHeroScene'), {
  ssr: false,
  loading: () => <HeroPoster />,
});

function HeroPoster({ interactive = false, onActivate }: { interactive?: boolean; onActivate?: () => void }) {
  return (
    <button
      type="button"
      className={styles.heroPoster}
      onClick={interactive ? onActivate : undefined}
      disabled={!interactive}
      aria-label={
        interactive
          ? 'Load interactive SATRF target — click to start'
          : 'SATRF emblem'
      }
      aria-hidden={!interactive}
    >
      <img
        src="/brand/satrf-emblem-transparent.png"
        alt=""
        className={styles.heroPosterImg}
      />
      {interactive && <span className={styles.heroPosterHint}>Tap to load interactive target</span>}
    </button>
  );
}

function MonitorShell({ sceneReady }: { sceneReady: boolean }) {
  const { isTargetMode } = useHeroScene();
  const reduceMotion = usePrefersReducedMotion();
  const showScene = sceneReady && !reduceMotion;

  return (
    <div
      className={`${styles.monitor} ${isTargetMode ? styles.monitorRangeLive : ''} ${styles.reveal} ${styles.revealD3}`}
      aria-label="Interactive 3D SATRF emblem that transforms into an electronic scoring target — click to take a shot"
    >
      <div className={styles.canvasBleed}>
        {showScene ? <SatrfHeroScene /> : <HeroPoster />}
      </div>
      {showScene && <HeroHud />}
    </div>
  );
}

function DeferredMonitor() {
  const reduceMotion = usePrefersReducedMotion();
  const { ready, activate } = useIdleReady(!reduceMotion);

  if (reduceMotion) {
    return (
      <div
        className={`${styles.monitor} ${styles.reveal} ${styles.revealD3}`}
        aria-label="SATRF emblem"
      >
        <div className={styles.canvasBleed}>
          <HeroPoster />
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className={`${styles.monitor} ${styles.reveal} ${styles.revealD3}`}
        aria-label="Interactive SATRF target — tap to load"
      >
        <div className={styles.canvasBleed}>
          <HeroPoster interactive onActivate={activate} />
        </div>
      </div>
    );
  }

  return (
    <HeroSceneProvider reduceMotion={false}>
      <MonitorShell sceneReady={true} />
    </HeroSceneProvider>
  );
}

export default function SatrfHero3DStage() {
  return <DeferredMonitor />;
}
