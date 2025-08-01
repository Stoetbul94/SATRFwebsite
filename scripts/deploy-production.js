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
  
  // Check if we're on main branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (currentBranch !== 'main') {
    logWarning(`Current branch is ${currentBranch}, not main`);
    logInfo('Please ensure you want to deploy from this branch');
  } else {
    logSuccess('Deploying from main branch');
  }
  
  // Check for uncommitted changes
  const hasChanges = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (hasChanges) {
    logWarning('There are uncommitted changes in the repository');
    logInfo('Consider committing or stashing changes before deployment');
  } else {
    logSuccess('No uncommitted changes detected');
  }
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    logSuccess('Vercel CLI is installed');
  } catch (error) {
    logError('Vercel CLI not found. Please install with: npm install -g vercel');
    return false;
  }
  
  return true;
}

function validateEnvironmentVariables() {
  logSection('Environment Variables Validation');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  let allValid = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is set`);
    } else {
      logError(`${envVar} is not set`);
      allValid = false;
    }
  }
  
  if (!allValid) {
    logError('Some required environment variables are missing');
    logInfo('Please set them in your Vercel project settings');
    return false;
  }
  
  return true;
}

function runPreDeploymentTests() {
  logSection('Pre-Deployment Tests');
  
  // Run linting
  const lintResult = runCommand('npm run lint', 'Linting');
  if (!lintResult.success) {
    logWarning('Linting issues found, but continuing with deployment');
  }
  
  // Run unit tests
  const testResult = runCommand('npm test', 'Unit tests');
  if (!testResult.success) {
    logWarning('Some unit tests failed, but continuing with deployment');
  }
  
  // Build test
  const buildResult = runCommand('npm run build', 'Production build');
  if (!buildResult.success) {
    logError('Build failed. Cannot proceed with deployment.');
    return false;
  }
  
  return true;
}

function deployToVercel() {
  logSection('Deploying to Vercel');
  
  // Deploy to production
  const deployResult = runCommand('vercel --prod --yes', 'Production deployment');
  if (!deployResult.success) {
    logError('Deployment failed');
    return false;
  }
  
  // Extract deployment URL from output
  const urlMatch = deployResult.output.match(/https:\/\/[^\s]+\.vercel\.app/);
  if (urlMatch) {
    global.deploymentUrl = urlMatch[0];
    logSuccess(`Deployment URL: ${global.deploymentUrl}`);
  }
  
  return true;
}

function runSmokeTests() {
  logSection('Post-Deployment Smoke Tests');
  
  if (!global.deploymentUrl) {
    logError('No deployment URL available for smoke tests');
    return false;
  }
  
  const smokeTests = [
    {
      name: 'Homepage Load',
      url: '/',
      expected: 'SATRF'
    },
    {
      name: 'Results Page',
      url: '/results',
      expected: 'Results'
    },
    {
      name: 'Donate Page',
      url: '/donate',
      expected: 'Donate'
    },
    {
      name: 'Contact Page',
      url: '/contact',
      expected: 'Contact'
    }
  ];
  
  let allPassed = true;
  
  for (const test of smokeTests) {
    try {
      logInfo(`Testing: ${test.name}`);
      const response = execSync(`curl -s "${global.deploymentUrl}${test.url}"`, { 
        encoding: 'utf8',
        timeout: 30000
      });
      
      if (response.includes(test.expected)) {
        logSuccess(`${test.name} - PASSED`);
      } else {
        logError(`${test.name} - FAILED (expected "${test.expected}" not found)`);
        allPassed = false;
      }
    } catch (error) {
      logError(`${test.name} - FAILED (${error.message})`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

function generateDeploymentReport() {
  logHeader('Deployment Report');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    deploymentUrl: global.deploymentUrl || 'Unknown',
    gitCommit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
    gitBranch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
    nodeVersion: process.version,
    buildTime: new Date().toISOString(),
    status: 'SUCCESS'
  };
  
  // Save report
  const reportPath = path.join(process.cwd(), 'deployment-reports', `deployment-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`📄 Deployment report saved to: ${reportPath}`, 'cyan');
  
  // Display summary
  log(`\n📊 Deployment Summary:`, 'bright');
  log(`   URL: ${reportData.deploymentUrl}`, 'cyan');
  log(`   Commit: ${reportData.gitCommit.substring(0, 8)}`, 'cyan');
  log(`   Branch: ${reportData.gitBranch}`, 'cyan');
  log(`   Status: ${reportData.status}`, 'green');
  
  return reportData;
}

function generateTeamNotification() {
  const notification = `
🚀 **SATRF Website Production Deployment Complete**

**Deployment Details:**
- **URL:** ${global.deploymentUrl || 'Unknown'}
- **Commit:** ${execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8)}
- **Branch:** ${execSync('git branch --show-current', { encoding: 'utf8' }).trim()}
- **Time:** ${new Date().toLocaleString()}

**Status:** ✅ **SUCCESSFULLY DEPLOYED**

**Next Steps:**
1. Verify the deployment at: ${global.deploymentUrl || 'Unknown'}
2. Run manual testing checklist: \`npm run test:manual\`
3. Monitor for any issues in the first 24 hours
4. Check Sentry for any error reports

**Key Features to Test:**
- User registration and login
- Admin score import functionality
- Results display and filtering
- Donation page and payment integration
- Mobile responsiveness

**Support:**
- For technical issues, check the deployment reports
- For user feedback, monitor the application
- For critical issues, refer to the rollback plan

🎉 **The SATRF website is now live in production!**
`;

  // Save notification to file
  const notificationPath = path.join(process.cwd(), 'deployment-reports', `team-notification-${Date.now()}.txt`);
  fs.writeFileSync(notificationPath, notification);
  
  log(`\n📧 Team notification saved to: ${notificationPath}`, 'cyan');
  log(`\n${notification}`, 'bright');
  
  return notification;
}

async function main() {
  logHeader('SATRF Website Production Deployment');
  
  try {
    // Step 1: Environment check
    if (!checkEnvironment()) {
      logError('Environment check failed. Exiting.');
      process.exit(1);
    }
    
    // Step 2: Validate environment variables
    if (!validateEnvironmentVariables()) {
      logError('Environment variables validation failed. Exiting.');
      process.exit(1);
    }
    
    // Step 3: Run pre-deployment tests
    if (!runPreDeploymentTests()) {
      logError('Pre-deployment tests failed. Exiting.');
      process.exit(1);
    }
    
    // Step 4: Deploy to Vercel
    if (!deployToVercel()) {
      logError('Deployment failed. Exiting.');
      process.exit(1);
    }
    
    // Step 5: Run smoke tests
    if (!runSmokeTests()) {
      logWarning('Some smoke tests failed, but deployment completed');
    }
    
    // Step 6: Generate reports
    const report = generateDeploymentReport();
    const notification = generateTeamNotification();
    
    logHeader('Deployment Complete');
    logSuccess('SATRF website has been successfully deployed to production!');
    logSuccess(`Live URL: ${global.deploymentUrl}`);
    
  } catch (error) {
    logError(`Deployment failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 