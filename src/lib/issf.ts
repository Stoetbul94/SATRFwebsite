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

export const SHOTS_PER_SERIES = 10;
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
  const shots = input.finalShots ?? [];

  if (input.discipline !== 'three_position_50m') {
    errors.push({ path: 'discipline', message: '3P final requires three_position_50m' });
  }

  if (strict && shots.length < 30) {
    errors.push({ path: 'finalShots', message: '3P final requires at least 30 shots (K+P+standing series)' });
  } else if (!strict && shots.length < 30) {
    warnings.push({ path: 'finalShots', message: 'Fewer than 30 shots recorded' });
  }

  shots.forEach((shot, i) => {
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

  if (stage === '3p_final') {
    const finalShots = (input.finalShots ?? []).map((s) => round1(s));
    const decimalTotal = round1(finalShots.reduce((a, b) => a + b, 0));
    return {
      userId: input.userId ?? null,
      shooterName: input.shooterName.trim(),
      club: input.club?.trim() ?? '',
      category: input.category,
      eventId: input.eventId ?? '',
      eventName: input.eventName,
      date: input.date,
      discipline: input.discipline,
      scoringType: input.scoringType ?? 'decimal',
      stage,
      positions: [],
      finalShots,
      eliminatedAtShot: input.eliminatedAtShot ?? null,
      finalRank: input.finalRank,
      decimalTotal,
      integerTotal: 0,
      innerTens: 0,
      totalShots: finalShots.length,
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
    category: input.category,
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
}

export interface EventResultPosition {
  position: string;
  decimalTotal: number;
  integerTotal?: number;
}

export interface EventResultRow {
  scoreId?: string;
  place: number;
  shooterName: string;
  club: string;
  category: Category;
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
    stage,
    decimalTotal: score.decimalTotal,
    integerTotal: score.integerTotal,
    isProvisional: score.status === 'provisional',
  };

  if (stage === '3p_final') {
    row.finalShots = score.finalShots;
    row.eliminatedAtShot = score.eliminatedAtShot ?? null;
    row.finalRank = score.finalRank;
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
    filtered = filtered.filter((d) => d.category === category);
  }

  const qualDocs = filtered.filter((d) => (d.stage ?? 'qualification') === 'qualification');
  const finalDocs = filtered.filter((d) => (d.stage ?? 'qualification') === expectedFinal);

  const qualSorted = [...qualDocs].sort((a, b) => b.decimalTotal - a.decimalTotal);
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
