import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page before each test
    await page.goto('/register');
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Check that all form fields are present
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /register/i })).toBeVisible();
  });

  test('should validate required fields on form submission', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /register/i }).click();

    // Check for validation error messages
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/last name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill in form with invalid email
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('password123');

    await page.getByRole('button', { name: /register/i }).click();

    // Check for email validation error
    await expect(page.getByText(/invalid email format/i)).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    // Fill in form with mismatched passwords
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('john.doe@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('differentpassword');

    await page.getByRole('button', { name: /register/i }).click();

    // Check for password confirmation error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    // Mock the API response for successful registration
    await page.route('**/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'User registered successfully',
          user: {
            id: 'test_user_id',
            email: 'john.doe@example.com'
          }
        })
      });
    });

    // Fill in form with valid data
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('john.doe@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('password123');

    await page.getByRole('button', { name: /register/i }).click();

    // Check for success message or redirect
    await expect(page.getByText(/user registered successfully/i)).toBeVisible();
  });

  test('should handle registration error', async ({ page }) => {
    // Mock the API response for registration error
    await page.route('**/auth/register', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Email already exists'
        })
      });
    });

    // Fill in form with valid data
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('existing@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('password123');

    await page.getByRole('button', { name: /register/i }).click();

    // Check for error message
    await expect(page.getByText(/email already exists/i)).toBeVisible();
  });

  test('should navigate to login page from registration', async ({ page }) => {
    // Click on login link
    await page.getByRole('link', { name: /login/i }).click();

    // Verify navigation to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Check that form fields have proper labels
    await expect(page.getByLabel(/first name/i)).toHaveAttribute('type', 'text');
    await expect(page.getByLabel(/last name/i)).toHaveAttribute('type', 'text');
    await expect(page.getByLabel(/email/i)).toHaveAttribute('type', 'email');
    await expect(page.getByLabel(/password/i)).toHaveAttribute('type', 'password');
    await expect(page.getByLabel(/confirm password/i)).toHaveAttribute('type', 'password');

    // Check that submit button is properly accessible
    await expect(page.getByRole('button', { name: /register/i })).toBeEnabled();
  });
}); 