import type { NotificationAudience } from '@/lib/notifications/types';

/** Whether a website account may see this notification. */
export function isUserEligibleForNotification(
  audience: NotificationAudience,
  userId: string,
): boolean {
  if (!userId) return false;
  if (audience.type === 'all-website-users') return true;
  if (audience.type === 'custom') return audience.userIds.includes(userId);
  return false;
}

export function filterEligibleNotifications<T extends { audience: NotificationAudience }>(
  notifications: T[],
  userId: string,
): T[] {
  return notifications.filter((item) => isUserEligibleForNotification(item.audience, userId));
}
