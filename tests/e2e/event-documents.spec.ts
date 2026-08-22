import { test, expect } from '@playwright/test';

const mockEventId = 'event-documents-e2e-fixture';
const mockDocumentId = 'cfe-doc-fixture-1';

const mockPublishedDocument = {
  id: mockDocumentId,
  type: 'call-for-entries',
  title: '2026 SATRF Event 4',
  fileUrl: 'https://example.com/satrf-call-for-entries-v1.pdf',
  publishedAt: '2026-08-22T10:00:00.000Z',
  downloadFileName: 'satrf-2026-event-4-call-for-entries-v1.pdf',
  version: 1,
};

const mockEventPayload = {
  id: mockEventId,
  title: 'SATRF Event Documents E2E Fixture',
  description: 'Fixture event for document E2E — not production data.',
  date: '2026-11-14T00:00:00.000Z',
  location: 'Modderbee Shooting Range',
  disciplines: ['prone_50m'],
  status: 'open',
  maxParticipants: 40,
  currentParticipants: 0,
  price: 300,
  startTime: '09:00',
  equipmentInspectionTime: '08:00',
  registrationDeadline: '2026-11-12T00:00:00.000Z',
};

test.describe('Event Documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/events/${mockEventId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockEventPayload),
      });
    });

    await page.route(`**/api/events/${mockEventId}/documents`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ eventId: mockEventId, documents: [mockPublishedDocument] }),
      });
    });
  });

  test('shows published documents on Event Hub with descriptive actions', async ({ page }) => {
    await page.goto(`/events/${mockEventId}`);
    await expect(page.getByTestId('event-hub-shell')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('event-hub-documents')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Call for Entries' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download Call for Entries' })).toBeVisible();
  });

  test('hides documents section when API returns none', async ({ page }) => {
    await page.route(`**/api/events/${mockEventId}/documents`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ eventId: mockEventId, documents: [] }),
      });
    });

    await page.goto(`/events/${mockEventId}`);
    await expect(page.getByTestId('event-hub-shell')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('event-hub-documents')).toHaveCount(0);
  });

  test('375px documents layout remains usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto(`/events/${mockEventId}`);
    await expect(page.getByTestId('event-hub-documents')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('link', { name: 'View Call for Entries' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(12);
  });
});

test.describe('Admin Event Documents', () => {
  test('documents admin route requires authentication', async ({ page }) => {
    await page.goto(`/admin/events/${mockEventId}/documents`);
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });
});
