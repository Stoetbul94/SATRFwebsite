import { test, expect, type Page } from '@playwright/test';

const emptyDashboard = {
  user: {
    firstName: 'John',
    lastName: 'Doe',
    club: null,
    province: null,
    competitionProfileLinked: false,
    profileIncomplete: true,
  },
  nextEvent: null,
  registrations: [],
  results: [],
  notifications: { unreadCount: 0, recent: [] },
};

const registeredDashboard = {
  user: {
    firstName: 'Jane',
    lastName: 'Doe',
    club: 'SATRF Club',
    province: 'Gauteng',
    competitionProfileLinked: false,
    profileIncomplete: false,
  },
  nextEvent: {
    id: 'event-next',
    title: 'SATRF SA Championships',
    date: '2026-10-10',
    location: 'Modderbee',
    status: 'open',
    isRegistered: true,
    registrationOpen: true,
    hasCallForEntries: false,
  },
  registrations: [
    {
      id: 'reg-1',
      eventId: 'event-next',
      eventTitle: 'SATRF SA Championships',
      eventDate: '2026-10-10',
      location: 'Modderbee',
      statusLabel: 'Registered',
    },
  ],
  results: [],
  notifications: {
    unreadCount: 2,
    recent: [
      {
        id: 'n1',
        title: 'Call for Entries Published',
        message: 'SATRF Championship',
        publishedAt: '2026-08-22T10:00:00.000Z',
        href: '/events/event-next',
        unread: true,
      },
    ],
  },
};

const linkedDashboard = {
  ...registeredDashboard,
  user: {
    ...registeredDashboard.user,
    competitionProfileLinked: true,
  },
  results: [
    {
      id: 'score-1',
      discipline: 'prone_50m',
      disciplineLabel: '50 m Rifle Prone',
      eventId: 'ev-old',
      eventName: 'SATRF Prone Event #3',
      date: '2026-06-27',
      scoreLabel: '587.2',
      stage: 'qualification',
      stageLabel: 'Qualification',
    },
  ],
};

async function mockWebsiteUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('__e2e_admin_bypass__', '1');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'e2e-dashboard-user',
        email: 'member@example.com',
        role: 'user',
        firstName: 'E2E',
        lastName: 'User',
        club: 'SATRF',
      }),
    );
    localStorage.setItem('access_token', 'e2e-mock-token');
    localStorage.setItem('auth_token', 'e2e-mock-token');
  });
}

async function mockDashboardApi(page: Page, payload: unknown) {
  await page.route('**/api/dashboard', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

test.describe('My SATRF dashboard', () => {
  test('logged out user is redirected to login with redirect param', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  });

  test('new user sees useful empty state', async ({ page }) => {
    await mockWebsiteUser(page);
    await mockDashboardApi(page, emptyDashboard);
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /Welcome back, John/i })).toBeVisible();
    await expect(page.getByText(/No upcoming registrations yet/i)).toBeVisible();
    await expect(page.getByText(/not yet linked to this account/i)).toBeVisible();
    await expect(page.getByText(/No unread notifications/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Events' }).first()).toBeVisible();
  });

  test('registered user sees next event and entry', async ({ page }) => {
    await mockWebsiteUser(page);
    await mockDashboardApi(page, registeredDashboard);
    await page.goto('/dashboard');

    await expect(page.getByText('SATRF SA Championships')).toBeVisible();
    await expect(page.getByText('Registered').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Event' }).first()).toBeVisible();
    await expect(page.getByText('2 unread')).toBeVisible();
  });

  test('linked athlete sees recent results', async ({ page }) => {
    await mockWebsiteUser(page);
    await mockDashboardApi(page, linkedDashboard);
    await page.goto('/dashboard');

    await expect(page.getByText('50 m Rifle Prone')).toBeVisible();
    await expect(page.getByText('587.2')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View My Results' })).toBeVisible();
  });

  test('mobile 375px layout has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockWebsiteUser(page);
    await mockDashboardApi(page, registeredDashboard);
    await page.goto('/dashboard');

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
    expect(overflow).toBe(false);
    await expect(page.getByText('MY SATRF')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Notifications' })).toBeVisible();
  });
});
