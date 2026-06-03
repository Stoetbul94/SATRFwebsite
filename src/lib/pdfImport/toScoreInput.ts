import type { ScoreInput } from '@/types/scores';
import type { Category } from '@/types/scores';
import type { ParsePronePdfResult } from './types';

export function parsedPdfToScoreInput(
  parsed: ParsePronePdfResult,
  opts: {
    userId: string | null;
    shooterName: string;
    club: string;
    category: Category;
    eventId: string;
    eventName: string;
    date: string;
  }
): ScoreInput {
  return {
    userId: opts.userId,
    shooterName: opts.shooterName,
    club: opts.club,
    category: opts.category,
    eventId: opts.eventId,
    eventName: opts.eventName,
    date: opts.date,
    discipline: 'prone_50m',
    scoringType: 'decimal',
    status: 'official',
    source: 'pdf',
    stage: 'qualification',
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
