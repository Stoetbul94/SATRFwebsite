import type { EventDocumentStatus, EventDocumentType } from '@/lib/eventDocuments/types';

export type DocumentVersionCandidate = {
  id: string;
  linkedEventIds: string[];
  type: string;
  status: EventDocumentStatus | string;
  version: number;
};

/** True when two event-id lists share at least one id. */
export function linkedEventIdsIntersect(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false;
  const setB = new Set(b);
  return a.some((id) => setB.has(id));
}

/**
 * Call for Entries publish invariant:
 * When publishing a document linked to events L, archive every other currently
 * published document of the same type whose linkedEventIds intersect L.
 * Do not rely on linkedEventIds[0] alone.
 */
export function selectDocumentsToArchiveOnPublish(input: {
  publishingDocumentId: string;
  publishingLinkedEventIds: string[];
  publishingType: string;
  candidates: DocumentVersionCandidate[];
}): string[] {
  const linked = input.publishingLinkedEventIds;
  const archived = new Set<string>();

  for (const candidate of input.candidates) {
    if (candidate.id === input.publishingDocumentId) continue;
    if (candidate.type !== input.publishingType) continue;
    if (candidate.status !== 'published') continue;
    if (!linkedEventIdsIntersect(candidate.linkedEventIds, linked)) continue;
    archived.add(candidate.id);
  }

  return Array.from(archived);
}

/**
 * Next Call for Entries version =
 * 1 + max version among documents of the same type whose linkedEventIds
 * intersect ANY of the new linked events (any status).
 */
export function computeNextDocumentVersion(input: {
  linkedEventIds: string[];
  type: string;
  candidates: DocumentVersionCandidate[];
}): number {
  let max = 0;
  for (const candidate of input.candidates) {
    if (candidate.type !== input.type) continue;
    if (!linkedEventIdsIntersect(candidate.linkedEventIds, input.linkedEventIds)) continue;
    max = Math.max(max, Number(candidate.version) || 0);
  }
  return max + 1;
}

export function isPublishedCallForEntriesConflict(
  existing: { linkedEventIds: string[]; type: string; status: string },
  incoming: { linkedEventIds: string[]; type: EventDocumentType | string },
): boolean {
  return (
    existing.status === 'published' &&
    existing.type === incoming.type &&
    linkedEventIdsIntersect(existing.linkedEventIds, incoming.linkedEventIds)
  );
}
