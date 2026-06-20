import type { Position } from '@/types/scores';

export type PdfReportType = 'summary' | 'target' | '3p_match';

/** How to map parsed 3P PDF data into a qualification score. */
export type ThreePImportMode = 'six_series' | 'position_aggregate';

export interface ParsedProneSeries {
  seriesNumber: number;
  decimal: number;
  integer?: number;
  innerTens?: number;
}

export interface ParsePronePdfResult {
  reportType: 'summary' | 'target';
  series: ParsedProneSeries[];
  decimalTotal: number;
  integerTotal?: number;
  warnings: string[];
}

export interface Parsed3pSeries {
  position: Position;
  seriesNumber: 1 | 2;
  decimal: number;
}

export interface Parsed3pPositionTotal {
  position: Position;
  decimal: number;
  integer: number;
  innerTens?: number;
}

export interface Parse3pPdfResult {
  reportType: '3p_match';
  shooterName?: string;
  series: Parsed3pSeries[];
  positionTotals: Parsed3pPositionTotal[];
  decimalTotal: number;
  integerTotal?: number;
  warnings: string[];
}

export type ParsePdfResult = ParsePronePdfResult | Parse3pPdfResult;

export function isParse3pPdfResult(r: ParsePdfResult): r is Parse3pPdfResult {
  return r.reportType === '3p_match';
}
