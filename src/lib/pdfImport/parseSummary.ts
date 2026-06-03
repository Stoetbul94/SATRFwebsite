import type { ParsedProneSeries, ParsePronePdfResult } from './types';

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Electronic target **Summary Report** — series totals S1–S6 only.
 * Ignores series 7+ (e.g. 80-shot practice sessions).
 */
export function parseSummaryReportText(text: string): ParsePronePdfResult {
  const warnings: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const byNumber = new Map<number, ParsedProneSeries>();

  for (let i = 0; i < lines.length; i++) {
    const sm = lines[i].match(/^S([1-6])\s+([\d.]+)$/i);
    if (!sm) continue;

    const seriesNumber = parseInt(sm[1], 10);
    const decimal = round1(parseFloat(sm[2]));
    if (!Number.isFinite(decimal)) continue;

    let innerTens: number | undefined;
    let integer: number | undefined;
    const next = lines[i + 1];
    if (next && !/^S\d/i.test(next)) {
      const nm = next.match(/^(\d+)(?:\s+(\d+))?$/);
      if (nm) {
        innerTens = parseInt(nm[1], 10);
        if (nm[2]) integer = parseInt(nm[2], 10);
        i += 1;
      }
    }

    byNumber.set(seriesNumber, { seriesNumber, decimal, integer, innerTens });
  }

  const series = Array.from(byNumber.values()).sort((a, b) => a.seriesNumber - b.seriesNumber);

  if (series.length === 0) {
    warnings.push('No S1–S6 series lines found. Expected lines like "S1 100.7".');
  } else if (series.length < 6) {
    warnings.push(`Only found ${series.length} of 6 series (S1–S6).`);
  }

  if (/SERIES WISE SCORES \(7/i.test(text) || /\bS7\s+[\d.]+/i.test(text)) {
    warnings.push('PDF includes series 7+ — only S1–S6 are imported for prone matches.');
  }

  const decimalTotal = round1(series.reduce((s, r) => s + r.decimal, 0));
  const integerTotal = series.every((r) => r.integer != null)
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
