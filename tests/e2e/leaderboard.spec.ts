import { test, expect } from '@playwright/test';

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test.describe('Page Loading', () => {
    test('should load leaderboard page successfully', async ({ page }) => {
      await expect(page).toHaveURL('/leaderboard');
      await expect(page.locator('h1')).toContainText(/Leaderboard|Rankings/);
    });

    test('should display leaderboard table', async ({ page }) => {
      // Wait for leaderboard to load
      await page.waitForSelector('[data-testid="leaderboard-table"]', { timeout: 10000 });
      
      await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    });

    test('should show loading state initially', async ({ page }) => {
      // Mock slow API response to see loading state
      await page.route('**/api/leaderboard**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify([]),
          delay: 2000 
        })
      );
      
      await page.reload();
      
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    });
  });

  test.describe('Leaderboard Data', () => {
    test('should display player rankings', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Check for ranking column
      await expect(page.locator('text=Rank')).toBeVisible();
      
      // Check for player information
      await expect(page.locator('text=Player')).toBeVisible();
      await expect(page.locator('text=Score')).toBeVisible();
    });

    test('should display player details', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-row"]');
      
      // Check that player rows are displayed
      const playerRows = page.locator('[data-testid="leaderboard-row"]');
      await expect(playerRows.first()).toBeVisible();
      
      // Check for player name, score, and rank
      await expect(page.locator('[data-testid="player-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="player-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="player-rank"]')).toBeVisible();
    });

    test('should display multiple players', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-row"]');
      
      const playerRows = page.locator('[data-testid="leaderboard-row"]');
      const count = await playerRows.count();
      
      // Should have multiple players
      expect(count).toBeGreaterThan(1);
    });

    test('should show player statistics', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-row"]');
      
      // Check for additional stats like events participated, average score, etc.
      await expect(page.locator('[data-testid="player-stats"]')).toBeVisible();
    });
  });

  test.describe('Sorting Functionality', () => {
    test('should sort by rank by default', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-row"]');
      
      // Check that first row has rank 1
      const firstRank = page.locator('[data-testid="player-rank"]').first();
      await expect(firstRank).toContainText('1');
    });

    test('should sort by score when clicking score header', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Click on score header to sort
      await page.click('th:has-text("Score")');
      
      // Should show sort indicator
      await expect(page.locator('[data-testid="sort-indicator"]')).toBeVisible();
    });

    test('should sort by player name when clicking name header', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Click on player name header
      await page.click('th:has-text("Player")');
      
      // Should sort alphabetically
      await expect(page.locator('[data-testid="sort-indicator"]')).toBeVisible();
    });

    test('should toggle sort direction', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Click score header twice to toggle sort direction
      await page.click('th:has-text("Score")');
      await page.click('th:has-text("Score")');
      
      // Should show reverse sort indicator
      await expect(page.locator('[data-testid="sort-indicator-reverse"]')).toBeVisible();
    });

    test('should maintain sort state on page refresh', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Sort by score
      await page.click('th:has-text("Score")');
      
      // Refresh page
      await page.reload();
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Should maintain sort state
      await expect(page.locator('[data-testid="sort-indicator"]')).toBeVisible();
    });
  });

  test.describe('Filtering Functionality', () => {
    test('should filter by discipline', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Open filter dropdown
      await page.click('[data-testid="discipline-filter"]');
      
      // Select a discipline
      await page.click('option:has-text("Air Rifle")');
      
      // Should filter results
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });

    test('should filter by category', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Open category filter
      await page.click('[data-testid="category-filter"]');
      
      // Select a category
      await page.click('option:has-text("Senior")');
      
      // Should filter results
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });

    test('should filter by date range', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Open date filter
      await page.click('[data-testid="date-filter"]');
      
      // Set date range
      await page.fill('input[placeholder="Start Date"]', '2024-01-01');
      await page.fill('input[placeholder="End Date"]', '2024-12-31');
      
      // Apply filter
      await page.click('button:has-text("Apply")');
      
      // Should filter results
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });

    test('should clear all filters', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Apply some filters
      await page.click('[data-testid="discipline-filter"]');
      await page.click('option:has-text("Air Rifle")');
      
      // Clear filters
      await page.click('button:has-text("Clear Filters")');
      
      // Should show all results
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });

    test('should show filter count', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Apply filter
      await page.click('[data-testid="discipline-filter"]');
      await page.click('option:has-text("Air Rifle")');
      
      // Should show filtered count
      await expect(page.locator('[data-testid="filter-count"]')).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should search for player by name', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Search for a player
      await page.fill('input[placeholder="Search players..."]', 'John');
      await page.keyboard.press('Enter');
      
      // Should show search results
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });

    test('should show no results for invalid search', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Search for non-existent player
      await page.fill('input[placeholder="Search players..."]', 'NonexistentPlayer');
      await page.keyboard.press('Enter');
      
      // Should show no results message
      await expect(page.locator('text=No players found')).toBeVisible();
    });

    test('should clear search', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Search for a player
      await page.fill('input[placeholder="Search players..."]', 'John');
      await page.keyboard.press('Enter');
      
      // Clear search
      await page.click('button[aria-label="Clear search"]');
      
      // Should show all results
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Check for pagination
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    });

    test('should navigate to next page', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Click next page
      await page.click('button[aria-label="Next page"]');
      
      // Should show different results
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });

    test('should navigate to previous page', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Go to next page first
      await page.click('button[aria-label="Next page"]');
      
      // Then go back
      await page.click('button[aria-label="Previous page"]');
      
      // Should show original results
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });

    test('should show current page indicator', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Check for page indicator
      await expect(page.locator('[data-testid="current-page"]')).toBeVisible();
    });
  });

  test.describe('Player Details', () => {
    test('should open player details when clicking on player name', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-row"]');
      
      // Click on player name
      await page.click('[data-testid="player-name"]:first-child');
      
      // Should open player details modal or navigate to player page
      await expect(page.locator('[data-testid="player-details"]')).toBeVisible();
    });

    test('should display player statistics in details', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-row"]');
      
      // Open player details
      await page.click('[data-testid="player-name"]:first-child');
      
      // Check for detailed stats
      await expect(page.locator('text=Total Events')).toBeVisible();
      await expect(page.locator('text=Average Score')).toBeVisible();
      await expect(page.locator('text=Best Score')).toBeVisible();
    });

    test('should show player history', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-row"]');
      
      // Open player details
      await page.click('[data-testid="player-name"]:first-child');
      
      // Check for event history
      await expect(page.locator('text=Event History')).toBeVisible();
    });
  });

  test.describe('Export and Sharing', () => {
    test('should export leaderboard data', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Click export button
      await page.click('button:has-text("Export")');
      
      // Should trigger download or show export options
      await expect(page.locator('[data-testid="export-options"]')).toBeVisible();
    });

    test('should share leaderboard', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Click share button
      await page.click('button:has-text("Share")');
      
      // Should show sharing options
      await expect(page.locator('[data-testid="share-options"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Table should be fully visible
      await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Table should be responsive
      await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Table should be mobile-friendly
      await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
      
      // Check for mobile-specific layout
      await expect(page.locator('[data-testid="mobile-leaderboard"]')).toBeVisible();
    });

    test('should handle mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mobile menu should work
      await page.click('button[aria-label="Menu"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Should be able to navigate to leaderboard from mobile menu
      await page.click('text=Leaderboard');
      await expect(page).toHaveURL('/leaderboard');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/leaderboard**', route => route.abort());
      
      await page.reload();
      
      // Should show error message
      await expect(page.locator('text=Failed to load leaderboard')).toBeVisible();
    });

    test('should show retry option on error', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/leaderboard**', route => route.abort());
      
      await page.reload();
      
      // Should show retry button
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should handle empty leaderboard', async ({ page }) => {
      // Mock empty response
      await page.route('**/api/leaderboard**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify([])
        })
      );
      
      await page.reload();
      
      // Should show empty state message
      await expect(page.locator('text=No rankings available')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Tab through table elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="leaderboard-table"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Check for proper table labels
      await expect(page.locator('[data-testid="leaderboard-table"]')).toHaveAttribute('aria-label');
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Apply filter
      await page.click('[data-testid="discipline-filter"]');
      await page.click('option:has-text("Air Rifle")');
      
      // Should announce results
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    });

    test('should have proper table headers', async ({ page }) => {
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Check for proper table headers
      const headers = page.locator('th');
      await expect(headers).toHaveCount.greaterThan(0);
      
      // Check that headers have proper scope
      for (let i = 0; i < await headers.count(); i++) {
        await expect(headers.nth(i)).toHaveAttribute('scope', 'col');
      }
    });
  });

  test.describe('Performance', () => {
    test('should load leaderboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.waitForSelector('[data-testid="leaderboard-table"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/leaderboard**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `Player ${i}`,
            score: 1000 - i,
            rank: i + 1
          })))
        })
      );
      
      await page.reload();
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Should display without performance issues
      await expect(page.locator('[data-testid="leaderboard-row"]')).toBeVisible();
    });

    test('should implement virtual scrolling for large lists', async ({ page }) => {
      // Mock very large dataset
      await page.route('**/api/leaderboard**', route => 
        route.fulfill({ 
          status: 200, 
          body: JSON.stringify(Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            name: `Player ${i}`,
            score: 10000 - i,
            rank: i + 1
          })))
        })
      );
      
      await page.reload();
      await page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Should only render visible rows
      const visibleRows = page.locator('[data-testid="leaderboard-row"]');
      const count = await visibleRows.count();
      
      // Should not render all 10000 rows at once
      expect(count).toBeLessThan(1000);
    });
  });
}); 