import { is3pImportReady, threePImportReadyLabel } from '@/lib/pdfImport/is3pImportReady';
import type { Parse3pPdfResult } from '@/lib/pdfImport/types';

function parsed(overrides: Partial<Parse3pPdfResult> = {}): Parse3pPdfResult {
  return {
    reportType: '3p_match',
    series: [],
    positionTotals: [],
    decimalTotal: 0,
    warnings: [],
    ...overrides,
  };
}

const threePositions = [
  { position: 'kneeling' as const, decimal: 180, integer: 170 },
  { position: 'prone' as const, decimal: 190, integer: 180 },
  { position: 'standing' as const, decimal: 160, integer: 150 },
];

describe('is3pImportReady', () => {
  it('position_aggregate requires 3 position totals only', () => {
    expect(
      is3pImportReady(parsed({ positionTotals: threePositions, series: [] }), 'position_aggregate')
    ).toBe(true);
  });

  it('position_aggregate fails without 3 position totals', () => {
    expect(
      is3pImportReady(parsed({ positionTotals: threePositions.slice(0, 2) }), 'position_aggregate')
    ).toBe(false);
  });

  it('six_series requires 3 position totals and 6 series', () => {
    const series = threePositions.flatMap((p) => [
      { position: p.position, seriesNumber: 1 as const, decimal: 90 },
      { position: p.position, seriesNumber: 2 as const, decimal: 90 },
    ]);
    expect(is3pImportReady(parsed({ positionTotals: threePositions, series }), 'six_series')).toBe(
      true
    );
    expect(
      is3pImportReady(parsed({ positionTotals: threePositions, series: series.slice(0, 4) }), 'six_series')
    ).toBe(false);
  });
});

describe('threePImportReadyLabel', () => {
  it('describes mode-specific requirements', () => {
    expect(threePImportReadyLabel('position_aggregate')).toContain('3 position totals');
    expect(threePImportReadyLabel('six_series')).toContain('6 series');
  });
});
