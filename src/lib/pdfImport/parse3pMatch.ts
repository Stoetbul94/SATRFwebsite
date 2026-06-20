import type { Position } from '@/types/scores';
import type { Parsed3pPositionTotal, Parsed3pSeries, Parse3pPdfResult } from './types';

const round1 = (n: number) => Math.round(n * 10) / 10;

const POSITION_ALIASES: Record<string, Position> = {
  kneeling: 'kneeling',
  prone: 'prone',
  standing: 'standing',
};

function parsePositionTotalLine(line: string): Parsed3pPositionTotal | null {
  const m = line.match(
    /^(Kneeling|Prone|Standing)\s*\(Total\)\s*:\s*([\d.]+)\s*\(\s*(\d+)\s*\)/i
  );
  if (!m) return null;
  const position = POSITION_ALIASES[m[1].toLowerCase()];
  const decimal = round1(parseFloat(m[2]));
  const integer = parseInt(m[3], 10);
  if (!position || !Number.isFinite(decimal) || !Number.isFinite(integer)) return null;
  return { position, decimal, integer };
}

function parseSeriesLine(line: string): Parsed3pSeries | null {
  const m = line.match(/^(Kneeling|Prone|Standing)\s+S([12])\s+(.+)$/i);
  if (!m) return null;
  const position = POSITION_ALIASES[m[1].toLowerCase()];
  const seriesNumber = parseInt(m[2], 10) as 1 | 2;
  if (!position || (seriesNumber !== 1 && seriesNumber !== 2)) return null;

  const tokens = m[3].trim().split(/\s+/);
  if (tokens.length < 2) return null;
  const decimal = round1(parseFloat(tokens[tokens.length - 1]));
  if (!Number.isFinite(decimal) || decimal <= 0) return null;

  return { position, seriesNumber, decimal };
}

/**
 * Electronic target **3P Match Report** (qualification).
 * Extracts position totals `Kneeling (Total) : 189.6 (180)` and series lines
 * `Kneeling S1 … 94.6` (trailing value = series decimal total).
 */
export function parse3pMatchReportText(text: string): Parse3pPdfResult {
  const warnings: string[] = [];
  const normalized = text.replace(/\u00a0/g, ' ');

  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const positionTotals: Parsed3pPositionTotal[] = [];
  const seriesByKey = new Map<string, Parsed3pSeries>();

  for (const line of lines) {
    const posTotal = parsePositionTotalLine(line);
    if (posTotal) {
      positionTotals.push(posTotal);
      continue;
    }
    const series = parseSeriesLine(line);
    if (series) {
      seriesByKey.set(`${series.position}-S${series.seriesNumber}`, series);
    }
  }

  // Compact pdf-parse output may glue lines — scan full text too
  if (positionTotals.length < 3) {
    const posRe =
      /(Kneeling|Prone|Standing)\s*\(Total\)\s*:\s*([\d.]+)\s*\(\s*(\d+)\s*\)/gi;
    let pm: RegExpExecArray | null;
    const seen = new Set(positionTotals.map((p) => p.position));
    while ((pm = posRe.exec(normalized)) !== null) {
      const position = POSITION_ALIASES[pm[1].toLowerCase()];
      if (!position || seen.has(position)) continue;
      positionTotals.push({
        position,
        decimal: round1(parseFloat(pm[2])),
        integer: parseInt(pm[3], 10),
      });
      seen.add(position);
    }
  }

  if (seriesByKey.size < 6) {
    const seriesRe = /(Kneeling|Prone|Standing)\s+S([12])\s+([\d.\s]+?)(\d{2,3}\.\d)/gi;
    let sm: RegExpExecArray | null;
    while ((sm = seriesRe.exec(normalized)) !== null) {
      const position = POSITION_ALIASES[sm[1].toLowerCase()];
      const seriesNumber = parseInt(sm[2], 10) as 1 | 2;
      const decimal = round1(parseFloat(sm[4]));
      if (!position || !Number.isFinite(decimal)) continue;
      const key = `${position}-S${seriesNumber}`;
      if (!seriesByKey.has(key)) {
        seriesByKey.set(key, { position, seriesNumber, decimal });
      }
    }
  }

  const order: Position[] = ['kneeling', 'prone', 'standing'];
  positionTotals.sort((a, b) => order.indexOf(a.position) - order.indexOf(b.position));

  const series = order
    .flatMap((pos) => [1, 2].map((n) => seriesByKey.get(`${pos}-S${n}`)))
    .filter((s): s is Parsed3pSeries => Boolean(s));

  if (positionTotals.length === 0) {
    warnings.push(
      'No position totals found. Expected lines like "Kneeling (Total) : 189.6 (180)".'
    );
  } else if (positionTotals.length < 3) {
    warnings.push(`Only found ${positionTotals.length} of 3 position totals.`);
  }

  if (series.length === 0) {
    warnings.push('No series lines found. Expected "Kneeling S1 … 94.6" style rows.');
  } else if (series.length < 6) {
    warnings.push(`Only found ${series.length} of 6 series (2 per position).`);
  }

  const decimalFromPositions = round1(positionTotals.reduce((s, p) => s + p.decimal, 0));
  const decimalFromSeries = round1(series.reduce((s, r) => s + r.decimal, 0));
  const decimalTotal =
    positionTotals.length === 3 ? decimalFromPositions : decimalFromSeries;

  if (
    positionTotals.length === 3 &&
    series.length === 6 &&
    Math.abs(decimalFromPositions - decimalFromSeries) > 0.15
  ) {
    warnings.push(
      `Position totals (${decimalFromPositions}) and series sum (${decimalFromSeries}) differ slightly — check PDF.`
    );
  }

  const integerTotal =
    positionTotals.length === 3
      ? positionTotals.reduce((s, p) => s + p.integer, 0)
      : undefined;

  const nameMatch = normalized.match(/Name:\s*([^\n]+)/i);
  const shooterName = nameMatch ? nameMatch[1].trim() : undefined;

  return {
    reportType: '3p_match',
    shooterName,
    series,
    positionTotals,
    decimalTotal,
    integerTotal,
    warnings,
  };
}
