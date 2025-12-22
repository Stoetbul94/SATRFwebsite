import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  try {
    // Clean up test artifacts
    await cleanupTestArtifacts();
    
    // Clean up test data
    await cleanupTestData();
    
    // Clean up screenshots and videos
    await cleanupTestResults();
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error as teardown failures shouldn't fail the build
  }
}

async function cleanupTestArtifacts() {
  console.log('🗑️ Cleaning up test artifacts...');
  
  try {
    // Remove test storage state files
    const storageStatePath = path.join(process.cwd(), 'playwright/.auth/user.json');
    if (fs.existsSync(storageStatePath)) {
      fs.unlinkSync(storageStatePath);
      console.log('✅ Removed storage state file');
    }
    
    // Remove other temporary files
    const tempFiles = [
      'test-results',
      'playwright-report',
      'test-results.json'
    ];
    
    for (const file of tempFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        console.log(`✅ Removed ${file}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to cleanup test artifacts:', error);
  }
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');
  
  try {
    // Launch browser for cleanup
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      // Navigate to the application
      await page.goto('http://localhost:3000');
      
      // Clear localStorage and sessionStorage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Clear cookies
      await page.context().clearCookies();
      
      console.log('✅ Test data cleaned up');
      
    } finally {
      await browser.close();
    }
    
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

async function cleanupTestResults() {
  console.log('🗑️ Cleaning up test results...');
  
  try {
    const resultsDir = path.join(process.cwd(), 'test-results');
    
    if (fs.existsSync(resultsDir)) {
      // Keep only the latest test results
      const files = fs.readdirSync(resultsDir);
      const sortedFiles = files
        .map(file => ({
          name: file,
          path: path.join(resultsDir, file),
          mtime: fs.statSync(path.join(resultsDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      // Keep only the 5 most recent test result directories
      const filesToKeep = sortedFiles.slice(0, 5);
      const filesToDelete = sortedFiles.slice(5);
      
      for (const file of filesToDelete) {
        if (fs.statSync(file.path).isDirectory()) {
          fs.rmSync(file.path, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file.path);
        }
        console.log(`✅ Removed old test result: ${file.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to cleanup test results:', error);
  }
}

export default globalTeardown; 