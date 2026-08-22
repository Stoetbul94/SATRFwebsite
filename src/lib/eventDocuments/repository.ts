import { Timestamp, type Firestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import { CALL_FOR_ENTRIES_TEMPLATE_VERSION } from '@/lib/eventDocuments/callForEntries/types';
import { buildDownloadFileName } from '@/lib/eventDocuments/staleCheck';
import {
  createPublishedReadUrl,
  deleteEventDocumentStorageObject,
  uploadEventDocumentPdf,
} from '@/lib/eventDocuments/storage';
import { generateCallForEntriesPdf } from '@/lib/eventDocuments/callForEntries/pdf';
import {
  computeNextDocumentVersion,
  selectDocumentsToArchiveOnPublish,
  type DocumentVersionCandidate,
} from '@/lib/eventDocuments/publishSemantics';
import {
  filterPublishedDocuments,
  serializeEventDocument,
} from '@/lib/eventDocuments/serialize';
import type { SerializedEventDocument } from '@/lib/eventDocuments/types';

const COLLECTION = 'eventDocuments';

function collection(db: Firestore) {
  return db.collection(COLLECTION);
}

function toCandidate(doc: QueryDocumentSnapshot): DocumentVersionCandidate {
  const data = doc.data();
  const linkedEventIds = Array.isArray(data.linkedEventIds)
    ? data.linkedEventIds.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    id: doc.id,
    linkedEventIds,
    type: String(data.type || 'other'),
    status: String(data.status || 'draft'),
    version: Number(data.version) || 0,
  };
}

/**
 * Load unique eventDocuments that reference ANY of the given event IDs.
 * Uses per-event array-contains queries (de-duped) — correct for multi-event
 * Call for Entries and avoids relying on linkedEventIds[0].
 */
export async function loadDocumentsIntersectingEvents(
  db: Firestore,
  eventIds: string[],
  options: { type?: string; status?: string } = {},
): Promise<QueryDocumentSnapshot[]> {
  const uniqueEventIds = Array.from(new Set(eventIds.filter(Boolean)));
  const byId = new Map<string, QueryDocumentSnapshot>();

  await Promise.all(
    uniqueEventIds.map(async (eventId) => {
      let query = collection(db).where('linkedEventIds', 'array-contains', eventId);
      if (options.type) {
        query = query.where('type', '==', options.type);
      }
      if (options.status) {
        query = query.where('status', '==', options.status);
      }
      const snap = await query.get();
      snap.docs.forEach((doc) => byId.set(doc.id, doc));
    }),
  );

  return Array.from(byId.values());
}

export async function listDocumentsForEvent(
  db: Firestore,
  eventId: string,
  options: { includeDrafts?: boolean } = {},
): Promise<SerializedEventDocument[]> {
  const snap = await collection(db).where('linkedEventIds', 'array-contains', eventId).get();
  const docs = snap.docs.map((doc) => serializeEventDocument(doc.id, doc.data()));

  if (options.includeDrafts) {
    return docs.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  return filterPublishedDocuments(docs) as unknown as SerializedEventDocument[];
}

export async function listPublishedDocumentsForEvent(db: Firestore, eventId: string) {
  const snap = await collection(db)
    .where('linkedEventIds', 'array-contains', eventId)
    .where('status', '==', 'published')
    .get();

  const docs = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const serialized = serializeEventDocument(docSnap.id, docSnap.data());
      if (!serialized.storagePath) return serialized;
      try {
        const freshUrl = await createPublishedReadUrl(serialized.storagePath);
        return { ...serialized, fileUrl: freshUrl };
      } catch {
        return serialized;
      }
    }),
  );

  return filterPublishedDocuments(docs);
}

export async function getEventDocument(
  db: Firestore,
  documentId: string,
): Promise<SerializedEventDocument | null> {
  const doc = await collection(db).doc(documentId).get();
  if (!doc.exists) return null;
  return serializeEventDocument(doc.id, doc.data() as Record<string, unknown>);
}

/**
 * Max Call for Entries version among documents intersecting ANY linked event.
 */
export async function getLatestDocumentVersion(
  db: Firestore,
  linkedEventIds: string[],
  type: string,
): Promise<number> {
  if (!linkedEventIds.length) return 0;
  const snaps = await loadDocumentsIntersectingEvents(db, linkedEventIds, { type });
  return (
    computeNextDocumentVersion({
      linkedEventIds,
      type,
      candidates: snaps.map(toCandidate),
    }) - 1
  );
}

export async function createCallForEntriesDraft(input: {
  db: Firestore;
  data: CallForEntriesData;
  createdBy?: string | null;
  linkedEventUpdatedAt: Record<string, string | null | undefined>;
}): Promise<SerializedEventDocument> {
  const nextVersion =
    (await getLatestDocumentVersion(input.db, input.data.linkedEventIds, 'call-for-entries')) + 1;

  const docRef = collection(input.db).doc();
  const pdfBuffer = await generateCallForEntriesPdf(input.data);
  const { storagePath } = await uploadEventDocumentPdf({
    documentId: docRef.id,
    version: nextVersion,
    type: 'call-for-entries',
    buffer: pdfBuffer,
    includeDraftSignedUrl: false,
  });

  const now = Timestamp.now();
  const generatedFromEventUpdatedAt = Object.values(input.linkedEventUpdatedAt)
    .filter(Boolean)
    .map((value) => new Date(String(value)).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0];

  const payload = {
    eventId: input.data.linkedEventIds[0],
    linkedEventIds: input.data.linkedEventIds,
    type: 'call-for-entries',
    title: input.data.documentTitle,
    status: 'draft',
    version: nextVersion,
    // Drafts intentionally omit durable public fileUrl — admin uses signed file API.
    fileUrl: null,
    storagePath,
    downloadFileName: buildDownloadFileName(input.data, nextVersion),
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy ?? null,
    generatedFromEventUpdatedAt: generatedFromEventUpdatedAt
      ? Timestamp.fromMillis(generatedFromEventUpdatedAt)
      : now,
    metadata: {
      templateVersion: CALL_FOR_ENTRIES_TEMPLATE_VERSION,
      generatedFromEvent: true,
    },
  };

  await docRef.set(payload);
  return serializeEventDocument(docRef.id, payload);
}

/**
 * Atomic publish:
 * 1) find overlapping published docs across ALL linked events
 * 2) archive them + publish target in a single batch
 * 3) attach published signed URL
 * 4) for Call for Entries: enqueue idempotent in-app notification in the same batch
 */
export async function publishEventDocument(
  db: Firestore,
  documentId: string,
  options: { createdBy?: string | null } = {},
): Promise<SerializedEventDocument> {
  const doc = await getEventDocument(db, documentId);
  if (!doc) throw new Error('Document not found');
  if (doc.status === 'published') return doc;
  if (doc.status === 'archived') throw new Error('Archived documents cannot be published');
  if (!doc.storagePath) throw new Error('Document has no storage file');

  const overlapping = await loadDocumentsIntersectingEvents(db, doc.linkedEventIds, {
    type: doc.type,
    status: 'published',
  });

  const toArchive = selectDocumentsToArchiveOnPublish({
    publishingDocumentId: documentId,
    publishingLinkedEventIds: doc.linkedEventIds,
    publishingType: doc.type,
    candidates: overlapping.map(toCandidate),
  });

  const publishedUrl = await createPublishedReadUrl(doc.storagePath);
  const now = Timestamp.now();
  const batch = db.batch();

  toArchive.forEach((archiveId) => {
    batch.update(collection(db).doc(archiveId), {
      status: 'archived',
      updatedAt: now,
    });
  });

  batch.update(collection(db).doc(documentId), {
    status: 'published',
    publishedAt: now,
    updatedAt: now,
    fileUrl: publishedUrl,
  });

  if (doc.type === 'call-for-entries') {
    const { appendCallForEntriesPublishedNotification } = await import(
      '@/lib/notifications/callForEntriesTrigger'
    );
    await appendCallForEntriesPublishedNotification(batch, db, doc, options.createdBy);
  }

  await batch.commit();

  return (await getEventDocument(db, documentId)) as SerializedEventDocument;
}

export async function archiveEventDocument(
  db: Firestore,
  documentId: string,
): Promise<SerializedEventDocument> {
  const doc = await getEventDocument(db, documentId);
  if (!doc) throw new Error('Document not found');

  await collection(db).doc(documentId).update({
    status: 'archived',
    updatedAt: Timestamp.now(),
  });

  return (await getEventDocument(db, documentId)) as SerializedEventDocument;
}

export async function deleteDraftEventDocument(db: Firestore, documentId: string): Promise<void> {
  const doc = await getEventDocument(db, documentId);
  if (!doc) throw new Error('Document not found');
  if (doc.status !== 'draft') throw new Error('Only draft documents can be deleted');

  await deleteEventDocumentStorageObject(doc.storagePath);
  await collection(db).doc(documentId).delete();
}

export async function regenerateCallForEntriesDraft(input: {
  db: Firestore;
  documentId: string;
  data: CallForEntriesData;
  linkedEventUpdatedAt: Record<string, string | null | undefined>;
}): Promise<SerializedEventDocument> {
  const existing = await getEventDocument(input.db, input.documentId);
  if (!existing) throw new Error('Document not found');
  if (existing.status !== 'draft') {
    throw new Error('Only draft documents can be regenerated in place');
  }

  const pdfBuffer = await generateCallForEntriesPdf(input.data);
  const version = existing.version;

  if (existing.storagePath) {
    await deleteEventDocumentStorageObject(existing.storagePath);
  }

  const { storagePath } = await uploadEventDocumentPdf({
    documentId: input.documentId,
    version,
    type: 'call-for-entries',
    buffer: pdfBuffer,
    includeDraftSignedUrl: false,
  });

  const generatedFromEventUpdatedAt = Object.values(input.linkedEventUpdatedAt)
    .filter(Boolean)
    .map((value) => new Date(String(value)).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0];

  const now = Timestamp.now();
  await collection(input.db).doc(input.documentId).update({
    title: input.data.documentTitle,
    linkedEventIds: input.data.linkedEventIds,
    fileUrl: null,
    storagePath,
    downloadFileName: buildDownloadFileName(input.data, version),
    updatedAt: now,
    generatedFromEventUpdatedAt: generatedFromEventUpdatedAt
      ? Timestamp.fromMillis(generatedFromEventUpdatedAt)
      : now,
  });

  return (await getEventDocument(input.db, input.documentId)) as SerializedEventDocument;
}
