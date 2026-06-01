/**
 * ISSF discipline rules, constants, and score validation/derivation.
 *
 * Single source of truth for what a valid Prone / 3-Position score looks like
 * and how totals are computed. Used by manual entry, Excel import, and PDF import.
 */

import type {
  Category,
  Discipline,
  Position,
  PositionBlock,
  Score,
  ScoreInput,
  ScoringType,
  ShotSeries,
} from '@/types/scores';

export const SHOTS_PER_SERIES = 10;

/** Max decimal value of a single shot (ISSF decimal scoring). */
export const MAX_SHOT_DECIMAL = 10.9;
/** Max integer ring value of a single shot. */
export const MAX_SHOT_INTEGER = 10;

export interface DisciplineSpec {
  id: Discipline;
  label: string;
  /** Firing order of positions. Prone has a single position. */
  positions: Position[];
  /** Series per position (each series = 10 shots). */
  seriesPerPosition: number;
  totalShots: number;
  maxDecimalSeries: number; // 10.9 * 10
  maxDecimalTotal: number;
  maxIntegerTotal: number;
}

export const DISCIPLINES: Record<Discipline, DisciplineSpec> = {
  prone_50m: {
    id: 'prone_50m',
    label: '50m Rifle Prone',
    positions: ['prone'],
    seriesPerPosition: 6,
    totalShots: 60,
    maxDecimalSeries: 109.0,
    maxDecimalTotal: 654.0,
    maxIntegerTotal: 600,
  },
  three_position_50m: {
    id: 'three_position_50m',
    label: '50m Rifle 3 Positions',
    positions: ['kneeling', 'prone', 'standing'],
    seriesPerPosition: 4,
    totalShots: 120,
    maxDecimalSeries: 109.0,
    maxDecimalTotal: 1308.0,
    maxIntegerTotal: 1200,
  },
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'junior', label: 'Junior' },
  { id: 'veteran', label: 'Veteran' },
  { id: 'ladies', label: 'Ladies' },
];

export const POSITION_LABELS: Record<Position, string> = {
  kneeling: 'Kneeling',
  prone: 'Prone',
  standing: 'Standing',
};

export function getDisciplineSpec(discipline: Discipline): DisciplineSpec {
  const spec = DISCIPLINES[discipline];
  if (!spec) {
    throw new Error(`Unknown discipline: ${discipline}`);
  }
  return spec;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  /** Hard errors that block saving. */
  errors: ValidationIssue[];
  /**
   * Soft warnings (e.g. incomplete series for a training session).
   * Present so the UI can flag, but they don't block a `provisional` save.
   */
  warnings: ValidationIssue[];
}

/**
 * Validate a score input against its discipline.
 *
 * `strict` (default true) requires the full shot count and is used for
 * `official` results. Set `strict: false` for provisional / partial sessions,
 * which turns count mismatches into warnings instead of errors.
 */
export function validateScoreInput(
  input: ScoreInput,
  options: { strict?: boolean } = {}
): ValidationResult {
  const strict = options.strict ?? true;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const spec = DISCIPLINES[input.discipline];
  if (!spec) {
    return { valid: false, errors: [{ path: 'discipline', message: `Unknown discipline: ${input.discipline}` }], warnings };
  }

  if (!input.shooterName?.trim()) errors.push({ path: 'shooterName', message: 'Shooter name is required' });
  if (!input.club?.trim()) errors.push({ path: 'club', message: 'Club is required' });
  if (!input.eventName?.trim()) errors.push({ path: 'eventName', message: 'Event name is required' });
  if (!input.date?.trim()) errors.push({ path: 'date', message: 'Date is required' });
  if (!CATEGORIES.some((c) => c.id === input.category)) {
    errors.push({ path: 'category', message: `Category must be one of: ${CATEGORIES.map((c) => c.id).join(', ')}` });
  }

  const expectedPositions = spec.positions;
  const gotPositions = input.positions?.map((p) => p.position) ?? [];

  // Position set must match the discipline (order-insensitive for validation).
  const missing = expectedPositions.filter((p) => !gotPositions.includes(p));
  const extra = gotPositions.filter((p) => !expectedPositions.includes(p));
  missing.forEach((p) => errors.push({ path: 'positions', message: `Missing ${p} position for ${spec.label}` }));
  extra.forEach((p) => errors.push({ path: 'positions', message: `Unexpected ${p} position for ${spec.label}` }));

  const maxSeriesDecimal = spec.maxDecimalSeries;

  input.positions?.forEach((block) => {
    const filledSeries = block.series.filter((s) => (s.decimal ?? 0) > 0 || (s.integer ?? 0) > 0);

    if (block.series.length > spec.seriesPerPosition) {
      errors.push({
        path: `positions.${block.position}`,
        message: `${POSITION_LABELS[block.position]} has ${block.series.length} series; max is ${spec.seriesPerPosition}`,
      });
    }

    if (filledSeries.length < spec.seriesPerPosition) {
      const issue = {
        path: `positions.${block.position}`,
        message: `${POSITION_LABELS[block.position]} has ${filledSeries.length}/${spec.seriesPerPosition} series completed`,
      };
      (strict ? errors : warnings).push(issue);
    }

    block.series.forEach((s, i) => {
      if (s.decimal != null) {
        if (s.decimal < 0 || s.decimal > maxSeriesDecimal) {
          errors.push({ path: `positions.${block.position}.series[${i}].decimal`, message: `Series decimal must be 0–${maxSeriesDecimal}` });
        }
      }
      if (s.integer != null) {
        if (!Number.isInteger(s.integer) || s.integer < 0 || s.integer > SHOTS_PER_SERIES * MAX_SHOT_INTEGER) {
          errors.push({ path: `positions.${block.position}.series[${i}].integer`, message: `Series integer must be 0–${SHOTS_PER_SERIES * MAX_SHOT_INTEGER}` });
        }
      }
      if (s.shots && s.shots.length > SHOTS_PER_SERIES) {
        errors.push({ path: `positions.${block.position}.series[${i}].shots`, message: `A series cannot have more than ${SHOTS_PER_SERIES} shots` });
      }
      s.shots?.forEach((shot, j) => {
        if (shot < 0 || shot > MAX_SHOT_DECIMAL) {
          errors.push({ path: `positions.${block.position}.series[${i}].shots[${j}]`, message: `Shot must be 0–${MAX_SHOT_DECIMAL}` });
        }
      });
    });
  });

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Derive a complete `Score` (with computed totals) from a validated input.
 * Does not assign `id`; caller/Firestore provides it.
 */
export function buildScore(
  input: ScoreInput,
  meta: { createdBy: string; now?: string }
): Omit<Score, 'id'> {
  const spec = getDisciplineSpec(input.discipline);
  const now = meta.now ?? new Date().toISOString();

  const positions: PositionBlock[] = input.positions.map((block) => {
    const series: ShotSeries[] = block.series.map((s, i) => ({
      seriesNumber: s.seriesNumber ?? i + 1,
      shots: s.shots,
      decimal: round1(s.decimal ?? 0),
      integer: Math.round(s.integer ?? 0),
      innerTens: s.innerTens,
    }));

    const decimalTotal = round1(series.reduce((sum, s) => sum + s.decimal, 0));
    const integerTotal = series.reduce((sum, s) => sum + s.integer, 0);
    const innerTens = series.reduce((sum, s) => sum + (s.innerTens ?? 0), 0);

    return { position: block.position, series, decimalTotal, integerTotal, innerTens };
  });

  // Order position blocks by the discipline's firing order.
  positions.sort((a, b) => spec.positions.indexOf(a.position) - spec.positions.indexOf(b.position));

  const decimalTotal = round1(positions.reduce((sum, p) => sum + p.decimalTotal, 0));
  const integerTotal = positions.reduce((sum, p) => sum + p.integerTotal, 0);
  const innerTens = positions.reduce((sum, p) => sum + (p.innerTens ?? 0), 0);
  const totalShots = positions.reduce(
    (sum, p) => sum + p.series.reduce((acc, s) => acc + (s.shots?.length ?? SHOTS_PER_SERIES), 0),
    0
  );

  return {
    userId: input.userId ?? null,
    shooterName: input.shooterName.trim(),
    club: input.club.trim(),
    category: input.category,
    eventId: input.eventId ?? '',
    eventName: input.eventName,
    date: input.date,
    discipline: input.discipline,
    scoringType: input.scoringType ?? 'decimal',
    positions,
    decimalTotal,
    integerTotal,
    innerTens,
    totalShots,
    status: input.status ?? 'official',
    source: input.source ?? 'manual',
    createdBy: meta.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Average a member's scores for ranking.
 * Ranking metric = mean of `decimalTotal` across the provided scores.
 */
export function averageDecimalTotal(scores: Pick<Score, 'decimalTotal'>[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s.decimalTotal, 0);
  return round1(sum / scores.length);
}
