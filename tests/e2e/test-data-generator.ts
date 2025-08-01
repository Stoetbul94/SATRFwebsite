const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

interface ScoreData {
  eventName: string;
  matchNumber: string;
  shooterName: string;
  club: string;
  division: string;
  veteran: string;
  series1: number;
  series2: number;
  series3: number;
  series4: number;
  series5: number;
  series6: number;
  total: number;
  place: number;
}

// Valid test data
const VALID_SCORE_DATA: ScoreData[] = [
  {
    eventName: 'Prone Match 1',
    matchNumber: '1',
    shooterName: 'John Smith',
    club: 'SATRF Club A',
    division: 'Open',
    veteran: 'No',
    series1: 98,
    series2: 99,
    series3: 97,
    series4: 100,
    series5: 98,
    series6: 99,
    total: 591,
    place: 1
  },
  {
    eventName: 'Prone Match 1',
    matchNumber: '1',
    shooterName: 'Sarah Johnson',
    club: 'SATRF Club B',
    division: 'Open',
    veteran: 'No',
    series1: 97,
    series2: 98,
    series3: 96,
    series4: 99,
    series5: 97,
    series6: 98,
    total: 585,
    place: 2
  },
  {
    eventName: 'Prone Match 1',
    matchNumber: '1',
    shooterName: 'Mike Brown',
    club: 'SATRF Club C',
    division: 'Veteran',
    veteran: 'Yes',
    series1: 96,
    series2: 97,
    series3: 95,
    series4: 98,
    series5: 96,
    series6: 97,
    total: 579,
    place: 3
  },
  {
    eventName: '3P Match 1',
    matchNumber: '1',
    shooterName: 'Alex Wilson',
    club: 'SATRF Club A',
    division: 'Junior',
    veteran: 'No',
    series1: 95,
    series2: 96,
    series3: 94,
    series4: 97,
    series5: 95,
    series6: 96,
    total: 573,
    place: 1
  },
  {
    eventName: '3P Match 1',
    matchNumber: '1',
    shooterName: 'Emma Davis',
    club: 'SATRF Club D',
    division: 'Junior',
    veteran: 'No',
    series1: 94,
    series2: 95,
    series3: 93,
    series4: 96,
    series5: 94,
    series6: 95,
    total: 567,
    place: 2
  }
];

// Invalid test data with various errors
const INVALID_SCORE_DATA: ScoreData[] = [
  {
    eventName: 'Invalid Event', // Invalid event name
    matchNumber: '1',
    shooterName: 'Test Shooter',
    club: 'Test Club',
    division: 'Invalid Division', // Invalid division
    veteran: 'Maybe', // Invalid veteran status
    series1: 150, // Invalid score > 109
    series2: -5, // Invalid negative score
    series3: 98,
    series4: 99,
    series5: 100,
    series6: 97,
    total: 647, // Incorrect total
    place: 1
  },
  {
    eventName: 'Prone Match 1',
    matchNumber: '', // Missing match number
    shooterName: '', // Missing shooter name
    club: 'Test Club',
    division: 'Open',
    veteran: 'No',
    series1: 98,
    series2: 99,
    series3: 97,
    series4: 100,
    series5: 98,
    series6: 99,
    total: 591,
    place: 2
  }
];

// Large dataset for performance testing
const LARGE_SCORE_DATA: ScoreData[] = Array.from({ length: 100 }, (_, index) => ({
  eventName: index % 2 === 0 ? 'Prone Match 1' : '3P Match 1',
  matchNumber: '1',
  shooterName: `Shooter ${index + 1}`,
  club: `Club ${String.fromCharCode(65 + (index % 5))}`,
  division: ['Open', 'Junior', 'Veteran', 'Master'][index % 4],
  veteran: index % 3 === 0 ? 'Yes' : 'No',
  series1: 90 + (index % 20),
  series2: 91 + (index % 19),
  series3: 89 + (index % 21),
  series4: 92 + (index % 18),
  series5: 90 + (index % 20),
  series6: 91 + (index % 19),
  total: 540 + (index % 60),
  place: index + 1
}));

function createExcelFile(data: ScoreData[], filename: string): string {
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
  
  // Write to file
  const filePath = path.join(__dirname, '..', '..', 'test-files', filename);
  XLSX.writeFile(workbook, filePath);
  
  return filePath;
}

function createTestFiles(): void {
  // Ensure test-files directory exists
  const testFilesDir = path.join(__dirname, '..', '..', 'test-files');
  try {
    fs.mkdirSync(testFilesDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Create valid test file
  createExcelFile(VALID_SCORE_DATA, 'valid-scores.xlsx');
  console.log('✅ Created valid-scores.xlsx');
  
  // Create invalid test file
  createExcelFile(INVALID_SCORE_DATA, 'invalid-scores.xlsx');
  console.log('✅ Created invalid-scores.xlsx');
  
  // Create large test file
  createExcelFile(LARGE_SCORE_DATA, 'large-scores.xlsx');
  console.log('✅ Created large-scores.xlsx');
  
  // Create file with wrong headers
  const wrongHeadersData = VALID_SCORE_DATA.map(score => ({
    'Event': score.eventName,
    'Match': score.matchNumber,
    'Name': score.shooterName,
    'Club': score.club,
    'Class': score.division,
    'Vet': score.veteran,
    'S1': score.series1,
    'S2': score.series2,
    'S3': score.series3,
    'S4': score.series4,
    'S5': score.series5,
    'S6': score.series6,
    'Total': score.total,
    'Position': score.place
  }));
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(wrongHeadersData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
  XLSX.writeFile(workbook, path.join(testFilesDir, 'wrong-headers.xlsx'));
  console.log('✅ Created wrong-headers.xlsx');
  
  // Create empty file
  const emptyWorkbook = XLSX.utils.book_new();
  const emptyWorksheet = XLSX.utils.json_to_sheet([]);
  XLSX.utils.book_append_sheet(emptyWorkbook, emptyWorksheet, 'Scores');
  XLSX.writeFile(emptyWorkbook, path.join(testFilesDir, 'empty-scores.xlsx'));
  console.log('✅ Created empty-scores.xlsx');
  
  console.log('\n🎯 Test files created successfully!');
  console.log('📁 Location: tests/test-files/');
}

// Export functions for use in tests
module.exports = {
  VALID_SCORE_DATA,
  INVALID_SCORE_DATA,
  LARGE_SCORE_DATA,
  createExcelFile,
  createTestFiles
};

// Run if called directly
if (require.main === module) {
  createTestFiles();
} 