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

test.describe('Working Score Import Tests', () => {
  let validExcelFile: string;

  test.beforeAll(async () => {
    // Create test file
    validExcelFile = createTestFile(VALID_SCORE_DATA, 'working-test-scores.xlsx');
  });

  test.afterAll(async () => {
    // Clean up test file
    if (fs.existsSync(validExcelFile)) {
      fs.unlinkSync(validExcelFile);
    }
  });

  test('should load admin import page and verify UI elements', async ({ page }) => {
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
    
    // Verify file input exists (it's hidden but should be present)
    await expect(page.locator('#file-input')).toBeAttached();
    
    // Verify tabs are present
    await expect(page.getByText('Upload Excel/CSV')).toBeVisible();
    await expect(page.getByText('Manual Entry')).toBeVisible();
  });

  test('should upload file and see processing results', async ({ page }) => {
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
    
    // Upload Excel file using the hidden input
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed - look for the file name first
    await page.waitForSelector(`text=working-test-scores.xlsx`, { timeout: 10000 });

    // Then wait for the rows parsed text
    await page.waitForSelector('text=1 rows parsed', { timeout: 10000 });

    // Verify the file was processed
    await expect(page.getByText('1 rows parsed')).toBeVisible();
    
    // Verify preview button is available
    await expect(page.getByRole('button', { name: /preview data/i })).toBeVisible();
    
    // Verify clear button is available
    await expect(page.getByRole('button', { name: /clear/i })).toBeVisible();
  });

  test('should show preview modal with data', async ({ page }) => {
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
    
    // Verify data is shown in preview table
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Prone Match 1')).toBeVisible();
    await expect(page.getByText('597.5')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
    
    // Verify modal is closed
    await expect(page.getByText('Data Preview')).not.toBeVisible();
  });

  test('should show import button after file processing', async ({ page }) => {
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
    
    // Upload Excel file
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await page.waitForSelector('text=1 rows parsed', { timeout: 10000 });

    // Look for the import button - it should show "Import 1 Valid Scores"
    const importButton = page.getByRole('button', { name: /import.*valid scores/i });
    await expect(importButton).toBeVisible();
    
    // Verify the button text contains the correct count
    await expect(importButton).toContainText('1');
  });

  test('should handle file upload with drag and drop', async ({ page }) => {
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
    
    // Find the drop zone
    const dropZone = page.locator('[data-testid="file-drop-zone"]');
    await expect(dropZone).toBeVisible();
    
    // Simulate drag and drop
    await dropZone.setInputFiles(validExcelFile);

    // Wait for file to be processed
    await page.waitForSelector('text=1 rows parsed', { timeout: 10000 });

    // Verify the file was processed
    await expect(page.getByText('1 rows parsed')).toBeVisible();
  });
}); 