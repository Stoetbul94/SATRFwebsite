import { test, expect } from '@playwright/test';

test.describe('Rules Finder', () => {
  test('loads the rule finder heading and search', async ({ page }) => {
    await page.goto('/rules');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ISSF Rules & Rule Finder');
    await expect(page.getByLabel('Search ISSF rifle rules')).toBeVisible();
  });

  test('initialises search from the URL', async ({ page }) => {
    await page.goto('/rules?q=jacket');
    await expect(page.getByLabel('Search ISSF rifle rules')).toHaveValue('jacket');
    await expect(page.getByText(/matching rule section/i)).toBeVisible({ timeout: 15000 });
  });

  test('shows empty state for nonsense queries', async ({ page }) => {
    await page.goto('/rules?q=xyznonexistent123');
    await expect(page.getByText(/No rules found for “xyznonexistent123”/i)).toBeVisible({
      timeout: 15000,
    });
  });

  test('search remains usable at a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto('/rules');
    const search = page.getByLabel('Search ISSF rifle rules');
    await expect(search).toBeVisible();
    await search.fill('jacket');
    await expect(page.getByText(/matching rule section/i)).toBeVisible({ timeout: 15000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(12);
  });
});
