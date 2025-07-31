import { test, expect } from '@playwright/test';

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to leaderboard page before each test
    await page.goto('/scores/leaderboard');
  });

  test('should display leaderboard with loading state initially', async ({ page }) => {
    // Mock API to delay response to show loading state
    await page.route('**/leaderboard', async route => {
      // Delay the response to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/scores/leaderboard');
    
    // Check for loading indicator
    await expect(page.getByText(/loading/i)).toBeVisible();
  });

  test('should display leaderboard data when loaded', async ({ page }) => {
    const mockLeaderboardData = [
      {
        id: '1',
        rank: 1,
        playerName: 'John Doe',
        score: 950,
        discipline: 'Rifle',
        eventTitle: 'Spring Championship',
        date: '2024-01-15'
      },
      {
        id: '2',
        rank: 2,
        playerName: 'Jane Smith',
        score: 920,
        discipline: 'Pistol',
        eventTitle: 'Winter Cup',
        date: '2024-01-14'
      },
      {
        id: '3',
        rank: 3,
        playerName: 'Bob Johnson',
        score: 890,
        discipline: 'Rifle',
        eventTitle: 'Spring Championship',
        date: '2024-01-13'
      }
    ];

    // Mock the API response
    await page.route('**/leaderboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLeaderboardData)
      });
    });

    await page.goto('/scores/leaderboard');

    // Check that leaderboard data is displayed
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('Bob Johnson')).toBeVisible();
    
    // Check scores
    await expect(page.getByText('950')).toBeVisible();
    await expect(page.getByText('920')).toBeVisible();
    await expect(page.getByText('890')).toBeVisible();
    
    // Check ranks
    await expect(page.getByText('1')).toBeVisible();
    await expect(page.getByText('2')).toBeVisible();
    await expect(page.getByText('3')).toBeVisible();
  });

  test('should display table headers correctly', async ({ page }) => {
    // Mock empty response to show headers
    await page.route('**/leaderboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/scores/leaderboard');

    // Check for table headers
    await expect(page.getByText(/rank/i)).toBeVisible();
    await expect(page.getByText(/player/i)).toBeVisible();
    await expect(page.getByText(/score/i)).toBeVisible();
    await expect(page.getByText(/discipline/i)).toBeVisible();
    await expect(page.getByText(/event/i)).toBeVisible();
    await expect(page.getByText(/date/i)).toBeVisible();
  });

  test('should handle empty leaderboard gracefully', async ({ page }) => {
    // Mock empty response
    await page.route('**/leaderboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/scores/leaderboard');

    // Check for empty state message
    await expect(page.getByText(/no scores available/i)).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/leaderboard', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Internal server error'
        })
      });
    });

    await page.goto('/scores/leaderboard');

    // Check for error message
    await expect(page.getByText(/error loading leaderboard/i)).toBeVisible();
  });

  test('should filter leaderboard by discipline', async ({ page }) => {
    const mockRifleData = [
      {
        id: '1',
        rank: 1,
        playerName: 'John Doe',
        score: 950,
        discipline: 'Rifle',
        eventTitle: 'Spring Championship',
        date: '2024-01-15'
      }
    ];

    // Mock the API response for rifle discipline
    await page.route('**/leaderboard?discipline=Rifle', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRifleData)
      });
    });

    await page.goto('/scores/leaderboard');

    // Click on discipline filter (assuming there's a filter dropdown)
    await page.getByRole('button', { name: /discipline/i }).click();
    await page.getByText('Rifle').click();

    // Check that only rifle scores are shown
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Rifle')).toBeVisible();
  });

  test('should display user rank when logged in', async ({ page }) => {
    // Mock user authentication
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'test_user_id',
        email: 'test@example.com'
      }));
    });

    const mockUserRank = [
      {
        rank: 5,
        score: 850,
        discipline: 'Rifle',
        eventTitle: 'Spring Championship',
        date: '2024-01-10'
      }
    ];

    // Mock the API response for user rank
    await page.route('**/leaderboard/user-rank', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUserRank)
      });
    });

    await page.goto('/scores/leaderboard');

    // Check that user rank is displayed
    await expect(page.getByText(/your rank/i)).toBeVisible();
    await expect(page.getByText('5')).toBeVisible();
  });

  test('should have proper table accessibility', async ({ page }) => {
    // Mock empty response to check table structure
    await page.route('**/leaderboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/scores/leaderboard');

    // Check that table has proper semantic structure
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('thead')).toBeVisible();
    await expect(page.locator('tbody')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mock empty response
    await page.route('**/leaderboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/scores/leaderboard');

    // Check that the page is still functional on mobile
    await expect(page.getByText(/rank/i)).toBeVisible();
    await expect(page.getByText(/player/i)).toBeVisible();
  });
}); 