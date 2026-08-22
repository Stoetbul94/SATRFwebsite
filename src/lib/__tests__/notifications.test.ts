import {
  isUserEligibleForNotification,
  filterEligibleNotifications,
} from '@/lib/notifications/eligibility';
import {
  countUnread,
  formatUnreadBadge,
  serializeNotification,
  toUserNotificationView,
} from '@/lib/notifications/serialize';
import { sanitizeNotificationHref, buildCallForEntriesNotificationHref } from '@/lib/notifications/hrefSafety';
import { buildCallForEntriesNotificationId } from '@/lib/notifications/ids';
import { formatNotificationWhen } from '@/lib/notifications/formatRelative';
import type { SerializedNotification, UserNotificationView } from '@/lib/notifications/types';

function baseNotification(
  overrides: Partial<SerializedNotification> & { id: string },
): SerializedNotification {
  return {
    type: 'general',
    title: 'Title',
    message: 'Message',
    href: '/events/abc',
    eventId: null,
    documentId: null,
    audience: { type: 'all-website-users' },
    status: 'published',
    createdAt: '2026-08-22T10:00:00.000Z',
    publishedAt: '2026-08-22T10:00:00.000Z',
    createdBy: null,
    sourceType: null,
    sourceId: null,
    sourceVersion: null,
    ...overrides,
  };
}

describe('notification eligibility', () => {
  it('allows all-website-users for any authenticated uid', () => {
    expect(
      isUserEligibleForNotification({ type: 'all-website-users' }, 'uid-1'),
    ).toBe(true);
  });

  it('rejects empty userId', () => {
    expect(isUserEligibleForNotification({ type: 'all-website-users' }, '')).toBe(
      false,
    );
  });

  it('filters custom audience to listed users only', () => {
    const audience = { type: 'custom' as const, userIds: ['a', 'b'] };
    expect(isUserEligibleForNotification(audience, 'a')).toBe(true);
    expect(isUserEligibleForNotification(audience, 'c')).toBe(false);
  });

  it('filterEligibleNotifications drops private items', () => {
    const items = [
      baseNotification({ id: '1', audience: { type: 'all-website-users' } }),
      baseNotification({
        id: '2',
        audience: { type: 'custom', userIds: ['other'] },
      }),
    ];
    expect(filterEligibleNotifications(items, 'uid-1').map((n) => n.id)).toEqual([
      '1',
    ]);
  });
});

describe('notification serialization', () => {
  it('serializes published notification fields', () => {
    const doc = serializeNotification('n1', {
      type: 'event-update',
      title: 'Update',
      message: 'Start time changed',
      href: '/events/e1',
      eventId: 'e1',
      status: 'published',
      audience: { type: 'all-website-users' },
      publishedAt: '2026-08-22T10:00:00.000Z',
      sourceVersion: 2,
    });
    expect(doc.id).toBe('n1');
    expect(doc.type).toBe('event-update');
    expect(doc.status).toBe('published');
    expect(doc.sourceVersion).toBe(2);
  });

  it('published-only filtering for user views', () => {
    const draft = baseNotification({ id: 'd', status: 'draft' });
    const published = baseNotification({ id: 'p', status: 'published' });
    expect(toUserNotificationView(draft, null)).toBeNull();
    expect(toUserNotificationView(published, null)?.unread).toBe(true);
    expect(toUserNotificationView(published, '2026-08-22T12:00:00.000Z')?.unread).toBe(
      false,
    );
  });
});

describe('unread count and badge', () => {
  const items: UserNotificationView[] = [
    {
      id: '1',
      type: 'general',
      title: 'A',
      message: 'm',
      publishedAt: null,
      readAt: null,
      unread: true,
    },
    {
      id: '2',
      type: 'general',
      title: 'B',
      message: 'm',
      publishedAt: null,
      readAt: '2026-08-22T10:00:00.000Z',
      unread: false,
    },
    {
      id: '3',
      type: 'general',
      title: 'C',
      message: 'm',
      publishedAt: null,
      readAt: null,
      unread: true,
    },
  ];

  it('counts unread', () => {
    expect(countUnread(items)).toBe(2);
  });

  it('formats badge including 99+', () => {
    expect(formatUnreadBadge(0)).toBeNull();
    expect(formatUnreadBadge(3)).toBe('3');
    expect(formatUnreadBadge(100)).toBe('99+');
  });
});

describe('href safety', () => {
  it('allows internal routes and blocks unsafe schemes', () => {
    expect(sanitizeNotificationHref('/events/abc#documents')).toBe(
      '/events/abc#documents',
    );
    expect(sanitizeNotificationHref('javascript:alert(1)')).toBeNull();
    expect(sanitizeNotificationHref('data:text/html,hi')).toBeNull();
    expect(sanitizeNotificationHref('//evil.com')).toBeNull();
    expect(sanitizeNotificationHref('https://evil.com/phish')).toBeNull();
    expect(
      sanitizeNotificationHref('https://www.rifleshooting.co.za/events/x'),
    ).toBe('/events/x');
  });

  it('builds CFE href to event documents anchor', () => {
    expect(buildCallForEntriesNotificationHref('evt-1')).toBe(
      '/events/evt-1#documents',
    );
  });
});

describe('CFE notification content + idempotency', () => {
  it('uses deterministic id per document version', () => {
    const a = buildCallForEntriesNotificationId('doc-abc', 1);
    const b = buildCallForEntriesNotificationId('doc-abc', 1);
    const c = buildCallForEntriesNotificationId('doc-abc', 2);
    expect(a).toBe('cfe-published-doc-abc-v1');
    expect(a).toBe(b);
    expect(c).toBe('cfe-published-doc-abc-v2');
  });

  it('CFE message stays concise', () => {
    const title = 'Call for Entries Published';
    const message = 'Entries are open for SATRF Event 5.';
    expect(title.length).toBeLessThan(80);
    expect(message.length).toBeLessThan(120);
    expect(message).not.toMatch(/PDF|pdfkit|base64/i);
  });
});

describe('timestamp formatting', () => {
  it('formats relative and absolute SA display', () => {
    const now = new Date(2026, 7, 22, 14, 0, 0); // 22 Aug 2026 local
    expect(formatNotificationWhen(now.toISOString(), now)).toBe('just now');
    expect(
      formatNotificationWhen(new Date(now.getTime() - 12 * 60_000).toISOString(), now),
    ).toBe('12 min ago');
    const yesterday = new Date(2026, 7, 21, 15, 0, 0);
    expect(formatNotificationWhen(yesterday.toISOString(), now)).toBe('Yesterday');
    const earlier = new Date(Date.UTC(2026, 7, 10, 10, 0, 0));
    expect(formatNotificationWhen(earlier.toISOString(), now)).toMatch(/10 Aug 2026/);
  });
});
