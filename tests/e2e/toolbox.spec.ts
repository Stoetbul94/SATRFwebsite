import { test, expect } from '@playwright/test';

const toolboxEnabled = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

test.describe('SATRF Toolbox', () => {
  test('toolbox nav link is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Toolbox' }).first()).toBeVisible();
  });
});

test.describe('SATRF Toolbox — disabled (no ANTHROPIC_API_KEY)', () => {
  test.skip(toolboxEnabled, 'Skipped when ANTHROPIC_API_KEY is configured');

  test('does not render the global launcher', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('toolbox-launcher')).toHaveCount(0);
  });

  test('renders coming-soon cards on /toolbox', async ({ page }) => {
    await page.goto('/toolbox');
    await expect(page.getByTestId('toolbox-page')).toBeVisible();
    await expect(page.getByText('Range Officer')).toBeVisible();
    await expect(page.getByText('Match Analyst')).toBeVisible();
    await expect(page.getByTestId('toolbox-coming-soon-card')).toHaveCount(2);
    await expect(page.getByTestId('toolbox-open-range-officer')).toHaveCount(0);
    await expect(page.getByTestId('toolbox-disabled-notice')).toBeVisible();
  });

  test('deep link shows coming-soon state without panel', async ({ page }) => {
    await page.goto('/toolbox/range-officer');
    await expect(page.getByTestId('toolbox-tool-coming-soon')).toBeVisible();
    await expect(page.getByTestId('toolbox-panel')).toHaveCount(0);
  });

  test('hides Ask the Range Officer link on rules page', async ({ page }) => {
    await page.goto('/rules');
    await expect(page.getByText('Ask the Range Officer')).toHaveCount(0);
  });
});

test.describe('SATRF Toolbox — enabled (ANTHROPIC_API_KEY set)', () => {
  test.skip(!toolboxEnabled, 'Requires ANTHROPIC_API_KEY in the test environment');

  test('shows the global launcher on the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('toolbox-launcher')).toBeVisible();
  });

  test('renders the toolbox page with Range Officer open button', async ({ page }) => {
    await page.goto('/toolbox');
    await expect(page.getByTestId('toolbox-open-range-officer')).toBeVisible();
  });

  test('deep link page opens the toolbox panel', async ({ page }) => {
    await page.goto('/toolbox/range-officer');
    await expect(page.getByTestId('toolbox-tool-page')).toBeVisible();
    await expect(page.getByTestId('toolbox-panel')).toBeVisible();
  });

  test('launcher on rules page opens Range Officer directly', async ({ page }) => {
    await page.goto('/rules');
    await page.getByTestId('toolbox-launcher').click();
    await expect(page.getByTestId('toolbox-panel')).toBeVisible();
    await expect(page.getByTestId('toolbox-chat-input')).toBeVisible();
  });
});
