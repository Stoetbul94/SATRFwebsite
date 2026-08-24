import { test, expect, type Page } from '@playwright/test';

const loggedOutStorage = { cookies: [] as [], origins: [] as [] };

const performanceScores = [
  {
    id: 'score-q1',
    userId: 'e2e-dashboard-user',
    shooterName: 'Jane Doe',
    club: 'SATRF Club',
    category: 'open',
    eventId: 'ev-1',
    eventName: 'SATRF Prone Event #3',
    date: '2026-06-27',
    discipline: 'prone_50m',
    scoringType: 'decimal',
    stage: 'qualification',
    positions: [
      {
        position: 'prone',
        decimalTotal: 587.2,
        integerTotal: 587,
        series: [
          { seriesNumber: 1, decimal: 98.5, integer: 98, innerTens: 4 },
          { seriesNumber: 2, decimal: 97.8, integer: 97, innerTens: 3 },
        ],
      },
    ],
    decimalTotal: 587.2,
    integerTotal: 587,
    innerTens: 20,
    totalShots: 60,
    status: 'official',
    source: 'manual',
    createdBy: 'admin',
    createdAt: '2026-06-27T00:00:00.000Z',
    updatedAt: '2026-06-27T00:00:00.000Z',
  },
  {
    id: 'score-q2',
    userId: 'e2e-dashboard-user',
    shooterName: 'Jane Doe',
    club: 'SATRF Club',
    category: 'open',
    eventId: 'ev-2',
    eventName: 'Winter Match',
    date: '2026-03-15',
    discipline: 'prone_50m',
    scoringType: 'decimal',
    stage: 'qualification',
    positions: [],
    decimalTotal: 580,
    integerTotal: 580,
    innerTens: 15,
    totalShots: 60,
    status: 'official',
    source: 'manual',
    createdBy: 'admin',
    createdAt: '2026-03-15T00:00:00.000Z',
    updatedAt: '2026-03-15T00:00:00.000Z',
  },
];

async function mockWebsiteUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('__e2e_admin_bypass__', '1');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'e2e-dashboard-user',
        email: 'member@example.com',
        role: 'user',
        firstName: 'Jane',
        lastName: 'Doe',
        club: 'SATRF',
      }),
    );
    localStorage.setItem('access_token', 'e2e-mock-token');
    localStorage.setItem('auth_token', 'e2e-mock-token');
  });
}

test.describe('My Performance page — logged out', () => {
  test.use({ storageState: loggedOutStorage });

  test('redirects logged out users to login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/dashboard/results');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

test.describe('My Performance page', () => {
  test('renders performance analytics for linked scores', async ({ page }) => {
    await mockWebsiteUser(page);
    await page.route('**/api/scores/my-scores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: performanceScores, total: performanceScores.length }),
      });
    });

    await page.goto('/dashboard/results');
    await expect(page.getByRole('heading', { name: 'My Performance' })).toBeVisible();
    await expect(page.getByText('Score Progression')).toBeVisible();
    await expect(page.locator('p').filter({ hasText: /^Personal Best$/ }).first()).toBeVisible();
    await expect(page.getByText('Result History')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to My SATRF' })).toBeVisible();
  });

  test('shows empty state without scores', async ({ page }) => {
    await mockWebsiteUser(page);
    await page.route('**/api/scores/my-scores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });
    await page.goto('/dashboard/results');
    await expect(page.getByText(/No competition results are linked to your account yet/i)).toBeVisible();
  });

  test('375px layout avoids horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockWebsiteUser(page);
    await page.route('**/api/scores/my-scores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: performanceScores, total: performanceScores.length }),
      });
    });
    await page.goto('/dashboard/results');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});

test.describe('My SATRF → My Performance navigation', () => {
  test('View My Performance links to /dashboard/results', async ({ page }) => {
    await mockWebsiteUser(page);
    await page.route('**/api/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            firstName: 'Jane',
            hasLinkedResults: true,
            profileIncomplete: false,
            club: 'Club',
            province: 'GP',
            lastName: 'Doe',
          },
          nextEvent: null,
          registrations: [],
          results: [
            {
              id: 'score-q1',
              discipline: 'prone_50m',
              disciplineLabel: '50 m Rifle Prone',
              eventId: 'ev-1',
              eventName: 'Event',
              date: '2026-06-27',
              scoreLabel: '587.2',
              stage: 'qualification',
              stageLabel: 'Qualification',
            },
          ],
          notifications: { unreadCount: 0, recent: [] },
        }),
      });
    });
    await page.route('**/api/scores/my-scores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: performanceScores, total: performanceScores.length }),
      });
    });

    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'View My Performance' }).click();
    await expect(page).toHaveURL(/\/dashboard\/results/);
    await expect(page.getByRole('heading', { name: 'My Performance' })).toBeVisible();
  });
});
