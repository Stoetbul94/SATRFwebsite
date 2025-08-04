import { chromium, FullConfig } from '@playwright/test';
import TestHelpers from '../utils/test-helpers';

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto(baseURL || 'http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Check if the application is running
    const isAppRunning = await page.locator('body').isVisible();
    
    if (!isAppRunning) {
      throw new Error('Application is not running. Please start the development server.');
    }
    
    // Create test data if needed
    await createTestData(page);
    
    // Set up authentication state for tests
    await setupAuthentication(page);
    
    // Save authentication state for tests
    if (storageState) {
      await page.context().storageState({ path: storageState as string });
    }
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function createTestData(page: any) {
  console.log('📝 Creating test data...');
  
  try {
    // Mock API endpoints with test data
    await TestHelpers.mockAPI(page, 'events', TestHelpers.generateTestEvents(10));
    await TestHelpers.mockAPI(page, 'leaderboard', TestHelpers.generateTestScores(20));
    await TestHelpers.mockAPI(page, 'users', [TestHelpers.DEFAULT_USER]);
    
    // Mock dashboard stats
    await TestHelpers.mockAPI(page, 'dashboard/stats', {
      members: 1250,
      events: 12,
      scores: 'Updated',
      news: 'Latest'
    });
    
    console.log('✅ Test data created successfully');
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    // Don't throw error as this is not critical for all tests
  }
}

async function setupAuthentication(page: any) {
  console.log('🔐 Setting up authentication...');
  
  try {
    // Mock authentication state
    await TestHelpers.mockAuthenticated(page, TestHelpers.DEFAULT_USER);
    
    // Mock successful login response
    await TestHelpers.mockAPI(page, 'auth/login', {
      success: true,
      user: TestHelpers.DEFAULT_USER,
      token: 'mock-jwt-token'
    });
    
    // Mock user profile
    await TestHelpers.mockAPI(page, 'auth/profile', {
      ...TestHelpers.DEFAULT_USER,
      id: 'test-user-id',
      role: 'user',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Authentication setup completed');
  } catch (error) {
    console.error('❌ Failed to setup authentication:', error);
    // Don't throw error as this is not critical for all tests
  }
}

export default globalSetup; 