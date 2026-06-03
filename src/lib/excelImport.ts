import type { Category, Discipline, ScoreInput } from '@/types/scores';
import { DISCIPLINES, CATEGORIES } from '@/lib/issf';

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const DISCIPLINE_IDS = new Set(Object.keys(DISCIPLINES) as Discipline[]);

/** Normalize Excel header to a lookup key. */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, ' ')
    .replace(/[()]/g, '');
}

/** Map normalized headers to internal field keys. */
export const EXCEL_HEADER_MAP: Record<string, string> = {
  date: 'date',
  'date yyyy-mm-dd': 'date',
  'event name': 'eventName',
  eventname: 'eventName',
  discipline: 'discipline',
  'shooter name': 'shooterName',
  shootername: 'shooterName',
  club: 'club',
  category: 'category',
  'series 1': 'series1',
  series1: 'series1',
  's1 decimal': 'series1',
  'series 2': 'series2',
  series2: 'series2',
  's2 decimal': 'series2',
  'series 3': 'series3',
  series3: 'series3',
  's3 decimal': 'series3',
  'series 4': 'series4',
  series4: 'series4',
  's4 decimal': 'series4',
  'series 5': 'series5',
  series5: 'series5',
  's5 decimal': 'series5',
  'series 6': 'series6',
  series6: 'series6',
  's6 decimal': 'series6',
  's1 integer': 'series1Int',
  's2 integer': 'series2Int',
  's3 integer': 'series3Int',
  's4 integer': 'series4Int',
  's5 integer': 'series5Int',
  's6 integer': 'series6Int',
  notes: 'notes',
  status: 'status',
};

export interface ExcelScoreRow {
  date: string;
  eventName: string;
  discipline: Discipline;
  shooterName: string;
  club: string;
  category: Category;
  series: { decimal: number; integer?: number }[];
  notes?: string;
  status?: 'official' | 'provisional';
  errors?: string[];
}

function parseDateCell(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const parsed = XLSXDateToISO(value);
    return parsed;
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

/** Excel serial date → YYYY-MM-DD (UTC). */
function XLSXDateToISO(serial: number): string | null {
  if (!Number.isFinite(serial)) return null;
  const utc = new Date(Math.round((serial - 25569) * 86400 * 1000));
  if (Number.isNaN(utc.getTime())) return null;
  return utc.toISOString().slice(0, 10);
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

export function mapRawRowToExcelRow(rowData: Record<string, unknown>, rowIndex: number): ExcelScoreRow {
  const errors: string[] = [];
  const push = (msg: string) => errors.push(`Row ${rowIndex + 1}: ${msg}`);

  const date = parseDateCell(rowData.date);
  if (!date) push('Invalid or missing date (use YYYY-MM-DD)');

  const eventName = String(rowData.eventName ?? '').trim();
  if (!eventName) push('Event name is required');

  const disciplineRaw = String(rowData.discipline ?? 'prone_50m')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  const discipline = (disciplineRaw === 'prone' ? 'prone_50m' : disciplineRaw) as Discipline;
  if (!DISCIPLINE_IDS.has(discipline)) {
    push(`Discipline must be prone_50m or three_position_50m (got "${rowData.discipline}")`);
  }

  const shooterName = String(rowData.shooterName ?? '').trim();
  if (!shooterName) push('Shooter name is required');

  const club = String(rowData.club ?? '').trim();
  if (!club) push('Club is required');

  const categoryRaw = String(rowData.category ?? 'open')
    .trim()
    .toLowerCase();
  const category = categoryRaw as Category;
  if (!CATEGORY_IDS.has(category)) {
    push(`Category must be: ${CATEGORIES.map((c) => c.id).join(', ')}`);
  }

  const seriesKeys = ['series1', 'series2', 'series3', 'series4', 'series5', 'series6'] as const;
  const intKeys = ['series1Int', 'series2Int', 'series3Int', 'series4Int', 'series5Int', 'series6Int'] as const;
  const series: { decimal: number; integer?: number }[] = [];

  seriesKeys.forEach((key, i) => {
    const dec = parseDecimal(rowData[key]);
    if (dec == null) {
      push(`Series ${i + 1} decimal is required`);
      series.push({ decimal: 0 });
    } else if (dec < 0 || dec > 109) {
      push(`Series ${i + 1} must be between 0 and 109.0`);
      series.push({ decimal: dec });
    } else {
      const integer = parseInteger(rowData[intKeys[i]]);
      series.push(integer != null ? { decimal: dec, integer } : { decimal: dec });
    }
  });

  const statusRaw = String(rowData.status ?? 'official').trim().toLowerCase();
  const status = statusRaw === 'provisional' ? 'provisional' : 'official';

  const result: ExcelScoreRow = {
    date: date ?? '',
    eventName,
    discipline: DISCIPLINE_IDS.has(discipline) ? discipline : 'prone_50m',
    shooterName,
    club,
    category: CATEGORY_IDS.has(category) ? category : 'open',
    series,
    notes: rowData.notes ? String(rowData.notes) : undefined,
    status,
  };
  if (errors.length > 0) result.errors = errors;
  return result;
}

export function excelRowToScoreInput(row: ExcelScoreRow): ScoreInput {
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

/** Build row object from header row + data row arrays. */
export function rowArraysToRecord(headers: string[], row: unknown[]): Record<string, unknown> {
  const rowData: Record<string, unknown> = {};
  headers.forEach((header, colIndex) => {
    const key = EXCEL_HEADER_MAP[normalizeHeader(header)];
    if (key) rowData[key] = row[colIndex];
  });
  return rowData;
}
