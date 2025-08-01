# End-to-End Tests for Score Import and Display Flow

This directory contains comprehensive end-to-end tests for the SATRF website's score import and display functionality using Playwright.

## Test Overview

The tests cover the complete score import and display workflow:

1. **Admin Authentication** - Login as admin user
2. **File Upload** - Upload Excel/CSV files with score data
3. **Data Validation** - Verify file parsing and validation
4. **Preview Functionality** - Check data preview before import
5. **Import Process** - Execute score import and verify success
6. **Results Display** - Verify imported data appears on results page
7. **Error Handling** - Test various error scenarios

## Test Files

### Core Test Files

- `score-import-simple.spec.ts` - Main test suite with core functionality
- `score-import-flow.spec.ts` - Comprehensive test suite with advanced scenarios
- `setup/score-import-setup.ts` - Test setup helpers and utilities

### Supporting Files

- `leaderboard.spec.ts` - Existing leaderboard tests
- `registration.spec.ts` - Existing registration tests

## Test Scenarios

### 1. Complete Score Import Flow
- Login as admin
- Upload valid Excel file
- Preview data in modal
- Import scores successfully
- Verify data appears on results page

### 2. Invalid File Handling
- Upload file with validation errors
- Verify error messages are displayed
- Confirm import button is disabled for invalid data

### 3. Mixed Data Handling
- Upload file with both valid and invalid rows
- Import only valid scores
- Verify partial import success

### 4. Error Scenarios
- Network errors during import
- Unsupported file types
- Empty files
- Large file uploads

## Prerequisites

### Required Dependencies

The tests require the following dependencies (already included in package.json):

```json
{
  "@playwright/test": "^1.42.1",
  "xlsx": "^0.18.5"
}
```

### Environment Setup

1. **Node.js** - Version 16 or higher
2. **Playwright** - Install browsers: `npx playwright install`
3. **Development Server** - Must be running on `http://localhost:3000`

## Running the Tests

### 1. Start Development Server

```bash
# Start the Next.js development server
npm run dev
```

### 2. Run All E2E Tests

```bash
# Run all end-to-end tests
npm run test:e2e
```

### 3. Run Specific Test File

```bash
# Run only score import tests
npx playwright test tests/e2e/score-import-simple.spec.ts

# Run with UI mode for debugging
npx playwright test tests/e2e/score-import-simple.spec.ts --ui
```

### 4. Run Tests in Specific Browser

```bash
# Run tests in Chrome only
npx playwright test tests/e2e/score-import-simple.spec.ts --project=chromium

# Run tests in all browsers
npx playwright test tests/e2e/score-import-simple.spec.ts --project=all
```

### 5. Run Tests with Debug Mode

```bash
# Run with debug mode (slower, shows browser)
npx playwright test tests/e2e/score-import-simple.spec.ts --debug

# Run with headed mode (shows browser window)
npx playwright test tests/e2e/score-import-simple.spec.ts --headed
```

## Test Data

### Valid Score Data Format

The tests use Excel files with the following structure:

| Column | Description | Example |
|--------|-------------|---------|
| Event Name | Valid event type | "Prone Match 1", "Air Rifle", "3P" |
| Match Number | Match identifier | 1, 2, 3 |
| Shooter Name | Participant name | "John Doe" |
| Club | Club name | "SATRF Club A" |
| Division/Class | Division category | "Open", "Junior", "Veteran" |
| Veteran | Veteran status | "Y" or "N" |
| Series 1-6 | Individual series scores | 100.5, 98.2, etc. |
| Total | Sum of all series | 597.5 |
| Place | Final ranking | 1, 2, 3 |

### Sample Test Data

```javascript
const VALID_SCORE_DATA = [
  {
    'Event Name': 'Prone Match 1',
    'Match Number': 1,
    'Shooter Name': 'John Doe',
    'Club': 'SATRF Club A',
    'Division/Class': 'Open',
    'Veteran': 'N',
    'Series 1': 100.5,
    'Series 2': 98.2,
    'Series 3': 101.0,
    'Series 4': 99.8,
    'Series 5': 100.1,
    'Series 6': 97.9,
    'Total': 597.5,
    'Place': 1
  }
];
```

## Test Configuration

### Playwright Configuration

The tests use the configuration from `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

### Test Setup

The tests automatically:

1. Create temporary Excel files for testing
2. Mock API responses for consistent testing
3. Setup admin authentication
4. Clean up test files after completion

## Debugging Tests

### 1. View Test Reports

```bash
# Generate HTML report
npx playwright show-report
```

### 2. Debug Individual Tests

```bash
# Run specific test with debug mode
npx playwright test --debug -g "should complete full score import"
```

### 3. View Test Traces

```bash
# Open trace viewer
npx playwright show-trace trace.zip
```

### 4. Common Issues

#### Test Fails on File Upload
- Ensure the development server is running
- Check that the file upload component is properly rendered
- Verify the file input selector is correct

#### Test Fails on API Calls
- Check that API routes are properly mocked
- Verify the API endpoints match the expected URLs
- Ensure authentication is properly set up

#### Test Fails on Data Validation
- Verify the test data format matches the expected schema
- Check that validation rules haven't changed
- Ensure error messages match expected text

## Continuous Integration

### GitHub Actions

The tests can be integrated into CI/CD pipelines:

```yaml
name: E2E Tests
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
      - run: npx playwright install --with-deps
      - run: npm run dev &
      - run: npx playwright test
```

### Docker Support

Tests can be run in Docker containers:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.42.1
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx playwright install --with-deps
CMD ["npx", "playwright", "test"]
```

## Performance Considerations

### Test Execution Time

- **Individual Test**: ~30-60 seconds
- **Full Test Suite**: ~5-10 minutes
- **With Debug Mode**: ~2-3x slower

### Resource Usage

- **Memory**: ~200-500MB per browser instance
- **CPU**: Moderate usage during test execution
- **Disk**: Temporary files cleaned up automatically

## Best Practices

### 1. Test Isolation
- Each test is independent
- Test data is created fresh for each test
- Cleanup happens automatically

### 2. Reliable Selectors
- Use data-testid attributes when possible
- Prefer text content over CSS selectors
- Avoid brittle selectors that depend on styling

### 3. Error Handling
- Tests include proper error scenarios
- Network failures are handled gracefully
- Validation errors are thoroughly tested

### 4. Maintainability
- Test setup is centralized in helper functions
- Mock data is reusable across tests
- Clear test descriptions and organization

## Troubleshooting

### Common Error Messages

#### "Target closed"
- Browser was closed unexpectedly
- Solution: Check for JavaScript errors in the application

#### "Element not found"
- Selector doesn't match any element
- Solution: Verify the element exists and selector is correct

#### "Timeout exceeded"
- Element didn't appear within timeout
- Solution: Increase timeout or check if element should be visible

#### "File upload failed"
- File input not found or not accessible
- Solution: Check file input selector and permissions

### Getting Help

1. Check the test logs for detailed error information
2. Run tests in debug mode to see what's happening
3. Verify the application is working manually
4. Check that all dependencies are installed correctly

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the helper functions from `setup/score-import-setup.ts`
3. Include proper cleanup in `afterAll` hooks
4. Add clear test descriptions
5. Test both success and failure scenarios 