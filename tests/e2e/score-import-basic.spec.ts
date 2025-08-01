import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Simple test data
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

test.describe('Basic Score Import Tests', () => {
  let validExcelFile: string;

  test.beforeAll(async () => {
    // Create test file
    validExcelFile = createTestFile(VALID_SCORE_DATA, 'test-scores.xlsx');
  });

  test.afterAll(async () => {
    // Clean up test file
    if (fs.existsSync(validExcelFile)) {
      fs.unlinkSync(validExcelFile);
    }
  });

  test('should load admin import page', async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin',
        name: 'Admin User'
      }));
      localStorage.setItem('authToken', 'mock-admin-token');
    });

    // Navigate to admin score import page
    await page.goto('/admin/scores/import');
    
    // Verify we're on the correct page
    await expect(page.getByText('Admin Score Import & Entry')).toBeVisible();
    
    // Verify file upload area is present
    await expect(page.getByText('Drag & drop Excel/CSV file here')).toBeVisible();
    
    // Verify file input exists
    await expect(page.locator('#file-input')).toBeVisible();
  });

  test('should upload and process Excel file', async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin',
        name: 'Admin User'
      }));
      localStorage.setItem('authToken', 'mock-admin-token');
    });

    // Mock API responses
    await page.route('**/api/admin/scores/import', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Successfully imported 1 scores',
          data: {
            imported: 1,
            errors: 0
          }
        })
      });
    });

    await page.route('**/api/results**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      });
    });

    // Navigate to admin score import page
    await page.goto('/admin/scores/import');
    
    // Upload Excel file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed (look for "1 rows parsed" text)
    await page.waitForSelector('text=1 rows parsed', { timeout: 10000 });

    // Verify the file was processed
    await expect(page.getByText('1 rows parsed')).toBeVisible();
    
    // Verify import button is available
    await expect(page.getByRole('button', { name: /import 1 valid scores/i })).toBeVisible();
  });

  test('should show preview modal', async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin',
        name: 'Admin User'
      }));
      localStorage.setItem('authToken', 'mock-admin-token');
    });

    // Navigate to admin score import page
    await page.goto('/admin/scores/import');
    
    // Upload Excel file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await page.waitForSelector('text=1 rows parsed', { timeout: 10000 });

    // Click preview button
    await page.getByRole('button', { name: /preview data/i }).click();
    
    // Verify preview modal opens
    await expect(page.getByText('Data Preview')).toBeVisible();
    
    // Verify data is shown in preview
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
  });

  test('should handle import process', async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin_user_id',
        email: 'admin@satrf.com',
        role: 'admin',
        name: 'Admin User'
      }));
      localStorage.setItem('authToken', 'mock-admin-token');
    });

    // Mock API responses
    await page.route('**/api/admin/scores/import', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Successfully imported 1 scores',
          data: {
            imported: 1,
            errors: 0
          }
        })
      });
    });

    // Navigate to admin score import page
    await page.goto('/admin/scores/import');
    
    // Upload Excel file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await page.waitForSelector('text=1 rows parsed', { timeout: 10000 });

    // Click import button
    await page.getByRole('button', { name: /import 1 valid scores/i }).click();
    
    // Wait for success message
    await page.waitForSelector('text=Import Successful', { timeout: 10000 });
    
    // Verify success message
    await expect(page.getByText('Import Successful')).toBeVisible();
  });
}); 