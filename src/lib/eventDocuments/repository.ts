import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import { CALL_FOR_ENTRIES_TEMPLATE_VERSION } from '@/lib/eventDocuments/callForEntries/types';
import { buildDownloadFileName } from '@/lib/eventDocuments/staleCheck';
import { uploadEventDocumentPdf } from '@/lib/eventDocuments/storage';
import { generateCallForEntriesPdf } from '@/lib/eventDocuments/callForEntries/pdf';
import {
  filterPublishedDocuments,
  serializeEventDocument,
} from '@/lib/eventDocuments/serialize';
import type { SerializedEventDocument } from '@/lib/eventDocuments/types';

const COLLECTION = 'eventDocuments';

function collection(db: Firestore) {
  return db.collection(COLLECTION);
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

  const docs = snap.docs.map((doc) => serializeEventDocument(doc.id, doc.data()));
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

export async function getLatestDocumentVersion(
  db: Firestore,
  linkedEventIds: string[],
  type: string,
): Promise<number> {
  const primaryEventId = linkedEventIds[0];
  if (!primaryEventId) return 0;

  const snap = await collection(db)
    .where('linkedEventIds', 'array-contains', primaryEventId)
    .where('type', '==', type)
    .get();

  return snap.docs.reduce((max, doc) => {
    const version = Number(doc.data().version) || 0;
    return Math.max(max, version);
  }, 0);
}

async function archivePublishedDocuments(
  db: Firestore,
  linkedEventIds: string[],
  type: string,
): Promise<void> {
  const primaryEventId = linkedEventIds[0];
  if (!primaryEventId) return;

  const snap = await collection(db)
    .where('linkedEventIds', 'array-contains', primaryEventId)
    .where('type', '==', type)
    .where('status', '==', 'published')
    .get();

  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: 'archived',
      updatedAt: Timestamp.now(),
    });
  });
  if (!snap.empty) await batch.commit();
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
  const { storagePath, fileUrl } = await uploadEventDocumentPdf({
    documentId: docRef.id,
    version: nextVersion,
    type: 'call-for-entries',
    buffer: pdfBuffer,
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
    fileUrl,
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

export async function publishEventDocument(
  db: Firestore,
  documentId: string,
): Promise<SerializedEventDocument> {
  const doc = await getEventDocument(db, documentId);
  if (!doc) throw new Error('Document not found');
  if (doc.status === 'published') return doc;
  if (doc.status === 'archived') throw new Error('Archived documents cannot be published');
  if (!doc.fileUrl) throw new Error('Document has no file');

  await archivePublishedDocuments(db, doc.linkedEventIds, doc.type);

  const now = Timestamp.now();
  await collection(db).doc(documentId).update({
    status: 'published',
    publishedAt: now,
    updatedAt: now,
  });

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

  const pdfBuffer = await generateCallForEntriesPdf(input.data);
  const version = existing.version;
  const { storagePath, fileUrl } = await uploadEventDocumentPdf({
    documentId: input.documentId,
    version,
    type: 'call-for-entries',
    buffer: pdfBuffer,
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
    fileUrl,
    storagePath,
    downloadFileName: buildDownloadFileName(input.data, version),
    updatedAt: now,
    generatedFromEventUpdatedAt: generatedFromEventUpdatedAt
      ? Timestamp.fromMillis(generatedFromEventUpdatedAt)
      : now,
  });

  return (await getEventDocument(input.db, input.documentId)) as SerializedEventDocument;
}
