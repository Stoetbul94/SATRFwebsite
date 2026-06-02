import type { PdfReportType } from './types';
import { parseSummaryReportText } from './parseSummary';
import { parseTargetReportText } from './parseTarget';
import type { ParsePronePdfResult } from './types';

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const data = new Uint8Array(buffer);
  const parser = new PDFParse(data);
  const result = await parser.getText();
  return result.text ?? '';
}

export function parsePronePdfText(text: string, reportType: PdfReportType): ParsePronePdfResult {
  const normalized = text.replace(/\u00a0/g, ' ');
  if (reportType === 'summary') return parseSummaryReportText(normalized);
  return parseTargetReportText(normalized);
}

export async function parsePronePdfBuffer(
  buffer: Buffer,
  reportType: PdfReportType
): Promise<ParsePronePdfResult> {
  const text = await extractTextFromPdfBuffer(buffer);
  if (!text.trim()) {
    return {
      reportType,
      series: [],
      decimalTotal: 0,
      warnings: ['No text could be extracted from this PDF (scanned image PDFs are not supported).'],
    };
  }
  return parsePronePdfText(text, reportType);
}
