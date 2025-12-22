import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface TestEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  type: 'competition' | 'training' | 'workshop';
  status: 'open' | 'closed' | 'cancelled';
}

export interface TestScore {
  id: string;
  playerName: string;
  score: number;
  event: string;
  date: string;
  discipline: string;
}

export class TestHelpers {
  static readonly DEFAULT_TIMEOUT = 10000;
  static readonly DEFAULT_USER: TestUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phone: '+27123456789'
  };

  /**
   * Login a user with the provided credentials
   */
  static async login(page: Page, user: TestUser = this.DEFAULT_USER): Promise<void> {
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await expect(page).toHaveURL(/\/dashboard|\//);
  }

  /**
   * Register a new user
   */
  static async register(page: Page, user: TestUser): Promise<void> {
    await page.goto('/register');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.fill('input[name="confirmPassword"]', user.password);
    await page.fill('input[name="firstName"]', user.firstName);
    await page.fill('input[name="lastName"]', user.lastName);
    await page.fill('input[name="phone"]', user.phone);
    await page.click('button[type="submit"]');
  }

  /**
   * Logout the current user
   */
  static async logout(page: Page): Promise<void> {
    await page.click('text=Logout');
    await expect(page).toHaveURL('/');
  }

  /**
   * Create a test user with unique email
   */
  static createTestUser(prefix: string = 'test'): TestUser {
    const timestamp = Date.now();
    return {
      email: `${prefix}-${timestamp}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+27123456789'
    };
  }

  /**
   * Mock API responses for testing
   */
  static async mockAPI(page: Page, endpoint: string, response: any, status: number = 200): Promise<void> {
    await page.route(`**/api/${endpoint}**`, route => 
      route.fulfill({ 
        status, 
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }

  /**
   * Mock API failure
   */
  static async mockAPIFailure(page: Page, endpoint: string): Promise<void> {
    await page.route(`**/api/${endpoint}**`, route => route.abort());
  }

  /**
   * Mock slow API with slow response
   */
  static async mockSlowAPI(page: Page, endpoint: string, response: any, delay: number = 2000): Promise<void> {
    await page.route(`**/api/${endpoint}**`, route => {
      // Simulate delay using setTimeout before fulfilling the route
      setTimeout(() => {
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify(response),
          headers: { 'Content-Type': 'application/json' }
        });
      }, delay);
    });
  }

  /**
   * Generate test events data
   */
  static generateTestEvents(count: number = 5): TestEvent[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `event-${i + 1}`,
      name: `Test Event ${i + 1}`,
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: `Test Location ${i + 1}`,
      type: ['competition', 'training', 'workshop'][i % 3] as TestEvent['type'],
      status: 'open' as TestEvent['status']
    }));
  }

  /**
   * Generate test scores data
   */
  static generateTestScores(count: number = 10): TestScore[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `score-${i + 1}`,
      playerName: `Player ${i + 1}`,
      score: 1000 - i * 10,
      event: `Event ${Math.floor(i / 3) + 1}`,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discipline: ['Air Rifle', 'Air Pistol', 'Small Bore'][i % 3]
    }));
  }

  /**
   * Wait for element to be visible with custom timeout
   */
  static async waitForElement(page: Page, selector: string, timeout: number = this.DEFAULT_TIMEOUT): Promise<void> {
    await page.waitForSelector(selector, { timeout });
  }

  /**
   * Wait for page to load completely
   */
  static async waitForPageLoad(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot with timestamp
   */
  static async takeScreenshot(page: Page, name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({ path: `test-results/${name}-${timestamp}.png` });
  }

  /**
   * Check if element exists
   */
  static async elementExists(page: Page, selector: string): Promise<boolean> {
    const element = page.locator(selector);
    return await element.count() > 0;
  }

  /**
   * Get element text safely
   */
  static async getElementText(page: Page, selector: string): Promise<string> {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      return await element.textContent() || '';
    }
    return '';
  }

  /**
   * Fill form fields from object
   */
  static async fillForm(page: Page, formData: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`;
      await page.fill(selector, value);
    }
  }

  /**
   * Clear form fields
   */
  static async clearForm(page: Page, fields: string[]): Promise<void> {
    for (const field of fields) {
      const selector = `input[name="${field}"], textarea[name="${field}"]`;
      await page.fill(selector, '');
    }
  }

  /**
   * Check form validation errors
   */
  static async checkValidationErrors(page: Page, expectedErrors: string[]): Promise<void> {
    for (const error of expectedErrors) {
      await expect(page.locator(`text=${error}`)).toBeVisible();
    }
  }

  /**
   * Navigate to page and wait for load
   */
  static async navigateTo(page: Page, url: string): Promise<void> {
    await page.goto(url);
    await this.waitForPageLoad(page);
  }

  /**
   * Click element and wait for navigation
   */
  static async clickAndWaitForNavigation(page: Page, selector: string): Promise<void> {
    await Promise.all([
      page.waitForNavigation(),
      page.click(selector)
    ]);
  }

  /**
   * Set viewport size for responsive testing
   */
  static async setViewport(page: Page, width: number, height: number): Promise<void> {
    await page.setViewportSize({ width, height });
  }

  /**
   * Generate random string
   */
  static generateRandomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random email
   */
  static generateRandomEmail(): string {
    const randomString = this.generateRandomString(8);
    return `${randomString}@example.com`;
  }

  /**
   * Wait for API call to complete
   */
  static async waitForAPI(page: Page, endpoint: string): Promise<void> {
    await page.waitForResponse(response => 
      response.url().includes(`/api/${endpoint}`) && response.status() === 200
    );
  }

  /**
   * Mock authentication state
   */
  static async mockAuthenticated(page: Page, user: TestUser = this.DEFAULT_USER): Promise<void> {
    // Mock localStorage or session storage
    await page.addInitScript((userData) => {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify(userData));
    }, user);
  }

  /**
   * Mock unauthenticated state
   */
  static async mockUnauthenticated(page: Page): Promise<void> {
    await page.addInitScript(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    });
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return localStorage.getItem('authToken') !== null;
    });
  }

  /**
   * Get current user data
   */
  static async getCurrentUser(page: Page): Promise<TestUser | null> {
    return await page.evaluate(() => {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    });
  }

  /**
   * Wait for toast notification
   */
  static async waitForToast(page: Page, message: string): Promise<void> {
    await expect(page.locator(`text=${message}`)).toBeVisible();
  }

  /**
   * Check if toast notification exists
   */
  static async hasToast(page: Page, message: string): Promise<boolean> {
    const toast = page.locator(`text=${message}`);
    return await toast.count() > 0;
  }

  /**
   * Clear all toasts
   */
  static async clearToasts(page: Page): Promise<void> {
    const closeButtons = page.locator('[data-testid="toast-close"]');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      await closeButtons.first().click();
    }
  }

  /**
   * Wait for loading spinner to disappear
   */
  static async waitForLoadingToComplete(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });
  }

  /**
   * Check if loading spinner is visible
   */
  static async isLoading(page: Page): Promise<boolean> {
    const spinner = page.locator('[data-testid="loading-spinner"]');
    return await spinner.isVisible();
  }

  /**
   * Retry function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxAttempts) {
          throw lastError;
        }
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }

  /**
   * Generate test data for different scenarios
   */
  static generateTestData(scenario: 'empty' | 'single' | 'multiple' | 'large'): any {
    switch (scenario) {
      case 'empty':
        return [];
      case 'single':
        return [this.generateTestEvents(1)[0]];
      case 'multiple':
        return this.generateTestEvents(5);
      case 'large':
        return this.generateTestEvents(100);
      default:
        return [];
    }
  }

  /**
   * Mock file upload
   */
  static async mockFileUpload(page: Page, filePath: string, fileName: string = 'test-file.xlsx'): Promise<void> {
    await page.setInputFiles('input[type="file"]', {
      name: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock file content')
    });
  }

  /**
   * Check if file was uploaded successfully
   */
  static async isFileUploaded(page: Page, fileName: string): Promise<boolean> {
    const fileElement = page.locator(`text=${fileName}`);
    return await fileElement.count() > 0;
  }

  /**
   * Wait for file upload to complete
   */
  static async waitForFileUpload(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="upload-progress"]', { state: 'hidden' });
  }
}

export default TestHelpers; 