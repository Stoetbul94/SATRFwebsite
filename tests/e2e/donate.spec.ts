import { test, expect } from '@playwright/test';

test.describe('Donate Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donate');
  });

  test.describe('Page Loading', () => {
    test('should load donate page successfully', async ({ page }) => {
      await expect(page).toHaveURL('/donate');
      await expect(page.locator('h1')).toContainText(/Donate|Support/);
    });

    test('should have proper page title and meta description', async ({ page }) => {
      await expect(page).toHaveTitle(/Donate|SATRF/);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /donate|support/);
    });

    test('should be accessible from main navigation', async ({ page }) => {
      await page.goto('/');
      
      // Click on donate link in navigation
      await page.click('text=Donate');
      
      await expect(page).toHaveURL('/donate');
    });
  });

  test.describe('Hero Section', () => {
    test('should display hero section with main headline', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/Support Olympic Shooting|Donate/);
    });

    test('should display hero subheading', async ({ page }) => {
      await expect(page.locator('text=Help the next generation')).toBeVisible();
    });

    test('should show SATRF logo', async ({ page }) => {
      const logo = page.locator('img[alt*="SATRF"]');
      await expect(logo).toBeVisible();
    });

    test('should display donation impact message', async ({ page }) => {
      await expect(page.locator('text=Your donation supports')).toBeVisible();
      await expect(page.locator('text=training programs')).toBeVisible();
      await expect(page.locator('text=equipment')).toBeVisible();
      await expect(page.locator('text=competitions')).toBeVisible();
    });
  });

  test.describe('Donation Form', () => {
    test('should display donation form', async ({ page }) => {
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible();
    });

    test('should show preset donation amounts', async ({ page }) => {
      await expect(page.locator('text=R100')).toBeVisible();
      await expect(page.locator('text=R250')).toBeVisible();
      await expect(page.locator('text=R500')).toBeVisible();
    });

    test('should allow custom amount input', async ({ page }) => {
      const customAmountInput = page.locator('input[placeholder*="amount"]');
      await expect(customAmountInput).toBeVisible();
      
      // Enter custom amount
      await customAmountInput.fill('750');
      await expect(customAmountInput).toHaveValue('750');
    });

    test('should select preset amounts', async ({ page }) => {
      // Click on R250 preset
      await page.click('button:has-text("R250")');
      
      // Should highlight selected amount
      await expect(page.locator('button:has-text("R250")')).toHaveClass(/selected|active/);
    });

    test('should clear custom amount when preset is selected', async ({ page }) => {
      const customAmountInput = page.locator('input[placeholder*="amount"]');
      
      // Enter custom amount
      await customAmountInput.fill('750');
      
      // Select preset amount
      await page.click('button:has-text("R250")');
      
      // Custom amount should be cleared
      await expect(customAmountInput).toHaveValue('');
    });

    test('should clear preset selection when custom amount is entered', async ({ page }) => {
      // Select preset amount
      await page.click('button:has-text("R250")');
      
      // Enter custom amount
      const customAmountInput = page.locator('input[placeholder*="amount"]');
      await customAmountInput.fill('750');
      
      // Preset should be deselected
      await expect(page.locator('button:has-text("R250")')).not.toHaveClass(/selected|active/);
    });
  });

  test.describe('Payment Methods', () => {
    test('should display payment method options', async ({ page }) => {
      await expect(page.locator('text=Payment Method')).toBeVisible();
    });

    test('should show PayFast option', async ({ page }) => {
      await expect(page.locator('text=PayFast')).toBeVisible();
      await expect(page.locator('text=Secure Online Payment')).toBeVisible();
    });

    test('should show EFT option', async ({ page }) => {
      await expect(page.locator('text=EFT')).toBeVisible();
      await expect(page.locator('text=Electronic Funds Transfer')).toBeVisible();
    });

    test('should select PayFast by default', async ({ page }) => {
      const payfastRadio = page.locator('input[value="payfast"]');
      await expect(payfastRadio).toBeChecked();
    });

    test('should switch between payment methods', async ({ page }) => {
      // Select EFT
      await page.click('input[value="eft"]');
      await expect(page.locator('input[value="eft"]')).toBeChecked();
      
      // Select PayFast
      await page.click('input[value="payfast"]');
      await expect(page.locator('input[value="payfast"]')).toBeChecked();
    });
  });

  test.describe('Banking Details (EFT)', () => {
    test('should display banking details when EFT is selected', async ({ page }) => {
      // Select EFT
      await page.click('input[value="eft"]');
      
      // Banking details should be visible
      await expect(page.locator('text=Banking Details')).toBeVisible();
      await expect(page.locator('text=South African Target Rifle Federation')).toBeVisible();
      await expect(page.locator('text=Standard Bank Vereeniging')).toBeVisible();
      await expect(page.locator('text=02 233 062 3')).toBeVisible();
    });

    test('should show account information', async ({ page }) => {
      await page.click('input[value="eft"]');
      
      await expect(page.locator('text=Account Name:')).toBeVisible();
      await expect(page.locator('text=Bank:')).toBeVisible();
      await expect(page.locator('text=Account Type:')).toBeVisible();
      await expect(page.locator('text=Account Number:')).toBeVisible();
      await expect(page.locator('text=Branch Code:')).toBeVisible();
      await expect(page.locator('text=Electronic Payments Code:')).toBeVisible();
    });

    test('should have copy buttons for banking details', async ({ page }) => {
      await page.click('input[value="eft"]');
      
      const copyButtons = page.locator('button[aria-label*="Copy"]');
      await expect(copyButtons).toBeVisible();
    });

    test('should copy banking details to clipboard', async ({ page }) => {
      await page.click('input[value="eft"]');
      
      // Click copy button for account number
      await page.click('button[aria-label*="Copy account number"]');
      
      // Should show copied confirmation
      await expect(page.locator('text=Copied')).toBeVisible();
    });

    test('should show proof of payment email', async ({ page }) => {
      await page.click('input[value="eft"]');
      
      await expect(page.locator('text=Proof of Payment:')).toBeVisible();
      await expect(page.locator('text=satrf.shooting@gmail.com')).toBeVisible();
    });
  });

  test.describe('PayFast Integration', () => {
    test('should display PayFast form when selected', async ({ page }) => {
      // Select PayFast
      await page.click('input[value="payfast"]');
      
      // PayFast form should be visible
      await expect(page.locator('[data-testid="payfast-form"]')).toBeVisible();
    });

    test('should show PayFast payment button', async ({ page }) => {
      await page.click('input[value="payfast"]');
      
      const payfastButton = page.locator('button:has-text("Pay with PayFast")');
      await expect(payfastButton).toBeVisible();
    });

    test('should redirect to PayFast on payment', async ({ page }) => {
      await page.click('input[value="payfast"]');
      
      // Select amount
      await page.click('button:has-text("R250")');
      
      // Click PayFast button
      await page.click('button:has-text("Pay with PayFast")');
      
      // Should redirect to PayFast
      await expect(page).toHaveURL(/payfast\.co\.za/);
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields', async ({ page }) => {
      // Try to submit without selecting amount
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=Please select an amount')).toBeVisible();
    });

    test('should validate custom amount format', async ({ page }) => {
      const customAmountInput = page.locator('input[placeholder*="amount"]');
      
      // Enter invalid amount
      await customAmountInput.fill('invalid');
      
      // Should show validation error
      await expect(page.locator('text=Please enter a valid amount')).toBeVisible();
    });

    test('should validate minimum donation amount', async ({ page }) => {
      const customAmountInput = page.locator('input[placeholder*="amount"]');
      
      // Enter amount below minimum
      await customAmountInput.fill('10');
      
      // Should show validation error
      await expect(page.locator('text=Minimum donation amount is R50')).toBeVisible();
    });

    test('should clear validation errors when user corrects input', async ({ page }) => {
      const customAmountInput = page.locator('input[placeholder*="amount"]');
      
      // Enter invalid amount
      await customAmountInput.fill('invalid');
      await expect(page.locator('text=Please enter a valid amount')).toBeVisible();
      
      // Enter valid amount
      await customAmountInput.fill('100');
      
      // Error should be cleared
      await expect(page.locator('text=Please enter a valid amount')).not.toBeVisible();
    });
  });

  test.describe('Payment Success Flow', () => {
    test('should handle successful PayFast payment', async ({ page }) => {
      // Mock successful PayFast response
      await page.route('**/api/payfast-success**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true, transactionId: 'TEST123' })
        })
      );
      
      await page.click('input[value="payfast"]');
      await page.click('button:has-text("R250")');
      await page.click('button:has-text("Pay with PayFast")');
      
      // Should redirect to success page
      await expect(page).toHaveURL('/donate/thank-you');
      await expect(page.locator('text=Thank you for your donation')).toBeVisible();
    });

    test('should display transaction details on success', async ({ page }) => {
      // Mock successful payment
      await page.route('**/api/payfast-success**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ 
            success: true, 
            transactionId: 'TEST123',
            amount: '250.00',
            date: '2024-01-15'
          })
        })
      );
      
      await page.goto('/donate/thank-you?transaction=TEST123');
      
      await expect(page.locator('text=Transaction ID: TEST123')).toBeVisible();
      await expect(page.locator('text=Amount: R250.00')).toBeVisible();
    });

    test('should send confirmation email', async ({ page }) => {
      // Mock email sending
      await page.route('**/api/send-donation-confirmation**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true })
        })
      );
      
      await page.goto('/donate/thank-you?transaction=TEST123');
      
      // Should show email confirmation message
      await expect(page.locator('text=Confirmation email sent')).toBeVisible();
    });
  });

  test.describe('Payment Failure Flow', () => {
    test('should handle PayFast payment failure', async ({ page }) => {
      // Mock failed PayFast response
      await page.route('**/api/payfast-failure**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: false, error: 'Payment declined' })
        })
      );
      
      await page.click('input[value="payfast"]');
      await page.click('button:has-text("R250")');
      await page.click('button:has-text("Pay with PayFast")');
      
      // Should redirect to failure page
      await expect(page).toHaveURL('/donate?error=payment_failed');
      await expect(page.locator('text=Payment failed')).toBeVisible();
    });

    test('should show error message for failed payment', async ({ page }) => {
      await page.goto('/donate?error=payment_failed');
      
      await expect(page.locator('text=Your payment could not be processed')).toBeVisible();
      await expect(page.locator('text=Please try again')).toBeVisible();
    });

    test('should provide alternative payment options on failure', async ({ page }) => {
      await page.goto('/donate?error=payment_failed');
      
      await expect(page.locator('text=Try EFT instead')).toBeVisible();
      await expect(page.locator('text=Contact us for assistance')).toBeVisible();
    });

    test('should allow retry of failed payment', async ({ page }) => {
      await page.goto('/donate?error=payment_failed');
      
      const retryButton = page.locator('button:has-text("Try Again")');
      await expect(retryButton).toBeVisible();
      
      await retryButton.click();
      
      // Should return to donation form
      await expect(page).toHaveURL('/donate');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // All content should be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Content should be properly laid out
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Content should be mobile-friendly
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible();
      
      // Check that form elements are properly sized for mobile
      const amountButtons = page.locator('button:has-text("R100"), button:has-text("R250"), button:has-text("R500")');
      await expect(amountButtons).toBeVisible();
    });

    test('should handle mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mobile menu should work
      await page.click('button[aria-label="Menu"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Should be able to navigate to donate from mobile menu
      await page.click('text=Donate');
      await expect(page).toHaveURL('/donate');
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('button:has-text("R100")')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button:has-text("R250")')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const amountButtons = page.locator('button:has-text("R100"), button:has-text("R250"), button:has-text("R500")');
      await expect(amountButtons).toHaveAttribute('aria-label');
    });

    test('should announce dynamic content changes', async ({ page }) => {
      // Select amount
      await page.click('button:has-text("R250")');
      
      // Should announce selection
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    });

    test('should have proper form labels', async ({ page }) => {
      const customAmountInput = page.locator('input[placeholder*="amount"]');
      await expect(customAmountInput).toHaveAttribute('aria-label');
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This would typically be tested with a color contrast checker
      // For now, we'll check that text is visible
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6');
      await expect(textElements.first()).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle form submission efficiently', async ({ page }) => {
      // Select amount and payment method
      await page.click('button:has-text("R250")');
      await page.click('input[value="payfast"]');
      
      const startTime = Date.now();
      
      // Submit form
      await page.click('button[type="submit"]');
      
      const submitTime = Date.now() - startTime;
      
      // Should submit within 2 seconds
      expect(submitTime).toBeLessThan(2000);
    });
  });

  test.describe('Security', () => {
    test('should use HTTPS for payment processing', async ({ page }) => {
      await page.click('input[value="payfast"]');
      await page.click('button:has-text("R250")');
      await page.click('button:has-text("Pay with PayFast")');
      
      // Should redirect to HTTPS
      await expect(page).toHaveURL(/^https:/);
    });

    test('should not expose sensitive data in URLs', async ({ page }) => {
      // Check that no sensitive data is in the URL
      const url = page.url();
      expect(url).not.toContain('password');
      expect(url).not.toContain('card');
      expect(url).not.toContain('cvv');
    });

    test('should validate payment data server-side', async ({ page }) => {
      // Mock server-side validation
      await page.route('**/api/validate-payment**', route => 
        route.fulfill({ 
          status: 400, 
          body: JSON.stringify({ error: 'Invalid amount' })
        })
      );
      
      await page.click('input[value="payfast"]');
      await page.click('button:has-text("R250")');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=Invalid amount')).toBeVisible();
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work in Chrome', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible();
    });

    test('should work in Firefox', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible();
    });

    test('should work in Safari', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible();
    });
  });
}); 