const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class WebsiteMonitor {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = [];
    this.issues = [];
  }

  async checkPage(url, name, checks) {
    const page = await this.browser.newPage();
    const result = { name, url, status: 'unknown', issues: [] };

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      for (const check of checks) {
        try {
          const checkResult = await check(page);
          if (!checkResult.passed) {
            result.issues.push(checkResult.message);
          }
        } catch (error) {
          result.issues.push(`Check failed: ${error.message}`);
        }
      }

      result.status = result.issues.length === 0 ? 'healthy' : 'issues';
    } catch (error) {
      result.status = 'error';
      result.issues.push(`Page failed to load: ${error.message}`);
    }

    await page.close();
    return result;
  }

  async runChecks() {
    this.browser = await puppeteer.launch({ headless: true });
    
    const checks = [
      {
        name: 'Homepage',
        url: this.baseUrl,
        checks: [
          async (page) => {
            const navbar = await page.$('nav');
            return {
              passed: !!navbar,
              message: 'Navbar not found'
            };
          },
          async (page) => {
            const coachingLink = await page.$('a[href="/coaching"]');
            return {
              passed: !!coachingLink,
              message: 'Coaching link missing from navbar'
            };
          }
        ]
      },
      {
        name: 'Events Page',
        url: `${this.baseUrl}/events`,
        checks: [
          async (page) => {
            const errorText = await page.$('text="Something went wrong"');
            return {
              passed: !errorText,
              message: 'Events page showing error message'
            };
          },
          async (page) => {
            const content = await page.$('h1');
            return {
              passed: !!content,
              message: 'Events page content not loading'
            };
          }
        ]
      },
      {
        name: 'Leaderboard Page',
        url: `${this.baseUrl}/scores/leaderboard`,
        checks: [
          async (page) => {
            const content = await page.$('h1, h2, h3');
            return {
              passed: !!content,
              message: 'Leaderboard page content not loading'
            };
          }
        ]
      },
      {
        name: 'Rules Page',
        url: `${this.baseUrl}/rules`,
        checks: [
          async (page) => {
            const navbar = await page.$('nav');
            return {
              passed: !!navbar,
              message: 'Rules page missing navbar'
            };
          }
        ]
      },
      {
        name: 'Coaching Page',
        url: `${this.baseUrl}/coaching`,
        checks: [
          async (page) => {
            const content = await page.$('h1, h2, h3');
            return {
              passed: !!content,
              message: 'Coaching page content not loading'
            };
          }
        ]
      }
    ];

    for (const check of checks) {
      const result = await this.checkPage(check.url, check.name, check.checks);
      this.results.push(result);
      
      if (result.status !== 'healthy') {
        this.issues.push(result);
      }
    }

    await this.browser.close();
  }

  generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        total: this.results.length,
        healthy: this.results.filter(r => r.status === 'healthy').length,
        issues: this.issues.length
      },
      results: this.results,
      issues: this.issues
    };

    // Save to file
    const reportPath = path.join(__dirname, '../monitoring-reports', `report-${timestamp.split('T')[0]}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Console output
    console.log(`\n📊 Website Health Report - ${timestamp}`);
    console.log('=====================================');
    console.log(`Total Pages: ${report.summary.total}`);
    console.log(`Healthy: ${report.summary.healthy}`);
    console.log(`Issues: ${report.summary.issues}`);

    if (this.issues.length > 0) {
      console.log('\n🚨 Issues Found:');
      this.issues.forEach(issue => {
        console.log(`\n${issue.name} (${issue.url}):`);
        issue.issues.forEach(problem => {
          console.log(`  - ${problem}`);
        });
      });
    } else {
      console.log('\n✅ All pages are healthy!');
    }

    return report;
  }
}

async function monitorWebsite() {
  const baseUrl = 'https://satr-fwebsite-git-master-stoetbul94s-projects.vercel.app';
  const monitor = new WebsiteMonitor(baseUrl);
  
  console.log('🔍 Starting website monitoring...');
  await monitor.runChecks();
  const report = monitor.generateReport();
  
  return report;
}

// Run monitoring
if (require.main === module) {
  monitorWebsite().catch(console.error);
}

module.exports = { WebsiteMonitor, monitorWebsite }; 