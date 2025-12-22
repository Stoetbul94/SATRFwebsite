const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}'
  ],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}', '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/utils/',
    '<rootDir>/src/__tests__/analytics/test-utils.ts',
    '<rootDir>/src/__tests__/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(source-map-support|@fullcalendar|@fullcalendar/core|@fullcalendar/react|@fullcalendar/daygrid|@fullcalendar/timegrid|@fullcalendar/interaction|@fullcalendar/list|preact|@preact|@chakra-ui|@emotion|framer-motion)/)'
  ],
  // Memory and performance optimizations
  maxWorkers: 2, // Limit concurrent workers to reduce memory usage
  workerIdleMemoryLimit: '512MB', // Limit memory per worker
  testTimeout: 30000, // Increase timeout for complex tests
  // Test isolation and cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // Prevent memory leaks (temporarily disabled to fix current issues)
  detectLeaks: false,
  detectOpenHandles: false,
  // Better error reporting
  verbose: true,
  // Coverage settings
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 