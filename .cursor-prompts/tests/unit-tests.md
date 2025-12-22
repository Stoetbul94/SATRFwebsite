# Unit Test Generation Template

## Component: [ComponentName]
**Type:** Unit Tests
**Framework:** Jest + React Testing Library
**Coverage Target:** [80%+]
**Dependencies:** [List required dependencies]
**Test Scenarios:** [List specific test cases]
**Mock Requirements:** [List external dependencies to mock]

## Prompt Template

Create comprehensive unit tests for [component/feature] that:

### Technical Requirements
- Uses Jest for unit tests
- Uses React Testing Library for component testing
- Achieves [coverage]% test coverage
- Mocks external dependencies properly
- Follows the existing test patterns in src/__tests__/
- Uses TypeScript for type safety

### Test Structure
- **Setup:** Proper test environment setup
- **Arrange:** Prepare test data and mocks
- **Act:** Execute the function/component
- **Assert:** Verify expected outcomes
- **Teardown:** Clean up after tests

### Test Categories
1. **Happy Path Tests**
   - Normal operation scenarios
   - Expected user interactions
   - Successful API calls
   - Proper data flow

2. **Error Handling Tests**
   - API error responses
   - Invalid input handling
   - Network failures
   - Authentication errors

3. **Edge Case Tests**
   - Boundary conditions
   - Empty/null values
   - Large datasets
   - Concurrent operations

4. **Integration Tests**
   - Component interactions
   - Hook integrations
   - Context usage
   - Event handling

### Mocking Strategy
- **External APIs:** Mock fetch/axios calls
- **Firebase:** Mock Firebase SDK methods
- **Browser APIs:** Mock localStorage, sessionStorage
- **Timers:** Mock setTimeout, setInterval
- **Events:** Mock user interactions

### Test Utilities
- **Custom render functions** for providers
- **Test data factories** for consistent test data
- **Mock service functions** for external dependencies
- **Assertion helpers** for common checks

### File Structure
```
src/__tests__/[category]/[ComponentName].test.tsx
src/__tests__/utils/test-helpers.ts
src/__tests__/mocks/[service].ts
```

### Example Test Structure
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from '@/components/[category]/ComponentName';
import { mockService } from '@/__tests__/mocks/service';

// Mock external dependencies
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn()
}));

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      render(<ComponentName />);
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(<ComponentName isLoading={true} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles button click correctly', async () => {
      const mockOnClick = jest.fn();
      render(<ComponentName onAction={mockOnClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Integration', () => {
    it('fetches and displays data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockService.fetchData.mockResolvedValue(mockData);
      
      render(<ComponentName />);
      
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      mockService.fetchData.mockRejectedValue(new Error('API Error'));
      
      render(<ComponentName />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading data')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ComponentName />);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<ComponentName />);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});
```

### Test Data Patterns
```typescript
// Test data factory
const createTestUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
});

// Mock service responses
const mockApiResponses = {
  success: { success: true, data: { id: 1 } },
  error: { success: false, error: { message: 'API Error' } }
};
```

### Coverage Requirements
- **Statements:** [80%+]
- **Branches:** [80%+]
- **Functions:** [80%+]
- **Lines:** [80%+]

### Performance Considerations
- **Fast execution:** Tests should run quickly
- **Isolation:** Tests should not depend on each other
- **Deterministic:** Tests should be repeatable
- **Minimal setup:** Avoid unnecessary test setup

## Context References
- Existing test patterns: [Reference similar test files]
- Mock patterns: [Reference existing mocks]
- Test utilities: [Reference helper functions]
- Coverage reports: [Reference coverage targets]
- Testing best practices: [Reference project guidelines] 