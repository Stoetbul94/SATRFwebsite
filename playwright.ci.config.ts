import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal Playwright config for main CI — score import smoke only.
 * No globalSetup; tests mock auth/API via page.route + localStorage.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'score-import-ci.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  timeout: 60_000,
  expect: { timeout: 15_000 },
});
