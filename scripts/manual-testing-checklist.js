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

function logStep(step, description) {
  log(`\n${step}. ${description}`, 'bright');
}

function promptUser(prompt) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt} (y/n): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

async function runManualTest(testName, steps, critical = false) {
  logSection(`Manual Test: ${testName}`);
  
  testResults.total++;
  
  logInfo(`Steps to follow:`);
  steps.forEach((step, index) => {
    log(`   ${index + 1}. ${step}`, 'blue');
  });
  
  const passed = await promptUser(`Did this test pass?`);
  
  if (passed) {
    testResults.passed++;
    logSuccess(`${testName} - PASSED`);
    testResults.details.push({
      test: testName,
      status: 'PASSED',
      critical: critical
    });
  } else {
    testResults.failed++;
    logError(`${testName} - FAILED`);
    testResults.details.push({
      test: testName,
      status: 'FAILED',
      critical: critical
    });
    
    if (critical) {
      logError(`⚠️  CRITICAL TEST FAILED - This may block launch!`);
    }
  }
}

async function main() {
  logHeader('SATRF Website Manual Testing Checklist');
  logInfo('This script will guide you through manual testing of critical user journeys.');
  logInfo('Please have the website running locally (npm run dev) before starting.');
  
  // Check if dev server is running
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'pipe' });
    logSuccess('Development server appears to be running on localhost:3000');
  } catch (error) {
    logWarning('Development server not detected on localhost:3000');
    logInfo('Please start the development server with: npm run dev');
    const continueAnyway = await promptUser('Continue anyway?');
    if (!continueAnyway) {
      process.exit(1);
    }
  }

  // Critical User Journey Tests
  await runManualTest(
    'User Registration Flow',
    [
      'Navigate to /register page',
      'Fill out registration form with valid data',
      'Submit the form',
      'Verify successful registration (redirect to login or dashboard)',
      'Check that validation works for invalid data'
    ],
    true
  );

  await runManualTest(
    'User Login Flow',
    [
      'Navigate to /login page',
      'Enter valid credentials',
      'Submit the form',
      'Verify successful login and redirect',
      'Test logout functionality'
    ],
    true
  );

  await runManualTest(
    'Admin Score Import',
    [
      'Login as admin user',
      'Navigate to /admin/scores/import',
      'Upload a valid Excel/CSV file',
      'Verify file parsing and preview',
      'Confirm successful import',
      'Check that validation works for invalid files'
    ],
    true
  );

  await runManualTest(
    'Results Display',
    [
      'Navigate to /results page',
      'Verify results are displayed correctly',
      'Test filtering by event/division',
      'Test sorting functionality',
      'Check responsive layout on mobile'
    ],
    true
  );

  await runManualTest(
    'Donation Page',
    [
      'Navigate to /donate page',
      'Verify PayFast form loads correctly',
      'Test preset amount selection',
      'Test custom amount input',
      'Verify banking details are displayed',
      'Test copy-to-clipboard functionality'
    ],
    false
  );

  await runManualTest(
    'Navigation & Responsiveness',
    [
      'Test all navigation links work correctly',
      'Verify header and footer display properly',
      'Test mobile menu functionality',
      'Check responsive design on different screen sizes',
      'Verify all pages load without errors'
    ],
    true
  );

  await runManualTest(
    'Error Handling',
    [
      'Test 404 page functionality',
      'Verify error messages are user-friendly',
      'Test form validation error display',
      'Check that API errors are handled gracefully'
    ],
    false
  );

  await runManualTest(
    'Performance & Loading',
    [
      'Verify pages load within 3 seconds',
      'Check that images load properly',
      'Test that interactive elements respond quickly',
      'Verify no console errors in browser dev tools'
    ],
    false
  );

  // Generate final report
  logHeader('Manual Testing Results');
  
  log(`\n📊 Test Summary:`, 'bright');
  log(`   Total Tests: ${testResults.total}`, 'cyan');
  log(`   Passed: ${testResults.passed}`, 'green');
  log(`   Failed: ${testResults.failed}`, 'red');
  log(`   Skipped: ${testResults.skipped}`, 'yellow');
  
  const passRate = testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : '0.0';
  log(`   Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');
  
  log(`\n📋 Detailed Results:`, 'bright');
  testResults.details.forEach((detail, index) => {
    const statusColor = detail.status === 'PASSED' ? 'green' : 'red';
    const criticalFlag = detail.critical ? ' [CRITICAL]' : '';
    log(`   ${index + 1}. ${detail.test}: ${detail.status}${criticalFlag}`, statusColor);
  });

  // Launch readiness assessment
  const criticalFailures = testResults.details.filter(d => d.critical && d.status === 'FAILED').length;
  const isReady = criticalFailures === 0 && parseFloat(passRate) >= 80;
  
  log(`\n🚀 Launch Readiness Assessment:`, 'bright');
  
  if (isReady) {
    logSuccess('  ✅ Website is ready for launch!');
    logSuccess('  ✅ All critical tests passed');
    logSuccess('  ✅ Manual testing validation complete');
  } else {
    logError('  ❌ Website is NOT ready for launch');
    
    if (criticalFailures > 0) {
      logError(`  ❌ ${criticalFailures} critical test(s) failed`);
    }
    
    if (parseFloat(passRate) < 80) {
      logError(`  ❌ Pass rate (${passRate}%) below threshold`);
    }
  }

  // Save report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      passRate: parseFloat(passRate),
      isReadyForLaunch: isReady
    },
    details: testResults.details
  };
  
  const reportPath = path.join(process.cwd(), 'test-results', 'manual-testing-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`\n📄 Report saved to: ${reportPath}`, 'cyan');
  
  return isReady;
}

// Run the main function
main().then((isReady) => {
  process.exit(isReady ? 0 : 1);
}).catch((error) => {
  logError(`Error during testing: ${error.message}`);
  process.exit(1);
}); 