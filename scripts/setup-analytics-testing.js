#!/usr/bin/env node

/**
 * SATRF Analytics Dashboard Testing Setup Script
 * 
 * This script helps set up and run comprehensive tests for the Analytics Dashboard component.
 * It includes test data generation, API mocking, and testing utilities.
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 SATRF Analytics Dashboard Testing Setup\n');

// Test data generation
const generateTestData = () => {
  const testData = {
    scoreHistory: Array.from({ length: 50 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      score: 85 + Math.floor(Math.random() * 15),
      xCount: Math.floor(Math.random() * 15),
      eventName: `Test Event ${i + 1}`,
      discipline: ['3P', 'Prone', 'Air Rifle'][i % 3],
      position: Math.floor(Math.random() * 20) + 1,
      totalParticipants: 20 + Math.floor(Math.random() * 30)
    })),
    disciplineStats: [
      {
        discipline: '3P',
        totalMatches: 18,
        averageScore: 91.5,
        personalBest: 98,
        totalXCount: 145,
        averageXCount: 8.1,
        bestScoreDate: '2024-03-15',
        bestScoreEvent: 'Regional Championship'
      },
      {
        discipline: 'Prone',
        totalMatches: 12,
        averageScore: 93.2,
        personalBest: 96,
        totalXCount: 98,
        averageXCount: 8.2,
        bestScoreDate: '2024-04-12',
        bestScoreEvent: 'National Qualifier'
      },
      {
        discipline: 'Air Rifle',
        totalMatches: 8,
        averageScore: 89.8,
        personalBest: 94,
        totalXCount: 62,
        averageXCount: 7.8,
        bestScoreDate: '2024-02-20',
        bestScoreEvent: 'Air Rifle Championship'
      }
    ],
    performanceTrends: [
      { period: 'week', averageScore: 92.5, totalMatches: 3, totalXCount: 18, improvement: 2.1 },
      { period: 'month', averageScore: 91.8, totalMatches: 12, totalXCount: 65, improvement: 1.5 },
      { period: 'quarter', averageScore: 90.2, totalMatches: 38, totalXCount: 305, improvement: 3.2 }
    ],
    eventParticipation: Array.from({ length: 20 }, (_, i) => ({
      eventId: `event-${i + 1}`,
      eventName: `Test Event ${i + 1}`,
      date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      location: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'][i % 4],
      discipline: ['3P', 'Prone', 'Air Rifle'][i % 3],
      status: 'completed',
      score: 85 + Math.floor(Math.random() * 15),
      xCount: Math.floor(Math.random() * 15),
      position: Math.floor(Math.random() * 20) + 1,
      totalParticipants: 20 + Math.floor(Math.random() * 30)
    })),
    summary: {
      totalMatches: 38,
      totalScore: 3456,
      averageScore: 91.5,
      personalBest: 98,
      totalXCount: 305,
      averageXCount: 8.0,
      improvementRate: 3.2,
      consistencyScore: 85.4
    }
  };

  return testData;
};

// Create test utilities
const createTestUtilities = () => {
  const testUtils = `
// Test utilities for Analytics Dashboard
export const createMockAnalytics = (overrides = {}) => {
  const baseData = ${JSON.stringify(generateTestData(), null, 2)};
  return { ...baseData, ...overrides };
};

export const createMockAPI = (overrides = {}) => ({
  getUserAnalytics: jest.fn().mockResolvedValue(createMockAnalytics()),
  exportAnalytics: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  getScoreHistory: jest.fn().mockResolvedValue(createMockAnalytics().scoreHistory),
  getDisciplineStats: jest.fn().mockResolvedValue(createMockAnalytics().disciplineStats),
  getPerformanceTrends: jest.fn().mockResolvedValue(createMockAnalytics().performanceTrends),
  getEventParticipation: jest.fn().mockResolvedValue(createMockAnalytics().eventParticipation),
  ...overrides
});

export const createMockUtils = (overrides = {}) => ({
  generateMockAnalytics: jest.fn().mockReturnValue(createMockAnalytics()),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
  getDisciplineColor: jest.fn(() => '#3B82F6'),
  getPerformanceLevel: jest.fn(() => ({ level: 'Good', color: '#F59E0B' })),
  calculateImprovementRate: jest.fn(() => 3.2),
  calculateConsistencyScore: jest.fn(() => 85.4),
  ...overrides
});

export const setupBrowserMocks = () => {
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
  
  return { mockCreateObjectURL, mockRevokeObjectURL, mockLink };
};

export const createTestUser = () => ({
  id: 'test-user-123',
  email: 'test@satrf.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'shooter',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z'
});

export const createTestFilters = () => ({
  dateRange: 'last-month',
  discipline: 'all',
  eventType: 'all',
  minScore: 0,
  maxScore: 100
});
`;

  return testUtils;
};

// Create Jest configuration
const createJestConfig = () => {
  const jestConfig = `
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
    '!src/**/*.d.ts',
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
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
`;

  return jestConfig;
};

// Create test setup file
const createTestSetup = () => {
  const setupContent = `
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWillReceiveProps') ||
       args[0].includes('Warning: componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
`;

  return setupContent;
};

// Create package.json scripts
const createPackageScripts = () => {
  const scripts = {
    "test:analytics": "jest --config jest.analytics.config.js",
    "test:analytics:watch": "jest --config jest.analytics.config.js --watch",
    "test:analytics:coverage": "jest --config jest.analytics.config.js --coverage",
    "test:analytics:debug": "jest --config jest.analytics.config.js --runInBand --detectOpenHandles",
    "test:analytics:update": "jest --config jest.analytics.config.js --updateSnapshot"
  };

  return scripts;
};

// Main setup function
const setupAnalyticsTesting = () => {
  console.log('📁 Creating test files and configurations...\n');

  // Create test utilities file
  const testUtilsPath = path.join(__dirname, '..', 'src', '__tests__', 'analytics', 'test-utils.ts');
  fs.writeFileSync(testUtilsPath, createTestUtilities());
  console.log('✅ Created test utilities: src/__tests__/analytics/test-utils.ts');

  // Create Jest configuration
  const jestConfigPath = path.join(__dirname, '..', 'jest.analytics.config.js');
  fs.writeFileSync(jestConfigPath, createJestConfig());
  console.log('✅ Created Jest configuration: jest.analytics.config.js');

  // Create test setup file
  const setupPath = path.join(__dirname, '..', 'src', '__tests__', 'setup.ts');
  fs.writeFileSync(setupPath, createTestSetup());
  console.log('✅ Created test setup: src/__tests__/setup.ts');

  // Update package.json scripts
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.scripts = { ...packageJson.scripts, ...createPackageScripts() };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with analytics test scripts');
  }

  console.log('\n🎯 Analytics Dashboard Testing Setup Complete!\n');
  
  console.log('📋 Available Test Commands:');
  console.log('  npm run test:analytics          - Run all analytics tests');
  console.log('  npm run test:analytics:watch    - Run tests in watch mode');
  console.log('  npm run test:analytics:coverage - Run tests with coverage report');
  console.log('  npm run test:analytics:debug    - Run tests with debugging');
  console.log('  npm run test:analytics:update   - Update test snapshots\n');

  console.log('📚 Test Structure:');
  console.log('  src/__tests__/analytics/');
  console.log('  ├── AnalyticsDashboard.test.tsx  - Main component tests');
  console.log('  └── test-utils.ts                - Test utilities and mocks\n');

  console.log('🔧 Test Coverage Includes:');
  console.log('  ✅ Rendering and initial loading state');
  console.log('  ✅ Data fetching and display');
  console.log('  ✅ Filtering functionality (date range, discipline)');
  console.log('  ✅ Export buttons (CSV, JSON, PDF)');
  console.log('  ✅ Accessibility checks (ARIA, keyboard navigation)');
  console.log('  ✅ Error handling (API failures, edge cases)');
  console.log('  ✅ Responsive layout behavior');
  console.log('  ✅ Component integration and state management');
  console.log('  ✅ Performance and optimization\n');

  console.log('🚀 Quick Start:');
  console.log('  1. Run: npm run test:analytics');
  console.log('  2. Check coverage: npm run test:analytics:coverage');
  console.log('  3. Debug issues: npm run test:analytics:debug\n');

  console.log('💡 Testing Tips:');
  console.log('  • Use test-utils.ts for consistent mock data');
  console.log('  • Check accessibility with screen reader testing');
  console.log('  • Test responsive behavior with different viewport sizes');
  console.log('  • Verify error states and edge cases');
  console.log('  • Ensure proper cleanup in afterEach blocks\n');

  console.log('🔍 Debugging Tests:');
  console.log('  • Add console.log() in test files for debugging');
  console.log('  • Use screen.debug() to inspect rendered elements');
  console.log('  • Check test coverage for missing scenarios');
  console.log('  • Verify mock implementations are correct\n');
};

// Run setup if called directly
if (require.main === module) {
  setupAnalyticsTesting();
}

module.exports = {
  setupAnalyticsTesting,
  generateTestData,
  createTestUtilities,
  createJestConfig,
  createTestSetup
}; 