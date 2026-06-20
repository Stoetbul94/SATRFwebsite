/**
 * ISSF discipline rules, constants, and score validation/derivation.
 */

import type {
  Category,
  Discipline,
  Position,
  PositionBlock,
  Score,
  ScoreInput,
  ScoreStage,
  ScoringType,
  ShotSeries,
} from '@/types/scores';
import { scoreMatchesCategoryFilter, normalizeScoreCategoryFlags } from '@/lib/scoreVeteran';

export const SHOTS_PER_SERIES = 10;
/** Max decimal for a 5-shot series in 3P final (5 × 10.9). */
export const MAX_5SHOT_SERIES_DECIMAL = 54.5;
export const MAX_DECIMAL_PER_POSITION_3P_FINAL = MAX_5SHOT_SERIES_DECIMAL * 2;
export const MAX_SHOT_DECIMAL = 10.9;
export const MAX_SHOT_INTEGER = 10;
export const MAX_DECIMAL_PER_POSITION_3P = 218.0;

export interface DisciplineSpec {
  id: Discipline;
  label: string;
  positions: Position[];
  seriesPerPosition: number;
  totalShots: number;
  maxDecimalSeries: number;
  maxDecimalTotal: number;
  maxIntegerTotal: number;
  maxDecimalPerPosition?: number;
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
  fclass_open: {
    id: 'fclass_open',
    label: 'F-Class Open',
    positions: ['fclass'],
    seriesPerPosition: 6,
    totalShots: 60,
    maxDecimalSeries: 109.0,
    maxDecimalTotal: 654.0,
    maxIntegerTotal: 600,
  },
  fclass_tr: {
    id: 'fclass_tr',
    label: 'F-Class TR',
    positions: ['fclass'],
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
    seriesPerPosition: 2,
    totalShots: 60,
    maxDecimalSeries: 109.0,
    maxDecimalTotal: 654.0,
    maxIntegerTotal: 600,
    maxDecimalPerPosition: MAX_DECIMAL_PER_POSITION_3P,
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
  fclass: 'F-Class',
};

export const DISCIPLINE_LIST = Object.values(DISCIPLINES);

export function getDisciplineSpec(discipline: Discipline): DisciplineSpec {
  const spec = DISCIPLINES[discipline];
  if (!spec) throw new Error(`Unknown discipline: ${discipline}`);
  return spec;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

function isSixSeriesDiscipline(discipline: Discipline): boolean {
  return (
    discipline === 'prone_50m' ||
    discipline === 'fclass_open' ||
    discipline === 'fclass_tr'
  );
}

function validate3pFinal(input: ScoreInput, strict: boolean): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const elimShots = input.finalShots ?? [];
  const positionBlocks = input.positions ?? [];
  const usesSeries = positionBlocks.length > 0;

  if (input.discipline !== 'three_position_50m') {
    errors.push({ path: 'discipline', message: '3P final requires three_position_50m' });
  }

  if (usesSeries) {
    let filledSlots = 0;
    positionBlocks.forEach((block) => {
      if (block.aggregate) {
        const filledSeries = block.series.filter((s) => (s.decimal ?? 0) > 0 || (s.integer ?? 0) > 0);
        if (filledSeries.length > 1) {
          errors.push({
            path: `positions.${block.position}`,
            message: `${POSITION_LABELS[block.position]} total-only entry must have at most one series with data`,
          });
        }
        const dec = block.series.reduce((sum, s) => sum + (s.decimal ?? 0), 0);
        const int = block.series.reduce((sum, s) => sum + (s.integer ?? 0), 0);
        if (dec > MAX_DECIMAL_PER_POSITION_3P_FINAL) {
          errors.push({
            path: `positions.${block.position}`,
            message: `${POSITION_LABELS[block.position]} decimal must be ≤ ${MAX_DECIMAL_PER_POSITION_3P_FINAL}`,
          });
        }
        if (int > 100) {
          errors.push({
            path: `positions.${block.position}`,
            message: `${POSITION_LABELS[block.position]} ring total must be ≤ 100`,
          });
        }
        if (filledSeries.length > 0) filledSlots += 2;
        return;
      }

      const filledSeries = block.series.filter((s) => (s.decimal ?? 0) > 0);
      filledSlots += filledSeries.length;
      block.series.forEach((s, i) => {
        const dec = s.decimal ?? 0;
        if (dec > MAX_5SHOT_SERIES_DECIMAL) {
          errors.push({
            path: `positions.${block.position}.series[${i}].decimal`,
            message: `5-shot series decimal must be 0–${MAX_5SHOT_SERIES_DECIMAL}`,
          });
        }
      });
    });

    if (strict && filledSlots < 6) {
      errors.push({
        path: 'positions',
        message: '3P final requires all 6 position series (Kn/Pr/St × 2) or equivalent position totals',
      });
    } else if (!strict && filledSlots < 6) {
      warnings.push({ path: 'positions', message: 'Fewer than 6 position series recorded' });
    }
  } else {
    if (strict && elimShots.length < 30) {
      errors.push({ path: 'finalShots', message: '3P final requires at least 30 shots (K+P+standing series)' });
    } else if (!strict && elimShots.length < 30) {
      warnings.push({ path: 'finalShots', message: 'Fewer than 30 shots recorded' });
    }
  }

  elimShots.forEach((shot, i) => {
    if (shot < 0 || shot > MAX_SHOT_DECIMAL) {
      errors.push({ path: `finalShots[${i}]`, message: `Shot must be 0–${MAX_SHOT_DECIMAL}` });
    }
  });

  if (input.eliminatedAtShot != null) {
    const e = input.eliminatedAtShot;
    if (!Number.isInteger(e) || e < 30 || e > 35) {
      errors.push({ path: 'eliminatedAtShot', message: 'Eliminated at shot must be 30–35 or blank' });
    }
  }

  if (input.finalRank != null && (!Number.isInteger(input.finalRank) || input.finalRank < 1)) {
    errors.push({ path: 'finalRank', message: 'Final rank must be a positive integer' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateScoreInput(
  input: ScoreInput,
  options: { strict?: boolean } = {}
): ValidationResult {
  const strict = options.strict ?? true;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const stage: ScoreStage = input.stage ?? 'qualification';

  if (stage === '3p_final') {
    const base = validate3pFinal(input, strict);
    if (!input.shooterName?.trim()) base.errors.push({ path: 'shooterName', message: 'Shooter name is required' });
    if (!input.eventName?.trim()) base.errors.push({ path: 'eventName', message: 'Event name is required' });
    if (!input.date?.trim()) base.errors.push({ path: 'date', message: 'Date is required' });
    return base;
  }

  const spec = DISCIPLINES[input.discipline];
  if (!spec) {
    return {
      valid: false,
      errors: [{ path: 'discipline', message: `Unknown discipline: ${input.discipline}` }],
      warnings,
    };
  }

  if (!input.shooterName?.trim()) errors.push({ path: 'shooterName', message: 'Shooter name is required' });
  if (!input.club?.trim() && stage === 'qualification') {
    errors.push({ path: 'club', message: 'Club is required' });
  }
  if (!input.eventName?.trim()) errors.push({ path: 'eventName', message: 'Event name is required' });
  if (!input.date?.trim() && stage === 'qualification') {
    errors.push({ path: 'date', message: 'Date is required' });
  }
  if (!CATEGORIES.some((c) => c.id === input.category)) {
    errors.push({
      path: 'category',
      message: `Category must be one of: ${CATEGORIES.map((c) => c.id).join(', ')}`,
    });
  }

  const expectedPositions = spec.positions;
  const gotPositions = input.positions?.map((p) => p.position) ?? [];
  const missing = expectedPositions.filter((p) => !gotPositions.includes(p));
  const extra = gotPositions.filter((p) => !expectedPositions.includes(p));
  missing.forEach((p) =>
    errors.push({ path: 'positions', message: `Missing ${POSITION_LABELS[p]} for ${spec.label}` })
  );
  extra.forEach((p) =>
    errors.push({ path: 'positions', message: `Unexpected ${POSITION_LABELS[p]} for ${spec.label}` })
  );

  const maxSeriesDecimal = spec.maxDecimalSeries;

  input.positions?.forEach((block) => {
    if (block.aggregate && input.discipline === 'three_position_50m') {
      const filledSeries = block.series.filter((s) => (s.decimal ?? 0) > 0 || (s.integer ?? 0) > 0);
      if (filledSeries.length > 1) {
        errors.push({
          path: `positions.${block.position}`,
          message: `${POSITION_LABELS[block.position]} aggregate entry must have at most one series with data`,
        });
      }
      if (filledSeries.length > 1) {
        filledSeries.forEach((s) => {
          if ((s.decimal ?? 0) > maxSeriesDecimal) {
            errors.push({
              path: `positions.${block.position}`,
              message: `${POSITION_LABELS[block.position]} series decimal must be ≤ ${maxSeriesDecimal} when multiple series are present`,
            });
          }
        });
      }
      const dec = block.series.reduce((s, x) => s + (x.decimal ?? 0), 0);
      const int = block.series.reduce((s, x) => s + (x.integer ?? 0), 0);
      if (strict && dec <= 0) {
        errors.push({
          path: `positions.${block.position}`,
          message: `${POSITION_LABELS[block.position]} decimal total is required`,
        });
      }
      if (dec > (spec.maxDecimalPerPosition ?? maxSeriesDecimal * spec.seriesPerPosition)) {
        errors.push({
          path: `positions.${block.position}`,
          message: `${POSITION_LABELS[block.position]} decimal must be ≤ ${spec.maxDecimalPerPosition ?? 218}`,
        });
      }
      if (int > 200) {
        errors.push({
          path: `positions.${block.position}`,
          message: `${POSITION_LABELS[block.position]} integer must be ≤ 200`,
        });
      }
      return;
    }

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
      if (s.decimal != null && (s.decimal < 0 || s.decimal > maxSeriesDecimal)) {
        errors.push({
          path: `positions.${block.position}.series[${i}].decimal`,
          message: `Series decimal must be 0–${maxSeriesDecimal}`,
        });
      }
      if (
        s.integer != null &&
        (!Number.isInteger(s.integer) || s.integer < 0 || s.integer > SHOTS_PER_SERIES * MAX_SHOT_INTEGER)
      ) {
        errors.push({
          path: `positions.${block.position}.series[${i}].integer`,
          message: `Series integer must be 0–${SHOTS_PER_SERIES * MAX_SHOT_INTEGER}`,
        });
      }
      s.shots?.forEach((shot, j) => {
        if (shot < 0 || shot > MAX_SHOT_DECIMAL) {
          errors.push({
            path: `positions.${block.position}.series[${i}].shots[${j}]`,
            message: `Shot must be 0–${MAX_SHOT_DECIMAL}`,
          });
        }
      });
    });
  });

  if (isSixSeriesDiscipline(input.discipline) || stage === 'prone_final') {
    const block = input.positions?.[0];
    const filled = block?.series.filter((s) => (s.decimal ?? 0) > 0) ?? [];
    if (strict && filled.length < 6) {
      errors.push({ path: 'positions', message: 'All 6 series decimals are required for official scores' });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Rank 3P finalists: later elimination = better; blank eliminatedAtShot = survived all 35. */
export function rank3pFinalists(
  entries: { id?: string; eliminatedAtShot?: number | null; decimalTotal: number }[]
): Map<string, number> {
  const sorted = [...entries].sort((a, b) => {
    const ea = a.eliminatedAtShot ?? 999;
    const eb = b.eliminatedAtShot ?? 999;
    if (eb !== ea) return eb - ea;
    return b.decimalTotal - a.decimalTotal;
  });
  const ranks = new Map<string, number>();
  sorted.forEach((e, i) => {
    if (e.id) ranks.set(e.id, i + 1);
  });
  return ranks;
}

/** Rank prone/F-Class finals by decimalTotal descending. */
export function rankProneFinalists(
  entries: { id?: string; decimalTotal: number }[]
): Map<string, number> {
  const sorted = [...entries].sort((a, b) => b.decimalTotal - a.decimalTotal);
  const ranks = new Map<string, number>();
  sorted.forEach((e, i) => {
    if (e.id) ranks.set(e.id, i + 1);
  });
  return ranks;
}

export function buildScore(
  input: ScoreInput,
  meta: { createdBy: string; now?: string }
): Omit<Score, 'id'> {
  const spec = getDisciplineSpec(input.discipline);
  const now = meta.now ?? new Date().toISOString();
  const stage: ScoreStage = input.stage ?? 'qualification';
  const { category, isVeteran } = normalizeScoreCategoryFlags(input);

  if (stage === '3p_final') {
    const elimShots = (input.finalShots ?? []).map((s) => round1(s));
    const positionBlocks = (input.positions ?? []).map((block) => {
      const series: ShotSeries[] = block.series.map((s, i) => ({
        seriesNumber: s.seriesNumber ?? i + 1,
        decimal: round1(s.decimal ?? 0),
        integer: Math.round(s.integer ?? 0),
      }));
      const decimalTotal = round1(series.reduce((sum, s) => sum + s.decimal, 0));
      return {
        position: block.position,
        series,
        decimalTotal,
        integerTotal: series.reduce((sum, s) => sum + s.integer, 0),
        innerTens: 0,
        aggregate: block.aggregate,
      };
    });

    const seriesTotal = round1(positionBlocks.reduce((sum, p) => sum + p.decimalTotal, 0));
    const elimTotal = round1(elimShots.reduce((a, b) => a + b, 0));
    const decimalTotal =
      positionBlocks.length > 0
        ? round1(seriesTotal + elimTotal)
        : round1(elimShots.reduce((a, b) => a + b, 0));

    const seriesShots = positionBlocks.reduce((sum, p) => {
      if (p.aggregate) return sum + 10;
      return sum + p.series.filter((s) => s.decimal > 0).length * 5;
    }, 0);
    const totalShots = positionBlocks.length > 0 ? seriesShots + elimShots.length : elimShots.length;

    let eliminatedAtShot = input.eliminatedAtShot ?? null;
    if (eliminatedAtShot == null && elimShots.length > 0 && elimShots.length < 5) {
      eliminatedAtShot = 30 + elimShots.length;
    }

    return {
      userId: input.userId ?? null,
      shooterName: input.shooterName.trim(),
      club: input.club?.trim() ?? '',
      category,
      isVeteran,
      eventId: input.eventId ?? '',
      eventName: input.eventName,
      date: input.date,
      discipline: input.discipline,
      scoringType: input.scoringType ?? 'decimal',
      stage,
      positions: positionBlocks,
      finalShots: elimShots.length > 0 ? elimShots : undefined,
      eliminatedAtShot,
      finalRank: input.finalRank,
      decimalTotal,
      integerTotal: 0,
      innerTens: 0,
      totalShots,
      status: input.status ?? 'official',
      source: input.source ?? 'manual',
      createdBy: meta.createdBy,
      createdAt: now,
      updatedAt: now,
    };
  }

  const positions: PositionBlock[] = input.positions.map((block) => {
    const series: ShotSeries[] = block.series.map((s, i) => {
      const row: ShotSeries = {
        seriesNumber: s.seriesNumber ?? i + 1,
        decimal: round1(s.decimal ?? 0),
        integer: Math.round(s.integer ?? 0),
      };
      if (s.shots != null && s.shots.length > 0) row.shots = s.shots;
      if (s.innerTens != null) row.innerTens = s.innerTens;
      return row;
    });

    const decimalTotal = round1(series.reduce((sum, s) => sum + s.decimal, 0));
    const integerTotal = series.reduce((sum, s) => sum + s.integer, 0);
    const innerTens = series.reduce((sum, s) => sum + (s.innerTens ?? 0), 0);

    return {
      position: block.position,
      series,
      decimalTotal,
      integerTotal,
      innerTens,
      aggregate: block.aggregate,
    };
  });

  positions.sort((a, b) => spec.positions.indexOf(a.position) - spec.positions.indexOf(b.position));

  const decimalTotal = round1(positions.reduce((sum, p) => sum + p.decimalTotal, 0));
  const integerTotal = positions.reduce((sum, p) => sum + p.integerTotal, 0);
  const innerTens = positions.reduce((sum, p) => sum + (p.innerTens ?? 0), 0);
  const totalShots = positions.reduce((sum, p) => {
    if (p.aggregate) return sum + 20;
    return sum + p.series.reduce((acc, s) => acc + (s.shots?.length ?? SHOTS_PER_SERIES), 0);
  }, 0);

  return {
    userId: input.userId ?? null,
    shooterName: input.shooterName.trim(),
    club: input.club.trim(),
    category,
    isVeteran,
    eventId: input.eventId ?? '',
    eventName: input.eventName,
    date: input.date,
    discipline: input.discipline,
    scoringType: input.scoringType ?? 'decimal',
    stage,
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

export function averageDecimalTotal(scores: Pick<Score, 'decimalTotal'>[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s.decimalTotal, 0);
  return round1(sum / scores.length);
}

/** Preferred order when picking default discipline for an event. */
export const EVENT_DISCIPLINE_ORDER: Discipline[] = [
  'prone_50m',
  'fclass_open',
  'fclass_tr',
  'three_position_50m',
];

export interface EventResultSeries {
  seriesNumber: number;
  decimal: number;
  integer?: number;
  missing?: boolean;
}

export interface EventResultPosition {
  position: string;
  decimalTotal: number;
  integerTotal?: number;
  aggregate?: boolean;
}

export interface EventResultRow {
  scoreId?: string;
  place: number;
  shooterName: string;
  club: string;
  category: Category;
  isVeteran?: boolean;
  stage: ScoreStage;
  decimalTotal: number;
  integerTotal?: number;
  isProvisional?: boolean;
  series?: EventResultSeries[];
  positions?: EventResultPosition[];
  finalShots?: number[];
  eliminatedAtShot?: number | null;
  finalRank?: number;
}

export interface EventResultBoard {
  discipline: Discipline;
  hasFinal: boolean;
  qualification: EventResultRow[];
  final?: EventResultRow[];
}

export interface BuildEventResultBoardOptions {
  includeProvisional?: boolean;
  category?: Category | 'all';
}

type ScoreDoc = Score & { deleted?: boolean };

function expectedFinalStage(discipline: Discipline): ScoreStage {
  return discipline === 'three_position_50m' ? '3p_final' : 'prone_final';
}

/** Map a stored score doc to a display row (series / positions / final shots). */
export function scoreToEventResultRow(score: ScoreDoc, place: number): EventResultRow {
  const stage: ScoreStage = score.stage ?? 'qualification';
  const row: EventResultRow = {
    scoreId: score.id,
    place,
    shooterName: score.shooterName,
    club: score.club,
    category: score.category,
    isVeteran: score.isVeteran === true,
    stage,
    decimalTotal: score.decimalTotal,
    integerTotal: score.integerTotal,
    isProvisional: score.status === 'provisional',
  };

  if (stage === '3p_final') {
    row.finalShots = score.finalShots;
    row.eliminatedAtShot = score.eliminatedAtShot ?? null;
    row.finalRank = score.finalRank;
    if (score.positions?.length) {
      row.positions = score.positions.map((p) => ({
        position: p.position,
        decimalTotal: p.decimalTotal,
        integerTotal: p.integerTotal,
        aggregate: p.aggregate,
      }));
      row.series = score.positions.flatMap((p, posIdx) => {
        const base = posIdx * 2 + 1;
        if (p.aggregate) {
          const filled = p.series.find((s) => (s.decimal ?? 0) > 0) ?? p.series[0];
          return [
            {
              seriesNumber: base,
              decimal: filled?.decimal ?? 0,
              integer: filled?.integer,
            },
            {
              seriesNumber: base + 1,
              decimal: 0,
              missing: true,
            },
          ];
        }
        return p.series.map((s, i) => ({
          seriesNumber: base + i,
          decimal: s.decimal,
          integer: s.integer,
        }));
      });
    }
    return row;
  }

  if (score.discipline === 'three_position_50m' && stage === 'qualification') {
    row.positions = (score.positions ?? []).map((p) => ({
      position: p.position,
      decimalTotal: p.decimalTotal,
      integerTotal: p.integerTotal,
    }));
    return row;
  }

  const block = score.positions?.[0];
  if (block?.series?.length) {
    row.series = block.series
      .slice()
      .sort((a, b) => a.seriesNumber - b.seriesNumber)
      .map((s) => ({
        seriesNumber: s.seriesNumber,
        decimal: s.decimal,
        integer: s.integer,
      }));
  }

  if (stage === 'prone_final') {
    row.finalRank = score.finalRank;
  }

  return row;
}

function applyFinalRanks(docs: ScoreDoc[], discipline: Discipline): ScoreDoc[] {
  if (docs.length === 0) return docs;
  const needsRank = docs.some((d) => d.finalRank == null);
  if (!needsRank) {
    return [...docs].sort((a, b) => (a.finalRank ?? 999) - (b.finalRank ?? 999));
  }

  if (discipline === 'three_position_50m') {
    const rankMap = rank3pFinalists(
      docs.map((d) => ({
        id: d.id,
        eliminatedAtShot: d.eliminatedAtShot,
        decimalTotal: d.decimalTotal,
      }))
    );
    return [...docs]
      .map((d) => ({ ...d, finalRank: rankMap.get(d.id) ?? d.finalRank }))
      .sort((a, b) => (a.finalRank ?? 999) - (b.finalRank ?? 999));
  }

  const rankMap = rankProneFinalists(docs.map((d) => ({ id: d.id, decimalTotal: d.decimalTotal })));
  return [...docs]
    .map((d) => ({ ...d, finalRank: rankMap.get(d.id) ?? d.finalRank }))
    .sort((a, b) => (a.finalRank ?? 999) - (b.finalRank ?? 999));
}

function positionDecimalTotal(score: ScoreDoc, position: Position): number {
  return score.positions?.find((p) => p.position === position)?.decimalTotal ?? 0;
}

/** Qualification sort: total desc; 3P ties broken by last position (standing) decimal. */
export function compareQualificationScores(a: ScoreDoc, b: ScoreDoc, discipline: Discipline): number {
  const totalDiff = b.decimalTotal - a.decimalTotal;
  if (totalDiff !== 0) return totalDiff;

  if (discipline === 'three_position_50m') {
    const lastPosition = DISCIPLINES.three_position_50m.positions.at(-1)!;
    return positionDecimalTotal(b, lastPosition) - positionDecimalTotal(a, lastPosition);
  }

  return 0;
}

/**
 * Build qualification + final result boards for one event and discipline.
 * Firestore-free — pass pre-fetched score docs.
 */
export function buildEventResultBoard(
  docs: ScoreDoc[],
  discipline: Discipline,
  options: BuildEventResultBoardOptions = {}
): EventResultBoard {
  const { includeProvisional = false, category = 'all' } = options;
  const expectedFinal = expectedFinalStage(discipline);

  let filtered = docs.filter((d) => d.discipline === discipline && !d.deleted);
  if (!includeProvisional) {
    filtered = filtered.filter((d) => d.status === 'official');
  }
  if (category !== 'all') {
    filtered = filtered.filter((d) => scoreMatchesCategoryFilter(d, category));
  }

  const qualDocs = filtered.filter((d) => (d.stage ?? 'qualification') === 'qualification');
  const finalDocs = filtered.filter((d) => (d.stage ?? 'qualification') === expectedFinal);

  const qualSorted = [...qualDocs].sort((a, b) => compareQualificationScores(a, b, discipline));
  const qualification = qualSorted.map((doc, i) => scoreToEventResultRow(doc, i + 1));

  let finalRows: EventResultRow[] | undefined;
  if (finalDocs.length > 0) {
    const finalSorted = applyFinalRanks(finalDocs, discipline);
    finalRows = finalSorted.map((doc, i) => {
      const row = scoreToEventResultRow(doc, doc.finalRank ?? i + 1);
      row.place = doc.finalRank ?? i + 1;
      return row;
    });
  }

  return {
    discipline,
    hasFinal: (finalRows?.length ?? 0) > 0,
    qualification,
    final: finalRows,
  };
}

/** Disciplines with at least one official score in the given docs. */
export function availableDisciplinesFromScores(
  docs: ScoreDoc[],
  options: { includeProvisional?: boolean } = {}
): Discipline[] {
  const { includeProvisional = false } = options;
  const set = new Set<Discipline>();
  for (const d of docs) {
    if (d.deleted) continue;
    if (!includeProvisional && d.status !== 'official') continue;
    if (d.discipline && DISCIPLINES[d.discipline]) set.add(d.discipline);
  }
  return EVENT_DISCIPLINE_ORDER.filter((id) => set.has(id));
}

export function defaultDisciplineFromAvailable(available: Discipline[]): Discipline {
  for (const id of EVENT_DISCIPLINE_ORDER) {
    if (available.includes(id)) return id;
  }
  return 'prone_50m';
}
