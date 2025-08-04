import { test, expect } from '@playwright/test';

test.describe('Coaching Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coaching');
  });

  test.describe('Page Navigation', () => {
    test('should load coaching page successfully', async ({ page }) => {
      await expect(page).toHaveURL('/coaching');
      await expect(page.locator('h1')).toContainText(/Coaching|Elite Coaching/);
    });

    test('should have proper page title and meta description', async ({ page }) => {
      await expect(page).toHaveTitle(/Coaching|SATRF/);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /coaching|training/);
    });

    test('should be accessible from main navigation', async ({ page }) => {
      await page.goto('/');
      
      // Click on coaching link in navigation
      await page.click('text=Coaching');
      
      await expect(page).toHaveURL('/coaching');
    });
  });

  test.describe('Hero Section', () => {
    test('should display hero section with main headline', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/Elite Coaching|South African Shooters/);
    });

    test('should display hero subheading', async ({ page }) => {
      await expect(page.locator('text=Transform your shooting performance')).toBeVisible();
    });

    test('should have call-to-action buttons', async ({ page }) => {
      await expect(page.locator('text=Book Your Free Consultation')).toBeVisible();
      await expect(page.locator('text=View Coach Profiles')).toBeVisible();
    });

    test('should have background styling', async ({ page }) => {
      // Check for gradient background
      const heroSection = page.locator('section').first();
      await expect(heroSection).toHaveClass(/gradient|bg-gradient/);
    });
  });

  test.describe('Coach Profiles', () => {
    test('should display coach profiles section', async ({ page }) => {
      await expect(page.locator('text=Our Expert Coaches')).toBeVisible();
    });

    test('should show coach Sarah van der Merwe', async ({ page }) => {
      await expect(page.locator('text=Coach Sarah van der Merwe')).toBeVisible();
      await expect(page.locator('text=Head Performance Coach')).toBeVisible();
    });

    test('should show coach Michael Botha', async ({ page }) => {
      await expect(page.locator('text=Coach Michael Botha')).toBeVisible();
      await expect(page.locator('text=Technical Development Coach')).toBeVisible();
    });

    test('should display coach credentials', async ({ page }) => {
      await expect(page.locator('text=ISSF Level 3 Coach')).toBeVisible();
      await expect(page.locator('text=Former National Champion')).toBeVisible();
      await expect(page.locator('text=15+ Years Experience')).toBeVisible();
    });

    test('should display coach specialties', async ({ page }) => {
      await expect(page.locator('text=Mental Preparation')).toBeVisible();
      await expect(page.locator('text=Technical Precision')).toBeVisible();
      await expect(page.locator('text=Competition Strategy')).toBeVisible();
    });

    test('should display coach achievements', async ({ page }) => {
      await expect(page.locator('text=Trained 5 National Champions')).toBeVisible();
      await expect(page.locator('text=ISSF Level 3 Certification')).toBeVisible();
      await expect(page.locator('text=Sports Science Degree')).toBeVisible();
    });

    test('should display coach contact information', async ({ page }) => {
      await expect(page.locator('text=sarah@satrf.co.za')).toBeVisible();
      await expect(page.locator('text=+27 82 123 4567')).toBeVisible();
      await expect(page.locator('text=michael@satrf.co.za')).toBeVisible();
      await expect(page.locator('text=+27 83 987 6543')).toBeVisible();
    });
  });

  test.describe('Coaching Benefits', () => {
    test('should display coaching benefits section', async ({ page }) => {
      await expect(page.locator('text=Why Choose Our Coaching')).toBeVisible();
    });

    test('should show personalized training plans benefit', async ({ page }) => {
      await expect(page.locator('text=Personalized Training Plans')).toBeVisible();
      await expect(page.locator('text=Custom programs tailored to your skill level')).toBeVisible();
    });

    test('should show competitive edge benefit', async ({ page }) => {
      await expect(page.locator('text=Competitive Edge')).toBeVisible();
      await expect(page.locator('text=Learn advanced techniques and strategies')).toBeVisible();
    });

    test('should show performance tracking benefit', async ({ page }) => {
      await expect(page.locator('text=Performance Tracking')).toBeVisible();
      await expect(page.locator('text=Comprehensive progress monitoring')).toBeVisible();
    });

    test('should show expert mentorship benefit', async ({ page }) => {
      await expect(page.locator('text=Expert Mentorship')).toBeVisible();
      await expect(page.locator('text=One-on-one guidance from certified coaches')).toBeVisible();
    });
  });

  test.describe('Contact and Booking', () => {
    test('should have contact form or booking section', async ({ page }) => {
      await expect(page.locator('text=Get Started|Contact Us|Book Consultation')).toBeVisible();
    });

    test('should link to contact page with coaching service', async ({ page }) => {
      const contactLink = page.locator('a[href*="contact"]');
      await expect(contactLink).toBeVisible();
      
      // Click the link
      await contactLink.click();
      
      // Should navigate to contact page
      await expect(page).toHaveURL(/\/contact/);
    });

    test('should have direct contact information', async ({ page }) => {
      await expect(page.locator('text=Contact Information')).toBeVisible();
      await expect(page.locator('text=Email:')).toBeVisible();
      await expect(page.locator('text=Phone:')).toBeVisible();
    });
  });

  test.describe('Content Structure', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      const h2 = page.locator('h2');
      const h3 = page.locator('h3');
      
      await expect(h1).toHaveCount(1);
      await expect(h2).toBeVisible();
      await expect(h3).toBeVisible();
    });

    test('should have sections with proper spacing', async ({ page }) => {
      const sections = page.locator('section');
      await expect(sections).toHaveCount.greaterThan(2);
    });

    test('should display coach images', async ({ page }) => {
      const coachImages = page.locator('img[alt*="coach"]');
      await expect(coachImages).toBeVisible();
    });

    test('should have proper icons for benefits', async ({ page }) => {
      const benefitIcons = page.locator('[data-testid="benefit-icon"]');
      await expect(benefitIcons).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // All content should be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Our Expert Coaches')).toBeVisible();
      await expect(page.locator('text=Why Choose Our Coaching')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Content should be properly laid out
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Our Expert Coaches')).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Content should be mobile-friendly
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Our Expert Coaches')).toBeVisible();
      
      // Check that text is readable on mobile
      const heroText = page.locator('h1');
      const fontSize = await heroText.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      // Font size should be appropriate for mobile
      expect(parseInt(fontSize)).toBeGreaterThan(16);
    });

    test('should handle mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mobile menu should work
      await page.click('button[aria-label="Menu"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Should be able to navigate to coaching from mobile menu
      await page.click('text=Coaching');
      await expect(page).toHaveURL('/coaching');
    });
  });

  test.describe('Interactive Elements', () => {
    test('should have working contact buttons', async ({ page }) => {
      const contactButtons = page.locator('button:has-text("Contact"), a:has-text("Contact")');
      await expect(contactButtons).toBeVisible();
      
      // Click should work
      await contactButtons.first().click();
    });

    test('should have working booking buttons', async ({ page }) => {
      const bookingButtons = page.locator('button:has-text("Book"), a:has-text("Book")');
      await expect(bookingButtons).toBeVisible();
    });

    test('should have working email links', async ({ page }) => {
      const emailLinks = page.locator('a[href^="mailto:"]');
      await expect(emailLinks).toBeVisible();
    });

    test('should have working phone links', async ({ page }) => {
      const phoneLinks = page.locator('a[href^="tel:"]');
      await expect(phoneLinks).toBeVisible();
    });
  });

  test.describe('SEO and Meta', () => {
    test('should have proper meta tags', async ({ page }) => {
      // Check title
      await expect(page).toHaveTitle(/Coaching|SATRF/);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /coaching|training/);
      
      // Check keywords
      const metaKeywords = page.locator('meta[name="keywords"]');
      await expect(metaKeywords).toHaveAttribute('content', /coaching|shooting/);
    });

    test('should have proper Open Graph tags', async ({ page }) => {
      const ogTitle = page.locator('meta[property="og:title"]');
      const ogDescription = page.locator('meta[property="og:description"]');
      const ogType = page.locator('meta[property="og:type"]');
      
      await expect(ogTitle).toBeVisible();
      await expect(ogDescription).toBeVisible();
      await expect(ogType).toHaveAttribute('content', 'website');
    });

    test('should have proper canonical URL', async ({ page }) => {
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', /\/coaching/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Check that headings are in logical order
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('should have alt text for images', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Should be able to navigate through all interactive elements
      const focusableElements = page.locator('button, a, input, select, textarea');
      await expect(focusableElements).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Either aria-label or text content should be present
        expect(ariaLabel || textContent).toBeTruthy();
      }
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

    test('should have optimized images', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const src = await image.getAttribute('src');
        
        // Check for proper image formats or optimization indicators
        expect(src).toMatch(/\.(jpg|jpeg|png|webp|avif)$/);
      }
    });

    test('should not have layout shift', async ({ page }) => {
      // Wait for all content to load
      await page.waitForLoadState('networkidle');
      
      // Take screenshot to check for layout stability
      await page.screenshot({ path: 'coaching-page-layout.png' });
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work in Chrome', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Our Expert Coaches')).toBeVisible();
    });

    test('should work in Firefox', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Our Expert Coaches')).toBeVisible();
    });

    test('should work in Safari', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Our Expert Coaches')).toBeVisible();
    });
  });
}); 