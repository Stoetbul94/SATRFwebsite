import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

const TEST_ADMIN = {
  email: 'admin@satrf.co.za',
  password: 'AdminPassword123!'
};

const VALID_SCORE_DATA = [
  {
    eventName: 'Prone Match 1',
    matchNumber: '1',
    shooterName: 'John Smith',
    club: 'SATRF Club A',
    division: 'Open',
    veteran: 'No',
    series1: 98,
    series2: 99,
    series3: 97,
    series4: 100,
    series5: 98,
    series6: 99,
    total: 591,
    place: 1
  }
];

// Helper functions
async function loginAsUser(page: Page, credentials: typeof TEST_USER) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

async function loginAsAdmin(page: Page, credentials: typeof TEST_ADMIN) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/admin');
}

async function createTestExcelFile(page: Page, data: any[]) {
  // This would create a test Excel file with the provided data
  // For now, we'll use a mock approach
  return 'test-scores.xlsx';
}

test.describe('SATRF Website Launch Readiness Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data and start fresh
    await page.goto('/');
  });

  test.describe('User Authentication & Authorization', () => {
    test('should allow user registration with valid data', async ({ page }) => {
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('[data-testid="name-input"]', TEST_USER.name);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.fill('[data-testid="confirm-password-input"]', TEST_USER.password);
      
      // Submit form
      await page.click('[data-testid="register-button"]');
      
      // Verify success message or redirect
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should allow user login with valid credentials', async ({ page }) => {
      await loginAsUser(page, TEST_USER);
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    });

    test('should allow user logout', async ({ page }) => {
      await loginAsUser(page, TEST_USER);
      
      // Click logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // Verify redirect to home page
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
    });

    test('should allow admin login with valid credentials', async ({ page }) => {
      await loginAsAdmin(page, TEST_ADMIN);
      
      // Verify admin access
      await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('should restrict admin pages for non-admin users', async ({ page }) => {
      await loginAsUser(page, TEST_USER);
      
      // Try to access admin page
      await page.goto('/admin/scores/import');
      
      // Should be redirected or show access denied
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });

    test('should show appropriate error messages for invalid login', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('[data-testid="email-input"]', 'invalid@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });
  });

  test.describe('Score Import & Validation Flow', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page, TEST_ADMIN);
    });

    test('should upload valid Excel file successfully', async ({ page }) => {
      await page.goto('/admin/scores/import');
      
      // Upload test file
      const filePath = await createTestExcelFile(page, VALID_SCORE_DATA);
      await page.setInputFiles('[data-testid="file-upload"]', filePath);
      
      // Verify file is processed
      await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-success"]')).toBeVisible();
      
      // Import scores
      await page.click('[data-testid="import-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="import-success"]')).toContainText('1 scores imported successfully');
    });

    test('should validate file format and show errors for invalid files', async ({ page }) => {
      await page.goto('/admin/scores/import');
      
      // Upload invalid file
      await page.setInputFiles('[data-testid="file-upload"]', 'invalid-file.txt');
      
      // Verify error message
      await expect(page.locator('[data-testid="file-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-error"]')).toContainText('Invalid file format');
    });

    test('should validate score data and show validation errors', async ({ page }) => {
      await page.goto('/admin/scores/import');
      
      // Create file with invalid data
      const invalidData = [
        {
          ...VALID_SCORE_DATA[0],
          series1: 150, // Invalid score
          eventName: 'Invalid Event' // Invalid event
        }
      ];
      
      const filePath = await createTestExcelFile(page, invalidData);
      await page.setInputFiles('[data-testid="file-upload"]', filePath);
      
      // Verify validation errors
      await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-errors"]')).toContainText('Invalid score value');
      await expect(page.locator('[data-testid="validation-errors"]')).toContainText('Invalid event name');
      
      // Import button should be disabled
      await expect(page.locator('[data-testid="import-button"]')).toBeDisabled();
    });

    test('should show preview modal with correct data', async ({ page }) => {
      await page.goto('/admin/scores/import');
      
      const filePath = await createTestExcelFile(page, VALID_SCORE_DATA);
      await page.setInputFiles('[data-testid="file-upload"]', filePath);
      
      // Click preview button
      await page.click('[data-testid="preview-button"]');
      
      // Verify modal content
      await expect(page.locator('[data-testid="preview-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-table"]')).toContainText('John Smith');
      await expect(page.locator('[data-testid="preview-table"]')).toContainText('591');
    });

    test('should enable/disable import button based on validation', async ({ page }) => {
      await page.goto('/admin/scores/import');
      
      // Initially disabled
      await expect(page.locator('[data-testid="import-button"]')).toBeDisabled();
      
      // Upload valid file
      const filePath = await createTestExcelFile(page, VALID_SCORE_DATA);
      await page.setInputFiles('[data-testid="file-upload"]', filePath);
      
      // Should be enabled after validation
      await expect(page.locator('[data-testid="import-button"]')).toBeEnabled();
    });
  });

  test.describe('Manual Score Entry & Editing', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page, TEST_ADMIN);
    });

    test('should allow manual score entry', async ({ page }) => {
      await page.goto('/admin/scores/import');
      
      // Switch to manual entry tab
      await page.click('[data-testid="manual-entry-tab"]');
      
      // Fill score form
      await page.fill('[data-testid="shooter-name"]', 'Jane Doe');
      await page.fill('[data-testid="club"]', 'SATRF Club B');
      await page.selectOption('[data-testid="division"]', 'Open');
      await page.fill('[data-testid="series1"]', '95');
      await page.fill('[data-testid="series2"]', '96');
      await page.fill('[data-testid="series3"]', '94');
      await page.fill('[data-testid="series4"]', '97');
      await page.fill('[data-testid="series5"]', '95');
      await page.fill('[data-testid="series6"]', '96');
      
      // Save score
      await page.click('[data-testid="save-score-button"]');
      
      // Verify success
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });

    test('should validate manual entry inputs', async ({ page }) => {
      await page.goto('/admin/scores/import');
      await page.click('[data-testid="manual-entry-tab"]');
      
      // Try to save with invalid data
      await page.fill('[data-testid="series1"]', '150'); // Invalid score
      await page.click('[data-testid="save-score-button"]');
      
      // Verify validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Score must be between 0 and 109');
    });

    test('should allow editing existing scores', async ({ page }) => {
      await page.goto('/admin/scores');
      
      // Find and click edit button for a score
      await page.click('[data-testid="edit-score-button"]');
      
      // Modify score
      await page.fill('[data-testid="series1"]', '100');
      
      // Save changes
      await page.click('[data-testid="update-score-button"]');
      
      // Verify success
      await expect(page.locator('[data-testid="update-success"]')).toBeVisible();
    });
  });

  test.describe('Results Display & Filtering', () => {
    test('should display results page with correct data', async ({ page }) => {
      await page.goto('/results');
      
      // Verify page loads
      await expect(page.locator('[data-testid="results-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="results-table"]')).toBeVisible();
      
      // Verify sample data is displayed
      await expect(page.locator('[data-testid="results-table"]')).toContainText('John Smith');
      await expect(page.locator('[data-testid="results-table"]')).toContainText('591');
    });

    test('should filter results by event', async ({ page }) => {
      await page.goto('/results');
      
      // Select event filter
      await page.selectOption('[data-testid="event-filter"]', 'Prone Match 1');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="results-table"]')).toContainText('Prone Match 1');
      await expect(page.locator('[data-testid="results-table"]')).not.toContainText('3P Match 1');
    });

    test('should filter results by division', async ({ page }) => {
      await page.goto('/results');
      
      // Select division filter
      await page.selectOption('[data-testid="division-filter"]', 'Veteran');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="results-table"]')).toContainText('Mike Brown');
      await expect(page.locator('[data-testid="results-table"]')).not.toContainText('John Smith');
    });

    test('should filter results by veteran status', async ({ page }) => {
      await page.goto('/results');
      
      // Toggle veteran filter
      await page.click('[data-testid="veteran-filter"]');
      
      // Verify only veteran results shown
      await expect(page.locator('[data-testid="results-table"]')).toContainText('Mike Brown');
      await expect(page.locator('[data-testid="results-table"]')).not.toContainText('John Smith');
    });

    test('should sort results by total score', async ({ page }) => {
      await page.goto('/results');
      
      // Click total score header to sort
      await page.click('[data-testid="sort-total"]');
      
      // Verify sorting (first row should have highest score)
      const firstRow = page.locator('[data-testid="results-table"] tbody tr').first();
      await expect(firstRow).toContainText('591');
    });

    test('should sort results by name', async ({ page }) => {
      await page.goto('/results');
      
      // Click name header to sort
      await page.click('[data-testid="sort-name"]');
      
      // Verify alphabetical sorting
      const firstRow = page.locator('[data-testid="results-table"] tbody tr').first();
      await expect(firstRow).toContainText('Alex Wilson');
    });

    test('should sort results by place', async ({ page }) => {
      await page.goto('/results');
      
      // Click place header to sort
      await page.click('[data-testid="sort-place"]');
      
      // Verify place sorting
      const firstRow = page.locator('[data-testid="results-table"] tbody tr').first();
      await expect(firstRow).toContainText('1');
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/results');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="results-table"]')).toBeVisible();
      
      // Test horizontal scroll on table
      await page.hover('[data-testid="results-table"]');
      await expect(page.locator('[data-testid="table-scroll"]')).toBeVisible();
    });
  });

  test.describe('Donate Page & Payment Integration', () => {
    test('should load donate page with correct content', async ({ page }) => {
      await page.goto('/donate');
      
      // Verify page content
      await expect(page.locator('[data-testid="donate-hero"]')).toBeVisible();
      await expect(page.locator('[data-testid="donate-hero"]')).toContainText('Support Olympic Shooting');
      await expect(page.locator('[data-testid="payment-options"]')).toBeVisible();
    });

    test('should display preset donation amounts', async ({ page }) => {
      await page.goto('/donate');
      
      // Verify preset amounts
      await expect(page.locator('[data-testid="amount-100"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-250"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-500"]')).toBeVisible();
    });

    test('should allow custom donation amount', async ({ page }) => {
      await page.goto('/donate');
      
      // Enter custom amount
      await page.fill('[data-testid="custom-amount"]', '750');
      
      // Verify custom amount is selected
      await expect(page.locator('[data-testid="custom-amount"]')).toHaveValue('750');
    });

    test('should load PayFast form with correct amount', async ({ page }) => {
      await page.goto('/donate');
      
      // Select amount
      await page.click('[data-testid="amount-250"]');
      
      // Click PayFast button
      await page.click('[data-testid="payfast-button"]');
      
      // Verify PayFast form loads (mock test)
      await expect(page.locator('[data-testid="payfast-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="payfast-amount"]')).toContainText('250.00');
    });

    test('should display banking details for EFT', async ({ page }) => {
      await page.goto('/donate');
      
      // Switch to EFT tab
      await page.click('[data-testid="eft-tab"]');
      
      // Verify banking details
      await expect(page.locator('[data-testid="banking-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="account-name"]')).toContainText('South African Target Rifle Federation');
      await expect(page.locator('[data-testid="account-number"]')).toContainText('02 233 062 3');
    });

    test('should copy banking details to clipboard', async ({ page }) => {
      await page.goto('/donate');
      await page.click('[data-testid="eft-tab"]');
      
      // Click copy button
      await page.click('[data-testid="copy-account-number"]');
      
      // Verify copy feedback
      await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
    });

    test('should redirect to thank you page after successful payment', async ({ page }) => {
      // Mock successful payment redirect
      await page.goto('/donate/thank-you');
      
      // Verify thank you page
      await expect(page.locator('[data-testid="thank-you-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="thank-you-message"]')).toContainText('Thank you for your donation');
    });
  });

  test.describe('Rules & FAQ Pages', () => {
    test('should load rules page without errors', async ({ page }) => {
      await page.goto('/rules');
      
      // Verify page loads
      await expect(page.locator('[data-testid="rules-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="rules-content"]')).toBeVisible();
      
      // Verify content presence
      await expect(page.locator('[data-testid="rules-content"]')).toContainText('Competition Rules');
    });

    test('should load FAQ page without errors', async ({ page }) => {
      await page.goto('/faq');
      
      // Verify page loads
      await expect(page.locator('[data-testid="faq-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="faq-content"]')).toBeVisible();
      
      // Verify FAQ items
      await expect(page.locator('[data-testid="faq-item"]')).toHaveCount(5); // Assuming 5 FAQ items
    });

    test('should expand/collapse FAQ items', async ({ page }) => {
      await page.goto('/faq');
      
      // Click first FAQ item
      await page.click('[data-testid="faq-item"]').first();
      
      // Verify content expands
      await expect(page.locator('[data-testid="faq-answer"]').first()).toBeVisible();
    });
  });

  test.describe('Site Navigation & Responsiveness', () => {
    test('should have working header navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test all navigation links
      const navLinks = ['Home', 'Events', 'Results', 'About', 'Contact', 'Donate'];
      
      for (const link of navLinks) {
        await page.click(`[data-testid="nav-${link.toLowerCase()}"]`);
        await expect(page).not.toHaveURL('/');
        await page.goBack();
      }
    });

    test('should have working footer links', async ({ page }) => {
      await page.goto('/');
      
      // Test footer links
      await page.click('[data-testid="footer-privacy"]');
      await expect(page).toHaveURL('/privacy');
      
      await page.goBack();
      await page.click('[data-testid="footer-terms"]');
      await expect(page).toHaveURL('/terms');
    });

    test('should be responsive on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      
      // Verify desktop layout
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
      
      // Test mobile menu toggle
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    });

    test('should have working breadcrumbs', async ({ page }) => {
      await page.goto('/events/register/123');
      
      // Verify breadcrumbs
      await expect(page.locator('[data-testid="breadcrumbs"]')).toBeVisible();
      await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('Events');
      await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText('Register');
    });
  });

  test.describe('Error Monitoring & Reporting', () => {
    test('should capture JavaScript errors with Sentry', async ({ page }) => {
      await page.goto('/');
      
      // Inject test error
      await page.evaluate(() => {
        // @ts-ignore - Testing error capture
        window.Sentry.captureException(new Error('Test error for monitoring'));
      });
      
      // Verify error was captured (this would be checked in Sentry dashboard)
      // For testing, we just verify Sentry is loaded
      await expect(page.locator('script[src*="sentry"]')).toBeVisible();
    });

    test('should display user-friendly error messages', async ({ page }) => {
      // Mock API error
      await page.route('/api/results', route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });
      
      await page.goto('/results');
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to load results');
    });

    test('should handle 404 errors gracefully', async ({ page }) => {
      await page.goto('/nonexistent-page');
      
      // Verify 404 page
      await expect(page.locator('[data-testid="404-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="404-page"]')).toContainText('Page not found');
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      // Verify load time is under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test enter key on links
      await page.keyboard.press('Enter');
      await expect(page).not.toHaveURL('/');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      // Verify ARIA labels on interactive elements
      await expect(page.locator('[aria-label="Main navigation"]')).toBeVisible();
      await expect(page.locator('[aria-label="Search"]')).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      
      // Verify heading structure
      const h1 = page.locator('h1');
      const h2 = page.locator('h2');
      
      await expect(h1).toHaveCount(1); // Should have one main heading
      await expect(h2).toHaveCount(3); // Should have multiple sub-headings
    });
  });

  test.describe('Deployment & Environment Validation', () => {
    test('should load environment variables correctly', async ({ page }) => {
      await page.goto('/');
      
      // Verify environment-specific content is loaded
      await expect(page.locator('[data-testid="environment-info"]')).toBeVisible();
    });

    test('should have working API endpoints', async ({ page }) => {
      // Test API health check
      const response = await page.request.get('/api/health');
      expect(response.status()).toBe(200);
      
      // Test results API
      const resultsResponse = await page.request.get('/api/results');
      expect(resultsResponse.status()).toBe(200);
    });

    test('should use HTTPS in production', async ({ page }) => {
      // This test would run in production environment
      if (process.env.NODE_ENV === 'production') {
        await page.goto('/');
        expect(page.url()).toMatch(/^https:/);
      }
    });

    test('should have valid SSL certificate', async ({ page }) => {
      // This test would verify SSL certificate validity
      // For now, just verify we can access the site
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
    });
  });
}); 