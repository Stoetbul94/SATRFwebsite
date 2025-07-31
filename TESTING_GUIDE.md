# Testing Guide for SATRF Website

This guide covers the complete testing setup for the SATRF website, including unit tests, integration tests, and E2E tests.

## Overview

The project uses a comprehensive testing strategy:

- **Frontend**: Jest + React Testing Library for unit tests, Playwright for E2E tests
- **Backend**: Pytest for unit and integration tests
- **Coverage**: Code coverage reporting for both frontend and backend

## Frontend Testing

### Setup

The frontend testing setup includes:

- Jest configuration with Next.js support
- React Testing Library for component testing
- Playwright for E2E testing
- Comprehensive mocks for external dependencies

### Running Frontend Tests

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Frontend Test Structure

```
src/
├── __tests__/
│   └── components/
│       ├── registration.test.tsx
│       └── leaderboard.test.tsx
tests/
└── e2e/
    ├── registration.spec.ts
    └── leaderboard.spec.ts
```

### Writing Frontend Tests

#### Unit Tests (Jest + React Testing Library)

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import Register from '../../pages/register'

describe('Registration Component', () => {
  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<ChakraProvider><Register /></ChakraProvider>)
    
    await user.click(screen.getByRole('button', { name: /register/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
    })
  })
})
```

#### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test('should register a new user', async ({ page }) => {
  await page.goto('/register')
  
  await page.getByLabel(/first name/i).fill('John')
  await page.getByLabel(/email/i).fill('john@example.com')
  
  await page.getByRole('button', { name: /register/i }).click()
  
  await expect(page.getByText(/user registered successfully/i)).toBeVisible()
})
```

## Backend Testing

### Setup

The backend testing setup includes:

- **Virtual Environment**: Isolated Python environment to avoid dependency conflicts
- Pytest with async support
- Coverage reporting
- Mock fixtures for database and authentication
- Integration test helpers

### Virtual Environment Setup

**Important**: The backend uses a virtual environment to avoid Python dependency conflicts.

```bash
# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows Command Prompt:
venv\Scripts\activate.bat

# Linux/Mac:
source venv/bin/activate
```

### Running Backend Tests

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment first
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows Command Prompt:
venv\Scripts\activate.bat

# Linux/Mac:
source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt
pip install -r requirements-test.txt

# Run all tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test categories
pytest -m unit
pytest -m integration
pytest -m auth

# Run tests with verbose output
pytest -v
```

### Easy Test Runner Scripts

For convenience, you can use the provided scripts:

```bash
# PowerShell script (recommended)
.\run-tests.ps1

# Or with specific test type
.\run-tests.ps1 -TestType frontend
.\run-tests.ps1 -TestType backend
.\run-tests.ps1 -TestType e2e
.\run-tests.ps1 -Coverage

# Batch file (alternative)
run-tests.bat
run-tests.bat frontend
run-tests.bat backend
run-tests.bat e2e
```

### Backend Test Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_events.py
│   ├── test_leaderboard.py
│   └── test_integration.py
├── pytest.ini
└── requirements-test.txt
```

### Writing Backend Tests

#### Unit Tests

```python
import pytest
from unittest.mock import Mock, patch
from app.auth import get_current_user

class TestAuthentication:
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_current_user_valid_token(self, mock_firebase):
        mock_request = Mock()
        mock_request.headers = {"Authorization": "Bearer valid_token"}
        
        with patch('app.auth.auth.verify_id_token') as mock_verify:
            mock_verify.return_value = {
                'uid': 'test_user_id',
                'email': 'test@example.com'
            }
            
            user = await get_current_user(mock_request)
            
            assert user.id == 'test_user_id'
            assert user.email == 'test@example.com'
```

#### Integration Tests

```python
import pytest
from httpx import AsyncClient

class TestIntegration:
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_registration_flow_end_to_end(self, async_client):
        registration_data = {
            "firstName": "Integration",
            "lastName": "Test",
            "email": "integration.test@example.com",
            "password": "testpassword123"
        }
        
        with patch('app.routers.auth.create_user_with_email_and_password') as mock_create:
            mock_create.return_value = Mock(user=Mock(uid="test_user_id"))
            
            response = await async_client.post("/auth/register", json=registration_data)
            
            assert response.status_code == 201
```

## Test Categories

### Unit Tests (`@pytest.mark.unit`)
- Test individual functions and methods
- Mock external dependencies
- Fast execution
- High isolation

### Integration Tests (`@pytest.mark.integration`)
- Test API endpoints end-to-end
- Test database interactions
- Test authentication flows
- More realistic scenarios

### E2E Tests (Playwright)
- Test complete user journeys
- Test across multiple pages
- Test browser interactions
- Test responsive design

## Test Data and Fixtures

### Frontend Test Data

```typescript
const mockLeaderboardData = [
  {
    id: '1',
    rank: 1,
    playerName: 'John Doe',
    score: 950,
    discipline: 'Rifle',
    date: '2024-01-15'
  }
]
```

### Backend Test Fixtures

```python
@pytest.fixture
def sample_user_data():
    return {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "password": "testpassword123"
    }

@pytest.fixture
def mock_auth():
    with patch('app.auth.get_current_user') as mock:
        mock_user = Mock()
        mock_user.id = "test_user_id"
        mock_user.email = "test@example.com"
        mock.return_value = mock_user
        yield mock_user
```

## Coverage Reporting

### Frontend Coverage

```bash
npm run test:coverage
```

This generates coverage reports in:
- Console output
- HTML report in `coverage/` directory

### Backend Coverage

```bash
pytest --cov=app --cov-report=html
```

This generates coverage reports in:
- Console output
- HTML report in `htmlcov/` directory
- XML report for CI integration

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: pip install -r backend/requirements.txt
      - run: pip install -r backend/requirements-test.txt
      - run: cd backend && pytest --cov=app
```

## Best Practices

### Frontend Testing

1. **Use React Testing Library** for component tests
2. **Test user interactions**, not implementation details
3. **Mock external dependencies** (API calls, Firebase)
4. **Test accessibility** with proper ARIA labels
5. **Use data-testid sparingly** - prefer semantic queries

### Backend Testing

1. **Use descriptive test names** that explain the scenario
2. **Mock external services** (Firebase, email, file storage)
3. **Test both success and error cases**
4. **Use fixtures for common test data**
5. **Test API endpoints with real HTTP requests**

### E2E Testing

1. **Test complete user journeys**
2. **Use realistic test data**
3. **Test across different browsers**
4. **Test responsive design**
5. **Mock external APIs** to avoid flaky tests

## Debugging Tests

### Frontend Debugging

```bash
# Run tests in debug mode
npm run test:watch

# Debug specific test
npm test -- --testNamePattern="should validate email"
```

### Backend Debugging

```bash
# Run with verbose output
pytest -v -s

# Run specific test
pytest tests/test_auth.py::TestAuthentication::test_get_current_user_valid_token

# Debug with pdb
pytest --pdb
```

### E2E Debugging

```bash
# Run with headed browser
npm run test:e2e -- --headed

# Run with slow motion
npm run test:e2e -- --headed --slowmo=1000

# Debug specific test
npm run test:e2e -- --grep="should register a new user"
```

## Performance Testing

### Frontend Performance

```bash
# Run Lighthouse CI
npm run lighthouse

# Bundle analysis
npm run analyze
```

### Backend Performance

```bash
# Run load tests
pytest tests/test_performance.py

# Profile specific endpoints
python -m cProfile -o profile.stats app/main.py
```

## Security Testing

### Frontend Security

- Test for XSS vulnerabilities
- Test authentication flows
- Test authorization checks
- Test input validation

### Backend Security

- Test authentication middleware
- Test authorization checks
- Test input validation
- Test SQL injection prevention
- Test rate limiting

## Maintenance

### Regular Tasks

1. **Update test dependencies** regularly
2. **Review and update mocks** when APIs change
3. **Maintain test data** to match schema changes
4. **Monitor test performance** and optimize slow tests
5. **Review coverage reports** and add tests for uncovered code

### Test Maintenance Commands

```bash
# Update dependencies
npm update
pip install -r requirements-test.txt --upgrade

# Regenerate coverage reports
npm run test:coverage
cd backend && pytest --cov=app --cov-report=html

# Clean up test artifacts
rm -rf coverage/ htmlcov/ .pytest_cache/
``` 