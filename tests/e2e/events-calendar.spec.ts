import { test, expect } from '@playwright/test';

test.describe('Events Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events/calendar');
  });

  test.describe('Event Browsing', () => {
    test('should load events calendar page', async ({ page }) => {
      await expect(page).toHaveURL('/events/calendar');
      await expect(page.locator('h1')).toContainText(/Events|Calendar/);
    });

    test('should display events list', async ({ page }) => {
      // Wait for events to load
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });
      
      // Check that events are displayed
      const eventItems = page.locator('[data-testid="event-item"]');
      await expect(eventItems.first()).toBeVisible();
    });

    test('should display event details correctly', async ({ page }) => {
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Check event details are present
      await expect(page.locator('text=Event Name')).toBeVisible();
      await expect(page.locator('text=Date')).toBeVisible();
      await expect(page.locator('text=Location')).toBeVisible();
    });

    test('should open event details modal', async ({ page }) => {
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Click on first event
      await page.click('[data-testid="event-item"]:first-child');
      
      // Modal should open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Event Details')).toBeVisible();
    });
  });

  test.describe('Event Filtering', () => {
    test('should filter events by date range', async ({ page }) => {
      // Open filters
      await page.click('text=Filter');
      
      // Set date range
      await page.fill('input[placeholder="Start Date"]', '2024-01-01');
      await page.fill('input[placeholder="End Date"]', '2024-12-31');
      
      // Apply filters
      await page.click('button:has-text("Apply Filters")');
      
      // Events should be filtered
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
    });

    test('should filter events by type', async ({ page }) => {
      await page.click('text=Filter');
      
      // Select event type
      await page.selectOption('select[name="eventType"]', 'competition');
      
      await page.click('button:has-text("Apply Filters")');
      
      // Should show filtered results
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
    });

    test('should filter events by location', async ({ page }) => {
      await page.click('text=Filter');
      
      await page.fill('input[placeholder="Location"]', 'Johannesburg');
      
      await page.click('button:has-text("Apply Filters")');
      
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
    });

    test('should clear filters', async ({ page }) => {
      await page.click('text=Filter');
      await page.fill('input[placeholder="Location"]', 'Test Location');
      await page.click('button:has-text("Apply Filters")');
      
      // Clear filters
      await page.click('button:has-text("Clear Filters")');
      
      // Should show all events
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
    });
  });

  test.describe('Event Registration', () => {
    test('should register for an event when logged in', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate back to events
      await page.goto('/events/calendar');
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Click register button on first event
      await page.click('[data-testid="register-button"]:first-child');
      
      // Should show registration confirmation
      await expect(page.locator('text=Successfully registered')).toBeVisible();
    });

    test('should unregister from an event', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/events/calendar');
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Click unregister button
      await page.click('[data-testid="unregister-button"]:first-child');
      
      // Should show unregistration confirmation
      await expect(page.locator('text=Successfully unregistered')).toBeVisible();
    });

    test('should redirect to login when trying to register while not authenticated', async ({ page }) => {
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Try to register without being logged in
      await page.click('[data-testid="register-button"]:first-child');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should show registration status', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/events/calendar');
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Check registration status is displayed
      await expect(page.locator('[data-testid="registration-status"]')).toBeVisible();
    });
  });

  test.describe('Calendar View', () => {
    test('should switch between calendar and list view', async ({ page }) => {
      // Default should be list view
      await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
      
      // Switch to calendar view
      await page.click('button:has-text("Calendar View")');
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      
      // Switch back to list view
      await page.click('button:has-text("List View")');
      await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
    });

    test('should navigate calendar months', async ({ page }) => {
      await page.click('button:has-text("Calendar View")');
      
      // Navigate to next month
      await page.click('button[aria-label="Next month"]');
      
      // Navigate to previous month
      await page.click('button[aria-label="Previous month"]');
    });

    test('should click on calendar dates', async ({ page }) => {
      await page.click('button:has-text("Calendar View")');
      
      // Click on a date with events
      await page.click('[data-testid="calendar-day"]:has-text("15")');
      
      // Should show events for that date
      await expect(page.locator('[data-testid="day-events"]')).toBeVisible();
    });
  });

  test.describe('Event Search', () => {
    test('should search for events by name', async ({ page }) => {
      await page.fill('input[placeholder="Search events..."]', 'Competition');
      
      // Press Enter or click search button
      await page.keyboard.press('Enter');
      
      // Should show search results
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
    });

    test('should show no results for invalid search', async ({ page }) => {
      await page.fill('input[placeholder="Search events..."]', 'NonexistentEvent');
      await page.keyboard.press('Enter');
      
      // Should show no results message
      await expect(page.locator('text=No events found')).toBeVisible();
    });
  });

  test.describe('Event Categories', () => {
    test('should filter by ISSF events', async ({ page }) => {
      await page.click('button:has-text("ISSF Events")');
      
      // Should show only ISSF events
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
    });

    test('should filter by SATRF events', async ({ page }) => {
      await page.click('button:has-text("SATRF Events")');
      
      // Should show only SATRF events
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
    });

    test('should show upcoming events', async ({ page }) => {
      await page.click('button:has-text("Upcoming")');
      
      // Should show upcoming events
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Calendar should be responsive
      await expect(page.locator('[data-testid="event-item"]')).toBeVisible();
      
      // Filters should be accessible on mobile
      await page.click('button:has-text("Filter")');
      await expect(page.locator('[data-testid="filter-modal"]')).toBeVisible();
    });

    test('should handle mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mobile menu should work
      await page.click('button[aria-label="Menu"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/events**', route => route.abort());
      
      await page.reload();
      
      // Should show error message
      await expect(page.locator('text=Failed to load events')).toBeVisible();
    });

    test('should show loading states', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/events**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify([]),
          delay: 2000 
        })
      );
      
      await page.reload();
      
      // Should show loading indicator
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Tab through event items
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="event-item"]:first-child')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Check for proper ARIA labels
      await expect(page.locator('[data-testid="event-item"]')).toHaveAttribute('aria-label');
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Filter events
      await page.click('button:has-text("Filter")');
      await page.click('button:has-text("Apply Filters")');
      
      // Should announce results
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load events within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large number of events', async ({ page }) => {
      // Mock many events
      await page.route('**/api/events**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify(Array.from({ length: 100 }, (_, i) => ({
            id: i,
            name: `Event ${i}`,
            date: '2024-12-01',
            location: 'Test Location'
          })))
        })
      );
      
      await page.reload();
      await page.waitForSelector('[data-testid="event-item"]');
      
      // Should display events without performance issues
      await expect(page.locator('[data-testid="event-item"]')).toHaveCount(100);
    });
  });
}); 