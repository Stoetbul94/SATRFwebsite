import type { SerializedNotification, UserNotificationView } from '@/lib/notifications/types';

/** True when individual readAt exists OR publishedAt <= readThroughAt. */
export function isNotificationRead(input: {
  publishedAt: string | null | undefined;
  individualReadAt: string | null | undefined;
  readThroughAt: string | null | undefined;
}): boolean {
  if (input.individualReadAt) return true;
  if (!input.publishedAt || !input.readThroughAt) return false;
  const publishedMs = Date.parse(input.publishedAt);
  const throughMs = Date.parse(input.readThroughAt);
  if (Number.isNaN(publishedMs) || Number.isNaN(throughMs)) return false;
  return publishedMs <= throughMs;
}

export function resolveUserNotificationView(
  notification: SerializedNotification,
  individualReadAt: string | null,
  readThroughAt: string | null,
): UserNotificationView | null {
  if (notification.status !== 'published') return null;
  const read = isNotificationRead({
    publishedAt: notification.publishedAt,
    individualReadAt,
    readThroughAt,
  });
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    href: notification.href ?? null,
    eventId: notification.eventId ?? null,
    documentId: notification.documentId ?? null,
    publishedAt: notification.publishedAt ?? null,
    readAt: individualReadAt,
    unread: !read,
  };
}
