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
    const openRule = page.getByRole('link', { name: 'Open rule' }).first();
    const download = page.getByRole('link', { name: 'Download Rule Book' }).first();
    await expect(openRule).toBeVisible();
    await expect(download).toBeVisible();
    const openBox = await openRule.boundingBox();
    const downloadBox = await download.boundingBox();
    expect(openBox?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(downloadBox?.height ?? 0).toBeGreaterThanOrEqual(40);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(12);
  });

  test('separates Open, Download, and official source for the current rulebook', async ({
    page,
  }) => {
    await page.goto('/rules');
    const card = page.getByTestId('current-rulebook');
    const open = card.getByRole('link', { name: 'Open Rule Book' });
    const download = card.getByRole('link', { name: 'Download PDF' });
    const official = card.getByRole('link', { name: 'View on ISSF' });
    await expect(open).toHaveAttribute(
      'href',
      '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf',
    );
    await expect(open).not.toHaveAttribute('download');
    await expect(download).toHaveAttribute(
      'href',
      '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf',
    );
    await expect(download).toHaveAttribute('download');
    await expect(official).toHaveAttribute('href', 'https://www.issf-sports.org/rules');
  });

  test('search result download is the full current rulebook, not a rule-number file', async ({
    page,
  }) => {
    await page.goto('/rules?q=7.7.4');
    await expect(page.getByText(/matching rule section/i)).toBeVisible({ timeout: 15000 });
    const open = page.getByRole('link', { name: /Open PDF at page/i }).first();
    const download = page.getByRole('link', { name: 'Download Rule Book' }).first();
    const official = page.getByRole('link', { name: 'Official ISSF Source' }).first();
    await expect(open).toHaveAttribute('href', /#page=\d+/);
    await expect(download).toHaveAttribute(
      'href',
      '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf',
    );
    await expect(download).not.toHaveAttribute('href', /#page=/);
    await expect(download).toHaveAttribute('download');
    await expect(official).toHaveAttribute('href', /issf-sports\.org/);
  });
});
