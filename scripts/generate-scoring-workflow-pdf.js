/**
 * Generate docs/SCORING_WORKFLOW.pdf from docs/SCORING_WORKFLOW.md
 * Run: node scripts/generate-scoring-workflow-pdf.js
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const ROOT = path.join(__dirname, '..');
const MD_PATH = path.join(ROOT, 'docs', 'SCORING_WORKFLOW.md');
const PDF_PATH = path.join(ROOT, 'docs', 'SCORING_WORKFLOW.pdf');

const PAGE_WIDTH = 595.28; // A4
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function writePdf(md) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: 'SATRF Scoring Workflow',
      Author: 'SATRF',
    },
  });

  const stream = fs.createWriteStream(PDF_PATH);
  doc.pipe(stream);

  const lines = md.split(/\r?\n/);
  let inCode = false;
  let codeLang = '';
  let codeLines = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9);
    for (const row of tableRows) {
      const text = row.join(' | ');
      doc.text(text, { width: CONTENT_WIDTH });
    }
    doc.moveDown(0.5);
    tableRows = [];
    inTable = false;
  };

  const flushCode = () => {
    if (codeLines.length === 0) return;
    if (codeLang === 'mermaid') {
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#444444');
      doc.text('(Flow diagram — see SCORING_WORKFLOW.md in the repo for the full chart.)', {
        width: CONTENT_WIDTH,
      });
      doc.fillColor('#000000');
    } else {
      doc.font('Courier').fontSize(8).fillColor('#222222');
      doc.text(codeLines.join('\n'), { width: CONTENT_WIDTH });
      doc.fillColor('#000000');
    }
    doc.moveDown(0.5);
    codeLines = [];
    inCode = false;
    codeLang = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        flushCode();
      } else {
        flushTable();
        inCode = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      if (!inTable) {
        doc.moveDown(0.2);
        inTable = true;
      }
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) continue;
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.trim() === '---') {
      doc.moveDown(0.5);
      continue;
    }

    if (line.startsWith('# ')) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(18).text(line.slice(2).trim(), { width: CONTENT_WIDTH });
      doc.moveDown(0.4);
      continue;
    }
    if (line.startsWith('## ')) {
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(14).text(line.slice(3).trim(), { width: CONTENT_WIDTH });
      doc.moveDown(0.3);
      continue;
    }
    if (line.startsWith('### ')) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(11).text(line.slice(4).trim(), { width: CONTENT_WIDTH });
      doc.moveDown(0.2);
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      doc.font('Helvetica').fontSize(10).text('• ' + stripMd(line.slice(2)), { width: CONTENT_WIDTH, indent: 12 });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      doc.font('Helvetica').fontSize(10).text(stripMd(line), { width: CONTENT_WIDTH, indent: 12 });
      continue;
    }

    if (line.trim() === '') {
      doc.moveDown(0.35);
      continue;
    }

    doc.font('Helvetica').fontSize(10).text(stripMd(line), { width: CONTENT_WIDTH });
  }

  flushCode();
  flushTable();
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(PDF_PATH));
    stream.on('error', reject);
  });
}

function stripMd(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

async function main() {
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const out = await writePdf(md);
  console.log('Wrote', out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
