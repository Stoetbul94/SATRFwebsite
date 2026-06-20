import type { Category, Discipline, ScoreInput, ScoreStage } from '@/types/scores';
import { CATEGORIES, DISCIPLINES } from '@/lib/issf';
import { veteranFlagFromImportData } from '@/lib/scoreMemberEnrich';
import * as XLSX from 'xlsx';

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const DISCIPLINE_IDS = new Set(Object.keys(DISCIPLINES) as Discipline[]);

const SCORE_SHEETS = [
  'Prone 50m',
  'F-Class',
  '3-Position 50m',
  'Prone Final',
  '3P Final',
] as const;

export type ScoreSheetName = (typeof SCORE_SHEETS)[number];

export interface ExcelImportContext {
  eventId: string;
  eventName: string;
  date: string;
}

export interface ParsedImportRow {
  sheet: string;
  rowIndex: number;
  input?: ScoreInput;
  preview: {
    shooterName: string;
    club: string;
    discipline: string;
    stage: string;
    summary: string;
  };
  errors?: string[];
}

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, ' ')
    .replace(/[()]/g, '');
}

const QUAL_HEADER_MAP: Record<string, string> = {
  date: 'date',
  'date yyyy-mm-dd': 'date',
  'event name': 'eventName',
  eventname: 'eventName',
  discipline: 'discipline',
  'shooter name': 'shooterName',
  shootername: 'shooterName',
  shooter: 'shooterName',
  club: 'club',
  category: 'category',
  veteran: 'veteran',
  'veteran y/n': 'veteran',
  's1 dec': 'series1',
  's2 dec': 'series2',
  's3 dec': 'series3',
  's4 dec': 'series4',
  's5 dec': 'series5',
  's6 dec': 'series6',
  's1 int': 'series1Int',
  's2 int': 'series2Int',
  's3 int': 'series3Int',
  's4 int': 'series4Int',
  's5 int': 'series5Int',
  's6 int': 'series6Int',
  'series 1': 'series1',
  'series 2': 'series2',
  'series 3': 'series3',
  'series 4': 'series4',
  'series 5': 'series5',
  'series 6': 'series6',
  'kneeling dec': 'kneelingDec',
  'prone dec': 'proneDec',
  'standing dec': 'standingDec',
  'kneeling int': 'kneelingInt',
  'prone int': 'proneInt',
  'standing int': 'standingInt',
  'kn s1': 'knS1',
  'kn s2': 'knS2',
  'pr s1': 'prS1',
  'pr s2': 'prS2',
  'st s1': 'stS1',
  'st s2': 'stS2',
  status: 'status',
};

const PRONE_FINAL_MAP: Record<string, string> = {
  date: 'date',
  'event name': 'eventName',
  eventname: 'eventName',
  discipline: 'discipline',
  'shooter name': 'shooterName',
  shootername: 'shooterName',
  shooter: 'shooterName',
  club: 'club',
  category: 'category',
  veteran: 'veteran',
  'veteran y/n': 'veteran',
  s1: 'series1',
  s2: 'series2',
  s3: 'series3',
  s4: 'series4',
  s5: 'series5',
  s6: 'series6',
  'final rank': 'finalRank',
  status: 'status',
};

const THREE_P_FINAL_MAP: Record<string, string> = {
  date: 'date',
  'event name': 'eventName',
  eventname: 'eventName',
  discipline: 'discipline',
  'shooter name': 'shooterName',
  shootername: 'shooterName',
  shooter: 'shooterName',
  club: 'club',
  category: 'category',
  veteran: 'veteran',
  'veteran y/n': 'veteran',
  'kn s1': 'knS1',
  'kn s2': 'knS2',
  'pr s1': 'prS1',
  'pr s2': 'prS2',
  'std s1': 'stS1',
  'std s2': 'stS2',
  'st s1': 'stS1',
  'st s2': 'stS2',
  'elim 1': 'elim1',
  'elim 2': 'elim2',
  'elim 3': 'elim3',
  'elim 4': 'elim4',
  'elim 5': 'elim5',
  'final rank': 'finalRank',
  status: 'status',
};

function findHeaderRowIndex(rows: unknown[][], markers: string[]): number {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const cells = (rows[i] as unknown[]).map((c) => normalizeHeader(String(c ?? '')));
    const ok = markers.every((m) => cells.some((c) => c === m || c.includes(m)));
    if (ok) return i;
  }
  return 0;
}

function parseFinalRank(raw: unknown): number | undefined {
  if (raw == null || String(raw).trim() === '') return undefined;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function has3pQualSummary(data: Record<string, unknown>): string {
  if (parseDecimal(data.knS1) != null) {
    return ['knS1', 'knS2', 'prS1', 'prS2', 'stS1', 'stS2']
      .map((k) => parseDecimal(data[k]) ?? '—')
      .join(' / ');
  }
  return `${parseDecimal(data.kneelingDec) ?? '—'} / ${parseDecimal(data.proneDec) ?? '—'} / ${parseDecimal(data.standingDec) ?? '—'}`;
}

function buildFinalShotMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {
    'event name': 'eventName',
    shooter: 'shooterName',
    'elim@shot': 'eliminatedAtShot',
    status: 'status',
  };
  headers.forEach((h) => {
    const n = normalizeHeader(h);
    if (/^k\d+$/.test(n.replace(/\s/g, ''))) map[n] = n.replace(/\s/g, '');
    if (/^p\d+$/.test(n.replace(/\s/g, ''))) map[n] = n.replace(/\s/g, '');
    if (/^s\d+$/.test(n.replace(/\s/g, '')) && !n.includes('status')) map[n] = n.replace(/\s/g, '');
    if (/^x3[1-5]$/.test(n.replace(/\s/g, ''))) map[n] = n.replace(/\s/g, '');
  });
  return map;
}

function parseDateCell(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const utc = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (Number.isNaN(utc.getTime())) return null;
    return utc.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function parseDecimal(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

function parseInteger(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = typeof value === 'number' ? Math.round(value) : parseInt(String(value), 10);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function rowToRecord(headers: string[], row: unknown[], headerMap: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  headers.forEach((header, i) => {
    const key = headerMap[normalizeHeader(header)];
    if (key) out[key] = row[i];
  });
  return out;
}

function isEmptyRow(row: unknown[]): boolean {
  return !row || row.every((c) => c == null || String(c).trim() === '');
}

function parseStatus(raw: unknown): 'official' | 'provisional' {
  const s = String(raw ?? 'official').trim().toLowerCase();
  return s === 'provisional' ? 'provisional' : 'official';
}

function parseCategory(raw: unknown): Category {
  const c = String(raw ?? 'open').trim().toLowerCase();
  if (c === 'veteran') return 'open';
  return CATEGORY_IDS.has(c as Category) ? (c as Category) : 'open';
}

function categoryFieldsFromRow(data: Record<string, unknown>): Pick<ScoreInput, 'category' | 'isVeteran'> {
  const category = parseCategory(data.category);
  const fromCol = veteranFlagFromImportData(data);
  const isVeteran =
    fromCol || String(data.category ?? '').trim().toLowerCase() === 'veteran';
  return isVeteran ? { category, isVeteran: true } : { category };
}

function sixSeriesInput(
  data: Record<string, unknown>,
  discipline: Discipline,
  position: 'prone' | 'fclass',
  stage: ScoreStage,
  ctx: ExcelImportContext
): ScoreInput {
  const series = [1, 2, 3, 4, 5, 6].map((n) => {
    const dec = parseDecimal(data[`series${n}`]) ?? 0;
    const int = parseInteger(data[`series${n}Int`]) ?? 0;
    return { seriesNumber: n, decimal: dec, integer: int };
  });
  return {
    shooterName: String(data.shooterName ?? '').trim(),
    club: String(data.club ?? '').trim(),
    ...categoryFieldsFromRow(data),
    eventId: ctx.eventId,
    eventName: ctx.eventName || String(data.eventName ?? '').trim(),
    date: parseDateCell(data.date) ?? ctx.date,
    discipline,
    stage,
    status: parseStatus(data.status),
    source: 'excel',
    positions: [{ position, series }],
  };
}

function parseQualSheet(
  sheetName: string,
  rows: unknown[][],
  headerRowIndex: number,
  ctx: ExcelImportContext
): ParsedImportRow[] {
  const headers = (rows[headerRowIndex] as string[]).map((h) => String(h ?? ''));
  const headerMap = QUAL_HEADER_MAP;
  const out: ParsedImportRow[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (isEmptyRow(row)) continue;

    const data = rowToRecord(headers, row, headerMap);
    const errors: string[] = [];
    const shooterName = String(data.shooterName ?? '').trim();
    if (!shooterName) continue;

    let input: ScoreInput | undefined;

    if (sheetName === 'Prone 50m') {
      const discipline = 'prone_50m' as Discipline;
      if (String(data.discipline ?? '').trim() && String(data.discipline) !== 'prone_50m') {
        errors.push('Discipline must be prone_50m on Prone 50m sheet');
      }
      if (!parseDateCell(data.date) && !ctx.date) errors.push('Date required');
      if (!String(data.club ?? '').trim()) errors.push('Club required');
      if (!errors.length) input = sixSeriesInput(data, discipline, 'prone', 'qualification', ctx);
    } else if (sheetName === 'F-Class') {
      const discRaw = String(data.discipline ?? '').trim().toLowerCase() as Discipline;
      if (!DISCIPLINE_IDS.has(discRaw) || (discRaw !== 'fclass_open' && discRaw !== 'fclass_tr')) {
        errors.push('Discipline must be fclass_open or fclass_tr');
      } else {
        if (!parseDateCell(data.date) && !ctx.date) errors.push('Date required');
        if (!String(data.club ?? '').trim()) errors.push('Club required');
        if (!errors.length) input = sixSeriesInput(data, discRaw, 'fclass', 'qualification', ctx);
      }
    } else if (sheetName === '3-Position 50m') {
      const knS1 = parseDecimal(data.knS1);
      const hasPerSeries = knS1 != null || parseDecimal(data.knS2) != null;

      if (hasPerSeries) {
        const seriesDefs: { position: 'kneeling' | 'prone' | 'standing'; keys: string[] }[] = [
          { position: 'kneeling', keys: ['knS1', 'knS2'] },
          { position: 'prone', keys: ['prS1', 'prS2'] },
          { position: 'standing', keys: ['stS1', 'stS2'] },
        ];
        const missing = seriesDefs.some(({ keys }) =>
          keys.every((k) => parseDecimal(data[k]) == null)
        );
        if (missing) {
          errors.push('All six qualification series (Kn/Pr/St × 2) are required');
        } else {
          input = {
            shooterName,
            club: String(data.club ?? '').trim(),
            ...categoryFieldsFromRow(data),
            eventId: ctx.eventId,
            eventName: ctx.eventName || String(data.eventName ?? '').trim(),
            date: parseDateCell(data.date) ?? ctx.date,
            discipline: 'three_position_50m',
            stage: 'qualification',
            status: parseStatus(data.status),
            source: 'excel',
            positions: seriesDefs.map(({ position, keys }) => ({
              position,
              series: keys.map((k, i) => ({
                seriesNumber: i + 1,
                decimal: parseDecimal(data[k]) ?? 0,
                integer: 0,
              })),
            })),
          };
        }
        if (!String(data.club ?? '').trim()) errors.push('Club required');
      } else {
        const kneelingDec = parseDecimal(data.kneelingDec);
        const proneDec = parseDecimal(data.proneDec);
        const standingDec = parseDecimal(data.standingDec);
        if (kneelingDec == null || proneDec == null || standingDec == null) {
          errors.push('Kneeling, Prone, and Standing decimal totals required');
        } else {
          input = {
            shooterName,
            club: String(data.club ?? '').trim(),
            ...categoryFieldsFromRow(data),
            eventId: ctx.eventId,
            eventName: ctx.eventName || String(data.eventName ?? '').trim(),
            date: parseDateCell(data.date) ?? ctx.date,
            discipline: 'three_position_50m',
            stage: 'qualification',
            status: parseStatus(data.status),
            source: 'excel',
            positions: [
              {
                position: 'kneeling',
                aggregate: true,
                series: [{ seriesNumber: 1, decimal: kneelingDec, integer: parseInteger(data.kneelingInt) ?? 0 }],
              },
              {
                position: 'prone',
                aggregate: true,
                series: [{ seriesNumber: 1, decimal: proneDec, integer: parseInteger(data.proneInt) ?? 0 }],
              },
              {
                position: 'standing',
                aggregate: true,
                series: [{ seriesNumber: 1, decimal: standingDec, integer: parseInteger(data.standingInt) ?? 0 }],
              },
            ],
          };
          if (!String(data.club ?? '').trim()) errors.push('Club required');
        }
      }
    }

    const summary =
      sheetName === '3-Position 50m'
        ? has3pQualSummary(data)
        : [1, 2, 3, 4, 5, 6]
            .map((n) => parseDecimal(data[`series${n}`]) ?? '—')
            .join(' / ');

    out.push({
      sheet: sheetName,
      rowIndex: i + 1,
      input,
      preview: {
        shooterName,
        club: String(data.club ?? '').trim(),
        discipline: input?.discipline ?? String(data.discipline ?? sheetName),
        stage: input?.stage ?? 'qualification',
        summary,
      },
      errors: errors.length ? errors.map((e) => `Row ${i + 1}: ${e}`) : undefined,
    });
  }
  return out;
}

function parseProneFinalSheet(rows: unknown[][], ctx: ExcelImportContext): ParsedImportRow[] {
  const headerRowIndex = findHeaderRowIndex(rows, ['shooter name', 's1']);
  const headers = (rows[headerRowIndex] as string[]).map((h) => String(h ?? ''));
  const out: ParsedImportRow[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (isEmptyRow(row)) continue;
    const data = rowToRecord(headers, row, PRONE_FINAL_MAP);
    const shooterName = String(data.shooterName ?? '').trim();
    if (!shooterName) continue;

    const errors: string[] = [];
    const series = [1, 2, 3, 4, 5, 6].map((n) => ({
      seriesNumber: n,
      decimal: parseDecimal(data[`series${n}`]) ?? 0,
      integer: 0,
    }));
    if (series.every((s) => s.decimal <= 0)) errors.push('At least one series score required');

    const input: ScoreInput = {
      shooterName,
      club: String(data.club ?? '').trim(),
      ...categoryFieldsFromRow(data),
      eventId: ctx.eventId,
      eventName: ctx.eventName || String(data.eventName ?? '').trim(),
      date: parseDateCell(data.date) ?? ctx.date,
      discipline: 'prone_50m',
      stage: 'prone_final',
      status: parseStatus(data.status),
      source: 'excel',
      finalRank: parseFinalRank(data.finalRank),
      positions: [{ position: 'prone', series }],
    };

    out.push({
      sheet: 'Prone Final',
      rowIndex: i + 1,
      input: errors.length ? undefined : input,
      preview: {
        shooterName,
        club: input.club || '—',
        discipline: 'prone_50m',
        stage: 'prone_final',
        summary: series.map((s) => s.decimal).join(' / '),
      },
      errors: errors.length ? errors.map((e) => `Row ${i + 1}: ${e}`) : undefined,
    });
  }
  return out;
}

function parse3pFinalSheet(rows: unknown[][], ctx: ExcelImportContext): ParsedImportRow[] {
  const headerRowIndex = findHeaderRowIndex(rows, ['shooter name', 'kn s1']);
  const headers = (rows[headerRowIndex] as string[]).map((h) => String(h ?? ''));
  const usesSeriesFormat = headers.some((h) => normalizeHeader(h).includes('kn s1'));
  const out: ParsedImportRow[] = [];

  if (usesSeriesFormat) {
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (isEmptyRow(row)) continue;
      const data = rowToRecord(headers, row, THREE_P_FINAL_MAP);
      const shooterName = String(data.shooterName ?? '').trim();
      if (!shooterName) continue;

      const errors: string[] = [];
      const seriesDefs: { position: 'kneeling' | 'prone' | 'standing'; keys: string[] }[] = [
        { position: 'kneeling', keys: ['knS1', 'knS2'] },
        { position: 'prone', keys: ['prS1', 'prS2'] },
        { position: 'standing', keys: ['stS1', 'stS2'] },
      ];
      const positions = seriesDefs.map(({ position, keys }) => ({
        position,
        series: keys.map((k, idx) => ({
          seriesNumber: idx + 1,
          decimal: parseDecimal(data[k]) ?? 0,
          integer: 0,
        })),
      }));

      const elimShots: number[] = [];
      for (let e = 1; e <= 5; e++) {
        const v = parseDecimal(data[`elim${e}`]);
        if (v != null) elimShots.push(v);
      }

      const filledSeries = positions.flatMap((p) => p.series).filter((s) => s.decimal > 0);
      if (filledSeries.length === 0 && elimShots.length === 0) {
        errors.push('No final series or elimination shots recorded');
      }

      const input: ScoreInput = {
        shooterName,
        club: String(data.club ?? '').trim(),
        ...categoryFieldsFromRow(data),
        eventId: ctx.eventId,
        eventName: ctx.eventName || String(data.eventName ?? '').trim(),
        date: parseDateCell(data.date) ?? ctx.date,
        discipline: 'three_position_50m',
        stage: '3p_final',
        status: parseStatus(data.status),
        source: 'excel',
        positions,
        finalShots: elimShots.length > 0 ? elimShots : undefined,
        finalRank: parseFinalRank(data.finalRank),
      };

      const seriesTotal = filledSeries.reduce((s, x) => s + x.decimal, 0);
      const elimTotal = elimShots.reduce((s, x) => s + x, 0);

      out.push({
        sheet: '3P Final',
        rowIndex: i + 1,
        input: errors.length ? undefined : input,
        preview: {
          shooterName,
          club: input.club || '—',
          discipline: 'three_position_50m',
          stage: '3p_final',
          summary: `${(seriesTotal + elimTotal).toFixed(1)} (${filledSeries.length} series + ${elimShots.length} elim)`,
        },
        errors: errors.length ? errors.map((e) => `Row ${i + 1}: ${e}`) : undefined,
      });
    }
    return out;
  }

  const shotMap = buildFinalShotMap(headers);
  const shotOrder = [
    ...Array.from({ length: 10 }, (_, j) => `k${j + 1}`),
    ...Array.from({ length: 10 }, (_, j) => `p${j + 1}`),
    ...Array.from({ length: 10 }, (_, j) => `s${j + 1}`),
    'x31',
    'x32',
    'x33',
    'x34',
    'x35',
  ];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (isEmptyRow(row)) continue;
    const data = rowToRecord(headers, row, shotMap);
    const shooterName = String(data.shooterName ?? '').trim();
    if (!shooterName) continue;

    const errors: string[] = [];
    const finalShots: number[] = [];
    shotOrder.forEach((key) => {
      const v = parseDecimal(data[key]);
      if (v != null) finalShots.push(v);
    });

    if (finalShots.length < 30) errors.push('Need at least 30 shots for official 3P final');

    let eliminatedAtShot: number | null = null;
    const elimRaw = data.eliminatedAtShot;
    if (elimRaw != null && String(elimRaw).trim() !== '') {
      const e = parseInt(String(elimRaw), 10);
      if (Number.isFinite(e)) eliminatedAtShot = e;
    }

    const input: ScoreInput = {
      shooterName,
      club: String(data.club ?? '').trim(),
      ...categoryFieldsFromRow(data),
      eventId: ctx.eventId,
      eventName: ctx.eventName || String(data.eventName ?? '').trim(),
      date: parseDateCell(data.date) ?? ctx.date,
      discipline: 'three_position_50m',
      stage: '3p_final',
      status: parseStatus(data.status),
      source: 'excel',
      positions: [],
      finalShots,
      eliminatedAtShot,
      finalRank: parseFinalRank(data.finalRank),
    };

    out.push({
      sheet: '3P Final',
      rowIndex: i + 1,
      input: errors.length ? undefined : input,
      preview: {
        shooterName,
        club: input.club || '—',
        discipline: 'three_position_50m',
        stage: '3p_final',
        summary: `${finalShots.length} shots, total ${finalShots.reduce((a, b) => a + b, 0).toFixed(1)}`,
      },
      errors: errors.length ? errors.map((e) => `Row ${i + 1}: ${e}`) : undefined,
    });
  }
  return out;
}

export function parseMatchWorkbook(buffer: ArrayBuffer, ctx: ExcelImportContext): ParsedImportRow[] {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const all: ParsedImportRow[] = [];

  for (const sheetName of SCORE_SHEETS) {
    if (!workbook.SheetNames.includes(sheetName)) continue;
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

    if (sheetName === 'Prone Final') {
      all.push(...parseProneFinalSheet(rows, ctx));
    } else if (sheetName === '3P Final') {
      all.push(...parse3pFinalSheet(rows, ctx));
    } else {
      const headerRow =
        sheetName === '3-Position 50m'
          ? findHeaderRowIndex(rows, ['shooter name', 'kn s1'])
          : findHeaderRowIndex(rows, ['shooter name', 's1 dec']);
      all.push(...parseQualSheet(sheetName, rows, headerRow, ctx));
    }
  }

  return all;
}

/** @deprecated Use parseMatchWorkbook — kept for tests */
export function excelRowToScoreInput(row: {
  shooterName: string;
  club: string;
  category: Category;
  eventName: string;
  date: string;
  discipline: Discipline;
  series: { decimal: number; integer?: number }[];
  status?: 'official' | 'provisional';
}): ScoreInput {
  const spec = DISCIPLINES[row.discipline];
  const position = spec.positions[0];
  return {
    shooterName: row.shooterName,
    club: row.club,
    category: row.category,
    eventName: row.eventName,
    date: row.date,
    discipline: row.discipline,
    scoringType: 'decimal',
    status: row.status ?? 'official',
    source: 'excel',
    stage: 'qualification',
    positions: [
      {
        position,
        series: row.series.map((s, i) => ({
          seriesNumber: i + 1,
          decimal: s.decimal,
          integer: s.integer ?? 0,
        })),
      },
    ],
  };
}
