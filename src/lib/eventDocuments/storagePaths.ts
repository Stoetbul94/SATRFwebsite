const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

/** Draft admin preview URLs — short-lived. Not stored on Firestore drafts. */
export const DRAFT_SIGNED_URL_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Published Event Hub URLs.
 * GCS V4 signed URLs max out at 7 days with service-account signing.
 * Archive does NOT cryptographically revoke previously issued signed URLs.
 */
export const PUBLISHED_SIGNED_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function assertSafeDocumentId(documentId: string): void {
  if (!SAFE_SEGMENT.test(documentId)) {
    throw new Error('Invalid document ID');
  }
}

export function assertSafeStoragePath(storagePath: string): void {
  if (
    !storagePath ||
    storagePath.includes('..') ||
    storagePath.startsWith('/') ||
    !storagePath.startsWith('eventDocuments/')
  ) {
    throw new Error('Invalid storage path');
  }
}

export function buildEventDocumentStoragePath(
  documentId: string,
  version: number,
  type: string,
): string {
  assertSafeDocumentId(documentId);
  const safeType = type.replace(/[^a-z0-9-]/gi, '') || 'document';
  return `eventDocuments/${documentId}/${safeType}-v${version}.pdf`;
}
