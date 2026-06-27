import { parsedPdfToScoreInput } from '../toScoreInput';
import type { ParsePronePdfResult } from '../types';

const parsed: ParsePronePdfResult = {
  series: [
    { seriesNumber: 1, decimal: 100.7, integer: 95 },
    { seriesNumber: 2, decimal: 101.2, integer: 96 },
    { seriesNumber: 3, decimal: 99.8, integer: 94 },
    { seriesNumber: 4, decimal: 102.1, integer: 97 },
    { seriesNumber: 5, decimal: 100.5, integer: 95 },
    { seriesNumber: 6, decimal: 101.0, integer: 96 },
  ],
  decimalTotal: 605.3,
  integerTotal: 573,
  warnings: [],
  ready: true,
};

const opts = {
  userId: 'uid-1',
  shooterName: 'Sherene Grundlingh',
  club: 'SATRF',
  category: 'ladies' as const,
  eventId: 'evt-1',
  eventName: 'SATRF PRONE EVENT #3',
  date: '2024-06-27',
  stage: 'qualification' as const,
};

describe('parsedPdfToScoreInput', () => {
  it('maps prone qualification PDF to ScoreInput', () => {
    const input = parsedPdfToScoreInput(parsed, opts);
    expect(input.discipline).toBe('prone_50m');
    expect(input.stage).toBe('qualification');
    expect(input.positions).toHaveLength(1);
    expect(input.positions![0].series).toHaveLength(6);
    expect(input.positions![0].series[0]).toMatchObject({ seriesNumber: 1, decimal: 100.7, integer: 95 });
  });

  it('uses prone_final stage when specified', () => {
    const input = parsedPdfToScoreInput(parsed, { ...opts, stage: 'prone_final' });
    expect(input.stage).toBe('prone_final');
  });
});
