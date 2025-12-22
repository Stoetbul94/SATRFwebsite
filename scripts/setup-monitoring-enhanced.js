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
  
  const optionalEnvVars = [
    'SENTRY_AUTH_TOKEN',
    'SLACK_WEBHOOK_URL',
    'LHCI_TOKEN'
  ];
  
  let allRequiredSet = true;
  let optionalSet = 0;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is set`);
    } else {
      logError(`${envVar} is not set`);
      allRequiredSet = false;
    }
  }
  
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is set (optional)`);
      optionalSet++;
    } else {
      logWarning(`${envVar} is not set (optional)`);
    }
  }
  
  if (!allRequiredSet) {
    logWarning('Some required environment variables are missing');
    logInfo('Please set them in your Vercel project settings');
    return false;
  }
  
  logInfo(`Optional variables set: ${optionalSet}/${optionalEnvVars.length}`);
  return true;
}

function installDependencies() {
  logHeader('Installing Monitoring Dependencies');
  
  const dependencies = [
    '@vercel/analytics',
    '@sentry/nextjs'
  ];
  
  const devDependencies = [
    '@lhci/cli'
  ];
  
  // Install production dependencies
  for (const dep of dependencies) {
    const result = runCommand(`npm install ${dep}`, `Installing ${dep}`);
    if (!result.success) {
      logWarning(`Failed to install ${dep}, but continuing...`);
    }
  }
  
  // Install dev dependencies
  for (const dep of devDependencies) {
    const result = runCommand(`npm install --save-dev ${dep}`, `Installing ${dep} (dev)`);
    if (!result.success) {
      logWarning(`Failed to install ${dep}, but continuing...`);
    }
  }
  
  return true;
}

function createMonitoringDirectories() {
  logHeader('Creating Monitoring Directories');
  
  const directories = [
    'monitoring',
    'monitoring/reports',
    'monitoring/alerts',
    'monitoring/config',
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
    'src/lib/monitoring.ts',
    'src/components/monitoring/MonitoringDashboard.tsx',
    'src/pages/monitoring.tsx',
    'src/pages/api/health.ts',
    'src/pages/api/alerts.ts',
    'src/pages/api/test-error.ts',
    'sentry.client.config.js',
    'sentry.server.config.js',
    'sentry.edge.config.js'
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

function createConfigurationFiles() {
  logHeader('Creating Configuration Files');
  
  // Create monitoring config
  const monitoringConfig = {
    version: '1.0',
    alertThresholds: {
      errorRate: 0.05,
      pageLoadTime: 5000,
      memoryUsage: 0.8,
      uptime: 0.99
    },
    notificationChannels: {
      email: {
        enabled: true,
        recipients: {
          critical: ['dev-team@satrf.com', 'cto@satrf.com'],
          high: ['dev-team@satrf.com'],
          medium: ['dev-team@satrf.com'],
          low: ['dev-team@satrf.com']
        }
      },
      slack: {
        enabled: true,
        webhook: process.env.SLACK_WEBHOOK_URL || '',
        channels: {
          critical: '#satrf-alerts-critical',
          high: '#satrf-alerts',
          medium: '#satrf-alerts',
          low: '#satrf-alerts'
        }
      }
    },
    healthChecks: {
      database: true,
      externalServices: true,
      fileSystem: true,
      memoryUsage: true
    }
  };
  
  try {
    fs.writeFileSync(
      'monitoring/config/monitoring.json',
      JSON.stringify(monitoringConfig, null, 2)
    );
    logSuccess('Created monitoring.json configuration');
  } catch (error) {
    logError(`Failed to create monitoring.json: ${error.message}`);
  }
  
  // Create alert templates
  const alertTemplates = {
    critical: {
      title: '🚨 CRITICAL ALERT - SATRF Website',
      template: 'Critical issue detected: {message}. Immediate attention required.',
      channels: ['email', 'slack', 'sms'],
      responseTime: 15
    },
    high: {
      title: '⚠️ HIGH PRIORITY ALERT - SATRF Website',
      template: 'High priority issue: {message}. Response required within 1 hour.',
      channels: ['email', 'slack'],
      responseTime: 60
    },
    medium: {
      title: '📊 MEDIUM PRIORITY ALERT - SATRF Website',
      template: 'Medium priority issue: {message}. Response required within 4 hours.',
      channels: ['email'],
      responseTime: 240
    },
    low: {
      title: 'ℹ️ LOW PRIORITY ALERT - SATRF Website',
      template: 'Low priority issue: {message}. Response required within 8 hours.',
      channels: ['email'],
      responseTime: 480
    }
  };
  
  try {
    fs.writeFileSync(
      'monitoring/config/alert-templates.json',
      JSON.stringify(alertTemplates, null, 2)
    );
    logSuccess('Created alert-templates.json');
  } catch (error) {
    logError(`Failed to create alert-templates.json: ${error.message}`);
  }
}

function setupLighthouseCI() {
  logHeader('Setting up Lighthouse CI');
  
  const lighthouserc = {
    ci: {
      collect: {
        url: ['https://your-domain.vercel.app'],
        numberOfRuns: 3,
        settings: {
          chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        },
      },
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.8 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:best-practices': ['warn', { minScore: 0.8 }],
          'categories:seo': ['warn', { minScore: 0.8 }],
        },
      },
      upload: {
        target: 'lhci',
        serverBaseUrl: 'https://your-lhci-server.com',
        token: process.env.LHCI_TOKEN,
      },
    },
  };
  
  try {
    fs.writeFileSync(
      'lighthouserc.js',
      `module.exports = ${JSON.stringify(lighthouserc, null, 2)};`
    );
    logSuccess('Created lighthouserc.js configuration');
  } catch (error) {
    logError(`Failed to create lighthouserc.js: ${error.message}`);
  }
}

function createMonitoringScripts() {
  logHeader('Adding Monitoring Scripts to package.json');
  
  try {
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add monitoring scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'monitor:health': 'curl -s https://your-domain.vercel.app/api/health | jq .',
      'monitor:performance': 'lhci autorun',
      'monitor:alerts': 'curl -s https://your-domain.vercel.app/api/alerts | jq .',
      'monitor:test': 'curl -X POST https://your-domain.vercel.app/api/test-error',
      'monitor:report': 'node scripts/generate-monitoring-report.js',
      'monitor:setup': 'node scripts/setup-monitoring-enhanced.js'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    logSuccess('Added monitoring scripts to package.json');
  } catch (error) {
    logError(`Failed to update package.json: ${error.message}`);
  }
}

function runHealthCheck() {
  logHeader('Running Basic Health Check');
  
  try {
    // Check if the app can start
    const result = runCommand('npm run build', 'Building application');
    if (result.success) {
      logSuccess('Application builds successfully');
    } else {
      logWarning('Application build failed - check for issues');
    }
    
    // Check if monitoring components are accessible
    const components = [
      'src/lib/monitoring.ts',
      'src/pages/api/health.ts',
      'src/pages/api/alerts.ts'
    ];
    
    for (const component of components) {
      if (fs.existsSync(component)) {
        logSuccess(`${component} is accessible`);
      } else {
        logError(`${component} is missing`);
      }
    }
    
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
  }
}

function generateSetupInstructions() {
  logHeader('Setup Instructions');
  
  const instructions = `
📋 **Next Steps for Monitoring Setup:**

1. **Environment Variables (Vercel Dashboard):**
   - NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   - NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
   - SENTRY_AUTH_TOKEN=your-sentry-auth-token (optional)
   - SLACK_WEBHOOK_URL=your-slack-webhook (optional)
   - LHCI_TOKEN=your-lighthouse-token (optional)

2. **Sentry Setup:**
   - Create project at https://sentry.io
   - Configure alert rules in Sentry Dashboard
   - Set up release tracking
   - Configure source maps upload

3. **Google Analytics Setup:**
   - Create GA4 property at https://analytics.google.com
   - Copy Measurement ID to environment variables
   - Set up custom events and goals

4. **Vercel Analytics:**
   - Enable in Vercel Dashboard > Analytics tab
   - Configure Web Analytics settings

5. **Uptime Monitoring:**
   - Set up UptimeRobot for https://your-domain.vercel.app/api/health
   - Configure Vercel Status Page
   - Set up incident notifications

6. **Slack Integration (Optional):**
   - Create Slack app and webhook
   - Configure alert channels
   - Test notifications

7. **Test Monitoring:**
   - Test Sentry: npm run monitor:test
   - Test Health: npm run monitor:health
   - Test Performance: npm run monitor:performance
   - Test Alerts: npm run monitor:alerts

📊 **Dashboard Access:**
- Monitoring Dashboard: https://your-domain.vercel.app/monitoring
- Sentry: https://sentry.io/organizations/your-org/projects/satrf-website/
- Google Analytics: https://analytics.google.com/analytics/web/
- Vercel Analytics: https://vercel.com/your-org/satrf-website/analytics
- Firebase Analytics: https://console.firebase.google.com/project/your-project/analytics

🚨 **Alert Configuration:**
- Critical errors: > 5% error rate for 5 minutes
- Performance: > 5 seconds load time for 5% of requests
- Uptime: < 99% for 10 minutes
- Memory usage: > 80% for 5 minutes

📞 **Support:**
- Review MONITORING_SYSTEM_GUIDE.md for detailed instructions
- Contact development team for technical issues
- Check monitoring dashboard for real-time status

🔧 **Available Commands:**
- npm run monitor:health - Check system health
- npm run monitor:performance - Run performance audit
- npm run monitor:alerts - View active alerts
- npm run monitor:test - Test error tracking
- npm run monitor:report - Generate monitoring report
  `;
  
  log(instructions, 'cyan');
}

function main() {
  logHeader('SATRF Website Enhanced Monitoring Setup');
  
  try {
    // Step 1: Check environment variables
    const envOk = checkEnvironmentVariables();
    
    // Step 2: Install dependencies
    installDependencies();
    
    // Step 3: Create directories
    createMonitoringDirectories();
    
    // Step 4: Verify components
    const componentsOk = verifyComponents();
    
    // Step 5: Create configuration files
    createConfigurationFiles();
    
    // Step 6: Setup Lighthouse CI
    setupLighthouseCI();
    
    // Step 7: Add monitoring scripts
    createMonitoringScripts();
    
    // Step 8: Run health check
    runHealthCheck();
    
    // Step 9: Generate instructions
    generateSetupInstructions();
    
    // Summary
    logHeader('Setup Summary');
    
    if (envOk && componentsOk) {
      logSuccess('Enhanced monitoring setup completed successfully!');
      logInfo('All components are ready for production deployment');
      logInfo('Monitoring dashboard available at /monitoring');
    } else {
      logWarning('Setup completed with some issues');
      logInfo('Please review the warnings above and complete the setup');
    }
    
    logInfo('Next: Deploy to production and test monitoring');
    logInfo('Access monitoring dashboard at: https://your-domain.vercel.app/monitoring');
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 