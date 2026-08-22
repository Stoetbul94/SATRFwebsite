import type {
  EventDocumentStatus,
  EventDocumentType,
  PublicEventDocument,
  SerializedEventDocument,
} from '@/lib/eventDocuments/types';

const toIso = (value: unknown): string | null => {
  if (!value) return null;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return null;
};

const DOCUMENT_TYPES: EventDocumentType[] = [
  'call-for-entries',
  'programme',
  'range-instructions',
  'results',
  'other',
];

const DOCUMENT_STATUSES: EventDocumentStatus[] = ['draft', 'published', 'archived'];

export function parseEventDocumentType(value: unknown): EventDocumentType {
  const raw = String(value || 'other');
  return DOCUMENT_TYPES.includes(raw as EventDocumentType)
    ? (raw as EventDocumentType)
    : 'other';
}

export function parseEventDocumentStatus(value: unknown): EventDocumentStatus {
  const raw = String(value || 'draft');
  return DOCUMENT_STATUSES.includes(raw as EventDocumentStatus)
    ? (raw as EventDocumentStatus)
    : 'draft';
}

export function serializeEventDocument(
  id: string,
  data: Record<string, unknown>,
): SerializedEventDocument {
  const linkedEventIds = Array.isArray(data.linkedEventIds)
    ? data.linkedEventIds.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : typeof data.eventId === 'string'
      ? [data.eventId]
      : [];

  return {
    id,
    eventId: linkedEventIds[0] || String(data.eventId || ''),
    linkedEventIds,
    type: parseEventDocumentType(data.type),
    title: String(data.title || ''),
    status: parseEventDocumentStatus(data.status),
    version: Number(data.version) || 1,
    fileUrl: typeof data.fileUrl === 'string' ? data.fileUrl : null,
    storagePath: typeof data.storagePath === 'string' ? data.storagePath : null,
    downloadFileName:
      typeof data.downloadFileName === 'string' ? data.downloadFileName : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    publishedAt: toIso(data.publishedAt),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
    generatedFromEventUpdatedAt: toIso(data.generatedFromEventUpdatedAt),
    metadata:
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as SerializedEventDocument['metadata'])
        : undefined,
  };
}

export function toPublicEventDocument(doc: SerializedEventDocument): PublicEventDocument | null {
  if (doc.status !== 'published' || !doc.fileUrl) return null;
  return {
    id: doc.id,
    type: doc.type,
    title: doc.title,
    fileUrl: doc.fileUrl,
    publishedAt: doc.publishedAt ?? null,
    downloadFileName: doc.downloadFileName || `${doc.id}.pdf`,
    version: doc.version,
  };
}

export const DOCUMENT_TYPE_SORT: Record<EventDocumentType, number> = {
  'call-for-entries': 0,
  programme: 1,
  'range-instructions': 2,
  results: 3,
  other: 4,
};

export function sortPublicDocuments(docs: PublicEventDocument[]): PublicEventDocument[] {
  return [...docs].sort((a, b) => {
    const typeDiff = DOCUMENT_TYPE_SORT[a.type] - DOCUMENT_TYPE_SORT[b.type];
    if (typeDiff !== 0) return typeDiff;
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function filterPublishedDocuments(
  docs: SerializedEventDocument[],
): PublicEventDocument[] {
  return sortPublicDocuments(
    docs.map(toPublicEventDocument).filter((doc): doc is PublicEventDocument => doc !== null),
  );
}
