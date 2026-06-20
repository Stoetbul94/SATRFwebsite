import { parsed3pPdfToScoreInput } from '../toScoreInput';
import { parse3pMatchReportText } from '../parse3pMatch';
import { ARNOLD_3P_MATCH_SNIPPET } from './parse3pMatch.test';

describe('parsed3pPdfToScoreInput', () => {
  const parsed = parse3pMatchReportText(ARNOLD_3P_MATCH_SNIPPET);
  const opts = {
    userId: 'uid-1',
    shooterName: 'Arnold Admin',
    club: 'Modderbee',
    category: 'open' as const,
    eventId: 'evt-1',
    eventName: 'Test Match',
    date: '2026-06-20',
  };

  it('position_aggregate mode uses one aggregate block per position with ring totals', () => {
    const input = parsed3pPdfToScoreInput(parsed, 'position_aggregate', opts);
    expect(input.discipline).toBe('three_position_50m');
    expect(input.positions).toHaveLength(3);
    const kneel = input.positions!.find((p) => p.position === 'kneeling');
    expect(kneel?.aggregate).toBe(true);
    expect(kneel?.series[0]).toMatchObject({ decimal: 189.6, integer: 180 });
    const stand = input.positions!.find((p) => p.position === 'standing');
    expect(stand?.series[0]).toMatchObject({ decimal: 163.4, integer: 153 });
  });

  it('six_series mode maps series decimals and splits position ring totals', () => {
    const input = parsed3pPdfToScoreInput(parsed, 'six_series', opts);
    expect(input.positions).toHaveLength(3);
    const kneel = input.positions!.find((p) => p.position === 'kneeling');
    expect(kneel?.series).toHaveLength(2);
    expect(kneel?.series[0]).toMatchObject({ seriesNumber: 1, decimal: 94.6, integer: 90 });
    expect(kneel?.series[1]).toMatchObject({ seriesNumber: 2, decimal: 95.0, integer: 90 });
  });
});
