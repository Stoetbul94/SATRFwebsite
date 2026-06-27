import type { Discipline, Score } from '@/types/scores';

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
  const bestRings = Math.max(...withRings.map((x) => x.rings));

  return {
    averageRings,
    bestRings: bestRings > 0 ? bestRings : null,
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

export function isFClassDiscipline(discipline: Discipline): boolean {
  return discipline === 'fclass_open' || discipline === 'fclass_tr';
}

export function rankingValueForScore(
  score: Pick<Score, 'decimalTotal' | 'integerTotal' | 'positions' | 'discipline'>,
): number {
  if (isFClassDiscipline(score.discipline)) {
    return ringTotalForScore(score) ?? score.decimalTotal;
  }
  return score.decimalTotal;
}

export function formatScoreTotalDisplay(
  score: Pick<Score, 'decimalTotal' | 'integerTotal' | 'positions' | 'discipline' | 'stage'>,
): string {
  const stage = score.stage ?? 'qualification';
  const rings = ringTotalForScore(score);
  const pair = formatScorePair(score.decimalTotal, rings, qualScoreVariant(score.discipline, stage));
  if (pair.secondary) return `${pair.primary} (${pair.secondary})`;
  return pair.primary;
}

export function sortRankRows<T extends SortableRankRow>(rows: T[]): T[] {
  return sortRankRowsForDiscipline(rows, 'prone_50m');
}

export function sortRankRowsForDiscipline<T extends SortableRankRow>(
  rows: T[],
  discipline: Discipline
): T[] {
  const sorted = [...rows].sort((a, b) => {
    if (discipline === 'three_position_50m' || isFClassDiscipline(discipline)) {
      const ringA = a.averageRings ?? 0;
      const ringB = b.averageRings ?? 0;
      if (ringA > 0 && ringB > 0) {
        if (ringB !== ringA) return ringB - ringA;
        return b.average - a.average;
      }
      if (b.average !== a.average) return b.average - a.average;
      return ringB - ringA;
    }
    if (b.average !== a.average) return b.average - a.average;
    return (b.averageRings ?? 0) - (a.averageRings ?? 0);
  });
  sorted.forEach((r, i) => {
    r.rank = i + 1;
  });
  return sorted;
}

export type ScorePairVariant = 'decimalPrimary' | 'ringPrimary';

/** Display variant for qualification scores (ring-primary for 3P and F-Class qual). */
export function qualScoreVariant(discipline: Discipline, stage?: string): ScorePairVariant {
  if (discipline === 'fclass_open' || discipline === 'fclass_tr') return 'ringPrimary';
  const isQual = (stage ?? 'qualification') === 'qualification';
  if (!isQual) return 'decimalPrimary';
  if (discipline === 'three_position_50m') return 'ringPrimary';
  return 'decimalPrimary';
}

export function formatScorePair(
  decimal: number,
  rings: number | null | undefined,
  variant: ScorePairVariant = 'decimalPrimary'
): { primary: string; secondary: string | null } {
  const showRings = rings != null && rings > 0;
  if (variant === 'ringPrimary' && showRings) {
    return {
      primary: String(Math.round(rings)),
      secondary: decimal > 0 ? decimal.toFixed(1) : null,
    };
  }
  return {
    primary: decimal.toFixed(1),
    secondary: showRings ? String(Math.round(rings)) : null,
  };
}

/** Display a single series cell (S1–S6) for event results tables and detail panels. */
export function formatSeriesScoreDisplay(
  series: { decimal?: number; integer?: number; missing?: boolean } | undefined,
  discipline: Discipline,
  stage?: string,
): string {
  if (!series || series.missing) return '—';
  const decimal = series.decimal ?? 0;
  const integer = series.integer ?? 0;
  const variant = qualScoreVariant(discipline, stage);
  if (variant === 'ringPrimary' && integer > 0) {
    const pair = formatScorePair(decimal, integer, 'ringPrimary');
    if (pair.secondary) return `${pair.primary} (${pair.secondary})`;
    return pair.primary;
  }
  if (decimal > 0) return decimal.toFixed(1);
  return '—';
}
