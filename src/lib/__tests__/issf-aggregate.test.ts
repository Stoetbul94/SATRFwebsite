import { buildScore, validateScoreInput } from '@/lib/issf';
import type { ScoreInput } from '@/types/scores';

const baseInput = (): ScoreInput => ({
  shooterName: 'Bernard Laferla',
  club: 'SATRF',
  category: 'open',
  eventName: 'Test Match',
  date: '2026-06-01',
  discipline: 'three_position_50m',
  stage: 'qualification',
  positions: [
    {
      position: 'kneeling',
      aggregate: true,
      series: [{ seriesNumber: 1, decimal: 192.1, integer: 183 }],
    },
    {
      position: 'prone',
      aggregate: true,
      series: [{ seriesNumber: 1, decimal: 195.6, integer: 186 }],
    },
    {
      position: 'standing',
      aggregate: true,
      series: [{ seriesNumber: 1, decimal: 149.8, integer: 138 }],
    },
  ],
});

describe('issf aggregate 3P qual', () => {
  it('accepts Bernard Laferla total-only positions', () => {
    const input = baseInput();
    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);

    const score = buildScore(input, { createdBy: 'test' });
    expect(score.decimalTotal).toBe(537.5);
    expect(score.integerTotal).toBe(507);
    expect(score.positions.every((p) => p.aggregate)).toBe(true);
    expect(score.totalShots).toBe(60);
  });

  it('rejects aggregate block with two filled series', () => {
    const input = baseInput();
    input.positions[0] = {
      position: 'kneeling',
      aggregate: true,
      series: [
        { seriesNumber: 1, decimal: 96.0, integer: 90 },
        { seriesNumber: 2, decimal: 96.1, integer: 93 },
      ],
    };
    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('at most one series'))).toBe(true);
  });

  it('rejects aggregate position decimal above 218', () => {
    const input = baseInput();
    input.positions[0] = {
      position: 'kneeling',
      aggregate: true,
      series: [{ seriesNumber: 1, decimal: 219.0, integer: 200 }],
    };
    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('≤ 218'))).toBe(true);
  });

  it('accepts mixed aggregate and series positions', () => {
    const input = baseInput();
    input.positions[1] = {
      position: 'prone',
      series: [
        { seriesNumber: 1, decimal: 98.0, integer: 93 },
        { seriesNumber: 2, decimal: 97.6, integer: 93 },
      ],
    };
    const result = validateScoreInput(input, { strict: true });
    expect(result.valid).toBe(true);

    const score = buildScore(input, { createdBy: 'test' });
    expect(score.positions.find((p) => p.position === 'prone')?.aggregate).toBeFalsy();
    expect(score.positions.find((p) => p.position === 'kneeling')?.aggregate).toBe(true);
    expect(score.decimalTotal).toBe(537.5);
  });
});
