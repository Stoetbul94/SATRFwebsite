import type { ParsedProneSeries, ParsePronePdfResult } from './types';

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Electronic target **Target / Match Report** — first six `SERIES N` blocks,
 * each with `TOTAL : decimal (integer)`.
 */
export function parseTargetReportText(text: string): ParsePronePdfResult {
  const warnings: string[] = [];
  const byNumber = new Map<number, ParsedProneSeries>();

  const parts = text.split(/SERIES\s+(\d+)/gi);
  for (let i = 1; i < parts.length; i += 2) {
    const seriesNumber = parseInt(parts[i], 10);
    if (!Number.isFinite(seriesNumber) || seriesNumber < 1 || seriesNumber > 6) continue;

    const block = parts[i + 1] ?? '';
    const totalMatch = block.match(/TOTAL\s*:\s*([\d.]+)\s*\(\s*(\d+)\s*\)/i);
    if (!totalMatch) continue;

    const decimal = round1(parseFloat(totalMatch[1]));
    const integer = parseInt(totalMatch[2], 10);
    if (!Number.isFinite(decimal)) continue;

    const innerMatch = block.match(/INNER\s*10\s*:\s*(\d+)/i);
    byNumber.set(seriesNumber, {
      seriesNumber,
      decimal,
      integer: Number.isFinite(integer) ? integer : undefined,
      innerTens: innerMatch ? parseInt(innerMatch[1], 10) : undefined,
    });
  }

  const series = [...byNumber.values()].sort((a, b) => a.seriesNumber - b.seriesNumber);

  if (series.length === 0) {
    warnings.push('No series totals found. Expected "SERIES 1" … "TOTAL : 100.7 (95)".');
  } else if (series.length < 6) {
    warnings.push(`Only found ${series.length} of 6 series blocks.`);
  }

  if (/SERIES\s+7\b/i.test(text)) {
    warnings.push('PDF includes series 7+ — only series 1–6 are imported.');
  }

  const decimalTotal = round1(series.reduce((s, r) => s + r.decimal, 0));
  const integerTotal = series.every((r) => r.integer != null)
    ? series.reduce((s, r) => s + (r.integer ?? 0), 0)
    : undefined;

  return {
    reportType: 'target',
    series,
    decimalTotal,
    integerTotal,
    warnings,
  };
}
