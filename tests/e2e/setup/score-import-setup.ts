import { Page } from '@playwright/test';

// Mock admin user data
export const ADMIN_USER = {
  id: 'admin_user_id',
  email: 'admin@satrf.com',
  role: 'admin',
  name: 'Admin User'
};

// Mock score data for API responses
export const MOCK_SCORES = [
  {
    id: '1',
    eventName: 'Prone Match 1',
    matchNumber: 1,
    shooterName: 'John Doe',
    club: 'SATRF Club A',
    division: 'Open',
    veteran: false,
    series1: 100.5,
    series2: 98.2,
    series3: 101.0,
    series4: 99.8,
    series5: 100.1,
    series6: 97.9,
    total: 597.5,
    place: 1,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    eventName: 'Air Rifle',
    matchNumber: 2,
    shooterName: 'Jane Smith',
    club: 'SATRF Club B',
    division: 'Junior',
    veteran: false,
    series1: 95.0,
    series2: 96.5,
    series3: 94.8,
    series4: 97.2,
    series5: 95.9,
    series6: 96.1,
    total: 575.5,
    place: 2,
    createdAt: '2024-01-15T11:00:00Z'
  },
  {
    id: '3',
    eventName: '3P',
    matchNumber: 3,
    shooterName: 'Bob Johnson',
    club: 'SATRF Club C',
    division: 'Veteran',
    veteran: true,
    series1: 92.3,
    series2: 94.7,
    series3: 91.8,
    series4: 93.5,
    series5: 95.2,
    series6: 92.9,
    total: 560.4,
    place: 3,
    createdAt: '2024-01-15T12:00:00Z'
  }
];

// Helper function to setup admin authentication
export async function setupAdminAuth(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authToken', 'mock-admin-token');
  }, ADMIN_USER);
}

// Helper function to mock API responses
export async function mockScoreImportAPI(page: Page, success = true, importedCount = 3) {
  await page.route('**/api/admin/scores/import', async route => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: `Successfully imported ${importedCount} scores`,
          data: {
            imported: importedCount,
            errors: 0
          }
        })
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Import failed',
          error: 'Validation error'
        })
      });
    }
  });
}

// Helper function to mock results API
export async function mockResultsAPI(page: Page, scores = MOCK_SCORES) {
  await page.route('**/api/results**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            event: 'Prone Match 1',
            matchNumber: 1,
            results: scores.filter(s => s.eventName === 'Prone Match 1')
          },
          {
            event: 'Air Rifle',
            matchNumber: 2,
            results: scores.filter(s => s.eventName === 'Air Rifle')
          },
          {
            event: '3P',
            matchNumber: 3,
            results: scores.filter(s => s.eventName === '3P')
          }
        ]
      })
    });
  });
}

// Helper function to mock leaderboard API
export async function mockLeaderboardAPI(page: Page, scores = MOCK_SCORES) {
  await page.route('**/api/leaderboard**', async route => {
    const leaderboardData = scores.map((score, index) => ({
      id: score.id,
      rank: index + 1,
      playerName: score.shooterName,
      score: score.total,
      discipline: score.eventName,
      eventTitle: `${score.eventName} - Match ${score.matchNumber}`,
      date: score.createdAt
    }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(leaderboardData)
    });
  });
}

// Helper function to create test Excel file content
export function createExcelFileContent(data: any[]) {
  const headers = [
    'Event Name', 'Match Number', 'Shooter Name', 'Club', 'Division/Class',
    'Veteran', 'Series 1', 'Series 2', 'Series 3', 'Series 4', 'Series 5',
    'Series 6', 'Total', 'Place'
  ];

  const rows = data.map(row => [
    row['Event Name'],
    row['Match Number'],
    row['Shooter Name'],
    row['Club'],
    row['Division/Class'],
    row['Veteran'],
    row['Series 1'],
    row['Series 2'],
    row['Series 3'],
    row['Series 4'],
    row['Series 5'],
    row['Series 6'],
    row['Total'],
    row['Place']
  ]);

  return [headers, ...rows];
}

// Helper function to wait for file processing
export async function waitForFileProcessing(page: Page, expectedRows: number) {
  await page.waitForSelector(`text=${expectedRows} rows parsed`, { timeout: 15000 });
}

// Helper function to wait for import completion
export async function waitForImportCompletion(page: Page, success = true) {
  if (success) {
    await page.waitForSelector('text=Import Successful', { timeout: 10000 });
  } else {
    await page.waitForSelector('text=Import Failed', { timeout: 10000 });
  }
}

// Helper function to verify score data in results page
export async function verifyScoreDataInResults(page: Page, scores: any[]) {
  for (const score of scores) {
    await page.waitForSelector(`text=${score.shooterName}`, { timeout: 5000 });
    await page.waitForSelector(`text=${score.total}`, { timeout: 5000 });
    await page.waitForSelector(`text=${score.eventName}`, { timeout: 5000 });
  }
}

// Helper function to verify validation errors
export async function verifyValidationErrors(page: Page, expectedErrors: string[]) {
  for (const error of expectedErrors) {
    await page.waitForSelector(`text=${error}`, { timeout: 5000 });
  }
} 