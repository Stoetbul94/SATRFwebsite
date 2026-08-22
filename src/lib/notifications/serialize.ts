import type {
  NotificationAudience,
  NotificationStatus,
  NotificationType,
  SerializedNotification,
  UserNotificationView,
} from '@/lib/notifications/types';
import { NOTIFICATION_TYPES } from '@/lib/notifications/types';

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

export function parseNotificationType(value: unknown): NotificationType {
  const raw = String(value || 'general');
  return NOTIFICATION_TYPES.includes(raw as NotificationType)
    ? (raw as NotificationType)
    : 'general';
}

export function parseNotificationStatus(value: unknown): NotificationStatus {
  const raw = String(value || 'draft');
  if (raw === 'published' || raw === 'archived' || raw === 'draft') return raw;
  return 'draft';
}

export function parseAudience(value: unknown): NotificationAudience {
  if (!value || typeof value !== 'object') {
    return { type: 'all-website-users' };
  }
  const audience = value as Record<string, unknown>;
  if (audience.type === 'custom' && Array.isArray(audience.userIds)) {
    return {
      type: 'custom',
      userIds: audience.userIds.filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      ),
    };
  }
  return { type: 'all-website-users' };
}

export function serializeNotification(
  id: string,
  data: Record<string, unknown>,
): SerializedNotification {
  return {
    id,
    type: parseNotificationType(data.type),
    title: String(data.title || ''),
    message: String(data.message || ''),
    href: typeof data.href === 'string' ? data.href : null,
    eventId: typeof data.eventId === 'string' ? data.eventId : null,
    documentId: typeof data.documentId === 'string' ? data.documentId : null,
    audience: parseAudience(data.audience),
    status: parseNotificationStatus(data.status),
    createdAt: toIso(data.createdAt),
    publishedAt: toIso(data.publishedAt),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
    sourceType: typeof data.sourceType === 'string' ? data.sourceType : null,
    sourceId: typeof data.sourceId === 'string' ? data.sourceId : null,
    sourceVersion:
      data.sourceVersion != null && !Number.isNaN(Number(data.sourceVersion))
        ? Number(data.sourceVersion)
        : null,
  };
}

export function toUserNotificationView(
  notification: SerializedNotification,
  readAt: string | null,
): UserNotificationView | null {
  if (notification.status !== 'published') return null;
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    href: notification.href ?? null,
    eventId: notification.eventId ?? null,
    documentId: notification.documentId ?? null,
    publishedAt: notification.publishedAt ?? null,
    readAt,
    unread: !readAt,
  };
}

export function countUnread(items: UserNotificationView[]): number {
  return items.filter((item) => item.unread).length;
}

export function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return '99+';
  return String(count);
}
