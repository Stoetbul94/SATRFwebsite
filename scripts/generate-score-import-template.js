/**
 * Generates public/templates/SATRF_Score_Import.xlsx — keep in sync with docs/IMPORT_SPEC.md
 * and src/lib/excelImport.ts.
 *
 * Run: node scripts/generate-score-import-template.js
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'public', 'templates');
const OUT_FILE = path.join(OUT_DIR, 'SATRF_Score_Import.xlsx');
const DOCS_COPY = path.join(__dirname, '..', 'docs', 'templates', 'SATRF_Match_Template.xlsx');

function sheetFromRows(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const colCount = Math.max(...rows.map((r) => r.length));
  ws['!cols'] = Array.from({ length: colCount }, () => ({ wch: 14 }));
  return ws;
}

function buildInstructions() {
  return [
    ['SATRF Score Import — Instructions'],
    [''],
    ['1. Select the match event on the admin Import page before uploading this workbook.'],
    ['2. Fill only the sheets you need (Prone 50m, F-Class, 3-Position 50m, Prone Final, 3P Final).'],
    ['3. Re-uploading the same shooter + event + discipline + stage REPLACES the previous score (no duplicates).'],
    ['4. Total / Rank / Check columns are for your reference only — the site recalculates everything.'],
    ['5. Ring (Int) columns are optional but recommended for 3-Position and F-Class qualification.'],
    ['6. Veteran Y/N: Y marks a veteran shooter in the Open category (category stays open).'],
    [''],
    ['Column guide:'],
    ['  Prone / F-Class qual: S1 Dec … S6 Dec (required), S1 Int … S6 Int (optional ring counts)'],
    ['  3-Position qual: Kneeling/Prone/Standing Dec (required), matching Int columns (optional rings)'],
    ['  Prone Final: header row 3, S1 … S6 decimals'],
    ['  3P Final: header row 3, Kn S1/S2, Pr S1/S2, St S1/S2 + Elim 1 … Elim 5'],
  ];
}

const QUAL_ID_COLS = [
  'Date (YYYY-MM-DD)',
  'Event Name',
  'Discipline',
  'Shooter Name',
  'Club',
  'Category',
  'Veteran Y/N',
];

function qualProneHeader() {
  return [
    ...QUAL_ID_COLS,
    'S1 Dec',
    'S2 Dec',
    'S3 Dec',
    'S4 Dec',
    'S5 Dec',
    'S6 Dec',
    'S1 Int',
    'S2 Int',
    'S3 Int',
    'S4 Int',
    'S5 Int',
    'S6 Int',
    'Total Dec',
    'Total Int',
    'Status',
    'Notes',
  ];
}

function qual3pHeader() {
  return [
    ...QUAL_ID_COLS,
    'Kneeling Dec',
    'Prone Dec',
    'Standing Dec',
    'Kneeling Int',
    'Prone Int',
    'Standing Int',
    'Total Dec',
    'Total Int',
    'Status',
    'Notes',
  ];
}

function buildProne50m() {
  const header = qualProneHeader();
  const rows = [
    header,
    [
      '2026-06-01',
      'SATRF Prone Championship',
      'prone_50m',
      'John Doe',
      'SATRF Club A',
      'open',
      'N',
      100.5,
      98.2,
      101.0,
      99.8,
      100.1,
      97.9,
      99,
      97,
      100,
      98,
      99,
      97,
      597.5,
      590,
      'official',
      '',
    ],
    [
      '2026-06-01',
      'SATRF Prone Championship',
      'prone_50m',
      'Jane Smith',
      'SATRF Club B',
      'junior',
      'N',
      95.2,
      97.8,
      96.5,
      98.1,
      94.9,
      97.3,
      94,
      96,
      95,
      97,
      93,
      96,
      579.8,
      571,
      'official',
      '',
    ],
  ];
  return sheetFromRows(rows);
}

function buildFClass() {
  const header = qualProneHeader();
  const rows = [
    header,
    [
      '2026-06-01',
      'SATRF F-Class Match',
      'fclass_open',
      'Pieter van Wyk',
      'Pretoria Rifle Club',
      'open',
      'Y',
      108.2,
      107.5,
      108.9,
      107.1,
      108.0,
      107.8,
      107,
      106,
      108,
      106,
      107,
      106,
      647.5,
      640,
      'official',
      '',
    ],
    [
      '2026-06-01',
      'SATRF F-Class Match',
      'fclass_tr',
      'Sarah Botha',
      'Cape Target Rifle',
      'ladies',
      'N',
      106.5,
      105.8,
      107.2,
      106.0,
      105.5,
      106.3,
      105,
      104,
      106,
      105,
      104,
      105,
      637.3,
      629,
      'official',
      '',
    ],
  ];
  return sheetFromRows(rows);
}

function build3Position50m() {
  const header = qual3pHeader();
  const rows = [
    header,
    [
      '2026-06-01',
      'SATRF 3P Championship',
      'three_position_50m',
      'Lerato Dlamini',
      'Johannesburg Rifle Club',
      'open',
      'N',
      191.2,
      203.1,
      157.4,
      185,
      198,
      141,
      551.7,
      524,
      'official',
      '',
    ],
    [
      '2026-06-01',
      'SATRF 3P Championship',
      'three_position_50m',
      'Thabo Mokoena',
      'Durban Rifle Club',
      'junior',
      'N',
      188.5,
      200.8,
      152.3,
      182,
      195,
      137,
      541.6,
      514,
      'official',
      '',
    ],
  ];
  return sheetFromRows(rows);
}

function buildProneFinal() {
  const rows = [
    [],
    [],
    ['Event Name', 'Shooter', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'Total', 'Final Rank', 'Status', 'Notes'],
    [
      'SATRF Prone Championship',
      'Arnold Prone',
      98.5,
      98.2,
      98.8,
      98.1,
      98.0,
      98.2,
      589.8,
      1,
      'official',
      '',
    ],
    [
      'SATRF Prone Championship',
      'John Doe',
      97.0,
      97.5,
      96.8,
      97.2,
      96.5,
      97.0,
      582.0,
      2,
      'official',
      '',
    ],
  ];
  return sheetFromRows(rows);
}

function build3pFinal() {
  const rows = [
    [],
    [],
    [
      'Event Name',
      'Shooter',
      'Kn S1',
      'Kn S2',
      'Pr S1',
      'Pr S2',
      'St S1',
      'St S2',
      'Elim 1',
      'Elim 2',
      'Elim 3',
      'Elim 4',
      'Elim 5',
      'Total',
      'Final Rank',
      'Status',
    ],
    [
      'SATRF 3P Championship',
      'Lerato Dlamini',
      98.5,
      98.2,
      99.1,
      98.8,
      97.5,
      97.2,
      10.5,
      10.3,
      10.1,
      9.8,
      9.5,
      599.5,
      1,
      'official',
    ],
    [
      'SATRF 3P Championship',
      'Thabo Mokoena',
      97.0,
      96.8,
      98.0,
      97.5,
      96.0,
      95.8,
      10.2,
      10.0,
      9.7,
      '',
      '',
      590.0,
      2,
      'official',
    ],
  ];
  return sheetFromRows(rows);
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromRows(buildInstructions()), 'Instructions');
  XLSX.utils.book_append_sheet(wb, buildProne50m(), 'Prone 50m');
  XLSX.utils.book_append_sheet(wb, buildFClass(), 'F-Class');
  XLSX.utils.book_append_sheet(wb, build3Position50m(), '3-Position 50m');
  XLSX.utils.book_append_sheet(wb, buildProneFinal(), 'Prone Final');
  XLSX.utils.book_append_sheet(wb, build3pFinal(), '3P Final');

  XLSX.writeFile(wb, OUT_FILE);
  console.log(`Wrote ${OUT_FILE}`);

  const docsDir = path.dirname(DOCS_COPY);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.copyFileSync(OUT_FILE, DOCS_COPY);
  console.log(`Copied to ${DOCS_COPY}`);
}

main();
