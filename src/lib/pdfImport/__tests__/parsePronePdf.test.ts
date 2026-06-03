import { parseSummaryReportText } from '../parseSummary';
import { parseTargetReportText } from '../parseTarget';

const SUMMARY_SNIPPET = `
S1 100.7
4 95
S2 101.6
4 95
S3 97.4
3 93
S4 100.5
5 97
S5 99.3
2 95
S6 93.4
2 89
SERIES WISE SCORES (7-12)
S7 100.7
`;

/** pdf-parse v1 compact layout (no spaces) */
const SUMMARY_V1_SNIPPET = `
S1100.7
495
S2101.6
495
S397.4
393
S4100.5
597
S599.3
295
S693.4
289
SERIES WISE SCORES (7-12)
S7100.7
`;

const TARGET_SNIPPET = `
SERIES 1
TOTAL : 100.7 (95) INNER 10 : 4
SERIES 2
TOTAL : 101.6 (95) INNER 10 : 4
SERIES 3
TOTAL : 97.4 (93) INNER 10 : 3
SERIES 4
TOTAL : 100.5 (97) INNER 10 : 5
SERIES 5
TOTAL : 99.3 (95) INNER 10 : 2
SERIES 6
TOTAL : 93.4 (89) INNER 10 : 2
SERIES 7
TOTAL : 100.7 (95)
`;

describe('parseSummaryReportText', () => {
  it('extracts S1–S6 only', () => {
    const r = parseSummaryReportText(SUMMARY_SNIPPET);
    expect(r.series).toHaveLength(6);
    expect(r.series[0]).toMatchObject({ seriesNumber: 1, decimal: 100.7, integer: 95, innerTens: 4 });
    expect(r.series[5]).toMatchObject({ seriesNumber: 6, decimal: 93.4, integer: 89 });
    expect(r.decimalTotal).toBe(593.9);
    expect(r.warnings.some((w) => w.includes('series 7'))).toBe(true);
  });

  it('parses pdf-parse v1 compact summary lines', () => {
    const r = parseSummaryReportText(SUMMARY_V1_SNIPPET);
    expect(r.series).toHaveLength(6);
    expect(r.series[0]).toMatchObject({ seriesNumber: 1, decimal: 100.7, integer: 95, innerTens: 4 });
    expect(r.series[5]).toMatchObject({ seriesNumber: 6, decimal: 93.4, integer: 89 });
    expect(r.decimalTotal).toBe(593.9);
  });
});

describe('parseTargetReportText', () => {
  it('extracts first six SERIES blocks', () => {
    const r = parseTargetReportText(TARGET_SNIPPET);
    expect(r.series).toHaveLength(6);
    expect(r.series[3].decimal).toBe(100.5);
    expect(r.decimalTotal).toBe(593.9);
    expect(r.integerTotal).toBe(564);
  });
});
