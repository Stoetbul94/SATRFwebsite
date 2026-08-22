import path from 'node:path';
import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import { getSiteUrl } from '@/lib/siteUrl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

const NAVY = '#1a365d';
const GREEN = '#2d6a4f';
const MUTED = '#4a5568';
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const BOTTOM = PAGE_H - MARGIN;

function ensureSpace(doc: PdfDoc, y: number, needed: number): number {
  if (y + needed <= BOTTOM) return y;
  doc.addPage({ size: 'A4', margin: MARGIN });
  return MARGIN;
}

function drawDivider(doc: PdfDoc, y: number): number {
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor('#cbd5e0').lineWidth(1).stroke();
  return y + 16;
}

function writeParagraph(doc: PdfDoc, text: string, x: number, y: number, width: number): number {
  doc.font('Helvetica').fontSize(10).fillColor('#1a202c');
  doc.text(text, x, y, { width, lineGap: 2 });
  return doc.y + 8;
}

export async function generateCallForEntriesPdf(data: CallForEntriesData): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  const logoPath = path.join(process.cwd(), 'public', 'brand', 'satrf-emblem-transparent.png');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = MARGIN;

    try {
      doc.image(logoPath, MARGIN, y, { fit: [56, 56] });
    } catch {
      /* logo optional in test env */
    }

    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY);
    doc.text('SOUTH AFRICAN TARGET RIFLE FEDERATION', MARGIN + 68, y + 6, {
      width: PAGE_W - MARGIN * 2 - 68,
    });
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    doc.text('Target Rifle Shooting', MARGIN + 68, y + 22);
    y += 64;

    doc.font('Helvetica-Bold').fontSize(20).fillColor(GREEN);
    doc.text('CALL FOR ENTRIES', MARGIN, y);
    y += 28;
    doc.font('Helvetica-Bold').fontSize(14).fillColor(NAVY);
    doc.text(data.documentTitle, MARGIN, y);
    y += 24;
    y = drawDivider(doc, y);

    data.events.forEach((event, index) => {
      y = ensureSpace(doc, y, 120);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(GREEN);
      doc.text(`EVENT ${index + 1}`, MARGIN, y);
      y += 16;
      doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY);
      doc.text(event.disciplineLabel, MARGIN, y);
      y += 18;
      doc.font('Helvetica').fontSize(11).fillColor('#1a202c');
      doc.text(event.dateLabel, MARGIN, y);
      y += 14;
      if (event.startTime) {
        doc.text(`Start time: ${event.startTime}`, MARGIN, y);
        y += 14;
      }
      if (event.equipmentInspectionTime) {
        doc.text(`Equipment inspection: ${event.equipmentInspectionTime}`, MARGIN, y);
        y += 14;
      }
      doc.text(event.venue, MARGIN, y, { width: PAGE_W - MARGIN * 2 });
      y = doc.y + 8;
      if (event.registrationDeadlineLabel) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
        doc.text(`Entries close: ${event.registrationDeadlineLabel}`, MARGIN, y);
        y += 16;
      }
      y = drawDivider(doc, y);
    });

    y = ensureSpace(doc, y, 160);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(GREEN);
    doc.text('ENTRY INFORMATION', MARGIN, y);
    y += 18;

    if (data.entryFeeLabel) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
      doc.text('Entry fee', MARGIN, y);
      y += 14;
      y = writeParagraph(doc, data.entryFeeLabel, MARGIN, y, PAGE_W - MARGIN * 2);
    }

    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
    doc.text('Registration', MARGIN, y);
    y += 14;
    y = writeParagraph(
      doc,
      data.registrationInfo || `Register online at ${getSiteUrl()}`,
      MARGIN,
      y,
      PAGE_W - MARGIN * 2,
    );

    data.events.forEach((event) => {
      doc.font('Helvetica').fontSize(9).fillColor(GREEN);
      doc.text(`• ${event.title}: ${event.eventUrl}`, MARGIN + 8, y, {
        width: PAGE_W - MARGIN * 2 - 8,
        link: event.eventUrl,
        underline: true,
      });
      y = doc.y + 4;
    });
    y += 8;

    if (data.paymentInfo?.trim()) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
      doc.text('Payment information', MARGIN, y);
      y += 14;
      y = writeParagraph(doc, data.paymentInfo.trim(), MARGIN, y, PAGE_W - MARGIN * 2);
    }

    const contactLines = [
      data.contactName,
      data.contactPhone,
      data.contactEmail,
    ].filter(Boolean);
    if (contactLines.length) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
      doc.text('Contact', MARGIN, y);
      y += 14;
      y = writeParagraph(doc, contactLines.join('\n'), MARGIN, y, PAGE_W - MARGIN * 2);
    }

    if (data.mapDirections?.trim()) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
      doc.text('Directions', MARGIN, y);
      y += 14;
      y = writeParagraph(doc, data.mapDirections.trim(), MARGIN, y, PAGE_W - MARGIN * 2);
    }

    if (data.additionalNotes?.trim()) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
      doc.text('Additional notes', MARGIN, y);
      y += 14;
      y = writeParagraph(doc, data.additionalNotes.trim(), MARGIN, y, PAGE_W - MARGIN * 2);
    }

    doc.font('Helvetica').fontSize(8).fillColor(MUTED);
    doc.text(getSiteUrl().replace(/^https:\/\//, 'www.'), MARGIN, BOTTOM - 10, {
      width: PAGE_W - MARGIN * 2,
      align: 'center',
      link: getSiteUrl(),
    });

    doc.end();
  });
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString('utf8') === '%PDF';
}
