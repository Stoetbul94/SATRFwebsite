import { Timestamp, type Firestore, type WriteBatch } from 'firebase-admin/firestore';
import { filterEligibleNotifications } from '@/lib/notifications/eligibility';
import { buildManualNotificationId } from '@/lib/notifications/ids';
import {
  countUnread,
  serializeNotification,
  toUserNotificationView,
} from '@/lib/notifications/serialize';
import { sanitizeNotificationHref } from '@/lib/notifications/hrefSafety';
import type {
  NotificationAudience,
  NotificationType,
  SerializedNotification,
  UserNotificationView,
} from '@/lib/notifications/types';
import { DROPDOWN_LIMIT, HISTORY_LIMIT } from '@/lib/notifications/types';

const COLLECTION = 'notifications';

function collection(db: Firestore) {
  return db.collection(COLLECTION);
}

function stateRef(db: Firestore, userId: string, notificationId: string) {
  return db.collection('users').doc(userId).collection('notificationState').doc(notificationId);
}

export async function listPublishedNotifications(
  db: Firestore,
  limit = HISTORY_LIMIT,
): Promise<SerializedNotification[]> {
  const snap = await collection(db)
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((doc) => serializeNotification(doc.id, doc.data()));
}

export async function listNotificationsForEvent(
  db: Firestore,
  eventId: string,
): Promise<SerializedNotification[]> {
  const snap = await collection(db)
    .where('eventId', '==', eventId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snap.docs.map((doc) => serializeNotification(doc.id, doc.data()));
}

export async function getNotification(
  db: Firestore,
  notificationId: string,
): Promise<SerializedNotification | null> {
  const doc = await collection(db).doc(notificationId).get();
  if (!doc.exists) return null;
  return serializeNotification(doc.id, doc.data() as Record<string, unknown>);
}

async function loadReadStateMap(
  db: Firestore,
  userId: string,
  notificationIds: string[],
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  await Promise.all(
    notificationIds.map(async (id) => {
      const snap = await stateRef(db, userId, id).get();
      if (!snap.exists) {
        result[id] = null;
        return;
      }
      const data = snap.data() as Record<string, unknown>;
      const readAt =
        data.readAt &&
        typeof data.readAt === 'object' &&
        'toDate' in (data.readAt as object)
          ? (data.readAt as { toDate: () => Date }).toDate().toISOString()
          : typeof data.readAt === 'string'
            ? data.readAt
            : null;
      result[id] = readAt;
    }),
  );
  return result;
}

export async function listNotificationsForUser(
  db: Firestore,
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {},
): Promise<{ notifications: UserNotificationView[]; unreadCount: number }> {
  const limit = options.limit ?? HISTORY_LIMIT;
  const published = await listPublishedNotifications(db, HISTORY_LIMIT);
  const eligible = filterEligibleNotifications(published, userId);
  const recent = eligible
    .map((item) => toUserNotificationView(item, null))
    .filter((item): item is UserNotificationView => item !== null);

  const readMap = await loadReadStateMap(
    db,
    userId,
    recent.map((item) => item.id),
  );

  const withRead = recent.map((item) => ({
    ...item,
    readAt: readMap[item.id] ?? null,
    unread: !readMap[item.id],
  }));

  const unreadCount = countUnread(withRead);
  let notifications = withRead.slice(0, limit);
  if (options.unreadOnly) {
    notifications = withRead.filter((item) => item.unread).slice(0, limit);
  }

  return { notifications, unreadCount };
}

export async function listDropdownNotificationsForUser(db: Firestore, userId: string) {
  const result = await listNotificationsForUser(db, userId, { limit: DROPDOWN_LIMIT });
  return result;
}

export async function markNotificationRead(
  db: Firestore,
  userId: string,
  notificationId: string,
): Promise<void> {
  const notification = await getNotification(db, notificationId);
  if (!notification || notification.status !== 'published') {
    throw new Error('Notification not found');
  }
  if (!filterEligibleNotifications([notification], userId).length) {
    throw new Error('Notification not found');
  }

  await stateRef(db, userId, notificationId).set(
    {
      readAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
}

export async function markAllNotificationsRead(db: Firestore, userId: string): Promise<number> {
  const { notifications } = await listNotificationsForUser(db, userId, {
    limit: HISTORY_LIMIT,
  });
  const unread = notifications.filter((item) => item.unread);
  if (!unread.length) return 0;

  const batch = db.batch();
  const now = Timestamp.now();
  unread.forEach((item) => {
    batch.set(
      stateRef(db, userId, item.id),
      { readAt: now, updatedAt: now },
      { merge: true },
    );
  });
  await batch.commit();
  return unread.length;
}

export type CreateNotificationInput = {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  eventId?: string | null;
  documentId?: string | null;
  audience?: NotificationAudience;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceVersion?: number | null;
  status?: 'draft' | 'published';
};

export function buildNotificationPayload(input: CreateNotificationInput) {
  const href = sanitizeNotificationHref(input.href) ?? null;
  const now = Timestamp.now();
  const status = input.status ?? 'published';
  return {
    type: input.type,
    title: input.title.trim(),
    message: input.message.trim(),
    href,
    eventId: input.eventId ?? null,
    documentId: input.documentId ?? null,
    audience: input.audience ?? { type: 'all-website-users' as const },
    status,
    createdAt: now,
    publishedAt: status === 'published' ? now : null,
    createdBy: input.createdBy ?? null,
    sourceType: input.sourceType ?? null,
    sourceId: input.sourceId ?? null,
    sourceVersion: input.sourceVersion ?? null,
  };
}

export async function createNotification(
  db: Firestore,
  input: CreateNotificationInput,
): Promise<SerializedNotification> {
  if (!input.title.trim()) throw new Error('Title is required');
  if (!input.message.trim()) throw new Error('Message is required');

  const id = input.id || buildManualNotificationId();
  const payload = buildNotificationPayload(input);
  await collection(db).doc(id).set(payload);
  return serializeNotification(id, payload as unknown as Record<string, unknown>);
}

/**
 * Idempotent write used by automatic triggers / batch publish.
 * Returns whether a new document was written.
 */
export async function ensureNotificationInBatch(
  batch: WriteBatch,
  db: Firestore,
  input: CreateNotificationInput & { id: string },
): Promise<{ created: boolean }> {
  const ref = collection(db).doc(input.id);
  const existing = await ref.get();
  if (existing.exists) {
    return { created: false };
  }
  const payload = buildNotificationPayload(input);
  batch.set(ref, payload);
  return { created: true };
}

export async function archiveNotification(
  db: Firestore,
  notificationId: string,
): Promise<SerializedNotification> {
  const existing = await getNotification(db, notificationId);
  if (!existing) throw new Error('Notification not found');
  await collection(db).doc(notificationId).update({
    status: 'archived',
    updatedAt: Timestamp.now(),
  });
  return (await getNotification(db, notificationId)) as SerializedNotification;
}
