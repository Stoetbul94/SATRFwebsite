/** Helpers for Open vs Download vs official ISSF links. */

export function stripHash(href: string) {
  return href.split('#')[0];
}

export function isLocalAsset(href?: string | null): href is string {
  return Boolean(href && href.startsWith('/') && !href.startsWith('//'));
}

export function downloadFileName(href: string, fallback = 'document.pdf') {
  const base = stripHash(href).split('/').pop();
  return base && base.includes('.') ? base : fallback;
}

export function downloadLabelForDocument(title: string) {
  return /rule book/i.test(title) ? 'Download Rule Book' : 'Download PDF';
}

export function formatFileSize(bytes?: number) {
  if (!bytes || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function officialSourceHref(entry: { officialPdfUrl?: string; officialUrl?: string }) {
  return entry.officialPdfUrl || entry.officialUrl || '';
}

/** Only allow same-origin ISSF mirrors — prevents open-redirect via ?file=. */
export function isAllowedRulesPdfPath(href?: string | null): href is string {
  if (!isLocalAsset(href)) return false;
  const clean = stripHash(href);
  return clean.startsWith('/documents/issf/') && clean.toLowerCase().endsWith('.pdf');
}

/**
 * In-app viewer URL. Mobile Safari / Android / PWA native PDF viewers ignore `#page=`,
 * so Open should use this instead of a raw PDF hash link.
 */
export function ruleViewerHref(opts: {
  pdfUrl: string;
  page?: number;
  ruleNumber?: string;
  heading?: string;
}) {
  const file = stripHash(opts.pdfUrl);
  if (!isAllowedRulesPdfPath(file)) {
    return opts.page ? `${file}#page=${opts.page}` : file;
  }
  const params = new URLSearchParams({ file });
  if (opts.page && opts.page > 0) params.set('page', String(opts.page));
  if (opts.ruleNumber) params.set('rule', opts.ruleNumber);
  if (opts.heading) params.set('heading', opts.heading.slice(0, 120));
  return `/rules/view?${params.toString()}`;
}
