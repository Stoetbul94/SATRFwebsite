import { DISCIPLINES } from '@/lib/issf';
import {
  formatScorePair,
  qualScoreVariant,
  ringTotalForScore,
  round1,
} from '@/lib/rankingsDisplay';
import type { Discipline, Position, PositionBlock, Score, ScoreStage } from '@/types/scores';

export interface AthleteChartPoint {
  id: string;
  date: string;
  eventId: string;
  eventName: string;
  stage: ScoreStage;
  discipline: Discipline;
  decimalTotal: number;
  ringTotal: number | null;
  primaryValue: number;
  label: string;
  innerTens: number;
  finalRank?: number;
  eliminatedAtShot?: number | null;
  /** Short x-axis label */
  xLabel: string;
}

export interface PersonalBest {
  value: number;
  label: string;
  eventName: string;
  date: string;
}

export interface AimMark {
  value: number;
  label: string;
  shortLabel: string;
}

export interface DisciplineAimMarks {
  qual: AimMark;
  final: AimMark | null;
  positionQual?: Partial<Record<'kneeling' | 'prone' | 'standing', AimMark>>;
}

export interface DisciplineAnalytics {
  discipline: Discipline;
  label: string;
  qualCompetitions: number;
  finalCompetitions: number;
  qualSeries: AthleteChartPoint[];
  finalSeries: AthleteChartPoint[];
  bestQual: PersonalBest | null;
  bestFinal: PersonalBest | null;
  aimMarks: DisciplineAimMarks;
  threePPositions?: {
    kneeling: AthleteChartPoint[];
    prone: AthleteChartPoint[];
    standing: AthleteChartPoint[];
  };
  insights: string[];
}

export interface AthleteAnalyticsSummary {
  totalQualCompetitions: number;
  totalFinalCompetitions: number;
  disciplinesActive: number;
  totalInnerTens: number;
  totalScoreRecords: number;
  disciplines: DisciplineAnalytics[];
}

export const STAGE_LABELS: Record<ScoreStage, string> = {
  qualification: 'Qualification',
  prone_final: 'Prone Final',
  '3p_final': '3P Final',
};

export function eventKey(score: Pick<Score, 'eventId' | 'eventName' | 'date'>): string {
  return score.eventId || `${score.eventName}|${score.date}`;
}

export function expectedFinalStage(discipline: Discipline): ScoreStage {
  return discipline === 'three_position_50m' ? '3p_final' : 'prone_final';
}

export function isQualificationStage(stage: ScoreStage | undefined): boolean {
  return (stage ?? 'qualification') === 'qualification';
}

export function isFinalStageForDiscipline(stage: ScoreStage | undefined, discipline: Discipline): boolean {
  const normalized = stage ?? 'qualification';
  return normalized === expectedFinalStage(discipline);
}

function positionRingTotal(block: PositionBlock): number | null {
  if (block.integerTotal > 0) return block.integerTotal;
  const fromSeries = (block.series ?? []).reduce((sum, s) => sum + (s.integer || 0), 0);
  return fromSeries > 0 ? fromSeries : null;
}

function formatXLabel(date: string, eventName: string): string {
  if (!date) return eventName.slice(0, 12) || 'Event';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return eventName.slice(0, 12) || 'Event';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: '2-digit' });
}

function buildScoreLabel(score: Score, stage: ScoreStage): string {
  const rings = ringTotalForScore(score);
  const pair = formatScorePair(score.decimalTotal, rings, qualScoreVariant(score.discipline, stage));
  if (pair.secondary) {
    return `${pair.primary} (${pair.secondary})`;
  }
  return pair.primary;
}

function primaryValueForScore(score: Score, stage: ScoreStage): number {
  const variant = qualScoreVariant(score.discipline, stage);
  const rings = ringTotalForScore(score);
  if (variant === 'ringPrimary' && rings != null && rings > 0) {
    return rings;
  }
  return score.decimalTotal;
}

export function scoreToChartPoint(score: Score): AthleteChartPoint {
  const stage = score.stage ?? 'qualification';
  const rings = ringTotalForScore(score);
  return {
    id: score.id,
    date: score.date || '',
    eventId: score.eventId,
    eventName: score.eventName,
    stage,
    discipline: score.discipline,
    decimalTotal: score.decimalTotal,
    ringTotal: rings,
    primaryValue: primaryValueForScore(score, stage),
    label: buildScoreLabel(score, stage),
    innerTens: score.innerTens ?? 0,
    finalRank: score.finalRank,
    eliminatedAtShot: score.eliminatedAtShot,
    xLabel: formatXLabel(score.date, score.eventName),
  };
}

function positionToChartPoint(
  score: Score,
  position: Position,
  ringValue: number,
): AthleteChartPoint {
  const stage = score.stage ?? 'qualification';
  const posBlock = score.positions?.find((p) => p.position === position);
  const decimal = posBlock?.decimalTotal ?? 0;
  const pair = formatScorePair(decimal, ringValue, 'ringPrimary');
  const label = pair.secondary ? `${pair.primary} (${pair.secondary})` : pair.primary;

  return {
    id: `${score.id}-${position}`,
    date: score.date || '',
    eventId: score.eventId,
    eventName: score.eventName,
    stage,
    discipline: score.discipline,
    decimalTotal: decimal,
    ringTotal: ringValue,
    primaryValue: ringValue,
    label,
    innerTens: posBlock?.innerTens ?? 0,
    xLabel: formatXLabel(score.date, score.eventName),
  };
}

function sortChronologically(points: AthleteChartPoint[]): AthleteChartPoint[] {
  return [...points].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return a.eventName.localeCompare(b.eventName);
  });
}

function uniqueEventCount(scores: Score[]): number {
  return new Set(scores.map(eventKey)).size;
}

function bestFromSeries(series: AthleteChartPoint[]): PersonalBest | null {
  if (!series.length) return null;
  const best = series.reduce((a, b) => (b.primaryValue > a.primaryValue ? b : a));
  return {
    value: best.primaryValue,
    label: best.label,
    eventName: best.eventName,
    date: best.date,
  };
}

/** Realistic SATRF / club-to-national pathway targets for chart reference lines. */
export function getDisciplineAimMarks(discipline: Discipline): DisciplineAimMarks {
  switch (discipline) {
    case 'three_position_50m':
      return {
        qual: {
          value: 565,
          label: 'National qual aim',
          shortLabel: 'Aim 565',
        },
        final: {
          value: 318,
          label: 'National final aim',
          shortLabel: 'Aim 318',
        },
        positionQual: {
          kneeling: { value: 185, label: 'Kneeling aim', shortLabel: 'Aim 185' },
          prone: { value: 190, label: 'Prone aim', shortLabel: 'Aim 190' },
          standing: { value: 175, label: 'Standing aim', shortLabel: 'Aim 175' },
        },
      };
    case 'prone_50m':
      return {
        qual: {
          value: 620,
          label: 'National qual aim',
          shortLabel: 'Aim 620',
        },
        final: {
          value: 620,
          label: 'National final aim',
          shortLabel: 'Aim 620',
        },
      };
    case 'fclass_open':
    case 'fclass_tr':
      return {
        qual: {
          value: 580,
          label: 'National qual aim',
          shortLabel: 'Aim 580',
        },
        final: {
          value: 580,
          label: 'National final aim',
          shortLabel: 'Aim 580',
        },
      };
    default:
      return {
        qual: { value: 0, label: 'Aim', shortLabel: 'Aim' },
        final: null,
      };
  }
}

function buildInsights(
  discipline: Discipline,
  qualSeries: AthleteChartPoint[],
  finalSeries: AthleteChartPoint[],
): string[] {
  const insights: string[] = [];

  if (qualSeries.length === 0 && finalSeries.length === 0) {
    return insights;
  }

  if (qualSeries.length >= 4) {
    const recent = qualSeries.slice(-3);
    const prior = qualSeries.slice(-6, -3);
    if (prior.length === 3) {
      const recentAvg = round1(recent.reduce((s, p) => s + p.primaryValue, 0) / 3);
      const priorAvg = round1(prior.reduce((s, p) => s + p.primaryValue, 0) / 3);
      const diff = round1(recentAvg - priorAvg);
      if (diff > 0) {
        insights.push(`Up ${diff} vs your previous 3 ${DISCIPLINES[discipline].label} qualifications`);
      } else if (diff < 0) {
        insights.push(`Down ${Math.abs(diff)} vs your previous 3 ${DISCIPLINES[discipline].label} qualifications`);
      }
    }
  }

  if (finalSeries.length > 0) {
    insights.push(
      `${finalSeries.length} final${finalSeries.length === 1 ? '' : 's'} recorded in ${DISCIPLINES[discipline].label}`,
    );
  }

  return insights.slice(0, 3);
}

function buildThreePPositions(qualScores: Score[]): DisciplineAnalytics['threePPositions'] {
  const kneeling: AthleteChartPoint[] = [];
  const prone: AthleteChartPoint[] = [];
  const standing: AthleteChartPoint[] = [];

  for (const score of qualScores) {
    for (const block of score.positions ?? []) {
      const rings = positionRingTotal(block);
      if (rings == null || rings <= 0) continue;
      const point = positionToChartPoint(score, block.position, rings);
      if (block.position === 'kneeling') kneeling.push(point);
      else if (block.position === 'prone') prone.push(point);
      else if (block.position === 'standing') standing.push(point);
    }
  }

  return {
    kneeling: sortChronologically(kneeling),
    prone: sortChronologically(prone),
    standing: sortChronologically(standing),
  };
}

function buildDisciplineAnalytics(discipline: Discipline, scores: Score[]): DisciplineAnalytics {
  const qualScores = scores.filter((s) => isQualificationStage(s.stage));
  const finalScores = scores.filter((s) => isFinalStageForDiscipline(s.stage, discipline));

  const qualSeries = sortChronologically(qualScores.map(scoreToChartPoint));
  const finalSeries = sortChronologically(finalScores.map(scoreToChartPoint));

  const analytics: DisciplineAnalytics = {
    discipline,
    label: DISCIPLINES[discipline].label,
    qualCompetitions: uniqueEventCount(qualScores),
    finalCompetitions: uniqueEventCount(finalScores),
    qualSeries,
    finalSeries,
    bestQual: bestFromSeries(qualSeries),
    bestFinal: bestFromSeries(finalSeries),
    aimMarks: getDisciplineAimMarks(discipline),
    insights: buildInsights(discipline, qualSeries, finalSeries),
  };

  if (discipline === 'three_position_50m' && qualScores.length > 0) {
    analytics.threePPositions = buildThreePPositions(qualScores);
  }

  return analytics;
}

const DISCIPLINE_ORDER: Discipline[] = [
  'prone_50m',
  'three_position_50m',
  'fclass_open',
  'fclass_tr',
];

export function buildAthleteAnalytics(scores: Score[]): AthleteAnalyticsSummary {
  const active = scores.filter((s) => s.discipline && DISCIPLINES[s.discipline]);

  const byDiscipline = new Map<Discipline, Score[]>();
  for (const score of active) {
    const list = byDiscipline.get(score.discipline) ?? [];
    list.push(score);
    byDiscipline.set(score.discipline, list);
  }

  const disciplines = DISCIPLINE_ORDER.filter((d) => byDiscipline.has(d)).map((d) =>
    buildDisciplineAnalytics(d, byDiscipline.get(d)!),
  );

  const allQualKeys = new Set<string>();
  const allFinalKeys = new Set<string>();

  for (const score of active) {
    const key = eventKey(score);
    if (isQualificationStage(score.stage)) {
      allQualKeys.add(key);
    } else if (isFinalStageForDiscipline(score.stage, score.discipline)) {
      allFinalKeys.add(key);
    }
  }

  return {
    totalQualCompetitions: allQualKeys.size,
    totalFinalCompetitions: allFinalKeys.size,
    disciplinesActive: disciplines.length,
    totalInnerTens: active.reduce((sum, s) => sum + (s.innerTens ?? 0), 0),
    totalScoreRecords: active.length,
    disciplines,
  };
}

/** Trailing N-event average for chronologically ordered qualification points. */
export function trailingAverage(values: number[], index: number, window = 3): number | null {
  if (index < window - 1) return null;
  const slice = values.slice(index - window + 1, index + 1);
  if (slice.length < window) return null;
  return round1(slice.reduce((sum, v) => sum + v, 0) / window);
}

export function enrichQualSeriesWithRollingAverage(
  points: AthleteChartPoint[],
  window = 3,
): Array<AthleteChartPoint & { value: number; rollingAvg: number | null }> {
  const values = points.map((p) => p.primaryValue);
  return points.map((p, index) => ({
    ...p,
    value: p.primaryValue,
    rollingAvg: trailingAverage(values, index, window),
  }));
}

/** Recent N qualification average (uses last N events in chronological order). */
export function recentQualAverage(points: AthleteChartPoint[], count = 3): number | null {
  if (!points.length) return null;
  const recent = points.slice(-Math.min(count, points.length));
  return round1(recent.reduce((sum, p) => sum + p.primaryValue, 0) / recent.length);
}

export function latestQualPoint(points: AthleteChartPoint[]): AthleteChartPoint | null {
  return points.length ? points[points.length - 1] : null;
}

export type ScoreDistributionBucket = {
  label: string;
  min: number;
  max: number;
  count: number;
};

/** Auto-derived qualification score distribution for consistency visual. */
export function buildQualScoreDistribution(
  points: AthleteChartPoint[],
  bucketCount = 5,
): ScoreDistributionBucket[] {
  if (points.length < 5) return [];

  const values = points.map((p) => p.primaryValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ label: String(min), min, max, count: values.length }];
  }

  const span = max - min;
  const width = span / bucketCount;
  const buckets: ScoreDistributionBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const bMin = min + i * width;
    const bMax = i === bucketCount - 1 ? max : min + (i + 1) * width;
    return {
      label: `${Math.round(bMin)}–${Math.round(bMax)}`,
      min: bMin,
      max: bMax,
      count: 0,
    };
  });

  for (const value of values) {
    let idx = Math.floor((value - min) / width);
    if (idx >= bucketCount) idx = bucketCount - 1;
    buckets[idx].count += 1;
  }

  return buckets;
}

export function filterScoresByYear(scores: Score[], year: number | 'all'): Score[] {
  if (year === 'all') return scores;
  const prefix = `${year}-`;
  return scores.filter((s) => String(s.date || '').startsWith(prefix));
}

export function scoresForDiscipline(scores: Score[], discipline: Discipline): Score[] {
  return scores.filter((s) => s.discipline === discipline && !((s as Score & { deleted?: boolean }).deleted));
}
