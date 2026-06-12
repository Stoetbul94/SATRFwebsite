import { buildScore, validateScoreInput, scoreToEventResultRow } from '@/lib/issf';
import type { ScoreInput } from '@/types/scores';

const baseFinalMeta = {
  shooterName: 'Test Shooter',
  club: 'SATRF',
  category: 'open' as const,
  eventName: 'SATRF League 2',
  date: '2026-04-18',
  discipline: 'three_position_50m' as const,
  stage: '3p_final' as const,
};

describe('3P final aggregate position totals', () => {
  it('accepts Bernard Laferia mixed modes — FINAL TOTAL 301.8', () => {
    const input: ScoreInput = {
      ...baseFinalMeta,
      shooterName: 'Bernard Laferia',
      positions: [
        {
          position: 'kneeling',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 89.1, integer: 0 }],
        },
        {
          position: 'prone',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 93.0, integer: 0 }],
        },
        {
          position: 'standing',
          series: [
            { seriesNumber: 1, decimal: 39.2, integer: 0 },
            { seriesNumber: 2, decimal: 45.6, integer: 0 },
          ],
        },
      ],
      finalShots: [3.4, 7.0, 9.1, 9.9, 5.5],
    };

    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(true);

    const score = buildScore(input, { createdBy: 'test' });
    expect(score.decimalTotal).toBe(301.8);
    expect(score.positions.find((p) => p.position === 'kneeling')?.aggregate).toBe(true);
    expect(score.positions.find((p) => p.position === 'standing')?.aggregate).toBeFalsy();
  });

  it('accepts Arnold Bailie all total-only — FINAL TOTAL 320.7', () => {
    const input: ScoreInput = {
      ...baseFinalMeta,
      shooterName: 'Arnold Bailie',
      positions: [
        {
          position: 'kneeling',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 94.1, integer: 0 }],
        },
        {
          position: 'prone',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 97.8, integer: 0 }],
        },
        {
          position: 'standing',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 85.6, integer: 0 }],
        },
      ],
      finalShots: [9.1, 7.1, 8.3, 8.8, 9.9],
    };

    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(true);

    const score = buildScore(input, { createdBy: 'test' });
    expect(score.decimalTotal).toBe(320.7);
    expect(score.positions.every((p) => p.aggregate)).toBe(true);
    expect(score.totalShots).toBe(30 + 5);
  });

  it('rejects aggregate final position decimal above 109.0', () => {
    const input: ScoreInput = {
      ...baseFinalMeta,
      positions: [
        {
          position: 'kneeling',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 110.0, integer: 0 }],
        },
        {
          position: 'prone',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 97.8, integer: 0 }],
        },
        {
          position: 'standing',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 85.6, integer: 0 }],
        },
      ],
      finalShots: [9.1, 7.1, 8.3, 8.8, 9.9],
    };

    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('≤ 109'))).toBe(true);
  });

  it('rejects aggregate final block with two filled series', () => {
    const input: ScoreInput = {
      ...baseFinalMeta,
      positions: [
        {
          position: 'kneeling',
          aggregate: true,
          series: [
            { seriesNumber: 1, decimal: 44.0, integer: 0 },
            { seriesNumber: 2, decimal: 45.1, integer: 0 },
          ],
        },
        {
          position: 'prone',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 97.8, integer: 0 }],
        },
        {
          position: 'standing',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 85.6, integer: 0 }],
        },
      ],
      finalShots: [9.1, 7.1, 8.3, 8.8, 9.9],
    };

    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('at most one series'))).toBe(true);
  });

  it('renders missing series as — in event result rows for aggregate positions', () => {
    const input: ScoreInput = {
      ...baseFinalMeta,
      shooterName: 'Arnold Bailie',
      positions: [
        {
          position: 'kneeling',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 94.1, integer: 0 }],
        },
        {
          position: 'prone',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 97.8, integer: 0 }],
        },
        {
          position: 'standing',
          aggregate: true,
          series: [{ seriesNumber: 1, decimal: 85.6, integer: 0 }],
        },
      ],
      finalShots: [9.1, 7.1, 8.3, 8.8, 9.9],
    };

    const score = buildScore(input, { createdBy: 'test', now: '2026-04-18T12:00:00.000Z' });
    const row = scoreToEventResultRow({ ...score, id: 'score-1' }, 1);
    expect(row.series?.filter((s) => s.missing)).toHaveLength(3);
    expect(row.positions?.every((p) => p.aggregate)).toBe(true);
  });

  it('keeps classic all-series final payload valid', () => {
    const input: ScoreInput = {
      ...baseFinalMeta,
      positions: [
        {
          position: 'kneeling',
          series: [
            { seriesNumber: 1, decimal: 45.0, integer: 0 },
            { seriesNumber: 2, decimal: 44.1, integer: 0 },
          ],
        },
        {
          position: 'prone',
          series: [
            { seriesNumber: 1, decimal: 48.0, integer: 0 },
            { seriesNumber: 2, decimal: 49.8, integer: 0 },
          ],
        },
        {
          position: 'standing',
          series: [
            { seriesNumber: 1, decimal: 39.2, integer: 0 },
            { seriesNumber: 2, decimal: 45.6, integer: 0 },
          ],
        },
      ],
      finalShots: [3.4, 7.0, 9.1, 9.9, 5.5],
    };

    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(true);
    const score = buildScore(input, { createdBy: 'test' });
    expect(score.positions.every((p) => !p.aggregate)).toBe(true);
  });
});
