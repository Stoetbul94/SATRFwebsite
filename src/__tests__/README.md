# Login and Redirect Flow Testing Guide

## Overview
This directory contains comprehensive test suites for the SATRF website login and redirect flow. The tests cover unit testing, integration testing, and end-to-end testing scenarios.

## Test Structure

```
src/__tests__/
├── components/
│   ├── login-flow.test.tsx          # Comprehensive login flow tests
│   ├── login.test.tsx               # Basic login component tests
│   └── auth-flow.test.tsx           # Authentication flow tests
├── utils/
│   └── test-utils.ts                # Test utilities and helpers
├── setup.ts                         # Global test setup and mocks
└── e2e/
    └── login-flow-e2e.md            # E2E test scenarios
```

## Running Tests

### Prerequisites
- Node.js 16+ installed
- All dependencies installed: `npm install`
- Development server running: `npm run dev`

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- login-flow.test.tsx

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run tests with verbose output
npm test -- --verbose
```

### E2E Tests (Playwright)

```bash
# Install Playwright (if not already installed)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- login-flow.spec.ts

# Run tests in headed mode
npm run test:e2e -- --headed

# Run tests with specific browser
npm run test:e2e -- --project=chromium
```

## Test Categories

### 1. Unit Tests (`login-flow.test.tsx`)

**Purpose:** Test individual components and functions in isolation.

**Coverage:**
- Login page rendering
- Form validation
- User input handling
- Error state management
- Loading states
- Accessibility features

**Example Test:**
```typescript
it('validates required fields on form submission', async () => {
  render(<LoginPage />);
  
  const submitButton = screen.getByRole('button', { name: /Sign In/i });
  await user.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
  });
});
```

### 2. Integration Tests (`auth-flow.test.tsx`)

**Purpose:** Test the interaction between multiple components and the authentication system.

**Coverage:**
- Complete login flow
- Token management
- State persistence
- Redirect handling
- Error scenarios

**Example Test:**
```typescript
it('successfully logs in demo user and redirects to dashboard', async () => {
  const mockLogin = jest.fn().mockResolvedValue(true);
  
  render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
  
  // Fill and submit form
  await user.type(emailInput, 'demo@satrf.org.za');
  await user.type(passwordInput, 'DemoPass123');
  await user.click(submitButton);
  
  // Verify login and redirect
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith('demo@satrf.org.za', 'DemoPass123');
    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
  });
});
```

### 3. E2E Tests (Playwright)

**Purpose:** Test the complete user journey from browser to application.

**Coverage:**
- Full login workflow
- Cross-browser compatibility
- Performance testing
- Accessibility testing
- Security validation

## Test Utilities

### Mock Data
```typescript
import { mockUser, mockCredentials, createMockAuthState } from '../utils/test-utils';

// Use predefined mock data
const authState = createMockAuthState({
  user: mockUser,
  isAuthenticated: true,
});
```

### Helper Functions
```typescript
import { 
  simulateSuccessfulLogin, 
  setupAuthenticatedState,
  createMockJWT 
} from '../utils/test-utils';

// Simulate login scenarios
await simulateSuccessfulLogin(mockLogin, mockRouter, credentials, '/dashboard');

// Set up different auth states
const loadingState = setupLoadingState();
const errorState = setupErrorState('Invalid credentials');
```

## Test Scenarios

### 1. Successful Login Flow

**Objective:** Verify that users can successfully log in and be redirected to the appropriate page.

**Test Steps:**
1. Navigate to login page
2. Enter valid credentials
3. Submit form
4. Verify redirect to dashboard
5. Verify authentication state

**Expected Results:**
- Form submits without errors
- User is redirected to dashboard
- Authentication state is properly set
- User can access protected routes

### 2. Form Validation

**Objective:** Ensure form validation works correctly for various input scenarios.

**Test Cases:**
- Empty form submission
- Invalid email format
- Missing password
- Valid input formats

**Expected Results:**
- Appropriate error messages are displayed
- Form does not submit with invalid data
- Errors clear when user starts typing

### 3. Error Handling

**Objective:** Test how the application handles various error scenarios.

**Test Cases:**
- Invalid credentials
- Network errors
- Server errors
- Token expiration

**Expected Results:**
- Error messages are displayed clearly
- User can retry login
- Application remains functional

### 4. Redirect Logic

**Objective:** Verify that redirect logic works correctly in different scenarios.

**Test Cases:**
- Default redirect to dashboard
- Custom redirect from protected route
- Redirect preservation on page refresh
- Already authenticated user redirect

**Expected Results:**
- Users are redirected to appropriate pages
- Redirect parameters are preserved
- Authenticated users are redirected away from login

### 5. Accessibility

**Objective:** Ensure the login form is accessible to all users.

**Test Cases:**
- Keyboard navigation
- Screen reader compatibility
- ARIA labels and roles
- Focus management

**Expected Results:**
- All interactive elements are keyboard accessible
- Screen readers can navigate the form
- Proper ARIA attributes are present

## Debugging Tests

### Common Issues

#### 1. Tests Failing Due to Timing
```typescript
// Add explicit waits
await waitFor(() => {
  expect(screen.getByText(/Success/i)).toBeInTheDocument();
}, { timeout: 5000 });
```

#### 2. Mock Not Working
```typescript
// Ensure mocks are properly set up
beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue(createMockAuthState());
});
```

#### 3. Component Not Rendering
```typescript
// Check if all required providers are wrapped
render(
  <AuthProvider>
    <ChakraProvider>
      <LoginPage />
    </ChakraProvider>
  </AuthProvider>
);
```

### Debug Mode
```bash
# Run tests in debug mode
npm test -- --debug

# Run with console output
npm test -- --verbose --no-coverage
```

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
};
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names
- Keep tests focused and atomic
- Avoid test interdependencies

### 2. Mocking
- Mock external dependencies
- Use consistent mock data
- Reset mocks between tests
- Mock at the appropriate level

### 3. Assertions
- Use specific assertions
- Test one thing per test
- Use meaningful error messages
- Test both positive and negative cases

### 4. Performance
- Keep tests fast
- Avoid unnecessary setup
- Use efficient selectors
- Minimize DOM queries

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
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
      - run: npm test
      - run: npm run test:e2e
```

### Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for critical paths
- Regular coverage reports
- Coverage trend monitoring

## Reporting

### Test Reports
- Jest coverage reports in `coverage/`
- Playwright HTML reports in `playwright-report/`
- Screenshots and videos for failed E2E tests

### Metrics to Track
- Test execution time
- Pass/fail rates
- Coverage percentages
- Flaky test frequency
- Browser compatibility scores

## Troubleshooting

### Common Problems

#### 1. Tests Not Running
```bash
# Check if Jest is properly configured
npm test -- --showConfig

# Verify test files are in correct location
# Ensure file names end with .test.tsx or .spec.tsx
```

#### 2. Import Errors
```bash
# Check module resolution
npm test -- --verbose

# Verify path mappings in tsconfig.json
# Ensure all dependencies are installed
```

#### 3. Mock Issues
```bash
# Clear Jest cache
npm test -- --clearCache

# Check mock setup in setup.ts
# Verify mock functions are properly defined
```

### Getting Help
- Check the test output for specific error messages
- Review the test setup and configuration
- Consult the Jest and Playwright documentation
- Check for similar issues in the project repository

## Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Use provided test utilities
4. Add comprehensive test coverage
5. Update documentation

### Test Review Process
1. Ensure all tests pass
2. Verify coverage requirements
3. Check for test quality
4. Update related documentation
5. Get code review approval

## Resources

### Documentation
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright E2E Testing](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Tools
- [Jest](https://jestjs.io/) - Unit and integration testing
- [React Testing Library](https://testing-library.com/) - Component testing
- [Playwright](https://playwright.dev/) - E2E testing
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro) - User interaction simulation 