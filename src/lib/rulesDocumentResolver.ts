import { issfRuleDocuments, type IssfRuleDocument } from '@/data/issf-rules';
import { isLocalAsset, stripHash } from '@/lib/rulesDownloads';

export type ResolvedRulesDocument = {
  id: string;
  title: string;
  section: string;
  localPath: string;
  status: 'current' | 'superseded' | 'reference';
  edition?: string;
  effectiveDate?: string;
  officialUrl?: string;
};

const DANGEROUS_INPUT =
  /\.\.|\\|%2e%2e|%5c|\0|^https?:|^file:|^\/\/|^[a-z]:[\\/]/i;

/** Reject attacker-controlled path syntax before catalogue lookup. */
export function isSuspiciousRulesPathInput(input: string): boolean {
  const raw = input.trim();
  if (!raw) return true;
  if (raw.includes('?') || raw.includes('#')) return true;
  return DANGEROUS_INPUT.test(raw) || DANGEROUS_INPUT.test(raw.toLowerCase());
}

function toResolved(doc: IssfRuleDocument): ResolvedRulesDocument | null {
  if (!doc.localPath) return null;
  return {
    id: doc.id,
    title: doc.title,
    section: doc.section,
    localPath: doc.localPath,
    status: doc.status ?? 'reference',
    edition: doc.edition,
    effectiveDate: doc.effectiveDate,
    officialUrl: doc.webUrl || doc.pdfUrl,
  };
}

/** Exact catalogue match on localPath — no prefix-only validation. */
export function resolveRulesDocumentByPath(
  requestedPath: string | null | undefined,
): ResolvedRulesDocument | null {
  if (!requestedPath || typeof requestedPath !== 'string') return null;
  const clean = stripHash(requestedPath.trim());
  if (isSuspiciousRulesPathInput(clean)) return null;
  if (!isLocalAsset(clean)) return null;
  if (!clean.toLowerCase().endsWith('.pdf')) return null;
  const match = issfRuleDocuments.find((doc) => doc.localPath === clean);
  return match ? toResolved(match) : null;
}

export function resolveRulesDocumentById(
  documentId: string | null | undefined,
): ResolvedRulesDocument | null {
  if (!documentId || typeof documentId !== 'string') return null;
  const id = documentId.trim();
  if (!id || isSuspiciousRulesPathInput(id)) return null;
  const match = issfRuleDocuments.find((doc) => doc.id === id);
  return match ? toResolved(match) : null;
}

/** Prefer document ID; fall back to legacy exact path match. */
export function resolveRulesDocument(opts: {
  documentId?: string | null;
  requestedPath?: string | null;
}): ResolvedRulesDocument | null {
  if (opts.documentId) {
    const byId = resolveRulesDocumentById(opts.documentId);
    if (byId) return byId;
  }
  if (opts.requestedPath) {
    return resolveRulesDocumentByPath(opts.requestedPath);
  }
  return null;
}

export function findDocumentIdByLocalPath(localPath: string): string | null {
  return resolveRulesDocumentByPath(localPath)?.id ?? null;
}

export function getCurrentRulebookDocument(): ResolvedRulesDocument | null {
  return (
    issfRuleDocuments
      .filter((doc) => doc.status === 'current' && doc.localPath)
      .map((doc) => toResolved(doc))
      .find(Boolean) ?? null
  );
}

export function parseViewerPage(raw: string | string[] | undefined): number {
  const value = typeof raw === 'string' ? raw : '';
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.floor(n);
}

/** @deprecated Use resolveRulesDocumentByPath instead. */
export function isAllowedRulesPdfPath(href?: string | null): href is string {
  return resolveRulesDocumentByPath(href ?? '') !== null;
}
