const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Sample data for the template
const templateData = [
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
  },
  {
    'Event Name': 'Prone Match 1',
    'Match Number': '1',
    'Shooter Name': 'Jane Smith',
    'Club': 'SATRF Club B',
    'Division/Class': 'Junior',
    'Veteran': 'N',
    'Series 1': 95.2,
    'Series 2': 97.8,
    'Series 3': 96.5,
    'Series 4': 98.1,
    'Series 5': 94.9,
    'Series 6': 97.3,
    'Total': 579.8,
    'Place': 2
  }
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(templateData);

// Set column widths for better readability (adjusted for manual event entry)
const columnWidths = [
  { wch: 20 }, // Event Name (manual input - any text)
  { wch: 15 }, // Match Number
  { wch: 25 }, // Shooter Name
  { wch: 18 }, // Club
  { wch: 15 }, // Division/Class
  { wch: 10 }, // Veteran
  { wch: 12 }, // Series 1
  { wch: 12 }, // Series 2
  { wch: 12 }, // Series 3
  { wch: 12 }, // Series 4
  { wch: 12 }, // Series 5
  { wch: 12 }, // Series 6
  { wch: 12 }, // Total
  { wch: 10 }  // Place
];

worksheet['!cols'] = columnWidths;

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Score Import Template');

// Ensure the templates directory exists
const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Write the file
const outputPath = path.join(templatesDir, 'score-import-template.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Excel template generated successfully at: ${outputPath}`);
console.log('📋 Template includes:');
console.log('   - Correct column headers');
console.log('   - Sample data rows');
console.log('   - Proper column formatting');
console.log('   - Ready for production use'); 