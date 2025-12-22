import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import {
  setupAdminAuth,
  mockScoreImportAPI,
  mockResultsAPI,
  MOCK_SCORES,
  waitForFileProcessing,
  waitForImportCompletion,
  verifyScoreDataInResults
} from './setup/score-import-setup';

// Test data for creating sample files
const VALID_SCORE_DATA = [
  {
    'Event Name': 'Prone Match 1',
    'Match Number': 1,
    'Shooter Name': 'John Doe',
    'Club': 'SATRF Club A',
    'Division/Class': 'Open',
    'Veteran': 'N',
    'Series 1': 100.5,
    'Series 2': 98.2,
    'Series 3': 101.0,
    'Series 4': 99.8,
    'Series 5': 100.1,
    'Series 6': 97.9,
    'Total': 597.5,
    'Place': 1
  },
  {
    'Event Name': 'Air Rifle',
    'Match Number': 2,
    'Shooter Name': 'Jane Smith',
    'Club': 'SATRF Club B',
    'Division/Class': 'Junior',
    'Veteran': 'N',
    'Series 1': 95.0,
    'Series 2': 96.5,
    'Series 3': 94.8,
    'Series 4': 97.2,
    'Series 5': 95.9,
    'Series 6': 96.1,
    'Total': 575.5,
    'Place': 2
  },
  {
    'Event Name': '3P',
    'Match Number': 3,
    'Shooter Name': 'Bob Johnson',
    'Club': 'SATRF Club C',
    'Division/Class': 'Veteran',
    'Veteran': 'Y',
    'Series 1': 92.3,
    'Series 2': 94.7,
    'Series 3': 91.8,
    'Series 4': 93.5,
    'Series 5': 95.2,
    'Series 6': 92.9,
    'Total': 560.4,
    'Place': 3
  }
];

const INVALID_SCORE_DATA = [
  {
    'Event Name': 'Invalid Event', // Invalid event name
    'Match Number': 1,
    'Shooter Name': 'John Doe',
    'Club': 'Test Club',
    'Division/Class': 'Open',
    'Veteran': 'N',
    'Series 1': 100.5,
    'Series 2': 98.2,
    'Series 3': 101.0,
    'Series 4': 99.8,
    'Series 5': 100.1,
    'Series 6': 97.9,
    'Total': 597.5,
    'Place': 1
  },
  {
    'Event Name': 'Prone Match 1',
    'Match Number': 1,
    'Shooter Name': '', // Empty shooter name
    'Club': 'Test Club',
    'Division/Class': 'Open',
    'Veteran': 'N',
    'Series 1': 100.5,
    'Series 2': 98.2,
    'Series 3': 101.0,
    'Series 4': 99.8,
    'Series 5': 100.1,
    'Series 6': 97.9,
    'Total': 597.5,
    'Place': 1
  }
];

// Helper function to create test files
function createTestFile(data: any[], filename: string): string {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
  
  const filePath = path.join(__dirname, filename);
  XLSX.writeFile(workbook, filePath);
  return filePath;
}

test.describe('Score Import and Display Flow', () => {
  let validExcelFile: string;
  let invalidExcelFile: string;

  test.beforeAll(async () => {
    // Create test files
    validExcelFile = createTestFile(VALID_SCORE_DATA, 'valid-scores.xlsx');
    invalidExcelFile = createTestFile(INVALID_SCORE_DATA, 'invalid-scores.xlsx');
  });

  test.afterAll(async () => {
    // Clean up test files
    if (fs.existsSync(validExcelFile)) {
      fs.unlinkSync(validExcelFile);
    }
    if (fs.existsSync(invalidExcelFile)) {
      fs.unlinkSync(invalidExcelFile);
    }
  });

  test('should complete full score import and display flow', async ({ page }) => {
    // Setup admin authentication and API mocking
    await setupAdminAuth(page);
    await mockScoreImportAPI(page, true, 3);
    await mockResultsAPI(page, MOCK_SCORES);

    // Navigate to admin score import page
    await page.goto('/admin/scores/import');
    
    // Verify we're on the correct page
    await expect(page.getByText('Admin Score Import & Entry')).toBeVisible();

    // Upload a valid Excel file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await waitForFileProcessing(page, 3);

    // Verify preview table shows all rows
    await page.getByRole('button', { name: /preview data/i }).click();
    
    // Check preview modal
    await expect(page.getByText('Data Preview')).toBeVisible();
    
    // Verify all rows are shown in preview
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('Bob Johnson')).toBeVisible();
    
    // Close preview modal
    await page.getByRole('button', { name: /close/i }).click();

    // Click "Import" and check for success message
    await page.getByRole('button', { name: /import 3 valid scores/i }).click();
    
    // Wait for import to complete
    await waitForImportCompletion(page, true);
    await expect(page.getByText('Successfully imported 3 scores')).toBeVisible();

    // Go to /results and verify imported data displays correctly
    await page.goto('/results');
    
    // Wait for results to load
    await expect(page.getByText('Match Results')).toBeVisible();
    
    // Verify imported data is displayed
    await verifyScoreDataInResults(page, MOCK_SCORES);
  });

  test('should handle invalid file upload correctly', async ({ page }) => {
    // Setup admin authentication
    await setupAdminAuth(page);

    await page.goto('/admin/scores/import');

    // Upload invalid Excel file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(invalidExcelFile);

    // Wait for file to be processed
    await waitForFileProcessing(page, 2);

    // Verify validation errors are shown
    await expect(page.getByText('Found 2 validation errors:')).toBeVisible();
    await expect(page.getByText('Invalid or missing event name')).toBeVisible();
    await expect(page.getByText('Missing shooter name')).toBeVisible();

    // Check that import button shows 0 valid scores
    await expect(page.getByText('Import 0 Valid Scores')).toBeVisible();
    
    // Verify import button is disabled
    await expect(page.getByRole('button', { name: /import 0 valid scores/i })).toBeDisabled();
  });

  test('should handle mixed valid and invalid data', async ({ page }) => {
    // Create mixed data file
    const mixedData = [
      ...VALID_SCORE_DATA.slice(0, 1), // One valid row
      ...INVALID_SCORE_DATA.slice(0, 1) // One invalid row
    ];
    const mixedFile = createTestFile(mixedData, 'mixed-scores.xlsx');

    try {
      // Setup admin authentication and API mocking
      await setupAdminAuth(page);
      await mockScoreImportAPI(page, true, 1);
      await mockResultsAPI(page, [MOCK_SCORES[0]]);

      await page.goto('/admin/scores/import');

      // Upload mixed data file
      const fileInput = page.locator('#file-input');
      await fileInput.setInputFiles(mixedFile);

      // Wait for file to be processed
      await waitForFileProcessing(page, 2);

      // Verify validation errors are shown
      await expect(page.getByText('Found 1 validation errors:')).toBeVisible();

      // Check that import button shows 1 valid score
      await expect(page.getByText('Import 1 Valid Scores')).toBeVisible();

      // Import the valid scores
      await page.getByRole('button', { name: /import 1 valid scores/i }).click();

      // Wait for import to complete
      await waitForImportCompletion(page, true);
      await expect(page.getByText('Successfully imported 1 scores with 1 errors')).toBeVisible();

      // Verify the valid score appears in results
      await page.goto('/results');
      await expect(page.getByText('John Doe')).toBeVisible();
      await expect(page.getByText('597.5')).toBeVisible();

    } finally {
      // Clean up
      if (fs.existsSync(mixedFile)) {
        fs.unlinkSync(mixedFile);
      }
    }
  });

  test('should handle network errors during import', async ({ page }) => {
    // Setup admin authentication
    await setupAdminAuth(page);

    // Mock network error
    await page.route('**/api/admin/scores/import', route => {
      route.abort('failed');
    });

    await page.goto('/admin/scores/import');

    // Upload valid file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await waitForFileProcessing(page, 3);

    // Try to import
    await page.getByRole('button', { name: /import 3 valid scores/i }).click();

    // Verify error message
    await expect(page.getByText('Import Failed')).toBeVisible();
  });

  test('should handle unsupported file type', async ({ page }) => {
    // Setup admin authentication
    await setupAdminAuth(page);

    await page.goto('/admin/scores/import');

    // Create a text file (unsupported)
    const textFile = path.join(__dirname, 'unsupported.txt');
    fs.writeFileSync(textFile, 'This is not a valid score file');

    try {
      // Try to upload unsupported file
      const fileInput = page.locator('#file-input');
      await fileInput.setInputFiles(textFile);

      // Verify error message
      await expect(page.getByText('Please upload an Excel (.xlsx, .xls) or CSV file')).toBeVisible();
    } finally {
      // Clean up
      if (fs.existsSync(textFile)) {
        fs.unlinkSync(textFile);
      }
    }
  });

  test('should handle empty file upload', async ({ page }) => {
    // Setup admin authentication
    await setupAdminAuth(page);

    await page.goto('/admin/scores/import');

    // Create an empty Excel file
    const emptyData: any[] = [];
    const emptyFile = createTestFile(emptyData, 'empty-scores.xlsx');

    try {
      // Upload empty file
      const fileInput = page.locator('#file-input');
      await fileInput.setInputFiles(emptyFile);

      // Verify error message
      await expect(page.getByText('File must contain at least a header row and one data row')).toBeVisible();
    } finally {
      // Clean up
      if (fs.existsSync(emptyFile)) {
        fs.unlinkSync(emptyFile);
      }
    }
  });
}); 