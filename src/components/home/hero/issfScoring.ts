import { TARGET_RADIUS } from './heroTheme';

export function scoreForDistance(dist: number, radius = TARGET_RADIUS): number {
  const s = 10.9 - (dist / radius) * 10;
  return Math.max(0, Math.min(10.9, s));
}

export interface ShotRecord {
  id: number;
  score: number;
  label: string;
}

export function formatShotLabel(shotNo: number, score: number): string {
  return `SHOT ${String(shotNo).padStart(2, '0')} · ${score.toFixed(1)}`;
}
