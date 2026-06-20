import { parse3pMatchReportText } from '../parse3pMatch';

/** Arnold 50M Small Bore Rifle Target Report — representative 3P qualification PDF text. */
export const ARNOLD_3P_MATCH_SNIPPET = `
MATCH REPORT
POSITION WISE PERFORMANCE
Name: Arnold
Total Shots: 60
Total Score: 551.7 (524)
Kneeling (Total) : 189.6 (180)
Prone (Total) : 198.7 (191)
Standing (Total) : 163.4 (153)
Event: 50M Small Bore Rifle
Kneeling S1 10.4 7.9 9.9 10.2 8.9 9.9 9.8 9.5 9.2 8.9 94.6
Kneeling S2 9.2 10.5 8.4 10.0 10.0 10.0 8.9 10.0 9.2 8.8 95.0
Prone S1 9.5 9.7 10.3 9.2 10.2 9.3 10.3 9.6 9.3 10.3 97.7
Prone S2 9.8 10.3 10.0 9.8 9.8 10.3 10.2 10.2 10.3 10.3 101.0
Standing S1 8.4 8.5 8.7 7.3 5.8 6.5 10.0 6.7 7.4 7.9 77.2
Standing S2 9.1 10.2 8.9 8.8 7.9 8.3 8.4 9.5 7.2 7.9 86.2
`;

describe('parse3pMatchReportText', () => {
  it('extracts position totals and six series from match report', () => {
    const r = parse3pMatchReportText(ARNOLD_3P_MATCH_SNIPPET);
    expect(r.reportType).toBe('3p_match');
    expect(r.shooterName).toBe('Arnold');
    expect(r.positionTotals).toHaveLength(3);
    expect(r.positionTotals[0]).toMatchObject({
      position: 'kneeling',
      decimal: 189.6,
      integer: 180,
    });
    expect(r.positionTotals[2]).toMatchObject({
      position: 'standing',
      decimal: 163.4,
      integer: 153,
    });
    expect(r.series).toHaveLength(6);
    expect(r.series.find((s) => s.position === 'kneeling' && s.seriesNumber === 1)?.decimal).toBe(
      94.6
    );
    expect(r.decimalTotal).toBe(551.7);
    expect(r.integerTotal).toBe(524);
  });
});
