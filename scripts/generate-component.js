#!/usr/bin/env node

/**
 * Component Generation Script
 * Automates the creation of new components with proper structure and tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  componentDir: 'src/components',
  testDir: 'src/__tests__',
  templatesDir: '.cursor-prompts',
  defaultCategory: 'ui'
};

// Component categories
const CATEGORIES = [
  'ui',
  'forms', 
  'layouts',
  'displays',
  'navigation',
  'admin',
  'analytics',
  'events',
  'monitoring'
];

function validateInputs(name, category) {
  if (!name) {
    throw new Error('Component name is required');
  }
  
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    throw new Error('Component name must be PascalCase');
  }
  
  if (category && !CATEGORIES.includes(category)) {
    throw new Error(`Invalid category. Must be one of: ${CATEGORIES.join(', ')}`);
  }
}

function createDirectoryStructure(category) {
  const componentPath = path.join(CONFIG.componentDir, category);
  const testPath = path.join(CONFIG.testDir, category);
  
  if (!fs.existsSync(componentPath)) {
    fs.mkdirSync(componentPath, { recursive: true });
    console.log(`✅ Created component directory: ${componentPath}`);
  }
  
  if (!fs.existsSync(testPath)) {
    fs.mkdirSync(testPath, { recursive: true });
    console.log(`✅ Created test directory: ${testPath}`);
  }
  
  return { componentPath, testPath };
}

function generateComponentFiles(name, category, componentPath, testPath) {
  const componentFile = path.join(componentPath, `${name}.tsx`);
  const testFile = path.join(testPath, `${name}.test.tsx`);
  const indexFile = path.join(componentPath, 'index.ts');
  
  // Component template
  const componentTemplate = `import React from 'react';

interface ${name}Props {
  // Add your props here
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div className="p-4">
      <h2>${name} Component</h2>
      {/* Add your component content here */}
    </div>
  );
};

export default ${name};
`;

  // Test template
  const testTemplate = `import { render, screen } from '@testing-library/react';
import { ${name} } from '@/components/${category}/${name}';

describe('${name}', () => {
  it('renders correctly', () => {
    render(<${name} />);
    expect(screen.getByText('${name} Component')).toBeInTheDocument();
  });
});
`;

  // Write files
  fs.writeFileSync(componentFile, componentTemplate);
  fs.writeFileSync(testFile, testTemplate);
  
  // Update index file if it exists
  if (fs.existsSync(indexFile)) {
    const indexContent = fs.readFileSync(indexFile, 'utf8');
    if (!indexContent.includes(`export { ${name} }`)) {
      const newExport = `export { ${name} } from './${name}';\n`;
      fs.appendFileSync(indexFile, newExport);
    }
  } else {
    fs.writeFileSync(indexFile, `export { ${name} } from './${name}';\n`);
  }
  
  console.log(`✅ Created component file: ${componentFile}`);
  console.log(`✅ Created test file: ${testFile}`);
  console.log(`✅ Updated index file: ${indexFile}`);
}

function runTests(name, category) {
  try {
    console.log('\n🧪 Running tests for the new component...');
    execSync(`npm test -- --testPathPattern=${name}`, { 
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

function generateCursorPrompt(name, category) {
  const promptTemplate = `# Generate ${name} Component

Create a React component for ${name} that:

## Technical Requirements
- Uses TypeScript with proper typing
- Follows the existing design system (Tailwind CSS)
- Integrates with existing contexts/hooks if needed
- Includes proper error handling
- Is responsive and accessible
- Has unit tests using Jest and React Testing Library
- Follows the project's file structure in src/components/${category}/

## Design Requirements
- Matches the existing design patterns in the codebase
- Uses consistent spacing and typography
- Implements proper loading states
- Handles error states gracefully
- Is mobile-responsive
- Follows accessibility guidelines

## Integration Requirements
- Uses existing hooks from src/hooks/
- Integrates with existing contexts if applicable
- Follows the established API patterns
- Uses consistent naming conventions
- Implements proper prop interfaces

## Testing Requirements
- Unit tests for all major functions
- Tests for different states (loading, error, success)
- Accessibility tests
- Responsive design tests
- Integration tests with parent components

## Context References
- Existing components: Check src/components/${category}/ for similar components
- Design patterns: Reference existing components for styling patterns
- API patterns: Check src/lib/api.ts for API usage patterns
- Testing patterns: Reference existing tests in src/__tests__/${category}/

## File Location
The component should be created at: src/components/${category}/${name}.tsx
The test should be created at: src/__tests__/${category}/${name}.test.tsx
`;

  const promptFile = path.join(CONFIG.templatesDir, 'components', `${name.toLowerCase()}-prompt.md`);
  fs.writeFileSync(promptFile, promptTemplate);
  console.log(`✅ Generated Cursor prompt: ${promptFile}`);
  
  return promptFile;
}

function main() {
  const args = process.argv.slice(2);
  const name = args[0];
  const category = args[1] || CONFIG.defaultCategory;
  
  try {
    console.log(`🚀 Generating component: ${name} in category: ${category}`);
    
    // Validate inputs
    validateInputs(name, category);
    
    // Create directory structure
    const { componentPath, testPath } = createDirectoryStructure(category);
    
    // Generate files
    generateComponentFiles(name, category, componentPath, testPath);
    
    // Generate Cursor prompt
    const promptFile = generateCursorPrompt(name, category);
    
    // Run tests and linting
    runTests(name, category);
    runLinting();
    
    console.log('\n🎉 Component generation complete!');
    console.log('\nNext steps:');
    console.log(`1. Review the generated files in src/components/${category}/${name}.tsx`);
    console.log(`2. Use the Cursor prompt in ${promptFile} to enhance the component`);
    console.log(`3. Add your specific functionality and styling`);
    console.log(`4. Run 'npm run dev' to test the component locally`);
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
  generateComponent: main,
  CATEGORIES
}; 