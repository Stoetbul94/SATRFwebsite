export type PdfReportType = 'summary' | 'target';

export interface ParsedProneSeries {
  seriesNumber: number;
  decimal: number;
  integer?: number;
  innerTens?: number;
}

export interface ParsePronePdfResult {
  reportType: PdfReportType;
  series: ParsedProneSeries[];
  decimalTotal: number;
  integerTotal?: number;
  warnings: string[];
}
