export type NotificationType =
  | 'call-for-entries'
  | 'entries-open'
  | 'entries-closing'
  | 'event-update'
  | 'event-cancelled'
  | 'results-published'
  | 'general';

export type NotificationStatus = 'draft' | 'published' | 'archived';

export type NotificationAudience =
  | { type: 'all-website-users' }
  | { type: 'custom'; userIds: string[] };

export type SerializedNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  eventId?: string | null;
  documentId?: string | null;
  audience: NotificationAudience;
  status: NotificationStatus;
  createdAt: string | null;
  publishedAt?: string | null;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceVersion?: number | null;
};

export type UserNotificationView = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  eventId?: string | null;
  documentId?: string | null;
  publishedAt: string | null;
  readAt: string | null;
  unread: boolean;
};

export type NotificationStateRecord = {
  readAt?: string | null;
  dismissedAt?: string | null;
};

export const NOTIFICATION_TYPES: NotificationType[] = [
  'call-for-entries',
  'entries-open',
  'entries-closing',
  'event-update',
  'event-cancelled',
  'results-published',
  'general',
];

export const DROPDOWN_LIMIT = 8;
/** History page size / Load more page size. */
export const HISTORY_LIMIT = 25;
/**
 * Max published notifications scanned for unread badge / mark-all window.
 * Badge = unread among eligible items within this recent scan (capped indicator).
 */
export const INBOX_SCAN_LIMIT = 50;
/** Visible-tab fallback refresh for the bell (ms). */
export const BELL_FALLBACK_INTERVAL_MS = 5 * 60 * 1000;
