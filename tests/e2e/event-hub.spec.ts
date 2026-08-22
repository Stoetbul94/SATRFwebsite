import { test, expect } from '@playwright/test';

test.describe('Event Hub', () => {
  async function openFirstEventHub(page: import('@playwright/test').Page) {
    await page.goto('/events');
    const details = page.getByRole('link', { name: 'Event details' }).first();
    await expect(details).toBeVisible({ timeout: 20000 });
    await details.click();
    await expect(page.getByTestId('event-hub-shell')).toBeVisible({ timeout: 20000 });
  }

  test('loads event hub shell from events list', async ({ page }) => {
    await openFirstEventHub(page);
    await expect(page.getByTestId('event-hub-header')).toBeVisible();
    await expect(page.getByTestId('event-hub-overview')).toBeVisible();
    await expect(page.getByTestId('event-hub-entries')).toBeVisible();
    await expect(page.getByTestId('event-hub-nav')).toBeVisible();
  });

  test('shows register and add to calendar controls', async ({ page }) => {
    await openFirstEventHub(page);
    await expect(page.getByTestId('event-hub-register')).toBeVisible();
    const calendar = page.getByTestId('add-to-calendar');
    if (await calendar.isVisible()) {
      await calendar.click();
      await expect(page.getByTestId('download-ics')).toBeVisible();
    }
  });

  test('opens registration modal without submitting', async ({ page }) => {
    await openFirstEventHub(page);
    const register = page.getByTestId('event-hub-register');
    if (await register.isEnabled()) {
      await register.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('missing event shows not found state', async ({ page }) => {
    await page.goto('/events/nonexistent-event-hub-test-id');
    await expect(page.getByTestId('event-not-found')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('event-not-found')).toContainText(/Event not found/i);
  });

  test('375px layout avoids horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await openFirstEventHub(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(12);
  });
});
