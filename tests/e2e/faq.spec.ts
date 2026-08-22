import { test, expect } from '@playwright/test';

test.describe('FAQ page', () => {
  test('loads with the expected H1 and canonical FAQ content', async ({ page }) => {
    await page.goto('/faq');
    await expect(page).toHaveURL(/\/faq/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Target Rifle Shooting FAQs');
    await expect(page.getByRole('heading', { name: 'About SATRF' })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'What is the South African Target Rifle Federation (SATRF)?',
      })
    ).toBeVisible();
  });

  test('expands and collapses a native FAQ details item', async ({ page }) => {
    await page.goto('/faq');
    const item = page.locator('details').first();
    await expect(item).toBeVisible();
    await expect(item).not.toHaveAttribute('open');
    await item.locator('summary').click();
    await expect(item).toHaveAttribute('open');
    await item.locator('summary').click();
    await expect(item).not.toHaveAttribute('open');
  });

  test('internal FAQ links point at live SATRF routes', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('a[href="/events/calendar"]').first()).toBeAttached();
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Home' })
    ).toHaveAttribute('href', '/');
  });
});

test.describe('Homepage FAQ', () => {
  test('shows featured FAQs and links to /faq', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Frequently asked questions' })
    ).toBeVisible();
    const viewAll = page.getByRole('link', { name: 'View all FAQs' });
    await expect(viewAll).toHaveAttribute('href', '/faq');
    await expect(page.getByText('Meet our Olympic athletes')).toHaveCount(0);
    await expect(page.getByText('OLYMPIC TEAM')).toHaveCount(0);
  });
});
