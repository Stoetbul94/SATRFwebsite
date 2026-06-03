import type { ParsedProneSeries, ParsePronePdfResult } from './types';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Only the S1–S6 block (before series 7–12 on 80-shot cards). */
function summarySectionForSeries16(text: string): string {
  const parts = text.split(/SERIES\s+WISE\s+SCORES\s*\(\s*7/i);
  return parts[0] ?? text;
}

/**
 * Next line after S# total in pdf-parse v1 output: "495" = inner 10s (4) + integer (95).
 */
function parseMergedInnerIntegerLine(line: string): { innerTens?: number; integer?: number } {
  const trimmed = line.trim();
  const spaced = trimmed.match(/^(\d+)\s+(\d+)$/);
  if (spaced) {
    return { innerTens: parseInt(spaced[1], 10), integer: parseInt(spaced[2], 10) };
  }
  const merged = trimmed.match(/^(\d)(\d{2,3})$/);
  if (merged) {
    const integer = parseInt(merged[2], 10);
    if (integer >= 0 && integer <= 100) {
      return { innerTens: parseInt(merged[1], 10), integer };
    }
  }
  return {};
}

/**
 * Electronic target **Summary Report** — series totals S1–S6 only.
 * Supports spaced text ("S1 100.7") and pdf-parse v1 compact ("S1100.7", "495").
 */
export function parseSummaryReportText(text: string): ParsePronePdfResult {
  const warnings: string[] = [];
  const section = summarySectionForSeries16(text.replace(/\u00a0/g, ' '));

  const lines = section
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const byNumber = new Map<number, ParsedProneSeries>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sm =
      line.match(/^S([1-6])\s+([\d.]+)$/i) ||
      line.match(/^S([1-6])(\d{2,3}\.\d)$/i);

    if (!sm) continue;

    const seriesNumber = parseInt(sm[1], 10);
    const decimal = round1(parseFloat(sm[2]));
    if (!Number.isFinite(decimal) || decimal <= 0) continue;

    let innerTens: number | undefined;
    let integer: number | undefined;
    const next = lines[i + 1];
    if (next && !/^S\d/i.test(next)) {
      const parsed = parseMergedInnerIntegerLine(next);
      innerTens = parsed.innerTens;
      integer = parsed.integer;
      if (innerTens != null || integer != null) i += 1;
    }

    byNumber.set(seriesNumber, { seriesNumber, decimal, integer, innerTens });
  }

  // Fallback: compact runs without newlines between S# rows
  if (byNumber.size < 6) {
    const re = /S([1-6])(\d{2,3}\.\d)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(section)) !== null) {
      const seriesNumber = parseInt(m[1], 10);
      const decimal = round1(parseFloat(m[2]));
      if (!Number.isFinite(decimal) || decimal <= 0) continue;
      if (!byNumber.has(seriesNumber)) {
        byNumber.set(seriesNumber, { seriesNumber, decimal, integer: 0 });
      }
    }
  }

  const series = Array.from(byNumber.values()).sort((a, b) => a.seriesNumber - b.seriesNumber);

  if (series.length === 0) {
    warnings.push('No S1–S6 series lines found. Expected lines like "S1 100.7" or "S1100.7".');
  } else if (series.length < 6) {
    warnings.push(`Only found ${series.length} of 6 series (S1–S6).`);
  }

  if (/SERIES\s+WISE\s+SCORES\s*\(\s*7/i.test(text)) {
    warnings.push('PDF includes series 7+ — only S1–S6 are imported for prone matches.');
  }

  const decimalTotal = round1(series.reduce((s, r) => s + r.decimal, 0));
  const integerTotal = series.every((r) => r.integer != null && r.integer > 0)
    ? series.reduce((s, r) => s + (r.integer ?? 0), 0)
    : undefined;

  return {
    reportType: 'summary',
    series,
    decimalTotal,
    integerTotal,
    warnings,
  };
}
