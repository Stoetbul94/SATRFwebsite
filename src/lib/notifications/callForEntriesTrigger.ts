import type { Firestore, WriteBatch } from 'firebase-admin/firestore';
import { buildCallForEntriesNotificationHref } from '@/lib/notifications/hrefSafety';
import { buildCallForEntriesNotificationId } from '@/lib/notifications/ids';
import { ensureNotificationInBatch } from '@/lib/notifications/repository';
import type { SerializedEventDocument } from '@/lib/eventDocuments/types';

/**
 * Queue an idempotent Call-for-Entries published notification onto an existing batch.
 * Deterministic ID: cfe-published-{documentId}-v{version}
 */
export async function appendCallForEntriesPublishedNotification(
  batch: WriteBatch,
  db: Firestore,
  document: Pick<
    SerializedEventDocument,
    'id' | 'title' | 'version' | 'linkedEventIds' | 'type'
  >,
  createdBy?: string | null,
): Promise<{ notificationId: string; created: boolean }> {
  const primaryEventId = document.linkedEventIds[0];
  if (!primaryEventId) {
    return { notificationId: '', created: false };
  }

  const notificationId = buildCallForEntriesNotificationId(document.id, document.version);
  const eventLabel = document.title || 'SATRF event';

  const { created } = await ensureNotificationInBatch(batch, db, {
    id: notificationId,
    type: 'call-for-entries',
    title: 'Call for Entries Published',
    message: `Entries are open for ${eventLabel}.`,
    href: buildCallForEntriesNotificationHref(primaryEventId),
    eventId: primaryEventId,
    documentId: document.id,
    audience: { type: 'all-website-users' },
    createdBy: createdBy ?? null,
    sourceType: 'event-document',
    sourceId: document.id,
    sourceVersion: document.version,
    status: 'published',
  });

  return { notificationId, created };
}
