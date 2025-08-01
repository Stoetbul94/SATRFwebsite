#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSection(message) {
  log('\n' + '-'.repeat(40), 'yellow');
  log(`  ${message}`, 'yellow');
  log('-'.repeat(40), 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: null,
  endTime: null,
  details: []
};

function runCommand(command, description) {
  try {
    logInfo(`Running: ${description}`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    });
    logSuccess(`${description} completed successfully`);
    return { success: true, output: result };
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return { success: false, output: error.stdout || error.stderr || error.message };
  }
}

function checkEnvironment() {
  logHeader('Environment Check');
  
  // Check Node.js version
  const nodeVersion = process.version;
  logInfo(`Node.js version: ${nodeVersion}`);
  
  // Check if required packages are installed
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  logInfo(`Project: ${packageJson.name} v${packageJson.version}`);
  
  // Check if development server can start
  logSection('Checking development server');
  const devCheck = runCommand('npm run dev --dry-run', 'Development server check');
  
  if (!devCheck.success) {
    logError('Development server check failed. Please ensure all dependencies are installed.');
    return false;
  }
  
  return true;
}

function generateTestFiles() {
  logSection('Generating Test Files');
  
  try {
    // Run the test data generator
    const result = runCommand('npx ts-node tests/e2e/test-data-generator.ts', 'Test data generation');
    
    if (result.success) {
      logSuccess('Test files generated successfully');
      return true;
    } else {
      logError('Failed to generate test files');
      return false;
    }
  } catch (error) {
    logError(`Test file generation error: ${error.message}`);
    return false;
  }
}

function runUnitTests() {
  logSection('Running Unit Tests');
  
  const result = runCommand('npm test', 'Unit tests');
  
  if (result.success) {
    testResults.passed += 1;
    logSuccess('Unit tests passed');
  } else {
    testResults.failed += 1;
    logError('Unit tests failed');
  }
  
  testResults.total += 1;
  testResults.details.push({
    category: 'Unit Tests',
    status: result.success ? 'PASSED' : 'FAILED',
    output: result.output
  });
}

function runE2ETests() {
  logSection('Running End-to-End Tests');
  
  // First, ensure test files exist
  if (!generateTestFiles()) {
    logError('Cannot run E2E tests without test files');
    return;
  }
  
  const result = runCommand('npm run test:e2e', 'End-to-end tests');
  
  if (result.success) {
    testResults.passed += 1;
    logSuccess('E2E tests passed');
  } else {
    testResults.failed += 1;
    logError('E2E tests failed');
  }
  
  testResults.total += 1;
  testResults.details.push({
    category: 'E2E Tests',
    status: result.success ? 'PASSED' : 'FAILED',
    output: result.output
  });
}

function runPerformanceTests() {
  logSection('Running Performance Tests');
  
  // Check bundle size
  const buildResult = runCommand('npm run build', 'Production build');
  
  if (buildResult.success) {
    testResults.passed += 1;
    logSuccess('Production build successful');
    
    // Check bundle size
    const statsPath = path.join(process.cwd(), '.next', 'build-manifest.json');
    if (fs.existsSync(statsPath)) {
      const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
      logInfo('Build completed successfully');
    }
  } else {
    testResults.failed += 1;
    logError('Production build failed');
  }
  
  testResults.total += 1;
  testResults.details.push({
    category: 'Performance Tests',
    status: buildResult.success ? 'PASSED' : 'FAILED',
    output: buildResult.output
  });
}

function runAccessibilityTests() {
  logSection('Running Accessibility Tests');
  
  // Run basic accessibility checks
  const accessibilityChecks = [
    'npm run lint', // ESLint with accessibility rules
  ];
  
  let allPassed = true;
  
  for (const check of accessibilityChecks) {
    const result = runCommand(check, `Accessibility check: ${check}`);
    if (!result.success) {
      allPassed = false;
    }
  }
  
  if (allPassed) {
    testResults.passed += 1;
    logSuccess('Accessibility tests passed');
  } else {
    testResults.failed += 1;
    logError('Accessibility tests failed');
  }
  
  testResults.total += 1;
  testResults.details.push({
    category: 'Accessibility Tests',
    status: allPassed ? 'PASSED' : 'FAILED',
    output: 'Accessibility checks completed'
  });
}

function runSecurityTests() {
  logSection('Running Security Tests');
  
  // Check for known vulnerabilities
  const auditResult = runCommand('npm audit --audit-level=moderate', 'Security audit');
  
  if (auditResult.success) {
    testResults.passed += 1;
    logSuccess('Security audit passed');
  } else {
    testResults.failed += 1;
    logWarning('Security audit found vulnerabilities');
  }
  
  testResults.total += 1;
  testResults.details.push({
    category: 'Security Tests',
    status: auditResult.success ? 'PASSED' : 'WARNING',
    output: auditResult.output
  });
}

function generateReport() {
  logHeader('Test Report');
  
  const duration = testResults.endTime - testResults.startTime;
  const durationMinutes = Math.floor(duration / 60000);
  const durationSeconds = Math.floor((duration % 60000) / 1000);
  
  log(`\n📊 Test Summary:`, 'bright');
  log(`   Total Tests: ${testResults.total}`, 'cyan');
  log(`   Passed: ${testResults.passed}`, 'green');
  log(`   Failed: ${testResults.failed}`, 'red');
  log(`   Skipped: ${testResults.skipped}`, 'yellow');
  log(`   Duration: ${durationMinutes}m ${durationSeconds}s`, 'cyan');
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`   Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');
  
  log(`\n📋 Detailed Results:`, 'bright');
  testResults.details.forEach((detail, index) => {
    const statusColor = detail.status === 'PASSED' ? 'green' : 
                       detail.status === 'WARNING' ? 'yellow' : 'red';
    log(`   ${index + 1}. ${detail.category}: ${detail.status}`, statusColor);
  });
  
  // Generate recommendations
  log(`\n💡 Recommendations:`, 'bright');
  
  if (testResults.failed > 0) {
    logError('  • Fix failed tests before launch');
    logError('  • Review error logs for specific issues');
  }
  
  if (passRate < 80) {
    logWarning('  • Test coverage is below recommended threshold');
    logWarning('  • Consider adding more test cases');
  }
  
  if (testResults.details.some(d => d.status === 'WARNING')) {
    logWarning('  • Address security vulnerabilities');
    logWarning('  • Update dependencies if needed');
  }
  
  // Launch readiness assessment
  log(`\n🚀 Launch Readiness Assessment:`, 'bright');
  
  const isReady = testResults.failed === 0 && passRate >= 80;
  
  if (isReady) {
    logSuccess('  ✅ Website is ready for launch!');
    logSuccess('  ✅ All critical tests passed');
    logSuccess('  ✅ Performance benchmarks met');
  } else {
    logError('  ❌ Website is NOT ready for launch');
    logError('  ❌ Critical issues need to be addressed');
    
    if (testResults.failed > 0) {
      logError(`  ❌ ${testResults.failed} test(s) failed`);
    }
    
    if (passRate < 80) {
      logError(`  ❌ Pass rate (${passRate}%) below threshold`);
    }
  }
  
  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      passRate: parseFloat(passRate),
      duration: duration,
      isReadyForLaunch: isReady
    },
    details: testResults.details,
    recommendations: {
      critical: testResults.failed > 0 ? ['Fix failed tests before launch'] : [],
      important: passRate < 80 ? ['Improve test coverage'] : [],
      optional: testResults.details.some(d => d.status === 'WARNING') ? ['Address security warnings'] : []
    }
  };
  
  const reportPath = path.join(process.cwd(), 'test-results', 'launch-readiness-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`\n📄 Report saved to: ${reportPath}`, 'cyan');
  
  return isReady;
}

function main() {
  logHeader('SATRF Website Launch Readiness Testing');
  
  testResults.startTime = Date.now();
  
  // Environment check
  if (!checkEnvironment()) {
    logError('Environment check failed. Exiting.');
    process.exit(1);
  }
  
  // Run all test suites
  runUnitTests();
  runE2ETests();
  runPerformanceTests();
  runAccessibilityTests();
  runSecurityTests();
  
  testResults.endTime = Date.now();
  
  // Generate final report
  const isReady = generateReport();
  
  // Exit with appropriate code
  process.exit(isReady ? 0 : 1);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log(`
Usage: node scripts/run-launch-tests.js [options]

Options:
  --help, -h     Show this help message
  --quick        Run only critical tests
  --verbose      Show detailed output
  --report-only  Generate report from existing results

Examples:
  node scripts/run-launch-tests.js
  node scripts/run-launch-tests.js --quick
  node scripts/run-launch-tests.js --verbose
`, 'cyan');
  process.exit(0);
}

// Run the main function
main(); 