import type { EventHubDocument } from '@/lib/eventHub/types';
import type { PublicEventDocument } from '@/lib/eventDocuments/types';

const DOC_TYPES = new Set([
  'call-for-entries',
  'programme',
  'range-instructions',
  'results',
  'other',
]);

/**
 * Reads optional event documents from raw API/Firestore data if present.
 * Phase 1: most events have none — section stays hidden.
 *
 * Phase 2 recommendation: `events/{eventId}/documents/{documentId}` subcollection
 * mirroring existing admin + Storage patterns used for cover images.
 */
export function parseEventDocuments(
  eventId: string,
  raw: Record<string, unknown> | null | undefined,
): EventHubDocument[] {
  if (!raw || !Array.isArray(raw.documents)) return [];

  return raw.documents
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const doc = item as Record<string, unknown>;
      const fileUrl = typeof doc.fileUrl === 'string' ? doc.fileUrl : '';
      const title = typeof doc.title === 'string' ? doc.title.trim() : '';
      if (!fileUrl || !title) return null;
      const typeRaw = typeof doc.type === 'string' ? doc.type : 'other';
      const type = DOC_TYPES.has(typeRaw) ? (typeRaw as EventHubDocument['type']) : 'other';
      const status = doc.status === 'draft' ? 'draft' : 'published';
      if (status === 'draft') return null;
      return {
        id: String(doc.id || `${eventId}-doc-${index}`),
        eventId,
        type,
        title,
        fileUrl,
        publishedAt:
          typeof doc.publishedAt === 'string'
            ? doc.publishedAt
            : typeof doc.publishedAt === 'object' && doc.publishedAt !== null
              ? String(doc.publishedAt)
              : null,
        status,
      } satisfies EventHubDocument;
    })
    .filter(Boolean) as EventHubDocument[];
}

export function mapPublicDocumentsToHub(
  eventId: string,
  docs: PublicEventDocument[],
): EventHubDocument[] {
  return docs.map((doc) => ({
    id: doc.id,
    eventId,
    type: doc.type,
    title: doc.title,
    fileUrl: doc.fileUrl,
    publishedAt: doc.publishedAt,
    status: 'published',
    downloadFileName: doc.downloadFileName,
  }));
}
