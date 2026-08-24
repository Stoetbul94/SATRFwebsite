import { test, expect, type Page } from '@playwright/test';

const loggedOutStorage = { cookies: [] as [], origins: [] as [] };

const mockEventApi = {
  id: 'event-reg-1',
  title: 'SATRF Spring Match',
  description: 'Spring match at Modderbee.',
  date: '2026-11-15T08:00:00.000Z',
  location: 'Modderbee',
  status: 'open',
  price: 0,
  maxParticipants: 100,
  currentParticipants: 5,
  disciplines: ['prone_50m'],
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
        firstName: 'Jane',
        lastName: 'Doe',
        club: 'SATRF Club',
      }),
    );
    localStorage.setItem('access_token', 'e2e-mock-token');
    localStorage.setItem('auth_token', 'e2e-mock-token');
  });
}

async function mockEventHubRoutes(page: Page) {
  await page.route('**/api/events/event-reg-1/documents**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ documents: [] }),
    });
  });

  await page.route('**/api/events/event-reg-1', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEventApi),
    });
  });
}

test.describe('Registration → My SATRF linkage', () => {
  test('authenticated registration sends auth token and shows View My SATRF', async ({ page }) => {
    await mockWebsiteUser(page);
    await mockEventHubRoutes(page);

    let authHeader: string | null = null;
    await page.route('**/api/events/event-reg-1/register', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      authHeader = route.request().headers()['authorization'] ?? null;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accountLinked: true,
          paymentMethod: 'free',
          payfastUrl: null,
          eftInstructions: null,
          message: 'You are registered for this event',
          registration: {
            id: 'reg-new',
            eventId: 'event-reg-1',
            memberId: 'e2e-dashboard-user',
          },
        }),
      });
    });

    await page.goto('/events/event-reg-1');
    await page.getByTestId('event-hub-register').click();
    await expect(page.getByText('Registering with your My SATRF account')).toBeVisible();
    await expect(page.getByRole('dialog').getByLabel('Email')).toHaveValue('member@example.com');
    await expect(page.getByRole('dialog').getByLabel(/Club/i)).not.toHaveValue('');

    const registerResponse = page.waitForResponse(
      (res) => res.url().includes('/register') && res.request().method() === 'POST',
    );
    await page.getByRole('dialog').getByRole('button', { name: 'Register' }).click();
    await registerResponse;
    await expect(page.getByText('Registration confirmed')).toBeVisible();
    expect(authHeader).toMatch(/^Bearer /);
    await expect(page.getByRole('link', { name: 'View My SATRF' })).toBeVisible();
  });

  test('registered event appears on My SATRF dashboard', async ({ page }) => {
    await mockWebsiteUser(page);

    await page.route('**/api/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            firstName: 'Jane',
            lastName: 'Doe',
            club: 'SATRF Club',
            province: 'Gauteng',
            hasLinkedResults: false,
            profileIncomplete: false,
          },
          nextEvent: {
            id: 'event-reg-1',
            title: 'SATRF Spring Match',
            date: '2026-11-15',
            location: 'Modderbee',
            status: 'open',
            isRegistered: true,
            registrationOpen: true,
            hasCallForEntries: false,
          },
          registrations: [
            {
              id: 'reg-new',
              eventId: 'event-reg-1',
              eventTitle: 'SATRF Spring Match',
              eventDate: '2026-11-15',
              location: 'Modderbee',
              statusLabel: 'Registered',
            },
          ],
          results: [],
          notifications: { unreadCount: 0, recent: [] },
        }),
      });
    });

    await page.goto('/dashboard');
    await expect(page.getByText('SATRF Spring Match').first()).toBeVisible();
    await expect(page.getByText('Registered').first()).toBeVisible();
  });
});

test.describe('Guest registration retained', () => {
  test.use({ storageState: loggedOutStorage });

  test('guest can register without auth token', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockEventHubRoutes(page);

    let authHeader: string | undefined;
    await page.route('**/api/events/event-reg-1/register', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      authHeader = route.request().headers()['authorization'];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          paymentMethod: 'free',
          message: 'You are registered for this event',
          registration: { id: 'reg-guest', memberId: null },
        }),
      });
    });

    await page.goto('/events/event-reg-1');
    await page.getByTestId('event-hub-register').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Email')).toBeEditable();
    await dialog.locator('input').nth(0).fill('Guest Shooter');
    await dialog.locator('input[type="email"]').fill('guest@example.com');
    await dialog.locator('input').nth(2).fill('Guest Club');

    const registerResponse = page.waitForResponse(
      (res) => res.url().includes('/register') && res.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Register' }).click();
    await registerResponse;
    await expect(page.getByText('Registration confirmed')).toBeVisible();
    expect(authHeader).toBeUndefined();
    await expect(page.getByRole('link', { name: 'View My SATRF' })).toHaveCount(0);
  });
});
