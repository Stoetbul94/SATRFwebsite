# Admin Score Import & Entry System

## Overview

The Admin Score Import & Entry system provides a comprehensive interface for administrators to upload and manage shooting scores. It supports both file upload (Excel/CSV) and manual entry methods.

## Features

### 1. File Upload (Excel/CSV)
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **File Validation**: Supports .xlsx, .xls, and .csv formats
- **Data Preview**: View parsed data before importing
- **Error Detection**: Row-by-row validation with detailed error messages
- **Batch Import**: Import multiple scores at once

### 2. Manual Entry
- **Dynamic Table**: Add/remove rows as needed
- **Live Validation**: Real-time field validation with error indicators
- **Auto-calculation**: Total scores automatically calculated from series
- **Inline Editing**: Direct table editing for efficient data entry

### 3. Data Validation
- **Required Fields**: Event name, match number, shooter name, club, division, veteran status
- **Score Validation**: Series scores must be between 0.0 and 109.0
- **Total Verification**: Ensures total matches sum of series scores
- **Format Validation**: Validates event names, divisions, and veteran status

## File Format Requirements

### Excel/CSV Template
Download the template from `/admin/scores/template` to ensure correct formatting.

### Required Columns
| Column | Type | Required | Valid Values | Description |
|--------|------|----------|--------------|-------------|
| Event Name | Text | Yes | Prone Match 1, Prone Match 2, 3P, Air Rifle | Shooting event type |
| Match Number | Text | Yes | Any text | Unique match identifier |
| Shooter Name | Text | Yes | Any text | Full shooter name |
| Club | Text | Yes | Any text | Shooter's club/organization |
| Division/Class | Text | Yes | Open, Junior, Veteran, Master | Shooter's division |
| Veteran | Text | Yes | Y or N | Veteran status |
| Series 1-6 | Number | Yes | 0.0 - 109.0 | Individual series scores |
| Total | Number | Yes | Sum of Series 1-6 | Total score |
| Place | Number | No | 1, 2, 3, etc. | Finishing position |

## API Endpoints

### POST /api/admin/scores/import
Imports scores from either file upload or manual entry.

**Request Body:**
```json
{
  "scores": [
    {
      "eventName": "Prone Match 1",
      "matchNumber": "001",
      "shooterName": "John Doe",
      "club": "SATRF Club",
      "division": "Open",
      "veteran": false,
      "series1": 95.5,
      "series2": 96.2,
      "series3": 94.8,
      "series4": 97.1,
      "series5": 95.9,
      "series6": 96.5,
      "total": 576.0,
      "place": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 1 scores",
  "imported": 1,
  "errors": 0,
  "errorDetails": [],
  "backendResult": {}
}
```

## Routes

- `/admin/scores/import` - Main import page with tabs
- `/admin/scores/template` - Template download and format guidelines

## Components

### FileUploadComponent
Handles Excel/CSV file uploads with drag & drop functionality.

**Props:**
- `onImportSuccess`: Callback for successful imports
- `onImportError`: Callback for import errors
- `isLoading`: Loading state
- `setIsLoading`: Loading state setter

### ManualEntryComponent
Provides manual score entry with dynamic table rows.

**Props:**
- `onImportSuccess`: Callback for successful saves
- `onImportError`: Callback for save errors
- `isLoading`: Loading state
- `setIsLoading`: Loading state setter

## Validation Rules

### Score Validation
- Series scores: 0.0 ≤ score ≤ 109.0
- Total must equal sum of all series scores
- All scores must be finite numbers

### Field Validation
- Event names must match: Prone Match 1, Prone Match 2, 3P, Air Rifle
- Divisions must match: Open, Junior, Veteran, Master
- Veteran status must be: Y or N
- Required fields cannot be empty

### Error Handling
- Invalid rows are skipped during import
- Detailed error messages for each validation failure
- Success/error summaries after import completion

## Security Considerations

### Authentication
- TODO: Implement admin authentication middleware
- TODO: Add role-based access control
- TODO: Validate admin permissions

### Data Validation
- Server-side validation for all imported data
- Input sanitization to prevent injection attacks
- Rate limiting for API endpoints

## Testing

Run the test suite:
```bash
npm test admin-score-import.test.tsx
```

### Test Coverage
- Component rendering
- File upload functionality
- Manual entry validation
- API integration
- Error handling

## Dependencies

### Required Packages
- `xlsx`: Excel/CSV file parsing
- `@chakra-ui/react`: UI components
- `react-icons`: Icons
- `axios`: HTTP client (for backend integration)

### Installation
```bash
npm install xlsx
```

## Usage Examples

### File Upload
1. Navigate to `/admin/scores/import`
2. Click "Upload Excel/CSV" tab
3. Drag & drop file or click to browse
4. Review parsed data and validation errors
5. Click "Import" to save valid scores

### Manual Entry
1. Navigate to `/admin/scores/import`
2. Click "Manual Entry" tab
3. Click "Add Row" to add score entries
4. Fill in required fields
5. Series scores auto-calculate totals
6. Click "Save" to submit valid scores

### Template Download
1. Navigate to `/admin/scores/template`
2. Click "Download Template"
3. Fill in your data following the format
4. Upload the completed file

## Error Messages

### Common Validation Errors
- "Invalid or missing event name" - Event must match valid options
- "Missing match number" - Match number is required
- "Series X score must be between 0 and 109" - Score out of range
- "Total score doesn't match sum of series" - Calculation error
- "Veteran must be Y or N" - Invalid veteran status

### File Upload Errors
- "Please upload an Excel (.xlsx, .xls) or CSV file" - Wrong file type
- "File must contain at least a header row and one data row" - Empty file
- "Failed to parse file" - Corrupted or invalid file format

## Future Enhancements

### Planned Features
- Bulk score editing
- Score history and audit trail
- Advanced filtering and search
- Export functionality
- Real-time collaboration
- Mobile-responsive interface

### Performance Optimizations
- Lazy loading for large datasets
- Virtual scrolling for large tables
- Caching for frequently accessed data
- Background processing for large imports 