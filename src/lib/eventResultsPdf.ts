import type { Category, Discipline } from '@/types/scores';
import { CATEGORIES, DISCIPLINES } from '@/lib/issf';
import type { EventResultRow } from '@/lib/issf';
import {
  formatScorePair,
  formatScoreTotalDisplay,
  formatSeriesScoreDisplay,
  qualScoreVariant,
} from '@/lib/rankingsDisplay';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

export interface EventResultsPdfInput {
  eventName: string;
  date?: string;
  discipline: Discipline;
  category: Category | 'all';
  hasFinal: boolean;
  qualification: EventResultRow[];
  final?: EventResultRow[];
}

const PAGE_W = 842;
const PAGE_H = 595;
const MARGIN = 40;
const BOTTOM = PAGE_H - MARGIN;
const ROW_H = 14;
const HEADER_H = 16;

function isSeriesDiscipline(d: Discipline): boolean {
  return d === 'prone_50m' || d === 'fclass_open' || d === 'fclass_tr';
}

function is3pQualTable(discipline: Discipline, rows: EventResultRow[]): boolean {
  return discipline === 'three_position_50m' && rows[0]?.stage === 'qualification';
}

export function buildResultsPdfFilename(eventName: string, discipline: string): string {
  const slug = eventName
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `SATRF-${slug || 'event'}-${discipline}-results.pdf`;
}

export function formatEventResultTotal(row: EventResultRow, discipline: Discipline): string {
  return formatScoreTotalDisplay({
    discipline,
    stage: row.stage,
    decimalTotal: row.decimalTotal,
    integerTotal: row.integerTotal ?? 0,
    positions: [],
  });
}

function formatPositionCell(
  decimal: number,
  rings: number | undefined,
  discipline: Discipline,
  stage: EventResultRow['stage']
): string {
  const pair = formatScorePair(
    decimal,
    rings ?? 0,
    qualScoreVariant(discipline, stage)
  );
  return pair.secondary ? `${pair.primary} (${pair.secondary})` : pair.primary;
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function categoryLabel(category: Category | 'all'): string {
  if (category === 'all') return 'All categories';
  return CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

type TableColumn = { key: string; label: string; width: number; align?: 'left' | 'right' };

function buildColumns(discipline: Discipline, rows: EventResultRow[]): TableColumn[] {
  const base: TableColumn[] = [
    { key: 'place', label: 'Place', width: 32 },
    { key: 'name', label: 'Name', width: 118 },
    { key: 'club', label: 'Club', width: 88 },
    { key: 'cat', label: 'Cat', width: 44 },
  ];

  if (is3pQualTable(discipline, rows)) {
    return [
      ...base,
      { key: 'kneel', label: 'Kneel', width: 52, align: 'right' },
      { key: 'prone', label: 'Prone', width: 52, align: 'right' },
      { key: 'stand', label: 'Stand', width: 52, align: 'right' },
      { key: 'total', label: 'Total', width: 58, align: 'right' },
    ];
  }

  if (isSeriesDiscipline(discipline) || rows[0]?.stage === 'prone_final') {
    const cols = [...base];
    for (let i = 1; i <= 6; i++) {
      cols.push({ key: `s${i}`, label: `S${i}`, width: 40, align: 'right' });
    }
    cols.push({ key: 'total', label: 'Total', width: 58, align: 'right' });
    return cols;
  }

  return [...base, { key: 'total', label: 'Total', width: 58, align: 'right' }];
}

function rowCells(
  row: EventResultRow,
  discipline: Discipline,
  columns: TableColumn[]
): Record<string, string> {
  const series = row.series ?? [];
  const pos = row.positions ?? [];
  const kneel = pos.find((p) => p.position === 'kneeling');
  const prone = pos.find((p) => p.position === 'prone');
  const stand = pos.find((p) => p.position === 'standing');

  const cells: Record<string, string> = {
    place: String(row.place),
    name: truncate(
      `${row.shooterName}${row.isProvisional ? ' (P)' : ''}${row.isVeteran ? ' Vet' : ''}`,
      22
    ),
    club: truncate(row.club || '—', 16),
    cat: row.category + (row.isVeteran ? ' V' : ''),
    total: formatEventResultTotal(row, discipline),
  };

  if (kneel) {
    cells.kneel = formatPositionCell(
      kneel.decimalTotal,
      kneel.integerTotal,
      discipline,
      row.stage
    );
  }
  if (prone) {
    cells.prone = formatPositionCell(prone.decimalTotal, prone.integerTotal, discipline, row.stage);
  }
  if (stand) {
    cells.stand = formatPositionCell(stand.decimalTotal, stand.integerTotal, discipline, row.stage);
  }

  for (let i = 0; i < 6; i++) {
    cells[`s${i + 1}`] = formatSeriesScoreDisplay(series[i], discipline, row.stage);
  }

  for (const col of columns) {
    if (!cells[col.key]) cells[col.key] = '—';
  }

  return cells;
}

function drawTable(
  doc: PdfDoc,
  state: { y: number },
  title: string,
  rows: EventResultRow[],
  discipline: Discipline
) {
  if (rows.length === 0) return;

  const columns = buildColumns(discipline, rows);
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);

  const ensureSpace = (needed: number) => {
    if (state.y + needed <= BOTTOM) return;
    doc.addPage({ size: 'A4', layout: 'landscape', margin: MARGIN });
    state.y = MARGIN;
  };

  ensureSpace(ROW_H * 3);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a365d');
  doc.text(title, MARGIN, state.y);
  state.y += HEADER_H;

  const drawHeader = () => {
    let x = MARGIN;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
    doc.rect(MARGIN, state.y, tableWidth, ROW_H).fill('#2d6a4f');
    for (const col of columns) {
      doc.fillColor('#ffffff');
      const text = col.align === 'right' ? col.label : col.label;
      if (col.align === 'right') {
        doc.text(text, x, state.y + 3, { width: col.width - 4, align: 'right' });
      } else {
        doc.text(text, x + 4, state.y + 3, { width: col.width - 4 });
      }
      x += col.width;
    }
    state.y += ROW_H;
  };

  drawHeader();

  doc.font('Helvetica').fontSize(8).fillColor('#000000');
  rows.forEach((row, idx) => {
    ensureSpace(ROW_H + 2);
    if (state.y + ROW_H > BOTTOM) {
      drawHeader();
    }

    const cells = rowCells(row, discipline, columns);
    let x = MARGIN;
    if (idx % 2 === 1) {
      doc.rect(MARGIN, state.y, tableWidth, ROW_H).fill('#f7fafc');
      doc.fillColor('#000000');
    }

    for (const col of columns) {
      const val = cells[col.key] ?? '—';
      if (col.align === 'right') {
        doc.text(val, x, state.y + 3, { width: col.width - 4, align: 'right' });
      } else {
        doc.text(val, x + 4, state.y + 3, { width: col.width - 4 });
      }
      x += col.width;
    }
    state.y += ROW_H;
  });

  state.y += 12;
}

export function generateEventResultsPdf(input: EventResultsPdfInput): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const PDFDocument = (await import('pdfkit')).default;

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: `${input.eventName} — Results`,
        Author: 'SATRF',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const state = { y: MARGIN };

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1a365d');
    doc.text('SATRF — Match Results', MARGIN, state.y);
    state.y += 22;

    doc.font('Helvetica-Bold').fontSize(13).fillColor('#000000');
    doc.text(input.eventName, MARGIN, state.y);
    state.y += 18;

    doc.font('Helvetica').fontSize(10).fillColor('#444444');
    const meta = [
      DISCIPLINES[input.discipline]?.label ?? input.discipline,
      categoryLabel(input.category),
      input.date ? formatDate(input.date) : null,
    ]
      .filter(Boolean)
      .join(' · ');
    doc.text(meta, MARGIN, state.y);
    state.y += 20;

    const podiumSource =
      input.hasFinal && input.final && input.final.length > 0
        ? input.final
        : input.qualification;
    const podium = podiumSource.slice(0, 3);

    if (podium.length > 0) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a365d');
      doc.text('Top 3', MARGIN, state.y);
      state.y += 14;
      doc.font('Helvetica').fontSize(9).fillColor('#000000');
      for (const row of podium) {
        doc.text(
          `${row.place}. ${row.shooterName} — ${formatEventResultTotal(row, input.discipline)}`,
          MARGIN,
          state.y
        );
        state.y += 12;
      }
      state.y += 8;
    }

    const hasAnyRows =
      (input.qualification?.length ?? 0) > 0 || (input.final?.length ?? 0) > 0;

    if (!hasAnyRows) {
      doc.font('Helvetica').fontSize(11).fillColor('#666666');
      doc.text('Results not published yet.', MARGIN, state.y);
    } else {
      if (input.hasFinal && input.final && input.final.length > 0) {
        drawTable(doc, state, 'Final', input.final, input.discipline);
      }
      if (input.qualification.length > 0) {
        drawTable(doc, state, 'Qualification', input.qualification, input.discipline);
      }
    }

    doc.font('Helvetica').fontSize(7).fillColor('#999999');
    doc.text(
      `Generated ${new Date().toLocaleString('en-ZA')} · satrf.org.za`,
      MARGIN,
      PAGE_H - MARGIN - 10,
      { width: PAGE_W - MARGIN * 2, align: 'center' }
    );

    doc.end();
  });
}
