import { test, expect } from '@playwright/test';

test.describe('Coaching Page', () => {
  test('loads with the current development H1', async ({ page }) => {
    await page.goto('/coaching');
    await expect(page).toHaveURL(/\/coaching/);
    await expect(page).toHaveTitle(/Coaching/i);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coaching & Athlete Development');
  });

  test('is reachable from main navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Coaching' }).first()).toHaveAttribute(
      'href',
      '/coaching'
    );
  });

  test('shows current development focus areas', async ({ page }) => {
    await page.goto('/coaching');
    await expect(page.getByRole('heading', { name: 'Development focus areas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Technical rifle fundamentals' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Competition preparation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mental preparation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Performance analysis' })).toBeVisible();
  });

  test('contact CTA targets the contact form with coaching service', async ({ page }) => {
    await page.goto('/coaching');
    const contactCta = page.getByRole('link', { name: 'Contact SATRF about coaching' }).first();
    await expect(contactCta).toBeVisible();
    await expect(contactCta).toHaveAttribute('href', '/contact?service=coaching');
  });

  test('insights CTA targets /insights', async ({ page }) => {
    await page.goto('/coaching');
    const insightsCta = page.getByRole('link', { name: 'View training insights' }).first();
    await expect(insightsCta).toBeVisible();
    await expect(insightsCta).toHaveAttribute('href', '/insights');
  });

  test('does not publish removed placeholder coach profiles', async ({ page }) => {
    await page.goto('/coaching');
    await expect(page.getByText('Sarah van der Merwe')).toHaveCount(0);
    await expect(page.getByText('Michael Botha')).toHaveCount(0);
  });

  test('contact CTA is keyboard-focusable', async ({ page }) => {
    await page.goto('/coaching');
    const contactCta = page.getByRole('link', { name: 'Contact SATRF about coaching' }).first();
    await contactCta.focus();
    await expect(contactCta).toBeFocused();
  });

  test('has no obvious horizontal overflow on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/coaching');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(8);
  });
});
