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
      stdio: 'pipe'
    });
    logSuccess(`${description} completed successfully`);
    return { success: true, output: result };
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return { success: false, output: error.stdout || error.stderr || error.message };
  }
}

function checkEnvironmentVariables() {
  logHeader('Environment Variables Check');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SENTRY_DSN',
    'NEXT_PUBLIC_GA_TRACKING_ID',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];
  
  let allSet = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is set`);
    } else {
      logError(`${envVar} is not set`);
      allSet = false;
    }
  }
  
  if (!allSet) {
    logWarning('Some environment variables are missing');
    logInfo('Please set them in your Vercel project settings');
    return false;
  }
  
  return true;
}

function installDependencies() {
  logHeader('Installing Monitoring Dependencies');
  
  const dependencies = [
    '@vercel/analytics',
    '@sentry/nextjs'
  ];
  
  for (const dep of dependencies) {
    const result = runCommand(`npm install ${dep}`, `Installing ${dep}`);
    if (!result.success) {
      logWarning(`Failed to install ${dep}, but continuing...`);
    }
  }
  
  // Install Lighthouse CI globally
  runCommand('npm install -g @lhci/cli', 'Installing Lighthouse CI');
  
  return true;
}

function createMonitoringDirectories() {
  logHeader('Creating Monitoring Directories');
  
  const directories = [
    'monitoring',
    'monitoring/reports',
    'monitoring/alerts',
    'lighthouse-reports'
  ];
  
  for (const dir of directories) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      logSuccess(`Created directory: ${dir}`);
    } catch (error) {
      logWarning(`Directory ${dir} already exists or could not be created`);
    }
  }
  
  return true;
}

function verifyComponents() {
  logHeader('Verifying Monitoring Components');
  
  const components = [
    'src/components/GoogleAnalytics.tsx',
    'src/components/VercelAnalytics.tsx',
    'src/lib/analytics.ts',
    'src/lib/performance.ts',
    'src/pages/api/health.ts',
    'src/pages/api/test-error.ts',
    'lighthouserc.js'
  ];
  
  let allExist = true;
  
  for (const component of components) {
    if (fs.existsSync(component)) {
      logSuccess(`${component} exists`);
    } else {
      logError(`${component} missing`);
      allExist = false;
    }
  }
  
  return allExist;
}

function generateSetupInstructions() {
  logHeader('Setup Instructions');
  
  const instructions = `
📋 **Next Steps for Monitoring Setup:**

1. **Environment Variables (Vercel Dashboard):**
   - NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   - NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
   - SENTRY_AUTH_TOKEN=your-sentry-auth-token

2. **Sentry Setup:**
   - Create project at https://sentry.io
   - Configure alert rules
   - Set up release tracking

3. **Google Analytics Setup:**
   - Create GA4 property at https://analytics.google.com
   - Copy Measurement ID to environment variables

4. **Vercel Analytics:**
   - Enable in Vercel Dashboard > Analytics tab

5. **Uptime Monitoring:**
   - Set up UptimeRobot for https://your-domain.vercel.app/api/health
   - Configure Vercel Status Page

6. **Test Monitoring:**
   - Test Sentry: curl -X POST https://your-domain.vercel.app/api/test-error
   - Test Health: curl https://your-domain.vercel.app/api/health
   - Run Lighthouse: lhci autorun

📊 **Dashboard Access:**
- Sentry: https://sentry.io/organizations/your-org/projects/satrf-website/
- Google Analytics: https://analytics.google.com/analytics/web/
- Vercel Analytics: https://vercel.com/your-org/satrf-website/analytics
- Firebase Analytics: https://console.firebase.google.com/project/your-project/analytics

🚨 **Alert Configuration:**
- Critical errors: > 5% error rate for 5 minutes
- Performance: > 5 seconds load time for 5% of requests
- Uptime: < 99% for 10 minutes

📞 **Support:**
- Review PRODUCTION_MONITORING_SETUP.md for detailed instructions
- Contact development team for technical issues
  `;
  
  log(instructions, 'cyan');
}

function main() {
  logHeader('SATRF Website Monitoring Setup');
  
  try {
    // Step 1: Check environment variables
    const envOk = checkEnvironmentVariables();
    
    // Step 2: Install dependencies
    installDependencies();
    
    // Step 3: Create directories
    createMonitoringDirectories();
    
    // Step 4: Verify components
    const componentsOk = verifyComponents();
    
    // Step 5: Generate instructions
    generateSetupInstructions();
    
    // Summary
    logHeader('Setup Summary');
    
    if (envOk && componentsOk) {
      logSuccess('Monitoring setup completed successfully!');
      logInfo('All components are ready for production deployment');
    } else {
      logWarning('Setup completed with some issues');
      logInfo('Please review the warnings above and complete the setup');
    }
    
    logInfo('Next: Deploy to production and test monitoring');
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 