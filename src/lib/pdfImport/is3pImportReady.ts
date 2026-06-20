import type { Parse3pPdfResult, ThreePImportMode } from './types';

/** Whether parsed 3P PDF data is sufficient to save for the chosen import mode. */
export function is3pImportReady(
  parsed: Parse3pPdfResult | null | undefined,
  mode: ThreePImportMode
): boolean {
  if (!parsed || parsed.positionTotals.length < 3) return false;
  if (mode === 'six_series') return parsed.series.length >= 6;
  return true;
}

export function threePImportReadyLabel(mode: ThreePImportMode): string {
  if (mode === 'position_aggregate') {
    return 'Need 3 position totals (decimal + ring)';
  }
  return 'Need 3 position totals and 6 series';
}
