import fs from 'fs';
import path from 'path';
import {
  downloadFileName,
  downloadLabelForDocument,
  formatFileSize,
  isLocalAsset,
  officialSourceHref,
  ruleViewerHref,
  stripHash,
} from '@/lib/rulesDownloads';
import { pdfPageHref, type RuleSearchEntry } from '@/lib/rulesSearch';
import { issfRuleDocuments } from '@/data/issf-rules';
import { RULES_INDEX_META } from '@/data/rulesIndexMeta';

const SECOND_PRINT =
  '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf';
const FIRST_PRINT =
  '/documents/issf/issf-rule-book-2026-edition-2025-first-print-12-2025-effective-1-january-2026.pdf';

describe('rules downloads', () => {
  it('keeps Open page fragments off Download hrefs', () => {
    const entry = {
      pdfUrl: SECOND_PRINT,
      page: 342,
    } as RuleSearchEntry;
    expect(pdfPageHref(entry)).toBe(`${SECOND_PRINT}#page=342`);
    expect(stripHash(pdfPageHref(entry))).toBe(SECOND_PRINT);
  });

  it('opens rules through the in-app viewer with document ID (mobile-safe)', () => {
    const href = ruleViewerHref({
      pdfUrl: SECOND_PRINT,
      page: 342,
      ruleNumber: '7.7.4',
      heading: 'Rifle Events Qualification Table',
    });
    expect(href.startsWith('/rules/view?')).toBe(true);
    const q = new URL(href, 'https://www.rifleshooting.co.za').searchParams;
    expect(q.get('document')).toBe(
      'issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026',
    );
    expect(q.get('file')).toBeNull();
    expect(q.get('page')).toBe('342');
    expect(q.get('rule')).toBe('7.7.4');
    expect(href).not.toContain('#page=');
  });

  it('labels complete rulebook downloads, not individual rule numbers', () => {
    expect(downloadLabelForDocument('ISSF Rule Book 2026')).toBe('Download Rule Book');
    expect(downloadLabelForDocument('Rifle Equipment Control Guide Edition 2026')).toBe(
      'Download PDF',
    );
  });

  it('only applies the download attribute to same-origin files', () => {
    expect(isLocalAsset(SECOND_PRINT)).toBe(true);
    expect(isLocalAsset('https://backoffice.issf-sports.org/getfile.aspx?file=x.pdf')).toBe(false);
    expect(downloadFileName(SECOND_PRINT)).toContain('second-print');
  });

  it('prefers the official ISSF PDF URL when present', () => {
    expect(
      officialSourceHref({
        officialUrl: 'https://www.issf-sports.org/rules',
        officialPdfUrl: RULES_INDEX_META.currentRulebook.officialPdf,
      }),
    ).toBe(RULES_INDEX_META.currentRulebook.officialPdf);
  });

  it('formats file sizes', () => {
    expect(formatFileSize(8396505)).toBe('8.0 MB');
  });

  it('does not use First Print as the current rulebook path', () => {
    expect(RULES_INDEX_META.currentRulebook.localPath).toBe(SECOND_PRINT);
    expect(RULES_INDEX_META.currentRulebook.localPath).not.toBe(FIRST_PRINT);
  });

  it('has no broken local PDF paths', () => {
    const missing = issfRuleDocuments
      .filter((doc) => doc.localPath)
      .filter((doc) => {
        const abs = path.join(process.cwd(), 'public', doc.localPath!.replace(/^\//, ''));
        return !fs.existsSync(abs);
      })
      .map((doc) => doc.localPath);
    expect(missing).toEqual([]);
  });
});
