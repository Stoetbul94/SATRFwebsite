#!/usr/bin/env node

/**
 * API Endpoint Generation Script
 * Automates the creation of new API endpoints with proper structure and tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  apiDir: 'src/pages/api',
  testDir: 'src/__tests__',
  templatesDir: '.cursor-prompts',
  validationsDir: 'src/lib/validations',
  servicesDir: 'src/lib/services'
};

// HTTP methods
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function validateInputs(name, methods) {
  if (!name) {
    throw new Error('API endpoint name is required');
  }
  
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error('API endpoint name must be kebab-case');
  }
  
  if (methods && !Array.isArray(methods)) {
    methods = [methods];
  }
  
  if (methods) {
    for (const method of methods) {
      if (!HTTP_METHODS.includes(method.toUpperCase())) {
        throw new Error(`Invalid HTTP method: ${method}. Must be one of: ${HTTP_METHODS.join(', ')}`);
      }
    }
  }
  
  return methods || ['GET'];
}

function createDirectoryStructure() {
  const dirs = [
    CONFIG.apiDir,
    CONFIG.testDir,
    CONFIG.validationsDir,
    CONFIG.servicesDir
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  }
}

function generateApiFiles(name, methods) {
  const apiFile = path.join(CONFIG.apiDir, `${name}.ts`);
  const testFile = path.join(CONFIG.testDir, `api-${name}.test.ts`);
  const validationFile = path.join(CONFIG.validationsDir, `${name}.ts`);
  const serviceFile = path.join(CONFIG.servicesDir, `${name}.ts`);
  
  // API endpoint template
  const apiTemplate = `import { NextApiRequest, NextApiResponse } from 'next';
import { validateRequest } from '@/lib/validations/${name}';
import { ${name}Service } from '@/lib/services/${name}';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Validate HTTP method
    if (!['${methods.join("', '")}'].includes(req.method || '')) {
      return res.status(405).json({ 
        success: false, 
        error: { message: 'Method not allowed' } 
      });
    }

    // Validate request
    const validation = validateRequest(req);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid request', details: validation.errors }
      });
    }

    // Handle different HTTP methods
    switch (req.method) {
${methods.map(method => `      case '${method}':
        return await handle${method.charAt(0) + method.slice(1).toLowerCase()}(req, res);`).join('\n')}
      default:
        return res.status(405).json({ 
          success: false, 
          error: { message: 'Method not allowed' } 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
}

${methods.map(method => `async function handle${method.charAt(0) + method.slice(1).toLowerCase()}(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const service = new ${name}Service();
    const result = await service.${method.toLowerCase()}(req.body);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('${method} Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
}`).join('\n\n')}
`;

  // Validation template
  const validationTemplate = `import { z } from 'zod';
import { NextApiRequest } from 'next';

// Define validation schemas
export const ${name}Schema = z.object({
  // Add your validation fields here
  // example: name: z.string().min(1, 'Name is required'),
});

export type ${name}Request = z.infer<typeof ${name}Schema>;

export function validateRequest(req: NextApiRequest) {
  try {
    const validatedData = ${name}Schema.parse(req.body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { 
      success: false, 
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    };
  }
}
`;

  // Service template
  const serviceTemplate = `import { ${name}Request } from '@/lib/validations/${name}';

export class ${name}Service {
  async get(data?: any) {
    // Implement GET logic
    return { message: 'GET endpoint for ${name}' };
  }

  async post(data: ${name}Request) {
    // Implement POST logic
    return { message: 'POST endpoint for ${name}', data };
  }

  async put(data: ${name}Request) {
    // Implement PUT logic
    return { message: 'PUT endpoint for ${name}', data };
  }

  async delete(data?: any) {
    // Implement DELETE logic
    return { message: 'DELETE endpoint for ${name}' };
  }

  async patch(data: Partial<${name}Request>) {
    // Implement PATCH logic
    return { message: 'PATCH endpoint for ${name}', data };
  }
}
`;

  // Test template
  const testTemplate = `import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/${name}';
import { ${name}Service } from '@/lib/services/${name}';

// Mock the service
jest.mock('@/lib/services/${name}');
const Mocked${name}Service = ${name}Service as jest.MockedClass<typeof ${name}Service>;

describe('/api/${name}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

${methods.map(method => `  describe('${method}', () => {
    it('handles ${method} request successfully', async () => {
      const { req, res } = createMocks({
        method: '${method}',
        body: { /* test data */ }
      });

      const mockService = new Mocked${name}Service();
      mockService.${method.toLowerCase()}.mockResolvedValue({ message: 'Success' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
        data: { message: 'Success' }
      });
    });

    it('handles ${method} request errors', async () => {
      const { req, res } = createMocks({
        method: '${method}',
        body: { /* invalid data */ }
      });

      const mockService = new Mocked${name}Service();
      mockService.${method.toLowerCase()}.mockRejectedValue(new Error('Service error'));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: { message: 'Internal server error' }
      });
    });
  });`).join('\n\n')}

  it('returns 405 for unsupported methods', async () => {
    const { req, res } = createMocks({
      method: 'OPTIONS'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: { message: 'Method not allowed' }
    });
  });
});
`;

  // Write files
  fs.writeFileSync(apiFile, apiTemplate);
  fs.writeFileSync(validationFile, validationTemplate);
  fs.writeFileSync(serviceFile, serviceTemplate);
  fs.writeFileSync(testFile, testTemplate);
  
  console.log(`✅ Created API file: ${apiFile}`);
  console.log(`✅ Created validation file: ${validationFile}`);
  console.log(`✅ Created service file: ${serviceFile}`);
  console.log(`✅ Created test file: ${testFile}`);
}

function runTests(name) {
  try {
    console.log('\n🧪 Running tests for the new API endpoint...');
    execSync(`npm test -- --testPathPattern=api-${name}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Tests passed!');
  } catch (error) {
    console.log('⚠️  Tests failed or no tests found. Please add tests manually.');
  }
}

function runLinting() {
  try {
    console.log('\n🔍 Running linter...');
    execSync('npm run lint', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Linting passed!');
  } catch (error) {
    console.log('⚠️  Linting issues found. Please fix them manually.');
  }
}

function generateCursorPrompt(name, methods) {
  const promptTemplate = `# Generate ${name} API Endpoint

Create a Next.js API route for ${name} that:

## Technical Requirements
- Handles ${methods.join(', ')} HTTP methods
- Validates input using Zod schemas
- Integrates with Firebase/Firestore
- Includes proper error handling and status codes
- Has authentication/authorization if required
- Includes unit tests
- Follows the project's API structure in src/pages/api/

## Input Validation
- Uses Zod schemas for request validation
- Validates required fields
- Sanitizes input data
- Returns appropriate error messages
- Handles different content types

## Database Integration
- Uses Firebase Admin SDK for server-side operations
- Implements proper error handling for database operations
- Uses transactions where appropriate
- Follows existing data models and schemas
- Implements proper indexing considerations

## Authentication & Authorization
- Validates JWT tokens if required
- Checks user permissions
- Implements rate limiting if needed
- Handles session management
- Logs authentication events

## Error Handling
- Returns consistent error response format
- Includes appropriate HTTP status codes
- Logs errors for debugging
- Provides user-friendly error messages
- Handles edge cases gracefully

## Testing Requirements
- Unit tests for all functions
- Integration tests with database
- Authentication tests
- Error handling tests
- Performance tests for complex operations

## Context References
- Existing endpoints: Check src/pages/api/ for similar endpoints
- Database models: Reference existing data schemas
- Authentication patterns: Reference auth implementation
- Error handling patterns: Reference error responses
- Testing patterns: Reference test examples

## File Locations
- API route: src/pages/api/${name}.ts
- Validation: src/lib/validations/${name}.ts
- Service: src/lib/services/${name}.ts
- Tests: src/__tests__/api-${name}.test.ts
`;

  const promptFile = path.join(CONFIG.templatesDir, 'api', `${name}-prompt.md`);
  fs.writeFileSync(promptFile, promptTemplate);
  console.log(`✅ Generated Cursor prompt: ${promptFile}`);
  
  return promptFile;
}

function main() {
  const args = process.argv.slice(2);
  const name = args[0];
  const methods = args.slice(1);
  
  try {
    console.log(`🚀 Generating API endpoint: ${name} with methods: ${methods.join(', ')}`);
    
    // Validate inputs
    const validatedMethods = validateInputs(name, methods);
    
    // Create directory structure
    createDirectoryStructure();
    
    // Generate files
    generateApiFiles(name, validatedMethods);
    
    // Generate Cursor prompt
    const promptFile = generateCursorPrompt(name, validatedMethods);
    
    // Run tests and linting
    runTests(name);
    runLinting();
    
    console.log('\n🎉 API endpoint generation complete!');
    console.log('\nNext steps:');
    console.log(`1. Review the generated files in src/pages/api/${name}.ts`);
    console.log(`2. Use the Cursor prompt in ${promptFile} to enhance the endpoint`);
    console.log(`3. Add your specific business logic and database operations`);
    console.log(`4. Test the endpoint locally with 'npm run dev'`);
    console.log(`5. Commit your changes with a clear message`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateApi: main,
  HTTP_METHODS
}; 