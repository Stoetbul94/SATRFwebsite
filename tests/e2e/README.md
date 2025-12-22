# SATRF Website E2E Test Suite

This directory contains comprehensive End-to-End (E2E) tests for the SATRF website using Playwright. The test suite covers all major user workflows including authentication, events management, coaching services, leaderboards, rules documentation, and donation processing.

## 📋 Test Coverage

### Core User Flows
- **Authentication** (`auth.spec.ts`)
  - User registration, login, logout
  - Profile management
  - Protected route access
  - Form validation and error handling

- **Events Calendar** (`events-calendar.spec.ts`)
  - Event browsing and filtering
  - Event registration/unregistration
  - Calendar view navigation
  - Search functionality

- **Coaching Page** (`coaching.spec.ts`)
  - Coach profiles and information
  - Service descriptions
  - Contact and booking flows
  - Responsive design

- **Leaderboard** (`leaderboard.spec.ts`)
  - Player rankings display
  - Sorting and filtering
  - Pagination
  - Performance with large datasets

- **Rules Page** (`rules.spec.ts`)
  - Content navigation
  - Search and filtering
  - Document downloads
  - Navbar presence verification

- **Donate Page** (`donate.spec.ts`)
  - Donation form functionality
  - Payment method selection
  - PayFast integration
  - EFT banking details
  - Success/failure flows

### Cross-Cutting Concerns
- **Responsive Design**: Mobile, tablet, and desktop viewports
- **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
- **Performance**: Load times, API response handling
- **Error Handling**: API failures, validation errors, user notifications
- **Security**: HTTPS, data validation, sensitive information protection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- SATRF website running on `http://localhost:3000`

### Installation
```bash
# Install dependencies (if not already installed)
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

#### Run All Tests
```bash
npm run test:e2e
```

#### Run Specific Test File
```bash
npx playwright test auth.spec.ts
```

#### Run Tests in UI Mode
```bash
npm run test:e2e:ui
```

#### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### Run Mobile Tests
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

#### Run Tests in Headed Mode
```bash
npx playwright test --headed
```

#### Run Tests with Debug Mode
```bash
npx playwright test --debug
```

## 📁 Project Structure

```
tests/e2e/
├── auth.spec.ts                 # Authentication tests
├── events-calendar.spec.ts      # Events calendar tests
├── coaching.spec.ts             # Coaching page tests
├── leaderboard.spec.ts          # Leaderboard tests
├── rules.spec.ts               # Rules page tests
├── donate.spec.ts              # Donation page tests
├── utils/
│   └── test-helpers.ts         # Common test utilities
├── setup/
│   ├── global-setup.ts         # Global test setup
│   └── global-teardown.ts      # Global test cleanup
└── README.md                   # This file
```

## 🛠️ Test Utilities

### TestHelpers Class
The `TestHelpers` class provides common utilities for E2E testing:

```typescript
import TestHelpers from './utils/test-helpers';

// Authentication
await TestHelpers.login(page, user);
await TestHelpers.register(page, user);
await TestHelpers.logout(page);

// API Mocking
await TestHelpers.mockAPI(page, 'events', eventsData);
await TestHelpers.mockAPIFailure(page, 'events');
await TestHelpers.mockSlowAPI(page, 'events', eventsData, 2000);

// Test Data Generation
const events = TestHelpers.generateTestEvents(10);
const scores = TestHelpers.generateTestScores(20);
const user = TestHelpers.createTestUser('prefix');

// Form Handling
await TestHelpers.fillForm(page, { email: 'test@example.com', password: 'pass' });
await TestHelpers.checkValidationErrors(page, ['Email is required']);

// Utilities
await TestHelpers.waitForElement(page, '[data-testid="loading"]');
await TestHelpers.takeScreenshot(page, 'test-name');
await TestHelpers.setViewport(page, 375, 667);
```

## 🔧 Configuration

### Playwright Configuration
The main configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Reporters**: HTML, JSON, JUnit
- **Global Setup/Teardown**: Automatic test data and cleanup
- **Storage State**: Shared authentication state across tests

### Environment Variables
```bash
# CI/CD environment
CI=true

# Custom base URL
BASE_URL=https://staging.satrf.co.za

# Test data configuration
TEST_DATA_SIZE=large
```

## 📊 Test Reports

### HTML Report
After running tests, view the HTML report:
```bash
npx playwright show-report
```

### JUnit Report
For CI/CD integration, JUnit reports are generated in `test-results/junit.xml`.

### JSON Report
Detailed test results are available in `test-results.json`.

## 🧪 Writing Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';
import TestHelpers from './utils/test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature-url');
  });

  test('should perform specific action', async ({ page }) => {
    // Arrange
    await TestHelpers.mockAPI(page, 'endpoint', mockData);
    
    // Act
    await page.click('[data-testid="button"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Best Practices

#### 1. Use Data Test IDs
```typescript
// Good
await page.click('[data-testid="submit-button"]');

// Avoid
await page.click('button:has-text("Submit")');
```

#### 2. Mock External Dependencies
```typescript
// Mock API responses
await TestHelpers.mockAPI(page, 'events', mockEvents);

// Mock authentication
await TestHelpers.mockAuthenticated(page, testUser);
```

#### 3. Handle Async Operations
```typescript
// Wait for API calls
await TestHelpers.waitForAPI(page, 'events');

// Wait for loading states
await TestHelpers.waitForLoadingToComplete(page);
```

#### 4. Test Error Scenarios
```typescript
test('should handle API errors gracefully', async ({ page }) => {
  await TestHelpers.mockAPIFailure(page, 'events');
  await page.reload();
  await expect(page.locator('text=Failed to load')).toBeVisible();
});
```

#### 5. Test Responsive Design
```typescript
test('should work on mobile', async ({ page }) => {
  await TestHelpers.setViewport(page, 375, 667);
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
});
```

## 🔍 Debugging Tests

### Debug Mode
```bash
npx playwright test --debug
```

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

### Screenshots
Screenshots are automatically taken on test failures. View them in `test-results/`.

### Videos
Videos are recorded for failed tests. View them in `test-results/`.

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Setup
```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps

# Run tests
npm run test:e2e

# Upload results
npx playwright show-report
```

## 📈 Performance Testing

### Load Testing
```typescript
test('should handle large datasets', async ({ page }) => {
  const largeDataset = TestHelpers.generateTestData('large');
  await TestHelpers.mockAPI(page, 'events', largeDataset);
  
  const startTime = Date.now();
  await page.reload();
  await page.waitForSelector('[data-testid="events-list"]');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(5000);
});
```

### Memory Testing
```typescript
test('should not have memory leaks', async ({ page }) => {
  const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize);
  
  // Perform actions that might cause memory leaks
  for (let i = 0; i < 10; i++) {
    await page.reload();
    await page.waitForLoadState('networkidle');
  }
  
  const finalMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize);
  const memoryIncrease = finalMemory - initialMemory;
  
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## 🔒 Security Testing

### Authentication Testing
```typescript
test('should protect sensitive routes', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL('/login');
});
```

### Data Validation
```typescript
test('should validate input data', async ({ page }) => {
  await page.fill('input[name="email"]', 'invalid-email');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Invalid email')).toBeVisible();
});
```

## 🎯 Accessibility Testing

### Keyboard Navigation
```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-testid="first-element"]')).toBeFocused();
});
```

### Screen Reader Support
```typescript
test('should have proper ARIA labels', async ({ page }) => {
  await expect(page.locator('button')).toHaveAttribute('aria-label');
});
```

## 📝 Maintenance

### Updating Test Data
1. Modify `TestHelpers.generateTestEvents()` or `TestHelpers.generateTestScores()`
2. Update mock data in `global-setup.ts`
3. Run tests to ensure they pass

### Adding New Tests
1. Create new test file following naming convention
2. Import `TestHelpers` for common utilities
3. Use data test IDs for selectors
4. Add comprehensive test coverage
5. Update this README if needed

### Troubleshooting

#### Common Issues

**Tests failing due to timing**
```typescript
// Increase timeout
await page.waitForSelector('[data-testid="element"]', { timeout: 15000 });
```

**API mocking not working**
```typescript
// Ensure correct endpoint pattern
await TestHelpers.mockAPI(page, 'events', data);
// Matches: /api/events, /api/events/123, etc.
```

**Authentication issues**
```typescript
// Clear authentication state
await TestHelpers.mockUnauthenticated(page);
```

#### Getting Help
- Check test reports for detailed error information
- Use debug mode for step-by-step execution
- Review browser console for JavaScript errors
- Check network tab for API call issues

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright CI/CD](https://playwright.dev/docs/ci)

## 🤝 Contributing

When adding new tests:
1. Follow existing patterns and conventions
2. Use `TestHelpers` for common operations
3. Add comprehensive test coverage
4. Update documentation
5. Ensure tests pass in all browsers
6. Add appropriate error handling
7. Test responsive design
8. Include accessibility considerations 