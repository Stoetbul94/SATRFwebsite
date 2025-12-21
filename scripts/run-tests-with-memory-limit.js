#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const config = {
  memoryLimit: '2GB',
  maxWorkers: 2,
  testTimeout: 30000,
  verbose: true,
  detectLeaks: true,
  detectOpenHandles: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
};

// Build Jest command with memory limits
const jestArgs = [
  '--maxWorkers', config.maxWorkers.toString(),
  '--testTimeout', config.testTimeout.toString(),
  '--verbose',
  '--detectLeaks',
  '--detectOpenHandles',
  '--clearMocks',
  '--restoreMocks',
  '--resetMocks',
  '--passWithNoTests',
];

// Set environment variables for memory management
const env = {
  ...process.env,
  NODE_OPTIONS: `--max-old-space-size=${config.memoryLimit}`,
  JEST_WORKER_IDLE_MEMORY_LIMIT: '512MB',
};

console.log('🚀 Running tests with optimized memory settings...');
console.log(`📊 Memory limit: ${config.memoryLimit}`);
console.log(`🔧 Max workers: ${config.maxWorkers}`);
console.log(`⏱️  Test timeout: ${config.testTimeout}ms`);
console.log('');

// Run Jest
const jestProcess = spawn('npm', ['run', 'jest', ...jestArgs], {
  stdio: 'inherit',
  env,
  cwd: process.cwd(),
});

jestProcess.on('close', (code) => {
  console.log('');
  if (code === 0) {
    console.log('✅ All tests passed successfully!');
  } else {
    console.log(`❌ Tests failed with exit code: ${code}`);
    process.exit(code);
  }
});

jestProcess.on('error', (error) => {
  console.error('❌ Failed to start Jest:', error.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping tests...');
  jestProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping tests...');
  jestProcess.kill('SIGTERM');
});
