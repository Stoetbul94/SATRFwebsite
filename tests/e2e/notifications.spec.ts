import { test, expect, type Page } from '@playwright/test';
import { buildCallForEntriesNotificationId } from '../../src/lib/notifications/ids';

const mockEventId = 'notifications-e2e-event';

type MockNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  eventId: string;
  documentId: string | null;
  publishedAt: string;
  readAt: string | null;
  unread: boolean;
};

const seedNotifications: MockNotification[] = [
  {
    id: 'n-unread-1',
    type: 'call-for-entries',
    title: 'Call for Entries Published',
    message: 'Entries are open for SATRF Event #5.',
    href: `/events/${mockEventId}#documents`,
    eventId: mockEventId,
    documentId: 'doc-1',
    publishedAt: '2026-08-22T10:00:00.000Z',
    readAt: null,
    unread: true,
  },
  {
    id: 'n-read-1',
    type: 'event-update',
    title: 'Event Update',
    message: 'Start time changed to 09:00.',
    href: `/events/${mockEventId}`,
    eventId: mockEventId,
    documentId: null,
    publishedAt: '2026-08-21T10:00:00.000Z',
    readAt: '2026-08-21T12:00:00.000Z',
    unread: false,
  },
];

async function mockWebsiteUser(page: Page, role: 'user' | 'admin' = 'user') {
  await page.addInitScript((userRole) => {
    localStorage.setItem('__e2e_admin_bypass__', '1');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'e2e-notifications-user',
        email: userRole === 'admin' ? 'admin@satrf.com' : 'member@example.com',
        role: userRole,
        firstName: 'E2E',
        lastName: 'User',
        club: 'SATRF',
      }),
    );
    localStorage.setItem('access_token', 'e2e-mock-token');
    localStorage.setItem('auth_token', 'e2e-mock-token');
  }, role);
}

async function mockNotificationsApi(page: Page, state: { items: MockNotification[] }) {
  await page.route('**/api/notifications**', async (route) => {
    const request = route.request();
    const url = request.url();

    if (request.method() === 'POST' && /\/api\/notifications\/[^/?]+\/read/.test(url)) {
      const id = url.split('/api/notifications/')[1]?.split('/read')[0]?.split('?')[0];
      state.items = state.items.map((item) =>
        item.id === id
          ? { ...item, unread: false, readAt: new Date().toISOString() }
          : item,
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    if (url.includes('/api/notifications/') && !url.includes('/api/notifications?') && !url.match(/\/api\/notifications\/?(\?|$)/)) {
      // other nested paths fall through unless handled above
    }

    if (request.method() === 'GET' && /\/api\/notifications\/?(\?|$)/.test(url.replace(/^https?:\/\/[^/]+/, ''))) {
      const parsed = new URL(url);
      const unreadOnly = parsed.searchParams.get('unread') === '1';
      const cursor = parsed.searchParams.get('cursor');
      const view = parsed.searchParams.get('view');
      let list = unreadOnly ? state.items.filter((n) => n.unread) : [...state.items];
      let nextCursor: string | null = null;

      if (view !== 'dropdown' && !cursor && list.length > 1) {
        nextCursor = 'page-2';
        list = list.slice(0, 1);
      } else if (cursor === 'page-2') {
        list = unreadOnly
          ? state.items.filter((n) => n.unread).slice(1)
          : state.items.slice(1);
        nextCursor = null;
      }

      if (view === 'dropdown') {
        list = list.slice(0, 8);
      }

      const unreadCount = state.items.filter((n) => n.unread).length;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: list,
          unreadCount,
          badge: unreadCount <= 0 ? null : unreadCount > 99 ? '99+' : String(unreadCount),
          nextCursor,
          limit: view === 'dropdown' ? 8 : 25,
        }),
      });
      return;
    }

    if (request.method() === 'POST' && /\/api\/notifications\/?(\?|$)/.test(url.replace(/^https?:\/\/[^/]+/, ''))) {
      const body = request.postDataJSON() as { action?: string; notificationId?: string };
      if (body.action === 'read-all') {
        state.items = state.items.map((item) => ({
          ...item,
          unread: false,
          readAt: item.readAt || new Date().toISOString(),
        }));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, marked: 1 }),
        });
        return;
      }
      if (body.action === 'read' && body.notificationId) {
        state.items = state.items.map((item) =>
          item.id === body.notificationId
            ? { ...item, unread: false, readAt: new Date().toISOString() }
            : item,
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }
    }

    await route.continue();
  });
}

test.describe('Notifications — logged out', () => {
  test('does not show notification bell', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('notification-bell')).toHaveCount(0);
  });

  test('notifications page redirects to login', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });

  test('admin communications requires auth', async ({ page }) => {
    await page.goto(`/admin/events/${mockEventId}/communications`);
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });
});

async function dismissNextOverlay(page: Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.evaluate(() => {
    document.querySelector('nextjs-portal')?.remove();
  }).catch(() => undefined);
}

test.describe('Notifications — logged in with unread (mocked)', () => {
  test('bell shows badge, dropdown lists items, mark all clears badge', async ({ page }) => {
    const state = { items: structuredClone(seedNotifications) };
    await mockWebsiteUser(page, 'user');
    await mockNotificationsApi(page, state);

    await page.goto('/scores');
    await dismissNextOverlay(page);
    await expect(page.getByTestId('notification-bell')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('notification-badge')).toHaveText('1', { timeout: 20000 });

    await page.getByTestId('notification-bell').click({ force: true });
    await expect(page.getByTestId('notification-dropdown')).toBeVisible();
    await expect(page.getByText('Call for Entries Published')).toBeVisible();
    await expect(page.getByText('Event Update')).toBeVisible();

    await page.getByRole('button', { name: 'Mark all as read' }).click({ force: true });
    await expect(page.getByTestId('notification-badge')).toHaveCount(0);
  });

  test('clicking notification marks read via mocked API', async ({ page }) => {
    const state = { items: structuredClone(seedNotifications) };
    await mockWebsiteUser(page, 'user');
    await mockNotificationsApi(page, state);

    await page.route(`**/api/events/${mockEventId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: mockEventId,
          title: 'SATRF Notifications E2E Event',
          description: 'Fixture',
          date: '2026-11-14T00:00:00.000Z',
          location: 'Modderbee',
          disciplines: ['prone_50m'],
          status: 'open',
          maxParticipants: 40,
          currentParticipants: 0,
          price: 300,
        }),
      });
    });
    await page.route(`**/api/events/${mockEventId}/documents`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ eventId: mockEventId, documents: [] }),
      });
    });

    await page.goto('/scores');
    await dismissNextOverlay(page);
    await page.getByTestId('notification-bell').click({ force: true });
    await page.getByText('Call for Entries Published').click({ force: true });
    await expect(page).toHaveURL(new RegExp(`/events/${mockEventId}`), { timeout: 15000 });
    expect(state.items.find((n) => n.id === 'n-unread-1')?.unread).toBe(false);
  });

  test('empty state hides Mark all as read', async ({ page }) => {
    const state = { items: [] as MockNotification[] };
    await mockWebsiteUser(page, 'user');
    await mockNotificationsApi(page, state);

    await page.goto('/notifications');
    await dismissNextOverlay(page);
    await expect(page.getByTestId('notifications-empty')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('mark-all-read')).toHaveCount(0);
  });

  test('history Load more appends without duplicates', async ({ page }) => {
    const state = { items: structuredClone(seedNotifications) };
    await mockWebsiteUser(page, 'user');
    await mockNotificationsApi(page, state);

    await page.goto('/notifications');
    await dismissNextOverlay(page);
    await expect(page.getByTestId('notifications-list')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Call for Entries Published')).toBeVisible();
    await expect(page.getByTestId('notifications-load-more')).toBeVisible();
    await page.getByTestId('notifications-load-more').click({ force: true });
    await expect(page.getByText('Event Update')).toBeVisible();
    await expect(page.getByText('Call for Entries Published')).toHaveCount(1);
  });

  test('bell IconButton is the popover trigger', async ({ page }) => {
    const state = { items: structuredClone(seedNotifications) };
    await mockWebsiteUser(page, 'user');
    await mockNotificationsApi(page, state);

    await page.goto('/scores');
    await dismissNextOverlay(page);
    const bell = page.getByTestId('notification-bell');
    await expect(bell).toBeVisible({ timeout: 20000 });
    await expect(bell).toHaveAttribute('aria-label', /Notifications/);
    await expect(bell).toHaveAttribute('aria-haspopup', /.+|true|menu|dialog/);
    await bell.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('notification-dropdown')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('notification-dropdown')).toBeHidden();
  });

  test('375px bell remains usable', async ({ page }) => {
    const state = { items: structuredClone(seedNotifications) };
    await mockWebsiteUser(page, 'user');
    await mockNotificationsApi(page, state);
    await page.setViewportSize({ width: 375, height: 720 });

    await page.goto('/scores');
    await dismissNextOverlay(page);
    const bell = page.getByTestId('notification-bell');
    await expect(bell).toBeVisible({ timeout: 20000 });
    const box = await bell.boundingBox();
    expect(box).toBeTruthy();
    expect((box?.width ?? 0) * (box?.height ?? 0)).toBeGreaterThanOrEqual(40 * 40);

    await bell.click({ force: true });
    await expect(page.getByTestId('notification-dropdown')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(12);
  });
});

test.describe('Admin Communications (mocked)', () => {
  test('preview then publish via mocked API', async ({ page }) => {
    let published = 0;
    const history: Array<Record<string, unknown>> = [];

    await mockWebsiteUser(page, 'admin');

    await page.route(`**/api/admin/events/${mockEventId}/communications`, async (route) => {
      const request = route.request();
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            eventId: mockEventId,
            eventTitle: 'SATRF Notifications E2E Event',
            notifications: history,
            audienceLabel: 'All registered website users',
          }),
        });
        return;
      }
      if (request.method() === 'POST') {
        const body = request.postDataJSON() as {
          action?: string;
          title?: string;
          message?: string;
          type?: string;
        };
        if (body.action === 'preview') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              preview: {
                type: body.type || 'event-update',
                title: body.title,
                message: body.message,
                href: `/events/${mockEventId}`,
                audienceLabel: 'All registered website users',
              },
            }),
          });
          return;
        }
        published += 1;
        history.unshift({
          id: `manual-${published}`,
          title: body.title,
          message: body.message,
          type: body.type || 'event-update',
          status: 'published',
          publishedAt: new Date().toISOString(),
        });
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ notification: history[0] }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto(`/admin/events/${mockEventId}/communications`);
    await dismissNextOverlay(page);
    await expect(page.getByTestId('admin-communications-compose')).toBeVisible({
      timeout: 20000,
    });
    await expect(
      page.locator('input[value="All registered website users"]'),
    ).toBeVisible();

    await page.getByLabel('Title').fill('SATRF Event #5 Update');
    await page.getByLabel('Message').fill('The start time has changed to 09:00.');
    await page.getByRole('button', { name: 'Preview' }).click({ force: true });
    await expect(page.getByTestId('notification-preview')).toBeVisible();
    await expect(page.getByTestId('notification-preview').getByText('SATRF Event #5 Update')).toBeVisible();

    await page.getByRole('button', { name: 'Publish Notification' }).click({ force: true });
    await expect(page.getByTestId('admin-communications-history').getByText('SATRF Event #5 Update')).toBeVisible();
    expect(published).toBe(1);
  });
});

test.describe('CFE notification idempotency', () => {
  test('retry publish maps to the same deterministic notification id', async () => {
    const first = buildCallForEntriesNotificationId('cfe-doc-fixture-1', 1);
    const retry = buildCallForEntriesNotificationId('cfe-doc-fixture-1', 1);
    expect(first).toBe(retry);
    expect(first).toBe('cfe-published-cfe-doc-fixture-1-v1');
  });
});
