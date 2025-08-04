# UI Component Generation Template

## Component: [ComponentName]
**Type:** UI Component
**Category:** [forms/layouts/displays/navigation]
**Dependencies:** [List required dependencies]
**Requirements:** [Specific functional requirements]
**Integration Points:** [How it connects to other components]
**Testing Requirements:** [What needs to be tested]

## Prompt Template

Create a React component for [feature] that:

### Technical Requirements
- Uses TypeScript with proper typing
- Follows the existing design system (Tailwind CSS)
- Integrates with [specific context/hook]
- Includes proper error handling
- Is responsive and accessible
- Has unit tests using Jest and React Testing Library
- Follows the project's file structure in src/components/[category]/

### Design Requirements
- Matches the existing design patterns in the codebase
- Uses consistent spacing and typography
- Implements proper loading states
- Handles error states gracefully
- Is mobile-responsive
- Follows accessibility guidelines (ARIA labels, keyboard navigation)

### Integration Requirements
- Uses existing hooks from src/hooks/
- Integrates with existing contexts if applicable
- Follows the established API patterns
- Uses consistent naming conventions
- Implements proper prop interfaces

### Testing Requirements
- Unit tests for all major functions
- Tests for different states (loading, error, success)
- Accessibility tests
- Responsive design tests
- Integration tests with parent components

### File Structure
```
src/components/[category]/[ComponentName].tsx
src/components/[category]/[ComponentName].test.tsx
src/components/[category]/index.ts (if needed for exports)
```

### Example Usage
```tsx
import { ComponentName } from '@/components/[category]/ComponentName';

<ComponentName 
  prop1={value1}
  prop2={value2}
  onAction={handleAction}
/>
```

## Context References
- Existing components: [List similar components]
- Design patterns: [Reference specific patterns]
- API patterns: [Reference API usage]
- Testing patterns: [Reference test examples] 