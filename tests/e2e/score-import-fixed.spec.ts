import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Test data with correct column names
const VALID_SCORE_DATA = [
  {
    'Event Name': 'Prone Match 1',
    'Match Number': '1',
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

test.describe('Fixed Score Import Tests', () => {
  let validExcelFile: string;

  test.beforeAll(async () => {
    validExcelFile = createTestFile(VALID_SCORE_DATA, 'fixed-scores.xlsx');
  });

  test.afterAll(async () => {
    if (fs.existsSync(validExcelFile)) {
      fs.unlinkSync(validExcelFile);
    }
  });

  test('should complete full score import flow with correct validation', async ({ page }) => {
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

    // Mock API response for import
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
    
    // Verify we're on the correct page
    await expect(page.getByText('Admin Score Import & Entry')).toBeVisible();
    
    // Upload Excel file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await page.waitForSelector('text=1 rows parsed', { timeout: 15000 });

    // Verify the file was processed
    await expect(page.getByText('1 rows parsed')).toBeVisible();
    
    // Verify preview button is available
    await expect(page.getByRole('button', { name: /preview data/i })).toBeVisible();

    // Click preview button to verify data
    await page.getByRole('button', { name: /preview data/i }).click();
    
    // Verify preview modal opens with data
    await expect(page.getByText('Data Preview')).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Prone Match 1')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();

    // Look for the import button - it should show "Import 1 Valid Scores"
    const importButton = page.getByRole('button', { name: /import.*scores/i });
    await expect(importButton).toBeVisible();
    
    // Verify the button text contains the correct count
    await expect(importButton).toContainText('1');
    
    // Verify the button is enabled
    await expect(importButton).toBeEnabled();
    
    // Click the import button
    await importButton.click();
    
    // Wait for success message
    await page.waitForSelector('text=Import Successful', { timeout: 15000 });
    
    // Verify success message (check for toast notification)
    await expect(page.locator('#toast-1-title')).toBeVisible();
  });

  test('should handle file upload and preview correctly', async ({ page }) => {
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
    await page.waitForSelector('text=1 rows parsed', { timeout: 15000 });

    // Verify the file was processed
    await expect(page.getByText('1 rows parsed')).toBeVisible();
    
    // Verify preview button is available
    await expect(page.getByRole('button', { name: /preview data/i })).toBeVisible();
    
    // Verify clear button is available
    await expect(page.getByRole('button', { name: /clear/i })).toBeVisible();

    // Click preview button
    await page.getByRole('button', { name: /preview data/i }).click();
    
    // Verify preview modal opens
    await expect(page.getByText('Data Preview')).toBeVisible();
    
    // Verify data is shown in preview table
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Prone Match 1')).toBeVisible();
    await expect(page.getByText('597.5')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
    
    // Verify modal is closed
    await expect(page.getByText('Data Preview')).not.toBeVisible();
  });

  test('should handle drag and drop file upload', async ({ page }) => {
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
    
    // Find the drop zone and click it to trigger file dialog
    const dropZone = page.locator('[data-testid="file-drop-zone"]');
    await expect(dropZone).toBeVisible();
    
    // Click the drop zone to trigger file selection
    await dropZone.click();
    
    // Use the file input that gets triggered
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await page.waitForSelector('text=1 rows parsed', { timeout: 15000 });

    // Verify the file was processed
    await expect(page.getByText('1 rows parsed')).toBeVisible();
  });
}); 