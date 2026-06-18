import type { Score } from '@/types/scores';

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function hasRecordedRings(score: Pick<Score, 'integerTotal' | 'positions'>): boolean {
  if (score.integerTotal > 0) return true;
  for (const p of score.positions ?? []) {
    if (p.integerTotal > 0) return true;
    if (p.series?.some((s) => s.integer > 0)) return true;
  }
  return false;
}

export function ringTotalForScore(score: Pick<Score, 'integerTotal' | 'positions'>): number | null {
  if (!hasRecordedRings(score)) return null;
  if (score.integerTotal > 0) return score.integerTotal;
  const fromPositions = (score.positions ?? []).reduce((sum, p) => sum + (p.integerTotal ?? 0), 0);
  return fromPositions > 0 ? fromPositions : null;
}

export function aggregateShooterRings(scores: Pick<Score, 'decimalTotal' | 'integerTotal' | 'positions'>[]): {
  averageRings: number | null;
  bestRings: number | null;
} {
  const withRings = scores
    .map((s) => ({ score: s, rings: ringTotalForScore(s) }))
    .filter((x): x is { score: typeof scores[number]; rings: number } => x.rings != null && x.rings > 0);

  if (withRings.length === 0) {
    return { averageRings: null, bestRings: null };
  }

  const averageRings = round1(withRings.reduce((sum, x) => sum + x.rings, 0) / withRings.length);

  const bestDecimal = Math.max(...scores.map((s) => s.decimalTotal));
  const bestScore = scores.find((s) => s.decimalTotal === bestDecimal) ?? scores[0];
  const bestRings = ringTotalForScore(bestScore);

  return {
    averageRings,
    bestRings: bestRings != null && bestRings > 0 ? bestRings : null,
  };
}

export function formatEventsCell(competed: number, seasonTotal?: number | null): string {
  if (seasonTotal != null && seasonTotal > 0) {
    return `${competed} / ${seasonTotal}`;
  }
  return String(competed);
}

export interface SortableRankRow {
  average: number;
  averageRings?: number | null;
  rank?: number;
}

export function sortRankRows<T extends SortableRankRow>(rows: T[]): T[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.average !== a.average) return b.average - a.average;
    return (b.averageRings ?? 0) - (a.averageRings ?? 0);
  });
  sorted.forEach((r, i) => {
    r.rank = i + 1;
  });
  return sorted;
}
