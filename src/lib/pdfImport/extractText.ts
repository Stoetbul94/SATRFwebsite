import type { PdfReportType } from './types';
import { parseSummaryReportText } from './parseSummary';
import { parseTargetReportText } from './parseTarget';
import type { ParsePronePdfResult } from './types';

type PdfParseFn = (buffer: Buffer) => Promise<{ text: string }>;

/** pdf-parse v1 — reliable on Vercel without pdfjs font assets. */
async function getPdfParser(): Promise<PdfParseFn> {
  const mod = await import('pdf-parse');
  const fn = (mod as { default?: PdfParseFn }).default ?? (mod as unknown as PdfParseFn);
  return fn;
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF';
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  if (!isPdfBuffer(buffer)) {
    throw new Error('File is not a valid PDF (missing %PDF header). Re-export from your target system as PDF.');
  }
  const pdfParse = await getPdfParser();
  const data = await pdfParse(buffer);
  return data.text ?? '';
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
