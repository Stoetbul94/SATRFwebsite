import {
  FieldPath,
  Timestamp,
  type Firestore,
  type Query,
  type WriteBatch,
} from 'firebase-admin/firestore';
import {
  decodeNotificationCursor,
  encodeNotificationCursor,
} from '@/lib/notifications/cursor';
import { filterEligibleNotifications } from '@/lib/notifications/eligibility';
import { buildManualNotificationId } from '@/lib/notifications/ids';
import { resolveUserNotificationView } from '@/lib/notifications/readState';
import {
  countUnread,
  serializeNotification,
} from '@/lib/notifications/serialize';
import { sanitizeNotificationHref } from '@/lib/notifications/hrefSafety';
import type {
  NotificationAudience,
  NotificationType,
  SerializedNotification,
  UserNotificationView,
} from '@/lib/notifications/types';
import {
  DROPDOWN_LIMIT,
  HISTORY_LIMIT,
  INBOX_SCAN_LIMIT,
} from '@/lib/notifications/types';

const COLLECTION = 'notifications';
const META_DOC = 'inbox';

function collection(db: Firestore) {
  return db.collection(COLLECTION);
}

function stateRef(db: Firestore, userId: string, notificationId: string) {
  return db.collection('users').doc(userId).collection('notificationState').doc(notificationId);
}

function metaRef(db: Firestore, userId: string) {
  return db.collection('users').doc(userId).collection('notificationMeta').doc(META_DOC);
}

function toIsoFromUnknown(value: unknown): string | null {
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
}

export async function getReadThroughAt(
  db: Firestore,
  userId: string,
): Promise<string | null> {
  const snap = await metaRef(db, userId).get();
  if (!snap.exists) return null;
  return toIsoFromUnknown((snap.data() as Record<string, unknown>).readThroughAt);
}

/**
 * Batched multi-get for per-notification read state (reduces RPC round-trips).
 */
export async function loadReadStateMap(
  db: Firestore,
  userId: string,
  notificationIds: string[],
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  if (!notificationIds.length) return result;

  const refs = notificationIds.map((id) => stateRef(db, userId, id));
  const snaps = await db.getAll(...refs);

  snaps.forEach((snap, index) => {
    const id = notificationIds[index];
    if (!snap.exists) {
      result[id] = null;
      return;
    }
    const data = snap.data() as Record<string, unknown>;
    result[id] = toIsoFromUnknown(data.readAt);
  });

  return result;
}

type PublishedPage = {
  docs: SerializedNotification[];
  /** Cursor from last Firestore doc in this page (underlying query advance). */
  nextCursor: string | null;
};

async function queryPublishedPage(
  db: Firestore,
  options: { limit: number; cursor?: string | null },
): Promise<PublishedPage> {
  let query: Query = collection(db)
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc')
    .orderBy(FieldPath.documentId(), 'desc')
    .limit(options.limit);

  const cursor = options.cursor ? decodeNotificationCursor(options.cursor) : null;
  if (cursor) {
    query = query.startAfter(Timestamp.fromDate(new Date(cursor.publishedAt)), cursor.id);
  }

  const snap = await query.get();
  const docs = snap.docs.map((doc) => serializeNotification(doc.id, doc.data()));

  let nextCursor: string | null = null;
  if (snap.docs.length === options.limit) {
    const last = snap.docs[snap.docs.length - 1];
    const publishedAt = toIsoFromUnknown(last.data().publishedAt);
    if (publishedAt) {
      nextCursor = encodeNotificationCursor({ publishedAt, id: last.id });
    }
  }

  return { docs, nextCursor };
}

export async function listPublishedNotifications(
  db: Firestore,
  limit = HISTORY_LIMIT,
): Promise<SerializedNotification[]> {
  const page = await queryPublishedPage(db, { limit });
  return page.docs;
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

async function attachReadState(
  db: Firestore,
  userId: string,
  eligible: SerializedNotification[],
  readThroughAt: string | null,
): Promise<UserNotificationView[]> {
  // Only fetch individual state for items not already covered by read-through.
  const needsState = eligible.filter((item) => {
    if (!item.publishedAt || !readThroughAt) return true;
    return Date.parse(item.publishedAt) > Date.parse(readThroughAt);
  });

  const readMap = await loadReadStateMap(
    db,
    userId,
    needsState.map((item) => item.id),
  );

  return eligible
    .map((item) =>
      resolveUserNotificationView(item, readMap[item.id] ?? null, readThroughAt),
    )
    .filter((item): item is UserNotificationView => item !== null);
}

export type ListNotificationsResult = {
  notifications: UserNotificationView[];
  unreadCount: number;
  nextCursor: string | null;
  /** Scan window used for unread badge semantics. */
  scanLimit: number;
};

/**
 * History page with cursor pagination over the published query.
 * Audience filtering is server-side; nextCursor advances on the underlying page.
 */
export async function listNotificationsForUser(
  db: Firestore,
  userId: string,
  options: {
    limit?: number;
    unreadOnly?: boolean;
    cursor?: string | null;
  } = {},
): Promise<ListNotificationsResult> {
  const limit = options.limit ?? HISTORY_LIMIT;
  const readThroughAt = await getReadThroughAt(db, userId);
  const page = await queryPublishedPage(db, {
    limit,
    cursor: options.cursor,
  });

  const eligible = filterEligibleNotifications(page.docs, userId);
  let withRead = await attachReadState(db, userId, eligible, readThroughAt);

  if (options.unreadOnly) {
    withRead = withRead.filter((item) => item.unread);
  }

  // Unread count for this response: within returned page only for history;
  // callers that need badge use listDropdown / scan helper.
  return {
    notifications: withRead,
    unreadCount: countUnread(withRead),
    nextCursor: page.nextCursor,
    scanLimit: limit,
  };
}

/**
 * Bell dropdown: recent items + capped unread scan (INBOX_SCAN_LIMIT).
 */
export async function listDropdownNotificationsForUser(
  db: Firestore,
  userId: string,
): Promise<ListNotificationsResult> {
  const readThroughAt = await getReadThroughAt(db, userId);
  const page = await queryPublishedPage(db, { limit: INBOX_SCAN_LIMIT });
  const eligible = filterEligibleNotifications(page.docs, userId);
  const withRead = await attachReadState(db, userId, eligible, readThroughAt);
  const unreadCount = countUnread(withRead);

  return {
    notifications: withRead.slice(0, DROPDOWN_LIMIT),
    unreadCount,
    nextCursor: null,
    scanLimit: INBOX_SCAN_LIMIT,
  };
}

/** Lighter dashboard summary — smaller scan than bell dropdown (INBOX_SCAN_LIMIT). */
export const DASHBOARD_NOTIFICATION_SCAN_LIMIT = 25;

export async function listDashboardNotificationSummary(
  db: Firestore,
  userId: string,
  recentLimit = 3,
): Promise<ListNotificationsResult> {
  const readThroughAt = await getReadThroughAt(db, userId);
  const page = await queryPublishedPage(db, { limit: DASHBOARD_NOTIFICATION_SCAN_LIMIT });
  const eligible = filterEligibleNotifications(page.docs, userId);
  const withRead = await attachReadState(db, userId, eligible, readThroughAt);
  const unreadCount = countUnread(withRead);

  return {
    notifications: withRead.slice(0, recentLimit),
    unreadCount,
    nextCursor: null,
    scanLimit: DASHBOARD_NOTIFICATION_SCAN_LIMIT,
  };
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

/**
 * Mark ALL currently published (and earlier) notifications as read via one
 * readThroughAt write — not limited to HISTORY_LIMIT state docs.
 */
export async function markAllNotificationsRead(
  db: Firestore,
  userId: string,
): Promise<{ marked: true; readThroughAt: string }> {
  const now = Timestamp.now();
  await metaRef(db, userId).set(
    {
      readThroughAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  return { marked: true, readThroughAt: now.toDate().toISOString() };
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
