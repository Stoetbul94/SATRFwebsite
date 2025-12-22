# E2E Test Scenarios for Login and Redirect Flow

## Overview
This document outlines comprehensive end-to-end test scenarios for the SATRF website login and redirect flow using Playwright. These tests cover the complete user journey from initial page load to successful authentication and navigation.

## Test Environment Setup

### Prerequisites
- Node.js 16+ installed
- Playwright installed: `npm install -D @playwright/test`
- SATRF website running on `http://localhost:3000`

### Test Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
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
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Scenarios

### 1. Basic Login Page Rendering

**Test Name:** `login-page-renders-correctly.spec.ts`

**Description:** Verify that the login page loads correctly with all required elements.

**Steps:**
1. Navigate to `/login`
2. Verify page title is "Login - SATRF"
3. Verify main heading "Welcome Back" is displayed
4. Verify email input field is present and accessible
5. Verify password input field is present and accessible
6. Verify "Sign In" button is present and enabled
7. Verify demo account information is displayed
8. Verify "Back to Home" link is present
9. Verify "Sign up" link is present

**Expected Results:**
- All elements are visible and properly styled
- Form is accessible via keyboard navigation
- Demo credentials are clearly displayed
- No console errors

### 2. Demo User Login Flow

**Test Name:** `demo-user-login-flow.spec.ts`

**Description:** Test the complete login flow using demo credentials.

**Steps:**
1. Navigate to `/login`
2. Enter demo email: `demo@satrf.org.za`
3. Enter demo password: `DemoPass123`
4. Click "Sign In" button
5. Wait for redirect to complete
6. Verify URL changes to `/dashboard`
7. Verify dashboard page loads with user information
8. Verify user is authenticated (check for user menu/logout option)

**Expected Results:**
- Login form submits successfully
- Loading state is shown during submission
- Redirect to dashboard occurs
- Dashboard displays demo user information
- User remains authenticated after page refresh

### 3. Real User Login Flow

**Test Name:** `real-user-login-flow.spec.ts`

**Description:** Test login flow with real user credentials (requires test user setup).

**Steps:**
1. Navigate to `/login`
2. Enter valid user email
3. Enter valid user password
4. Click "Sign In" button
5. Wait for redirect to complete
6. Verify URL changes to `/dashboard`
7. Verify dashboard displays correct user information

**Expected Results:**
- Login succeeds with valid credentials
- User is redirected to dashboard
- User information is correctly displayed
- Authentication persists across page reloads

### 4. Login Validation and Error Handling

**Test Name:** `login-validation-error-handling.spec.ts`

**Description:** Test form validation and error handling for various scenarios.

**Test Cases:**

#### 4.1 Empty Form Submission
**Steps:**
1. Navigate to `/login`
2. Click "Sign In" without entering credentials
3. Verify validation errors are displayed

**Expected Results:**
- "Email is required" error appears
- "Password is required" error appears
- Form does not submit

#### 4.2 Invalid Email Format
**Steps:**
1. Navigate to `/login`
2. Enter invalid email format (e.g., "invalid-email")
3. Enter valid password
4. Click "Sign In"

**Expected Results:**
- "Please enter a valid email address" error appears
- Form does not submit

#### 4.3 Invalid Credentials
**Steps:**
1. Navigate to `/login`
2. Enter valid email format but incorrect credentials
3. Click "Sign In"

**Expected Results:**
- Error message is displayed
- User remains on login page
- Form is not disabled

#### 4.4 Network Error Handling
**Steps:**
1. Navigate to `/login`
2. Disconnect network (or mock network failure)
3. Enter valid credentials
4. Click "Sign In"

**Expected Results:**
- Network error message is displayed
- User can retry login
- Form remains functional

### 5. Redirect Flow Testing

**Test Name:** `redirect-flow-testing.spec.ts`

**Description:** Test various redirect scenarios after login.

#### 5.1 Default Redirect to Dashboard
**Steps:**
1. Navigate to `/login`
2. Login with valid credentials
3. Verify redirect to `/dashboard`

**Expected Results:**
- User is redirected to `/dashboard` by default

#### 5.2 Custom Redirect from Protected Route
**Steps:**
1. Navigate to `/dashboard` (should redirect to login)
2. Verify URL contains redirect parameter
3. Login with valid credentials
4. Verify redirect to original intended page

**Expected Results:**
- Login URL includes redirect parameter
- After login, user is redirected to originally requested page

#### 5.3 Redirect Preservation on Page Refresh
**Steps:**
1. Navigate to protected route (e.g., `/profile`)
2. Get redirected to login with redirect parameter
3. Refresh the page
4. Verify redirect parameter is preserved
5. Login with valid credentials
6. Verify redirect to original page

**Expected Results:**
- Redirect parameter persists through page refresh
- Login redirects to originally intended page

### 6. Authentication State Management

**Test Name:** `authentication-state-management.spec.ts`

**Description:** Test authentication state persistence and management.

#### 6.1 Already Authenticated User
**Steps:**
1. Login with valid credentials
2. Navigate to `/login` while authenticated
3. Verify automatic redirect to dashboard

**Expected Results:**
- Authenticated users are automatically redirected away from login page

#### 6.2 Authentication Persistence
**Steps:**
1. Login with valid credentials
2. Navigate to dashboard
3. Refresh the page
4. Verify user remains authenticated

**Expected Results:**
- Authentication state persists across page reloads
- User does not need to login again

#### 6.3 Logout Flow
**Steps:**
1. Login with valid credentials
2. Navigate to dashboard
3. Click logout button
4. Verify redirect to login page
5. Verify user cannot access protected routes

**Expected Results:**
- Logout clears authentication state
- User is redirected to login page
- Protected routes are no longer accessible

### 7. Accessibility Testing

**Test Name:** `login-accessibility.spec.ts`

**Description:** Test accessibility features of the login page.

**Steps:**
1. Navigate to `/login`
2. Test keyboard navigation (Tab, Enter, Escape)
3. Test screen reader compatibility
4. Test form validation announcements
5. Test error message accessibility

**Expected Results:**
- All interactive elements are keyboard accessible
- Screen reader announces form validation errors
- ARIA labels and roles are properly implemented
- Focus management works correctly

### 8. Cross-Browser Compatibility

**Test Name:** `cross-browser-login.spec.ts`

**Description:** Test login flow across different browsers.

**Steps:**
1. Run demo user login flow in Chrome
2. Run demo user login flow in Firefox
3. Run demo user login flow in Safari
4. Compare behavior and functionality

**Expected Results:**
- Login flow works consistently across all browsers
- No browser-specific issues or errors

## Performance Testing

### 9. Login Performance

**Test Name:** `login-performance.spec.ts`

**Description:** Test login performance and loading times.

**Steps:**
1. Measure initial page load time
2. Measure form submission response time
3. Measure redirect completion time
4. Test with slow network conditions

**Expected Results:**
- Page loads within 3 seconds
- Form submission completes within 2 seconds
- Redirect completes within 1 second
- Graceful handling of slow network conditions

## Security Testing

### 10. Security Validation

**Test Name:** `login-security.spec.ts`

**Description:** Test security aspects of the login flow.

**Steps:**
1. Test password field masking
2. Test form submission over HTTPS
3. Test CSRF protection
4. Test brute force protection (if implemented)
5. Test session management

**Expected Results:**
- Passwords are properly masked
- Form submissions use secure protocols
- No security vulnerabilities detected

## Running the Tests

### Command Line
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- login-flow.spec.ts

# Run tests in headed mode (with browser visible)
npm run test:e2e -- --headed

# Run tests with specific browser
npm run test:e2e -- --project=chromium

# Generate test report
npm run test:e2e -- --reporter=html
```

### CI/CD Integration
```yaml
# GitHub Actions example
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

## Test Data Management

### Demo User Credentials
- **Email:** `demo@satrf.org.za`
- **Password:** `DemoPass123`

### Test User Setup
For real user testing, create a test user account:
```sql
INSERT INTO users (email, password_hash, first_name, last_name, is_active)
VALUES ('test@satrf.org.za', 'hashed_password', 'Test', 'User', true);
```

## Troubleshooting

### Common Issues
1. **Tests failing due to timing**: Increase wait times or add explicit waits
2. **Network errors**: Check if the development server is running
3. **Authentication issues**: Verify test user credentials are correct
4. **Browser compatibility**: Test on different browsers and versions

### Debug Mode
```bash
# Run tests in debug mode
npm run test:e2e -- --debug

# Run with slow motion
npm run test:e2e -- --headed --timeout=30000
```

## Reporting and Analysis

### Test Reports
- HTML reports are generated in `playwright-report/`
- Screenshots are captured on test failures
- Video recordings are available for debugging

### Metrics to Track
- Test execution time
- Pass/fail rates
- Browser compatibility scores
- Performance metrics
- Accessibility compliance

## Continuous Improvement

### Regular Updates
- Update test scenarios as features evolve
- Add new test cases for edge cases
- Optimize test performance
- Improve test data management

### Feedback Loop
- Monitor test results regularly
- Address flaky tests promptly
- Update documentation as needed
- Share learnings with the team 