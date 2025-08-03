# SATRF Analytics Dashboard Testing Guide

## Overview

This guide covers the comprehensive automated test suite for the SATRF Analytics Dashboard React component. The test suite includes extensive coverage for rendering, data fetching, user interactions, accessibility, error handling, and edge cases.

## Test Structure

```
src/__tests__/analytics/
├── AnalyticsDashboard.test.tsx    # Main component tests
└── test-utils.ts                  # Test utilities and mocks
```

## Test Categories

### 1. Rendering and Initial Loading State
- **Purpose**: Verify component renders correctly and shows appropriate loading states
- **Tests Include**:
  - Initial loading spinner with proper ARIA attributes
  - Successful data loading and state transitions
  - Summary statistics display with proper formatting
  - Loading state removal after data fetch

### 2. Data Fetching and Display
- **Purpose**: Ensure data is fetched correctly and displayed properly
- **Tests Include**:
  - API calls with authentication token headers
  - Score history table with all required columns
  - Discipline statistics with performance metrics
  - Chart data rendering and formatting

### 3. Filtering Functionality
- **Purpose**: Test date range and discipline filtering
- **Tests Include**:
  - Date range filter interactions
  - Discipline filter dropdown functionality
  - Multiple filter combinations
  - Filter reset functionality
  - Chart data updates after filtering

### 4. Export Buttons Functionality
- **Purpose**: Verify export functionality for all formats
- **Tests Include**:
  - CSV export with correct parameters
  - JSON export with correct parameters
  - PDF export with correct parameters
  - Export error handling
  - File download simulation

### 5. Accessibility Checks
- **Purpose**: Ensure component meets accessibility standards
- **Tests Include**:
  - Proper ARIA roles and labels
  - Keyboard navigation support
  - Screen reader compatibility
  - Focus management and indicators
  - Chart accessibility attributes

### 6. Error Handling
- **Purpose**: Test error scenarios and user feedback
- **Tests Include**:
  - API failure simulation
  - User-friendly error messages
  - Partial data failures
  - Different error types (auth, server, network)
  - Retry functionality

### 7. Responsive Layout Behavior
- **Purpose**: Verify responsive design across viewport sizes
- **Tests Include**:
  - Mobile viewport adaptation
  - Tablet viewport functionality
  - Chart responsiveness
  - Cross-screen size compatibility

### 8. Edge Cases and Data Validation
- **Purpose**: Handle unusual data scenarios gracefully
- **Tests Include**:
  - Empty data handling
  - Invalid filter parameters
  - Large dataset performance
  - Malformed data handling

### 9. Component Integration and State Management
- **Purpose**: Test component lifecycle and state persistence
- **Tests Include**:
  - Tab switching state management
  - Component unmounting/remounting
  - Props passing to child components
  - State persistence across interactions

### 10. Performance and Optimization
- **Purpose**: Ensure efficient rendering and interactions
- **Tests Include**:
  - Chart memoization verification
  - Rapid interaction handling
  - Memory leak prevention
  - Performance degradation detection

## Running Tests

### Basic Test Commands

```bash
# Run all analytics tests
npm run test:analytics

# Run tests in watch mode (recommended for development)
npm run test:analytics:watch

# Run tests with coverage report
npm run test:analytics:coverage

# Run tests with debugging (for troubleshooting)
npm run test:analytics:debug

# Update test snapshots
npm run test:analytics:update
```

### Running Specific Test Suites

```bash
# Run only rendering tests
npm run test:analytics -- --testNamePattern="Rendering and Initial Loading State"

# Run only accessibility tests
npm run test:analytics -- --testNamePattern="Accessibility Checks"

# Run only error handling tests
npm run test:analytics -- --testNamePattern="Error Handling"
```

### Running Individual Tests

```bash
# Run a specific test
npm run test:analytics -- --testNamePattern="renders loading state initially"

# Run tests matching a pattern
npm run test:analytics -- --testNamePattern="export"
```

## Test Configuration

### Jest Configuration (`jest.analytics.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/components/analytics/**/*.{ts,tsx}',
    'src/lib/analytics.ts',
    'src/hooks/useAnalytics.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/__tests__/analytics/**/*.test.{ts,tsx}',
  ],
};
```

### Test Setup (`src/__tests__/setup.ts`)

The setup file configures:
- Testing Library configuration
- Browser API mocks (IntersectionObserver, ResizeObserver)
- Console error/warning suppression
- Global test environment setup

## Mock Implementation

### API Mocks

```javascript
// Mock analytics API
jest.mock('../../lib/analytics', () => ({
  analyticsAPI: {
    getUserAnalytics: jest.fn(),
    exportAnalytics: jest.fn(),
    getScoreHistory: jest.fn(),
    getDisciplineStats: jest.fn(),
    getPerformanceTrends: jest.fn(),
    getEventParticipation: jest.fn(),
  },
  analyticsUtils: {
    generateMockAnalytics: jest.fn(),
    formatDate: jest.fn(),
    getDisciplineColor: jest.fn(),
    getPerformanceLevel: jest.fn(),
    calculateImprovementRate: jest.fn(),
    calculateConsistencyScore: jest.fn(),
  },
}));
```

### Chart Library Mocks

```javascript
// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, data, ...props }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  // ... other chart components
}));
```

### Browser API Mocks

```javascript
// Mock browser APIs for testing
const setupBrowserMocks = () => {
  const mockCreateObjectURL = jest.fn().mockReturnValue('blob:test');
  const mockRevokeObjectURL = jest.fn();
  const mockLink = {
    href: '',
    download: '',
    click: jest.fn(),
  };
  
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  global.document.createElement = jest.fn().mockReturnValue(mockLink);
};
```

## Test Utilities

### Creating Mock Data

```javascript
import { createMockAnalytics, createMockAPI, createTestUser } from './test-utils';

// Create mock analytics data
const mockData = createMockAnalytics({
  scoreHistory: customScoreHistory,
  disciplineStats: customDisciplineStats
});

// Create mock API with custom behavior
const mockAPI = createMockAPI({
  getUserAnalytics: jest.fn().mockRejectedValue(new Error('Network error'))
});

// Create test user
const testUser = createTestUser();
```

### Test Setup Helpers

```javascript
// Setup for each test
beforeEach(() => {
  jest.clearAllMocks();
  setupMockAPI();
  setupMockUtils();
  setupBrowserMocks();
});

// Cleanup after each test
afterEach(() => {
  jest.restoreAllMocks();
});
```

## Interpreting Test Results

### Coverage Report

The coverage report shows:
- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches taken
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

Target coverage: 80% minimum for all metrics.

### Test Output

```
PASS src/__tests__/analytics/AnalyticsDashboard.test.tsx
  AnalyticsDashboard Component
    Rendering and Initial Loading State
      ✓ renders loading state initially with proper accessibility attributes (45ms)
      ✓ renders analytics dashboard after successful data loading (23ms)
      ✓ displays all summary statistics with proper formatting (34ms)
    Data Fetching and Display
      ✓ fetches data correctly from mock API responses (28ms)
      ✓ handles API calls with authentication token headers (31ms)
      ✓ displays score history table with all required columns (42ms)
    Filtering Functionality
      ✓ filters by date range and updates chart data (67ms)
      ✓ filters by discipline and verifies updated chart data (58ms)
      ✓ handles multiple filter combinations (73ms)
      ✓ resets filters when clear button is clicked (49ms)
    Export Buttons Functionality
      ✓ triggers CSV export with correct parameters (38ms)
      ✓ triggers JSON export with correct parameters (41ms)
      ✓ triggers PDF export with correct parameters (39ms)
      ✓ handles export errors gracefully (35ms)
    Accessibility Checks
      ✓ has proper ARIA roles and labels for key interactive elements (52ms)
      ✓ supports keyboard navigation for all interactive elements (78ms)
      ✓ provides screen reader support for charts and data (45ms)
      ✓ has proper focus management and visible focus indicators (61ms)
    Error Handling
      ✓ simulates API failure and verifies user-friendly error messages (33ms)
      ✓ handles partial data failures gracefully (29ms)
      ✓ displays appropriate error states for different error types (47ms)
    Responsive Layout Behavior
      ✓ adapts to different viewport sizes (56ms)
      ✓ maintains functionality across different screen sizes (64ms)
      ✓ handles chart responsiveness correctly (48ms)
    Edge Cases and Data Validation
      ✓ handles empty data gracefully (31ms)
      ✓ handles invalid filter parameters (28ms)
      ✓ handles large datasets efficiently (89ms)
      ✓ handles malformed data gracefully (35ms)
    Component Integration and State Management
      ✓ maintains state correctly across tab switches (67ms)
      ✓ handles component unmounting and remounting (42ms)
      ✓ passes props correctly to child components (38ms)
    Performance and Optimization
      ✓ implements proper memoization for expensive calculations (51ms)
      ✓ handles rapid user interactions without performance degradation (94ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.847s
```

## Troubleshooting Common Issues

### Test Failures

#### 1. Mock Not Working
```javascript
// Problem: Mock not being applied
// Solution: Ensure mock is set up before component render
beforeEach(() => {
  jest.clearAllMocks();
  setupMockAPI();
});
```

#### 2. Async Test Timing
```javascript
// Problem: Test finishes before async operations complete
// Solution: Use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
});
```

#### 3. Component Not Rendering
```javascript
// Problem: Component not rendering in test
// Solution: Check for missing providers or context
render(
  <AuthProvider>
    <AnalyticsDashboard />
  </AuthProvider>
);
```

#### 4. Chart Mocks Not Working
```javascript
// Problem: Chart components not mocked properly
// Solution: Ensure Recharts mock includes all required props
LineChart: ({ children, data, ...props }) => (
  <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} {...props}>
    {children}
  </div>
),
```

### Performance Issues

#### 1. Slow Test Execution
- Use `--runInBand` flag for sequential execution
- Reduce mock data size for large datasets
- Use `jest.isolateModules()` for heavy imports

#### 2. Memory Leaks
- Ensure proper cleanup in `afterEach`
- Mock heavy dependencies
- Use `jest.resetModules()` when needed

### Coverage Issues

#### 1. Low Coverage
- Add tests for untested code paths
- Test error conditions and edge cases
- Ensure all user interactions are covered

#### 2. Missing Branches
- Test conditional logic with different inputs
- Test both success and failure scenarios
- Test boundary conditions

## Best Practices

### Writing Tests

1. **Descriptive Test Names**: Use clear, descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Independent Tests**: Tests should not depend on each other
5. **Clean Setup/Teardown**: Use beforeEach/afterEach for consistent test environment

### Mocking

1. **Minimal Mocking**: Only mock what's necessary for the test
2. **Realistic Data**: Use realistic mock data that represents actual usage
3. **Consistent Mocks**: Use consistent mock implementations across tests
4. **Mock Verification**: Verify that mocks are called with expected parameters

### Accessibility Testing

1. **ARIA Attributes**: Test for proper ARIA roles and labels
2. **Keyboard Navigation**: Verify all interactive elements are keyboard accessible
3. **Screen Reader**: Test with screen reader compatibility in mind
4. **Focus Management**: Ensure proper focus indicators and management

### Error Handling

1. **Error Scenarios**: Test all possible error conditions
2. **User Feedback**: Verify error messages are user-friendly
3. **Recovery**: Test error recovery mechanisms
4. **Graceful Degradation**: Ensure partial failures don't break the entire component

## Continuous Integration

### GitHub Actions Example

```yaml
name: Analytics Dashboard Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:analytics:coverage
      - uses: codecov/codecov-action@v2
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:analytics"
    }
  }
}
```

## Conclusion

This comprehensive test suite ensures the SATRF Analytics Dashboard component is robust, accessible, and performs well across different scenarios. Regular testing helps maintain code quality and prevents regressions as the component evolves.

For questions or issues with the test suite, refer to the troubleshooting section or consult the React Testing Library documentation. 