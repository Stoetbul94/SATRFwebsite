import type { Category, ScoreInput, ScoreStage } from '@/types/scores';
import type {
  Parse3pPdfResult,
  ParsePronePdfResult,
  ThreePImportMode,
} from './types';

export type PdfScoreInputOpts = {
  userId: string | null;
  shooterName: string;
  club: string;
  category: Category;
  isVeteran?: boolean;
  eventId: string;
  eventName: string;
  date: string;
  stage: ScoreStage;
};

export function parsedPdfToScoreInput(
  parsed: ParsePronePdfResult,
  opts: PdfScoreInputOpts,
): ScoreInput {
  return {
    userId: opts.userId,
    shooterName: opts.shooterName,
    club: opts.club,
    category: opts.category,
    isVeteran: opts.isVeteran,
    eventId: opts.eventId,
    eventName: opts.eventName,
    date: opts.date,
    discipline: 'prone_50m',
    scoringType: 'decimal',
    status: 'official',
    source: 'pdf',
    stage: opts.stage,
    positions: [
      {
        position: 'prone',
        series: parsed.series.map((s) => ({
          seriesNumber: s.seriesNumber,
          decimal: s.decimal,
          integer: s.integer ?? 0,
          innerTens: s.innerTens,
        })),
      },
    ],
  };
}

/** Split position ring total across two series (PDF only shows position-level integers). */
function splitIntegerAcrossSeries(total: number): [number, number] {
  const half = Math.floor(total / 2);
  return [half, total - half];
}

export function parsed3pPdfToScoreInput(
  parsed: Parse3pPdfResult,
  mode: ThreePImportMode,
  opts: PdfScoreInputOpts,
): ScoreInput {
  const base = {
    userId: opts.userId,
    shooterName: opts.shooterName,
    club: opts.club,
    category: opts.category,
    isVeteran: opts.isVeteran,
    eventId: opts.eventId,
    eventName: opts.eventName,
    date: opts.date,
    discipline: 'three_position_50m' as const,
    scoringType: 'decimal' as const,
    status: 'official' as const,
    source: 'pdf' as const,
    stage: opts.stage,
  };

  if (mode === 'position_aggregate') {
    return {
      ...base,
      positions: parsed.positionTotals.map((p) => ({
        position: p.position,
        aggregate: true,
        series: [
          {
            seriesNumber: 1,
            decimal: p.decimal,
            integer: p.integer,
            innerTens: p.innerTens,
          },
        ],
      })),
    };
  }

  const integerByPosition = new Map(
    parsed.positionTotals.map((p) => [p.position, p.integer] as const)
  );

  const order = ['kneeling', 'prone', 'standing'] as const;
  const positions = order.map((position) => {
    const posSeries = parsed.series.filter((s) => s.position === position);
    const [int1, int2] = splitIntegerAcrossSeries(integerByPosition.get(position) ?? 0);
    return {
      position,
      series: posSeries.map((s) => ({
        seriesNumber: s.seriesNumber,
        decimal: s.decimal,
        integer: s.seriesNumber === 1 ? int1 : int2,
      })),
    };
  });

  return { ...base, positions };
}
