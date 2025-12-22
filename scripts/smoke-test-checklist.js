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

async function runSmokeTest(testName, steps, critical = false) {
  logSection(`Smoke Test: ${testName}`);
  
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
      logError(`⚠️  CRITICAL TEST FAILED - This may indicate deployment issues!`);
    }
  }
}

async function main() {
  logHeader('SATRF Website Production Smoke Tests');
  logInfo('This script will guide you through smoke testing the production deployment.');
  logInfo('Please have the production URL ready before starting.');
  
  // Get production URL
  const args = process.argv.slice(2);
  let productionUrl = args[0];
  
  if (!productionUrl) {
    logWarning('No production URL provided');
    logInfo('Please provide the production URL as an argument:');
    logInfo('node scripts/smoke-test-checklist.js https://your-domain.vercel.app');
    process.exit(1);
  }
  
  logSuccess(`Testing production URL: ${productionUrl}`);

  // Critical Smoke Tests
  await runSmokeTest(
    'Homepage Load Test',
    [
      `Navigate to ${productionUrl}`,
      'Verify the page loads within 3 seconds',
      'Check that the SATRF logo is displayed',
      'Verify navigation menu is visible',
      'Check that the page is responsive on mobile'
    ],
    true
  );

  await runSmokeTest(
    'User Registration Flow',
    [
      `Navigate to ${productionUrl}/register`,
      'Verify the registration form loads correctly',
      'Check that form validation works (try invalid email)',
      'Verify the form is responsive on mobile',
      'Check that required fields are marked appropriately'
    ],
    true
  );

  await runSmokeTest(
    'User Login Flow',
    [
      `Navigate to ${productionUrl}/login`,
      'Verify the login form loads correctly',
      'Check that form validation works (try invalid credentials)',
      'Verify the form is responsive on mobile',
      'Check that password field is properly secured'
    ],
    true
  );

  await runSmokeTest(
    'Results Page Test',
    [
      `Navigate to ${productionUrl}/results`,
      'Verify the results page loads correctly',
      'Check that any existing results are displayed',
      'Test filtering functionality (if available)',
      'Verify the page is responsive on mobile'
    ],
    true
  );

  await runSmokeTest(
    'Donation Page Test',
    [
      `Navigate to ${productionUrl}/donate`,
      'Verify the donation page loads correctly',
      'Check that PayFast integration is working',
      'Test preset amount selection',
      'Test custom amount input',
      'Verify banking details are displayed correctly'
    ],
    false
  );

  await runSmokeTest(
    'Admin Panel Access',
    [
      `Navigate to ${productionUrl}/admin/scores/import`,
      'Verify the admin panel loads (may require login)',
      'Check that file upload interface is present',
      'Verify the page is secure (HTTPS)',
      'Test responsive design on mobile'
    ],
    true
  );

  await runSmokeTest(
    'Contact Page Test',
    [
      `Navigate to ${productionUrl}/contact`,
      'Verify the contact form loads correctly',
      'Check that form validation works',
      'Verify the form is responsive on mobile',
      'Test that contact information is displayed'
    ],
    false
  );

  await runSmokeTest(
    'Navigation Test',
    [
      'Test all main navigation links',
      'Verify each page loads correctly',
      'Check that active page is highlighted',
      'Test mobile menu functionality',
      'Verify footer links work correctly'
    ],
    true
  );

  await runSmokeTest(
    'Performance Test',
    [
      'Use browser dev tools to check page load times',
      'Verify images load properly',
      'Check that no console errors appear',
      'Test that interactive elements respond quickly',
      'Verify the site works on different browsers'
    ],
    false
  );

  await runSmokeTest(
    'Security Test',
    [
      'Verify the site uses HTTPS',
      'Check that sensitive pages require authentication',
      'Verify no sensitive data is exposed in source code',
      'Test that error pages don\'t reveal system information',
      'Check that forms have proper CSRF protection'
    ],
    true
  );

  // Generate final report
  logHeader('Smoke Test Results');
  
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

  // Deployment health assessment
  const criticalFailures = testResults.details.filter(d => d.critical && d.status === 'FAILED').length;
  const isHealthy = criticalFailures === 0 && parseFloat(passRate) >= 80;
  
  log(`\n🏥 Deployment Health Assessment:`, 'bright');
  
  if (isHealthy) {
    logSuccess('  ✅ Deployment is healthy!');
    logSuccess('  ✅ All critical tests passed');
    logSuccess('  ✅ Production environment is stable');
  } else {
    logError('  ❌ Deployment has issues');
    
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
    productionUrl: productionUrl,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      passRate: parseFloat(passRate),
      isHealthy: isHealthy
    },
    details: testResults.details
  };
  
  const reportPath = path.join(process.cwd(), 'deployment-reports', `smoke-test-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`\n📄 Report saved to: ${reportPath}`, 'cyan');
  
  return isHealthy;
}

// Run the main function
main().then((isHealthy) => {
  process.exit(isHealthy ? 0 : 1);
}).catch((error) => {
  logError(`Error during smoke testing: ${error.message}`);
  process.exit(1);
}); 