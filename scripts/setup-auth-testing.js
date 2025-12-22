#!/usr/bin/env node

/**
 * SATRF Authentication System Testing Setup
 * 
 * This script helps set up and test the authentication system
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 SATRF Authentication System Setup\n');

// Check if required files exist
const requiredFiles = [
  'src/contexts/AuthContext.tsx',
  'src/lib/auth.ts',
  'src/pages/login.tsx',
  'src/pages/register.tsx',
  'src/pages/profile.tsx',
  'src/pages/dashboard.tsx',
  'src/components/auth/ProtectedRoute.tsx',
  'src/__tests__/auth/LoginPage.test.tsx'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all authentication components are created.');
  process.exit(1);
}

console.log('\n✅ All required files found!');

// Check environment variables
console.log('\n🔧 Environment Configuration:');
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  console.log(`✅ ${envFile} exists`);
  const envContent = fs.readFileSync(envFile, 'utf8');
  if (envContent.includes('NEXT_PUBLIC_API_BASE_URL')) {
    console.log('✅ API base URL configured');
  } else {
    console.log('⚠️  API base URL not found in .env.local');
  }
} else {
  console.log(`⚠️  ${envFile} not found. Creating template...`);
  
  const envTemplate = `# SATRF Authentication Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_VERSION=v1

# Optional: Enable debug mode
# NEXT_PUBLIC_DEBUG=true
`;
  
  fs.writeFileSync(envFile, envTemplate);
  console.log(`✅ Created ${envFile} with template configuration`);
}

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['axios', 'react', 'next', '@testing-library/react', '@testing-library/jest-dom'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`⚠️  ${dep} - Consider installing if needed`);
  }
});

// Create test data
console.log('\n🧪 Creating test data...');
const testData = {
  users: [
    {
      email: 'demo@satrf.org.za',
      password: 'DemoPass123',
      firstName: 'Demo',
      lastName: 'User',
      membershipType: 'senior',
      club: 'Demo Club'
    },
    {
      email: 'test@example.com',
      password: 'TestPass123',
      firstName: 'Test',
      lastName: 'User',
      membershipType: 'junior',
      club: 'Test Club'
    }
  ],
  apiEndpoints: [
    'POST /users/register',
    'POST /users/login',
    'POST /users/refresh',
    'POST /users/logout',
    'GET /users/profile',
    'PUT /users/profile',
    'GET /users/dashboard',
    'POST /users/change-password',
    'POST /users/forgot-password',
    'POST /users/reset-password',
    'POST /users/confirm-email',
    'GET /users/activity'
  ]
};

const testDataFile = 'test-data/auth-test-data.json';
if (!fs.existsSync('test-data')) {
  fs.mkdirSync('test-data');
}
fs.writeFileSync(testDataFile, JSON.stringify(testData, null, 2));
console.log(`✅ Created ${testDataFile}`);

// Create testing checklist
console.log('\n📋 Creating testing checklist...');
const checklist = `# SATRF Authentication Testing Checklist

## Setup Verification
- [ ] All required files exist
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Backend API running

## Manual Testing
- [ ] Registration flow
  - [ ] Valid registration data
  - [ ] Password strength validation
  - [ ] Email format validation
  - [ ] Duplicate email handling
  - [ ] Form error display

- [ ] Login flow
  - [ ] Valid credentials
  - [ ] Invalid credentials
  - [ ] Password visibility toggle
  - [ ] Remember me functionality
  - [ ] Redirect after login

- [ ] Profile management
  - [ ] View profile data
  - [ ] Edit profile information
  - [ ] Form validation
  - [ ] Save changes
  - [ ] Cancel changes

- [ ] Dashboard
  - [ ] Load dashboard data
  - [ ] Display user statistics
  - [ ] Show recent scores
  - [ ] Show upcoming events
  - [ ] Tab navigation

- [ ] Protected routes
  - [ ] Access without authentication
  - [ ] Redirect to login
  - [ ] Access with authentication
  - [ ] Logout functionality

- [ ] Error handling
  - [ ] Network errors
  - [ ] API errors
  - [ ] Validation errors
  - [ ] Token expiration

## Automated Testing
- [ ] Run \`npm test\`
- [ ] All tests pass
- [ ] Test coverage > 80%
- [ ] No console errors

## Security Testing
- [ ] Password strength requirements
- [ ] Input sanitization
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Token security

## Performance Testing
- [ ] Page load times
- [ ] Form submission speed
- [ ] API response times
- [ ] Memory usage

## Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast
- [ ] Focus indicators
`;

fs.writeFileSync('test-data/testing-checklist.md', checklist);
console.log('✅ Created test-data/testing-checklist.md');

// Create API test script
console.log('\n🔧 Creating API test script...');
const apiTestScript = `#!/usr/bin/env node

/**
 * API Testing Script for SATRF Authentication
 */

const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

const api = axios.create({
  baseURL: \`\${API_BASE_URL}/\${API_VERSION}\`,
  timeout: 10000,
});

async function testAPI() {
  console.log('🧪 Testing SATRF Authentication API\\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await api.get('/health');
    console.log('✅ Health check passed:', healthResponse.data);

    // Test registration
    console.log('\\n2. Testing user registration...');
    const registrationData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'TestPass123',
      membershipType: 'senior',
      club: 'Test Club'
    };

    try {
      const registerResponse = await api.post('/users/register', registrationData);
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  User already exists (expected for testing)');
      } else {
        console.log('❌ Registration failed:', error.response?.data || error.message);
      }
    }

    // Test login
    console.log('\\n3. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'TestPass123'
    };

    try {
      const loginResponse = await api.post('/users/login', loginData);
      console.log('✅ Login successful');
      
      const token = loginResponse.data.access_token;
      
      // Test protected endpoint
      console.log('\\n4. Testing protected endpoint...');
      const profileResponse = await api.get('/users/profile', {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      console.log('✅ Profile access successful:', profileResponse.data);

      // Test logout
      console.log('\\n5. Testing logout...');
      const logoutResponse = await api.post('/users/logout', {}, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      console.log('✅ Logout successful');

    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ API test failed:', error.message);
    console.log('Make sure the backend API is running on', API_BASE_URL);
  }
}

testAPI();
`;

fs.writeFileSync('scripts/test-api.js', apiTestScript);
console.log('✅ Created scripts/test-api.js');

console.log('\n🎉 Setup complete!');
console.log('\n📝 Next steps:');
console.log('1. Start the backend API server');
console.log('2. Run \`npm run dev\` to start the frontend');
console.log('3. Visit http://localhost:3000/login to test the authentication system');
console.log('4. Run \`node scripts/test-api.js\` to test the API endpoints');
console.log('5. Run \`npm test\` to run automated tests');
console.log('\n📋 See test-data/testing-checklist.md for detailed testing instructions'); 