# API Endpoint Generation Template

## Endpoint: [EndpointName]
**Type:** API Route
**Methods:** [GET/POST/PUT/DELETE]
**Authentication:** [Required/Optional/None]
**Dependencies:** [List required dependencies]
**Requirements:** [Specific functional requirements]
**Integration Points:** [How it connects to other services]
**Testing Requirements:** [What needs to be tested]

## Prompt Template

Create a Next.js API route for [endpoint] that:

### Technical Requirements
- Handles [HTTP methods]
- Validates input using Zod schemas
- Integrates with Firebase/Firestore
- Includes proper error handling and status codes
- Has authentication/authorization if required
- Includes unit tests
- Follows the project's API structure in src/pages/api/

### Input Validation
- Uses Zod schemas for request validation
- Validates required fields
- Sanitizes input data
- Returns appropriate error messages
- Handles different content types

### Database Integration
- Uses Firebase Admin SDK for server-side operations
- Implements proper error handling for database operations
- Uses transactions where appropriate
- Follows existing data models and schemas
- Implements proper indexing considerations

### Authentication & Authorization
- Validates JWT tokens if required
- Checks user permissions
- Implements rate limiting if needed
- Handles session management
- Logs authentication events

### Error Handling
- Returns consistent error response format
- Includes appropriate HTTP status codes
- Logs errors for debugging
- Provides user-friendly error messages
- Handles edge cases gracefully

### Testing Requirements
- Unit tests for all functions
- Integration tests with database
- Authentication tests
- Error handling tests
- Performance tests for complex operations

### File Structure
```
src/pages/api/[endpoint].ts
src/pages/api/[endpoint].test.ts
src/lib/validations/[endpoint].ts (Zod schemas)
src/lib/services/[endpoint].ts (Business logic)
```

### Example Response Format
```typescript
// Success response
{
  success: true,
  data: { ... },
  message?: string
}

// Error response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Example Usage
```typescript
// GET request
const response = await fetch('/api/[endpoint]', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// POST request
const response = await fetch('/api/[endpoint]', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

## Context References
- Existing endpoints: [List similar endpoints]
- Database models: [Reference data schemas]
- Authentication patterns: [Reference auth implementation]
- Error handling patterns: [Reference error responses]
- Testing patterns: [Reference test examples] 