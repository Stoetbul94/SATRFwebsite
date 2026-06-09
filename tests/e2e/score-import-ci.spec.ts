import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const SERIES_SCORES = [100.5, 98.2, 101.0, 99.8, 100.1, 97.9];
const EXPECTED_TOTAL = SERIES_SCORES.reduce((a, b) => a + b, 0); // 597.5

function createMatchWorkbook(filename: string): string {
  const headers = [
    'Date',
    'Event Name',
    'Discipline',
    'Shooter Name',
    'Club',
    'Category',
    'S1 Dec',
    'S2 Dec',
    'S3 Dec',
    'S4 Dec',
    'S5 Dec',
    'S6 Dec',
  ];
  const dataRow = [
    '2024-03-15',
    'Prone Match 1',
    'prone_50m',
    'John Doe',
    'SATRF Club A',
    'open',
    ...SERIES_SCORES,
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, dataRow]);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prone 50m');

  const filePath = path.join(__dirname, filename);
  XLSX.writeFile(workbook, filePath);
  return filePath;
}

async function setupAdminPage(page: Page, context: BrowserContext) {
  await context.addCookies([
    { name: 'access_token', value: 'mock-admin-token', url: 'http://localhost:3000' },
    { name: 'auth_token', value: 'mock-admin-token', url: 'http://localhost:3000' },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem('__e2e_admin_bypass__', '1');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        club: 'SATRF',
      }),
    );
    localStorage.setItem('access_token', 'mock-admin-token');
    localStorage.setItem('auth_token', 'mock-admin-token');
  });

  await context.route('**/api/admin/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [
          {
            id: 'member-1',
            firstName: 'Jane',
            lastName: 'Member',
            club: 'SATRF Club A',
            status: 'active',
          },
        ],
      }),
    });
  });

  await context.route('**/api/admin/events**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        events: [{ id: 'event-1', title: 'Prone Match 1', date: '2024-03-15' }],
      }),
    });
  });
}

test.describe('Score import — main CI', () => {
  let excelFile: string;

  test.beforeAll(() => {
    excelFile = createMatchWorkbook('ci-import-scores.xlsx');
  });

  test.afterAll(() => {
    if (fs.existsSync(excelFile)) {
      fs.unlinkSync(excelFile);
    }
  });

  test('Excel upload: parse, preview, and POST /api/admin/scores/import', async ({ page, context }) => {
    await setupAdminPage(page, context);

    let importBody = '';
    await context.route('**/api/admin/scores/import', async (route) => {
      importBody = route.request().postData() || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Successfully imported 1 scores',
          data: { imported: 1, errors: 0 },
        }),
      });
    });

    await page.goto('/admin/scores/import');
    await expect(page.getByRole('heading', { name: 'Score Import & Entry' })).toBeVisible();

    const uploadEvent = page.getByLabel('Event (links all rows)');
    await expect(uploadEvent.locator('option', { hasText: 'Prone Match 1' })).toHaveCount(1, {
      timeout: 15_000,
    });
    await uploadEvent.selectOption({ label: 'Prone Match 1' });
    await page.locator('#file-input').setInputFiles(excelFile);

    await expect(page.getByText(/1 rows · 1 valid/)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.getByText('John Doe')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    await page.getByRole('button', { name: /import 1 score/i }).click();
    await expect(page.getByText('Import Successful').first()).toBeVisible({ timeout: 15_000 });

    expect(importBody).toContain('John Doe');
    expect(importBody).toContain('prone_50m');
  });

  test('Manual entry: validation, grand total, and POST /api/admin/scores', async ({ page, context }) => {
    await setupAdminPage(page, context);

    let scoresBody = '';
    await context.route('**/api/admin/scores', async (route) => {
      if (route.request().method() === 'POST') {
        scoresBody = route.request().postData() || '';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Saved 1 score(s)' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/scores/import');
    await page.getByRole('tab', { name: 'Manual Entry' }).click();
    await expect(page.getByText('Discipline')).toBeVisible();

    const manual = page.getByRole('tabpanel', { name: 'Manual Entry' });

    // Validation: empty save surfaces an error before we fill the form
    await manual.getByRole('button', { name: /save 0 score/i }).click();
    await expect(page.getByText(/select an event|event name is required/i).first()).toBeVisible();
    await page.evaluate(() => {
      document.querySelectorAll('[id^="toast"]').forEach((el) => el.remove());
    });

    await manual.getByLabel(/^Event/).selectOption('__custom__');
    await manual.getByPlaceholder('Event name (required if not selected above)').fill('Prone Match 1');
    await manual.getByLabel(/^Member/).selectOption('__guest__');
    await manual.getByPlaceholder('First Last').fill('John Doe');
    await manual.getByLabel(/^Club/).fill('SATRF Club A');

    const decimalInputs = manual.locator('input[placeholder="decimal"]');
    await expect(decimalInputs).toHaveCount(6);
    for (let i = 0; i < SERIES_SCORES.length; i++) {
      await decimalInputs.nth(i).fill(String(SERIES_SCORES[i]));
    }

    await expect(manual.getByText(new RegExp(`Qual total: ${EXPECTED_TOTAL.toFixed(1)}`))).toBeVisible();

    await manual.getByRole('button', { name: /save 1 score/i }).click();
    await expect(page.getByText('Saved 1 score(s)').first()).toBeVisible({ timeout: 15_000 });

    expect(scoresBody).toContain('John Doe');
    expect(scoresBody).toContain('SATRF Club A');
    expect(scoresBody).toContain('Prone Match 1');
  });
});
