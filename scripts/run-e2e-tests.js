#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  testDir: 'tests/e2e',
  reportDir: 'playwright-report',
  resultsDir: 'test-results',
  browsers: ['chromium', 'firefox', 'webkit'],
  mobileBrowsers: ['Mobile Chrome', 'Mobile Safari'],
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  headed: process.env.HEADED === 'true',
  debug: process.env.DEBUG === 'true',
  ui: process.env.UI === 'true',
  parallel: process.env.PARALLEL !== 'false',
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
  grep: process.env.GREP || null,
  grepInvert: process.env.GREP_INVERT || null,
  project: process.env.PROJECT || null,
  reporter: process.env.REPORTER || 'html,json,junit',
  screenshot: process.env.SCREENSHOT || 'only-on-failure',
  video: process.env.VIDEO || 'retain-on-failure',
  trace: process.env.TRACE || 'on-first-retry'
};

// Test suites configuration
const TEST_SUITES = {
  smoke: ['auth.spec.ts', 'events-calendar.spec.ts'],
  critical: ['auth.spec.ts', 'events-calendar.spec.ts', 'leaderboard.spec.ts'],
  full: ['auth.spec.ts', 'events-calendar.spec.ts', 'coaching.spec.ts', 'leaderboard.spec.ts', 'rules.spec.ts', 'donate.spec.ts'],
  auth: ['auth.spec.ts'],
  events: ['events-calendar.spec.ts'],
  coaching: ['coaching.spec.ts'],
  leaderboard: ['leaderboard.spec.ts'],
  rules: ['rules.spec.ts'],
  donate: ['donate.spec.ts']
};

class E2ETestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      suites: []
    };
  }

  async run() {
    try {
      console.log('🚀 Starting SATRF E2E Test Suite');
      console.log('=' .repeat(50));
      
      // Parse command line arguments
      const args = this.parseArguments();
      
      // Validate environment
      await this.validateEnvironment();
      
      // Run tests based on arguments
      if (args.suite) {
        await this.runTestSuite(args.suite, args);
      } else if (args.file) {
        await this.runTestFile(args.file, args);
      } else {
        await this.runAllTests(args);
      }
      
      // Generate reports
      await this.generateReports();
      
      // Display summary
      this.displaySummary();
      
      // Exit with appropriate code
      process.exit(this.results.failed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  parseArguments() {
    const args = process.argv.slice(2);
    const options = {
      suite: null,
      file: null,
      browser: null,
      mobile: false,
      headed: false,
      debug: false,
      ui: false,
      parallel: true,
      updateSnapshots: false,
      grep: null,
      grepInvert: null,
      project: null
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--suite':
        case '-s':
          options.suite = args[++i];
          break;
        case '--file':
        case '-f':
          options.file = args[++i];
          break;
        case '--browser':
        case '-b':
          options.browser = args[++i];
          break;
        case '--mobile':
        case '-m':
          options.mobile = true;
          break;
        case '--headed':
        case '-h':
          options.headed = true;
          break;
        case '--debug':
        case '-d':
          options.debug = true;
          break;
        case '--ui':
        case '-u':
          options.ui = true;
          break;
        case '--no-parallel':
          options.parallel = false;
          break;
        case '--update-snapshots':
          options.updateSnapshots = true;
          break;
        case '--grep':
          options.grep = args[++i];
          break;
        case '--grep-invert':
          options.grepInvert = args[++i];
          break;
        case '--project':
          options.project = args[++i];
          break;
        case '--help':
          this.showHelp();
          process.exit(0);
        default:
          console.warn(`⚠️ Unknown argument: ${arg}`);
      }
    }

    return options;
  }

  showHelp() {
    console.log(`
SATRF E2E Test Runner

Usage: node scripts/run-e2e-tests.js [options]

Options:
  --suite, -s <suite>        Run specific test suite (smoke, critical, full, auth, events, coaching, leaderboard, rules, donate)
  --file, -f <file>          Run specific test file
  --browser, -b <browser>    Run tests in specific browser (chromium, firefox, webkit)
  --mobile, -m               Run mobile browser tests
  --headed, -h               Run tests in headed mode (show browser)
  --debug, -d                Run tests in debug mode
  --ui, -u                   Run tests in UI mode
  --no-parallel              Disable parallel test execution
  --update-snapshots         Update test snapshots
  --grep <pattern>           Run tests matching pattern
  --grep-invert <pattern>    Run tests not matching pattern
  --project <project>        Run tests for specific project
  --help                     Show this help message

Examples:
  node scripts/run-e2e-tests.js --suite smoke
  node scripts/run-e2e-tests.js --file auth.spec.ts
  node scripts/run-e2e-tests.js --browser chromium --headed
  node scripts/run-e2e-tests.js --mobile --grep "login"
  node scripts/run-e2e-tests.js --debug --file events-calendar.spec.ts

Environment Variables:
  BASE_URL                   Base URL for tests (default: http://localhost:3000)
  CI                         Enable CI mode (reduces retries, workers)
  HEADED                     Run in headed mode
  DEBUG                      Run in debug mode
  UI                         Run in UI mode
  PARALLEL                   Enable/disable parallel execution
  UPDATE_SNAPSHOTS           Update snapshots
  GREP                       Test pattern to match
  GREP_INVERT                Test pattern to exclude
  PROJECT                    Specific project to run
  REPORTER                   Comma-separated list of reporters
  SCREENSHOT                 Screenshot mode (on, off, only-on-failure)
  VIDEO                      Video mode (on, off, retain-on-failure, on-first-retry)
  TRACE                      Trace mode (on, off, retain-on-failure, on-first-retry)
`);
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    // Check if Node.js version is compatible
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 16) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or higher.`);
    }
    
    // Check if Playwright is installed
    try {
      require('@playwright/test');
    } catch (error) {
      throw new Error('Playwright is not installed. Please run: npm install');
    }
    
    // Check if test directory exists
    if (!fs.existsSync(CONFIG.testDir)) {
      throw new Error(`Test directory not found: ${CONFIG.testDir}`);
    }
    
    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found. Please run this script from the project root.');
    }
    
    console.log('✅ Environment validation passed');
  }

  async runTestSuite(suiteName, options) {
    console.log(`📋 Running test suite: ${suiteName}`);
    
    if (!TEST_SUITES[suiteName]) {
      throw new Error(`Unknown test suite: ${suiteName}. Available suites: ${Object.keys(TEST_SUITES).join(', ')}`);
    }
    
    const files = TEST_SUITES[suiteName];
    console.log(`📁 Test files: ${files.join(', ')}`);
    
    for (const file of files) {
      await this.runTestFile(file, options);
    }
  }

  async runTestFile(fileName, options) {
    console.log(`📄 Running test file: ${fileName}`);
    
    const filePath = path.join(CONFIG.testDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }
    
    const command = this.buildPlaywrightCommand(fileName, options);
    await this.executeCommand(command, fileName);
  }

  async runAllTests(options) {
    console.log('📋 Running all tests');
    
    const command = this.buildPlaywrightCommand('', options);
    await this.executeCommand(command, 'all');
  }

  buildPlaywrightCommand(testFile, options) {
    const args = ['npx', 'playwright', 'test'];
    
    // Add test file if specified
    if (testFile && testFile !== 'all') {
      args.push(path.join(CONFIG.testDir, testFile));
    }
    
    // Add browser/project options
    if (options.browser) {
      args.push('--project', options.browser);
    } else if (options.mobile) {
      args.push('--project', 'Mobile Chrome');
    } else if (options.project) {
      args.push('--project', options.project);
    }
    
    // Add execution options
    if (options.headed || CONFIG.headed) {
      args.push('--headed');
    }
    
    if (options.debug || CONFIG.debug) {
      args.push('--debug');
    }
    
    if (options.ui || CONFIG.ui) {
      args.push('--ui');
    }
    
    if (!options.parallel && !CONFIG.parallel) {
      args.push('--workers=1');
    }
    
    if (options.updateSnapshots || CONFIG.updateSnapshots) {
      args.push('--update-snapshots');
    }
    
    // Add grep options
    if (options.grep || CONFIG.grep) {
      args.push('--grep', options.grep || CONFIG.grep);
    }
    
    if (options.grepInvert || CONFIG.grepInvert) {
      args.push('--grep-invert', options.grepInvert || CONFIG.grepInvert);
    }
    
    // Add reporter options
    if (CONFIG.reporter) {
      args.push('--reporter', CONFIG.reporter);
    }
    
    return args;
  }

  async executeCommand(command, testName) {
    console.log(`🚀 Executing: ${command.join(' ')}`);
    
    const startTime = Date.now();
    
    try {
      const result = execSync(command.join(' '), {
        stdio: 'inherit',
        env: {
          ...process.env,
          BASE_URL: CONFIG.baseUrl,
          CI: process.env.CI || 'false',
          PLAYWRIGHT_TIMEOUT: CONFIG.timeout.toString(),
          PLAYWRIGHT_RETRIES: CONFIG.retries.toString(),
          PLAYWRIGHT_WORKERS: CONFIG.workers?.toString() || 'auto'
        }
      });
      
      const duration = Date.now() - startTime;
      this.results.suites.push({
        name: testName,
        status: 'passed',
        duration,
        command: command.join(' ')
      });
      
      console.log(`✅ ${testName} completed successfully in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.suites.push({
        name: testName,
        status: 'failed',
        duration,
        command: command.join(' '),
        error: error.message
      });
      
      console.log(`❌ ${testName} failed after ${duration}ms`);
      console.error('Error:', error.message);
    }
  }

  async generateReports() {
    console.log('📊 Generating reports...');
    
    try {
      // Generate HTML report
      if (fs.existsSync(CONFIG.reportDir)) {
        console.log(`📈 HTML report available at: ${CONFIG.reportDir}`);
      }
      
      // Generate JSON report
      if (fs.existsSync('test-results.json')) {
        console.log('📄 JSON report generated: test-results.json');
      }
      
      // Generate JUnit report
      if (fs.existsSync(path.join(CONFIG.resultsDir, 'junit.xml'))) {
        console.log('📋 JUnit report generated: test-results/junit.xml');
      }
      
      // Parse test results
      await this.parseTestResults();
      
    } catch (error) {
      console.error('❌ Failed to generate reports:', error.message);
    }
  }

  async parseTestResults() {
    try {
      // Try to parse JSON results
      if (fs.existsSync('test-results.json')) {
        const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
        
        this.results.passed = results.stats.passed || 0;
        this.results.failed = results.stats.failed || 0;
        this.results.skipped = results.stats.skipped || 0;
        this.results.total = results.stats.total || 0;
        this.results.duration = results.stats.duration || 0;
      }
    } catch (error) {
      console.warn('⚠️ Could not parse test results:', error.message);
    }
  }

  displaySummary() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    
    const totalDuration = Date.now() - this.startTime;
    
    console.log(`⏱️  Total Duration: ${this.formatDuration(totalDuration)}`);
    console.log(`📋 Test Suites: ${this.results.suites.length}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`📊 Total: ${this.results.total}`);
    
    // Display suite results
    if (this.results.suites.length > 0) {
      console.log('\n📋 Suite Results:');
      this.results.suites.forEach(suite => {
        const status = suite.status === 'passed' ? '✅' : '❌';
        console.log(`  ${status} ${suite.name}: ${this.formatDuration(suite.duration)}`);
        if (suite.error) {
          console.log(`    Error: ${suite.error}`);
        }
      });
    }
    
    // Display next steps
    console.log('\n📈 Next Steps:');
    if (this.results.failed > 0) {
      console.log('❌ Some tests failed. Check the reports for details.');
      console.log(`📊 View HTML report: npx playwright show-report`);
      console.log(`📄 View JSON report: test-results.json`);
    } else {
      console.log('✅ All tests passed!');
    }
    
    console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);
    console.log(`📁 Test Directory: ${CONFIG.testDir}`);
    console.log(`📊 Report Directory: ${CONFIG.reportDir}`);
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Run the test runner
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.run().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = E2ETestRunner; 