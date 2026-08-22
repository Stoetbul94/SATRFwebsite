import { test, expect } from '@playwright/test';

const SECOND_PRINT_ID =
  'issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026';
const FIRST_PRINT_ID =
  'issf-rule-book-2026-edition-2025-first-print-12-2025-effective-1-january-2026';
const SECOND_PRINT_PATH =
  '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf';

test.describe('Rule Viewer security', () => {
  test('blocks unknown PDF before PDF.js loads', async ({ page }) => {
    await page.goto('/rules/view?file=/documents/issf/totally-unknown.pdf&page=1');
    await expect(page.getByTestId('viewer-invalid-document')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rule document unavailable' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Rule Finder' })).toBeVisible();
    await expect(page.getByTestId('rules-pdf-viewer')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Open original PDF/i })).toHaveCount(0);
  });

  test('blocks path traversal before PDF.js loads', async ({ page }) => {
    await page.goto('/rules/view?file=/documents/issf/../../../etc/passwd.pdf&page=1');
    await expect(page.getByTestId('viewer-invalid-document')).toBeVisible();
    await expect(page.getByTestId('rules-pdf-viewer')).toHaveCount(0);
  });

  test('blocks encoded traversal', async ({ page }) => {
    await page.goto(
      '/rules/view?file=' +
        encodeURIComponent('/documents/issf/%2e%2e/%2e%2e/etc/passwd.pdf') +
        '&page=1',
    );
    await expect(page.getByTestId('viewer-invalid-document')).toBeVisible();
    await expect(page.getByTestId('rules-pdf-viewer')).toHaveCount(0);
  });
});

test.describe('Rule Viewer page edges', () => {
  test('clamps invalid page values safely', async ({ page }) => {
    await page.goto(`/rules/view?document=${SECOND_PRINT_ID}&page=0`);
    await expect(page.getByTestId('rules-pdf-viewer')).toBeVisible({ timeout: 25000 });
    await expect(page.getByTestId('viewer-page-count')).toHaveText(/Page 1 of \d+/);

    await page.goto(`/rules/view?document=${SECOND_PRINT_ID}&page=abc`);
    await expect(page.getByTestId('viewer-page-count')).toHaveText(/Page 1 of \d+/, {
      timeout: 25000,
    });

    await page.goto(`/rules/view?document=${SECOND_PRINT_ID}&page=99999`);
    await expect(page.getByTestId('viewer-page-count')).toHaveText(/Page \d+ of \d+/, {
      timeout: 25000,
    });
    const text = await page.getByTestId('viewer-page-count').textContent();
    const match = text?.match(/Page (\d+) of (\d+)/);
    expect(match).toBeTruthy();
    expect(Number(match![1])).toBe(Number(match![2]));
  });
});

test.describe('Rule Viewer metadata', () => {
  test('shows current rulebook title, CURRENT badge, and page count', async ({ page }) => {
    await page.goto(`/rules/view?document=${SECOND_PRINT_ID}&page=342&rule=7.7.4&heading=Test`);
    await expect(page.getByTestId('viewer-document-title')).toBeVisible({ timeout: 25000 });
    await expect(page.getByTestId('viewer-status-current')).toBeVisible();
    await expect(page.getByTestId('viewer-edition')).toBeVisible();
    await expect(page.getByTestId('viewer-page-count')).toHaveText(/Page 342 of \d+/);
    await expect(page.getByRole('link', { name: 'Download Rule Book' })).toHaveAttribute(
      'href',
      SECOND_PRINT_PATH,
    );
    await expect(page.getByRole('link', { name: 'Download Rule Book' })).toHaveAttribute(
      'download',
    );
  });

  test('shows archive badge for superseded document', async ({ page }) => {
    await page.goto(`/rules/view?document=${FIRST_PRINT_ID}&page=1`);
    await expect(page.getByTestId('viewer-status-archive')).toBeVisible({ timeout: 25000 });
    await expect(page.getByText(/retained for reference/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Current Rule Book' })).toBeVisible();
  });
});

test.describe('Rule Viewer mobile', () => {
  test('375px layout has no overflow and usable controls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto(`/rules/view?document=${SECOND_PRINT_ID}&page=1`);
    await expect(page.getByTestId('rules-pdf-viewer')).toBeVisible({ timeout: 25000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(12);
    for (const name of ['Back to Rule Finder', 'Prev', 'Next', 'Download Rule Book']) {
      const btn = page.getByRole('link', { name }).or(page.getByRole('button', { name }));
      const box = await btn.first().boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
    }
  });
});

test.describe('Rule Viewer search journeys', () => {
  test('3P timing opens trusted document at page 342', async ({ page }) => {
    await page.goto('/rules?q=3P+timing');
    await expect(page.getByText(/matching rule section/i)).toBeVisible({ timeout: 15000 });
    const open = page.getByRole('link', { name: /Open at page|Open rule \(page/i }).first();
    await expect(open).toHaveAttribute('href', new RegExp(`document=${SECOND_PRINT_ID}`));
    await open.click();
    await expect(page).toHaveURL(new RegExp(`document=${SECOND_PRINT_ID}`));
    await expect(page.getByTestId('viewer-page-count')).toHaveText(/Page 342 of \d+/, {
      timeout: 25000,
    });
  });
});
