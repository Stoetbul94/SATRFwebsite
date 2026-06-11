'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { formatShotLabel, scoreForDistance, type ShotRecord } from './issfScoring';

export type HeroPhase = 'emblem' | 'toTarget' | 'target' | 'toEmblem';

export interface HeroSceneState {
  phase: HeroPhase;
  isTargetMode: boolean;
  lastScore: string;
  isTenPlus: boolean;
  shots: ShotRecord[];
  hint: string;
  hintHidden: boolean;
  phaseLive: string;
  phaseInfo: string;
  flashAt: { x: string; y: string } | null;
  lastShotAt: number;
  reduceMotion: boolean;
  glbFailed: boolean;
  setGlbFailed: (v: boolean) => void;
  setPhase: (p: HeroPhase) => void;
  setHintHidden: (v: boolean) => void;
  triggerFlash: (x?: string, y?: string) => void;
  placeShot: (localX: number, localY: number) => number;
  toggleTargetMode: () => void;
  skipToTarget: () => void;
}

const HeroSceneContext = createContext<HeroSceneState | null>(null);

export function HeroSceneProvider({
  children,
  reduceMotion,
}: {
  children: ReactNode;
  reduceMotion: boolean;
}) {
  const [phase, setPhase] = useState<HeroPhase>('emblem');
  const [lastScore, setLastScore] = useState('—');
  const [isTenPlus, setIsTenPlus] = useState(false);
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [hintHidden, setHintHidden] = useState(false);
  const [flashAt, setFlashAt] = useState<{ x: string; y: string } | null>(null);
  const [lastShotAt, setLastShotAt] = useState(0);
  const [glbFailed, setGlbFailed] = useState(false);
  const shotNoRef = useRef(0);

  const isTargetMode = phase === 'target' || phase === 'toTarget';

  const phaseLive = isTargetMode ? 'Live range' : 'SATRF Official';
  const phaseInfo = isTargetMode
    ? 'Lane 07 · 50m Prone · Final'
    : 'National Emblem · est. RSA';
  const hint = isTargetMode
    ? 'Click the target — take the shot'
    : 'Click the emblem — open the range';

  const triggerFlash = useCallback((x = '50%', y = '50%') => {
    setFlashAt({ x, y });
    window.setTimeout(() => setFlashAt(null), 400);
  }, []);

  const placeShot = useCallback(
    (localX: number, localY: number) => {
      const dist = Math.hypot(localX, localY);
      const score = scoreForDistance(dist);
      shotNoRef.current += 1;
      const label = formatShotLabel(shotNoRef.current, score);
      setLastScore(score.toFixed(1));
      setIsTenPlus(score >= 10.0);
      setShots((prev) => [...prev.slice(-4), { id: shotNoRef.current, score, label }]);
      if (!reduceMotion) {
        setLastShotAt(Date.now());
      }
      return score;
    },
    [reduceMotion],
  );

  const skipToTarget = useCallback(() => {
    if (reduceMotion) {
      setPhase('target');
      return;
    }
    setPhase('toTarget');
    setHintHidden(true);
  }, [reduceMotion]);

  const toggleTargetMode = useCallback(() => {
    if (!reduceMotion) return;
    setPhase((p) => (p === 'target' ? 'emblem' : 'target'));
    if (shots.length === 0) {
      placeShot(0.05, -0.07);
    }
  }, [reduceMotion, shots.length, placeShot]);

  const value = useMemo<HeroSceneState>(
    () => ({
      phase,
      isTargetMode,
      lastScore,
      isTenPlus,
      shots,
      hint,
      hintHidden,
      phaseLive,
      phaseInfo,
      flashAt,
      lastShotAt,
      reduceMotion,
      glbFailed,
      setGlbFailed,
      setPhase,
      setHintHidden,
      triggerFlash,
      placeShot,
      toggleTargetMode,
      skipToTarget,
    }),
    [
      phase,
      isTargetMode,
      lastScore,
      isTenPlus,
      shots,
      hint,
      hintHidden,
      phaseLive,
      phaseInfo,
      flashAt,
      lastShotAt,
      reduceMotion,
      glbFailed,
      triggerFlash,
      placeShot,
      toggleTargetMode,
      skipToTarget,
    ],
  );

  return <HeroSceneContext.Provider value={value}>{children}</HeroSceneContext.Provider>;
}

export function useHeroScene() {
  const ctx = useContext(HeroSceneContext);
  if (!ctx) throw new Error('useHeroScene must be used within HeroSceneProvider');
  return ctx;
}
