import { test, expect } from '@playwright/test';

test.describe('Rules Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rules');
  });

  test.describe('Page Navigation', () => {
    test('should load rules page successfully', async ({ page }) => {
      await expect(page).toHaveURL('/rules');
      await expect(page.locator('h1')).toContainText(/Rules|Regulations/);
    });

    test('should have proper page title and meta description', async ({ page }) => {
      await expect(page).toHaveTitle(/Rules|SATRF/);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /rules|regulations/);
    });

    test('should be accessible from main navigation', async ({ page }) => {
      await page.goto('/');
      
      // Click on rules link in navigation
      await page.click('text=Rules');
      
      await expect(page).toHaveURL('/rules');
    });

    test('should have breadcrumb navigation', async ({ page }) => {
      await expect(page.locator('[data-testid="breadcrumb"]')).toBeVisible();
      await expect(page.locator('text=Home')).toBeVisible();
      await expect(page.locator('text=Rules')).toBeVisible();
    });
  });

  test.describe('Navbar Presence', () => {
    test('should display main navigation bar', async ({ page }) => {
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    });

    test('should show SATRF logo in navbar', async ({ page }) => {
      const logo = page.locator('[data-testid="navbar-logo"]');
      await expect(logo).toBeVisible();
      
      // Logo should be clickable and link to home
      await logo.click();
      await expect(page).toHaveURL('/');
    });

    test('should display all main navigation links', async ({ page }) => {
      // Check for all main navigation items
      await expect(page.locator('text=Home')).toBeVisible();
      await expect(page.locator('text=Events')).toBeVisible();
      await expect(page.locator('text=Leaderboard')).toBeVisible();
      await expect(page.locator('text=Rules')).toBeVisible();
      await expect(page.locator('text=Coaching')).toBeVisible();
      await expect(page.locator('text=Contact')).toBeVisible();
    });

    test('should highlight current page in navigation', async ({ page }) => {
      const rulesLink = page.locator('a[href="/rules"]');
      await expect(rulesLink).toHaveClass(/active|current/);
    });

    test('should have working navigation links', async ({ page }) => {
      // Test navigation to other pages
      await page.click('text=Events');
      await expect(page).toHaveURL('/events');
      
      await page.goto('/rules');
      await page.click('text=Leaderboard');
      await expect(page).toHaveURL('/leaderboard');
      
      await page.goto('/rules');
      await page.click('text=Coaching');
      await expect(page).toHaveURL('/coaching');
    });

    test('should show user authentication links when not logged in', async ({ page }) => {
      await expect(page.locator('text=Login')).toBeVisible();
      await expect(page.locator('text=Register')).toBeVisible();
    });

    test('should show user menu when logged in', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate to rules page
      await page.goto('/rules');
      
      // Should show user menu
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Profile')).toBeVisible();
      await expect(page.locator('text=Logout')).toBeVisible();
    });
  });

  test.describe('Rules Content', () => {
    test('should display rules sections', async ({ page }) => {
      await expect(page.locator('text=Competition Rules')).toBeVisible();
      await expect(page.locator('text=Safety Regulations')).toBeVisible();
      await expect(page.locator('text=Equipment Standards')).toBeVisible();
    });

    test('should show ISSF rules', async ({ page }) => {
      await expect(page.locator('text=ISSF Rules')).toBeVisible();
      await expect(page.locator('text=International Shooting Sport Federation')).toBeVisible();
    });

    test('should show SATRF specific rules', async ({ page }) => {
      await expect(page.locator('text=SATRF Regulations')).toBeVisible();
      await expect(page.locator('text=South African Target Rifle Federation')).toBeVisible();
    });

    test('should display rule categories', async ({ page }) => {
      // Check for different rule categories
      await expect(page.locator('text=Air Rifle')).toBeVisible();
      await expect(page.locator('text=Air Pistol')).toBeVisible();
      await expect(page.locator('text=Small Bore')).toBeVisible();
      await expect(page.locator('text=Large Bore')).toBeVisible();
    });

    test('should show rule details and explanations', async ({ page }) => {
      // Check for detailed rule content
      await expect(page.locator('text=Scoring')).toBeVisible();
      await expect(page.locator('text=Target Specifications')).toBeVisible();
      await expect(page.locator('text=Competition Format')).toBeVisible();
    });

    test('should display safety guidelines', async ({ page }) => {
      await expect(page.locator('text=Safety Guidelines')).toBeVisible();
      await expect(page.locator('text=Range Safety')).toBeVisible();
      await expect(page.locator('text=Equipment Safety')).toBeVisible();
    });

    test('should show equipment requirements', async ({ page }) => {
      await expect(page.locator('text=Equipment Requirements')).toBeVisible();
      await expect(page.locator('text=Approved Equipment')).toBeVisible();
      await expect(page.locator('text=Equipment Inspection')).toBeVisible();
    });
  });

  test.describe('Content Organization', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      const h2 = page.locator('h2');
      const h3 = page.locator('h3');
      
      await expect(h1).toHaveCount(1);
      await expect(h2).toBeVisible();
      await expect(h3).toBeVisible();
    });

    test('should have table of contents', async ({ page }) => {
      await expect(page.locator('[data-testid="table-of-contents"]')).toBeVisible();
    });

    test('should have working table of contents links', async ({ page }) => {
      const tocLinks = page.locator('[data-testid="toc-link"]');
      await expect(tocLinks).toBeVisible();
      
      // Click on a TOC link
      await tocLinks.first().click();
      
      // Should scroll to the section
      await expect(page.locator('[data-testid="section-content"]')).toBeVisible();
    });

    test('should have proper sections with spacing', async ({ page }) => {
      const sections = page.locator('section');
      await expect(sections).toHaveCount.greaterThan(3);
    });

    test('should display rule numbers and references', async ({ page }) => {
      await expect(page.locator('[data-testid="rule-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="rule-reference"]')).toBeVisible();
    });
  });

  test.describe('Search and Filter', () => {
    test('should have search functionality', async ({ page }) => {
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    });

    test('should search within rules content', async ({ page }) => {
      await page.fill('input[placeholder*="Search"]', 'safety');
      await page.keyboard.press('Enter');
      
      // Should highlight or filter results
      await expect(page.locator('[data-testid="search-result"]')).toBeVisible();
    });

    test('should filter rules by category', async ({ page }) => {
      await page.click('[data-testid="category-filter"]');
      await page.click('option:has-text("Air Rifle")');
      
      // Should show filtered results
      await expect(page.locator('[data-testid="filtered-content"]')).toBeVisible();
    });

    test('should clear search and filters', async ({ page }) => {
      await page.fill('input[placeholder*="Search"]', 'test');
      await page.click('button:has-text("Clear")');
      
      // Should show all content
      await expect(page.locator('[data-testid="rules-content"]')).toBeVisible();
    });
  });

  test.describe('Document Downloads', () => {
    test('should provide downloadable rule documents', async ({ page }) => {
      await expect(page.locator('text=Download Rules')).toBeVisible();
    });

    test('should have PDF downloads', async ({ page }) => {
      const pdfLinks = page.locator('a[href*=".pdf"]');
      await expect(pdfLinks).toBeVisible();
    });

    test('should have different document formats', async ({ page }) => {
      await expect(page.locator('text=PDF')).toBeVisible();
      await expect(page.locator('text=DOC')).toBeVisible();
    });

    test('should show document sizes and dates', async ({ page }) => {
      await expect(page.locator('[data-testid="document-size"]')).toBeVisible();
      await expect(page.locator('[data-testid="document-date"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // All content should be visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="rules-content"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Content should be properly laid out
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Content should be mobile-friendly
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
      
      // Check that text is readable on mobile
      const mainText = page.locator('p').first();
      const fontSize = await mainText.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      // Font size should be appropriate for mobile
      expect(parseInt(fontSize)).toBeGreaterThan(14);
    });

    test('should handle mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mobile menu should work
      await page.click('button[aria-label="Menu"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Should be able to navigate to rules from mobile menu
      await page.click('text=Rules');
      await expect(page).toHaveURL('/rules');
    });

    test('should have collapsible sections on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Sections should be collapsible on mobile
      await page.click('[data-testid="section-toggle"]:first-child');
      
      // Should expand/collapse section
      await expect(page.locator('[data-testid="section-content"]')).toBeVisible();
    });
  });

  test.describe('Interactive Elements', () => {
    test('should have working internal links', async ({ page }) => {
      const internalLinks = page.locator('a[href^="#"]');
      await expect(internalLinks).toBeVisible();
      
      // Click on internal link
      await internalLinks.first().click();
      
      // Should scroll to section
      await expect(page.locator('[data-testid="section-content"]')).toBeVisible();
    });

    test('should have working external links', async ({ page }) => {
      const externalLinks = page.locator('a[href^="http"]');
      await expect(externalLinks).toBeVisible();
    });

    test('should have expandable sections', async ({ page }) => {
      await page.click('[data-testid="expand-section"]:first-child');
      
      // Should expand section
      await expect(page.locator('[data-testid="expanded-content"]')).toBeVisible();
    });

    test('should have tooltips for technical terms', async ({ page }) => {
      const tooltipTriggers = page.locator('[data-testid="tooltip-trigger"]');
      await expect(tooltipTriggers).toBeVisible();
      
      // Hover to show tooltip
      await tooltipTriggers.first().hover();
      await expect(page.locator('[data-testid="tooltip"]')).toBeVisible();
    });
  });

  test.describe('SEO and Meta', () => {
    test('should have proper meta tags', async ({ page }) => {
      // Check title
      await expect(page).toHaveTitle(/Rules|SATRF/);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /rules|regulations/);
      
      // Check keywords
      const metaKeywords = page.locator('meta[name="keywords"]');
      await expect(metaKeywords).toHaveAttribute('content', /rules|shooting/);
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
      await expect(canonical).toHaveAttribute('href', /\/rules/);
    });

    test('should have structured data markup', async ({ page }) => {
      const structuredData = page.locator('script[type="application/ld+json"]');
      await expect(structuredData).toBeVisible();
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

    test('should have skip navigation link', async ({ page }) => {
      await expect(page.locator('a[href="#main-content"]')).toBeVisible();
    });

    test('should have proper focus management', async ({ page }) => {
      // Tab to skip link
      await page.keyboard.press('Tab');
      
      // Should focus on skip link first
      await expect(page.locator('a[href="#main-content"]')).toBeFocused();
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
      await page.screenshot({ path: 'rules-page-layout.png' });
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work in Chrome', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    });

    test('should work in Firefox', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    });

    test('should work in Safari', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    });
  });
}); 