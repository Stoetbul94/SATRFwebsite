import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      // Navigate to registration page
      await page.click('text=Register');
      await expect(page).toHaveURL('/register');

      // Fill registration form
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="phone"]', '+27123456789');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to login or dashboard
      await expect(page).toHaveURL(/\/login|\/dashboard/);
    });

    test('should show validation errors for invalid registration data', async ({ page }) => {
      await page.click('text=Register');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.click('text=Register');
      
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'differentpassword');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.click('text=Login');
      await expect(page).toHaveURL('/login');

      // Fill login form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard or home
      await expect(page).toHaveURL(/\/dashboard|\//);
      
      // Should show user is logged in
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.click('text=Login');
      
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.click('text=Login');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.click('text=Login');
      
      await page.fill('input[name="password"]', 'testpassword');
      
      // Password should be hidden by default
      await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
      
      // Click toggle button
      await page.click('button[aria-label="Toggle password visibility"]');
      
      // Password should be visible
      await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      await page.click('text=Login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Click logout
      await page.click('text=Logout');
      
      // Should redirect to home page
      await expect(page).toHaveURL('/');
      
      // Should show login/register options
      await expect(page.locator('text=Login')).toBeVisible();
      await expect(page.locator('text=Register')).toBeVisible();
    });
  });

  test.describe('Profile Management', () => {
    test('should view and edit profile', async ({ page }) => {
      // Login first
      await page.click('text=Login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate to profile
      await page.click('text=Profile');
      await expect(page).toHaveURL('/profile');
      
      // Check profile information is displayed
      await expect(page.locator('text=Test User')).toBeVisible();
      await expect(page.locator('text=test@example.com')).toBeVisible();
      
      // Click edit profile
      await page.click('text=Edit Profile');
      await expect(page).toHaveURL('/profile/edit');
      
      // Update profile information
      await page.fill('input[name="firstName"]', 'Updated');
      await page.fill('input[name="lastName"]', 'Name');
      await page.fill('input[name="phone"]', '+27987654321');
      
      // Save changes
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route while not authenticated', async ({ page }) => {
      // Try to access dashboard without login
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should access protected routes when authenticated', async ({ page }) => {
      // Login first
      await page.click('text=Login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should be able to access dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  test.describe('Responsive Authentication', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.click('text=Login');
      
      // Form should be properly displayed on mobile
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Fill and submit form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should work on mobile
      await expect(page).toHaveURL(/\/dashboard|\//);
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.click('text=Login');
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('text=Login');
      
      // Check for proper labels
      await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label');
      await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label');
    });
  });
}); 