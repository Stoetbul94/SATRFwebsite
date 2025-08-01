import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

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
  },
  {
    'Event Name': 'Prone Match 1',
    'Match Number': 1,
    'Shooter Name': 'John Doe',
    'Club': 'Test Club',
    'Division/Class': 'Open',
    'Veteran': 'Maybe', // Invalid veteran status
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
    // Step 1: Login as admin
    await page.goto('/login');
    
    // Mock admin login
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin'
      }));
    });

    // Navigate to admin score import page
    await page.goto('/admin/scores/import');
    
    // Verify we're on the correct page
    await expect(page.getByText('Admin Score Import & Entry')).toBeVisible();
    await expect(page.getByText('Upload Excel/CSV files or manually enter scores for matches')).toBeVisible();

    // Step 2: Upload a valid Excel file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await expect(page.getByText('3 rows parsed')).toBeVisible();

    // Step 3: Verify preview table shows all rows
    await page.getByRole('button', { name: /preview data/i }).click();
    
    // Check preview modal
    await expect(page.getByText('Data Preview')).toBeVisible();
    
    // Verify all rows are shown in preview
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('Bob Johnson')).toBeVisible();
    
    // Verify scores are displayed
    await expect(page.getByText('597.5')).toBeVisible();
    await expect(page.getByText('575.5')).toBeVisible();
    await expect(page.getByText('560.4')).toBeVisible();
    
    // Close preview modal
    await page.getByRole('button', { name: /close/i }).click();

    // Step 4: Click "Import" and check for success message
    await page.getByRole('button', { name: /import 3 valid scores/i }).click();
    
    // Wait for import to complete
    await expect(page.getByText('Import Successful')).toBeVisible();
    await expect(page.getByText('Successfully imported 3 scores')).toBeVisible();

    // Step 5: Go to /results and verify imported data displays correctly
    await page.goto('/results');
    
    // Wait for results to load
    await expect(page.getByText('Match Results')).toBeVisible();
    
    // Verify imported data is displayed
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('Bob Johnson')).toBeVisible();
    
    // Verify scores are displayed
    await expect(page.getByText('597.5')).toBeVisible();
    await expect(page.getByText('575.5')).toBeVisible();
    await expect(page.getByText('560.4')).toBeVisible();
    
    // Verify event names are displayed
    await expect(page.getByText('Prone Match 1')).toBeVisible();
    await expect(page.getByText('Air Rifle')).toBeVisible();
    await expect(page.getByText('3P')).toBeVisible();
  });

  test('should handle invalid file upload correctly', async ({ page }) => {
    // Login as admin
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin'
      }));
    });

    await page.goto('/admin/scores/import');

    // Upload invalid Excel file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidExcelFile);

    // Wait for file to be processed
    await expect(page.getByText('3 rows parsed')).toBeVisible();

    // Verify validation errors are shown
    await expect(page.getByText('Found 3 validation errors:')).toBeVisible();
    await expect(page.getByText('Invalid or missing event name')).toBeVisible();
    await expect(page.getByText('Missing shooter name')).toBeVisible();
    await expect(page.getByText('Veteran must be Y or N')).toBeVisible();

    // Check that import button shows 0 valid scores
    await expect(page.getByText('Import 0 Valid Scores')).toBeVisible();
    
    // Verify import button is disabled
    await expect(page.getByRole('button', { name: /import 0 valid scores/i })).toBeDisabled();
  });

  test('should handle file upload with mixed valid and invalid data', async ({ page }) => {
    // Create mixed data file
    const mixedData = [
      ...VALID_SCORE_DATA.slice(0, 1), // One valid row
      ...INVALID_SCORE_DATA.slice(0, 1) // One invalid row
    ];
    const mixedFile = createTestFile(mixedData, 'mixed-scores.xlsx');

    try {
      // Login as admin
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          id: 'admin_user_id',
          email: 'admin@satrf.com',
          role: 'admin'
        }));
      });

      await page.goto('/admin/scores/import');

      // Upload mixed data file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(mixedFile);

      // Wait for file to be processed
      await expect(page.getByText('2 rows parsed')).toBeVisible();

      // Verify validation errors are shown
      await expect(page.getByText('Found 1 validation errors:')).toBeVisible();

      // Check that import button shows 1 valid score
      await expect(page.getByText('Import 1 Valid Scores')).toBeVisible();

      // Import the valid scores
      await page.getByRole('button', { name: /import 1 valid scores/i }).click();

      // Wait for import to complete
      await expect(page.getByText('Import Completed with Errors')).toBeVisible();
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

  test('should handle drag and drop file upload', async ({ page }) => {
    // Login as admin
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin'
      }));
    });

    await page.goto('/admin/scores/import');

    // Get the drop zone
    const dropZone = page.locator('[data-testid="file-drop-zone"]').first();

    // Create a file object for drag and drop
    const fileBuffer = fs.readFileSync(validExcelFile);
    const file = {
      name: 'valid-scores.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: fileBuffer
    };

    // Perform drag and drop
    await dropZone.dispatchEvent('drop', {
      dataTransfer: {
        files: [file]
      }
    });

    // Verify file was uploaded
    await expect(page.getByText('valid-scores.xlsx')).toBeVisible();
    await expect(page.getByText('3 rows parsed')).toBeVisible();
  });

  test('should handle unsupported file type', async ({ page }) => {
    // Login as admin
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin'
      }));
    });

    await page.goto('/admin/scores/import');

    // Create a text file (unsupported)
    const textFile = path.join(__dirname, 'unsupported.txt');
    fs.writeFileSync(textFile, 'This is not a valid score file');

    try {
      // Try to upload unsupported file
      const fileInput = page.locator('input[type="file"]');
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
    // Login as admin
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin'
      }));
    });

    await page.goto('/admin/scores/import');

    // Create an empty Excel file
    const emptyData: any[] = [];
    const emptyFile = createTestFile(emptyData, 'empty-scores.xlsx');

    try {
      // Upload empty file
      const fileInput = page.locator('input[type="file"]');
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

  test('should handle network errors during import', async ({ page }) => {
    // Login as admin
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin'
      }));
    });

    await page.goto('/admin/scores/import');

    // Mock network error
    await page.route('**/api/admin/scores/import', route => {
      route.abort('failed');
    });

    // Upload valid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await expect(page.getByText('3 rows parsed')).toBeVisible();

    // Try to import
    await page.getByRole('button', { name: /import 3 valid scores/i }).click();

    // Verify error message
    await expect(page.getByText('Import Failed')).toBeVisible();
  });

  test('should handle large file upload', async ({ page }) => {
    // Login as admin
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin'
      }));
    });

    await page.goto('/admin/scores/import');

    // Create a large dataset (100 rows)
    const largeData = Array.from({ length: 100 }, (_, i) => ({
      'Event Name': 'Prone Match 1',
      'Match Number': 1,
      'Shooter Name': `Shooter ${i + 1}`,
      'Club': `Club ${i + 1}`,
      'Division/Class': 'Open',
      'Veteran': 'N',
      'Series 1': 100.0,
      'Series 2': 99.0,
      'Series 3': 98.0,
      'Series 4': 97.0,
      'Series 5': 96.0,
      'Series 6': 95.0,
      'Total': 585.0,
      'Place': i + 1
    }));

    const largeFile = createTestFile(largeData, 'large-scores.xlsx');

    try {
      // Upload large file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(largeFile);

      // Wait for file to be processed
      await expect(page.getByText('100 rows parsed')).toBeVisible();

      // Verify import button shows correct count
      await expect(page.getByText('Import 100 Valid Scores')).toBeVisible();

      // Import the scores
      await page.getByRole('button', { name: /import 100 valid scores/i }).click();

      // Wait for import to complete
      await expect(page.getByText('Import Successful')).toBeVisible();
      await expect(page.getByText('Successfully imported 100 scores')).toBeVisible();

      // Verify results page shows the data
      await page.goto('/results');
      await expect(page.getByText('Shooter 1')).toBeVisible();
      await expect(page.getByText('Shooter 100')).toBeVisible();

    } finally {
      // Clean up
      if (fs.existsSync(largeFile)) {
        fs.unlinkSync(largeFile);
      }
    }
  });
}); 