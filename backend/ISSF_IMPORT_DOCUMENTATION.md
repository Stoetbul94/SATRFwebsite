# ISSF Score Import Documentation

## Overview

The ISSF Score Import feature allows administrators to bulk import shooting match scores from Excel (.xlsx) or CSV files. This endpoint validates the data according to ISSF standards and stores valid scores in the database.

## Endpoint

**POST** `/scores/import-issf`

### Authentication
- **Required**: Admin access only
- **Authorization**: Bearer token with admin role

### File Requirements
- **Formats**: `.xlsx` or `.csv`
- **Encoding**: UTF-8 (for CSV files)
- **Size Limit**: Determined by server configuration

## Expected File Format

The uploaded file must contain the following columns in the exact order:

| Column Name | Type | Required | Validation Rules |
|-------------|------|----------|------------------|
| Event Name | String | Yes | Must be one of: "Prone Match 1", "Prone Match 2", "3P", "Air Rifle" |
| Match Number | Integer | Yes | Must be > 0 |
| Shooter Name | String | Yes | Non-empty string |
| Shooter ID | String | No | Optional identifier |
| Club | String | Yes | Non-empty string |
| Division/Class | String | No | Optional classification |
| Veteran | String | Yes | Must be "Y" or "N" |
| Series 1 | Float | Yes | 0.0 ≤ value ≤ 109.0 |
| Series 2 | Float | Yes | 0.0 ≤ value ≤ 109.0 |
| Series 3 | Float | Yes | 0.0 ≤ value ≤ 109.0 |
| Series 4 | Float | Yes | 0.0 ≤ value ≤ 109.0 |
| Series 5 | Float | Yes | 0.0 ≤ value ≤ 109.0 |
| Series 6 | Float | Yes | 0.0 ≤ value ≤ 109.0 |
| Total | Float | Yes | Must equal sum of Series 1-6 |
| Place | String | No | Optional ranking |

## Validation Rules

### Event Name Validation
Only the following event types are accepted:
- "Prone Match 1"
- "Prone Match 2" 
- "3P"
- "Air Rifle"

### Series Score Validation
- Each series score must be between 0.0 and 109.0 (inclusive)
- All six series are required
- Total must exactly match the sum of all series scores

### Data Integrity
- Shooter Name and Club cannot be empty
- Veteran status must be exactly "Y" or "N"
- Match Number must be a positive integer

## Response Format

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "ISSF scores import completed",
  "data": {
    "records_added": 4,
    "records_failed": 1,
    "errors": [
      {
        "row_number": 3,
        "field": "event_name",
        "error": "Event name must be one of: Prone Match 1, Prone Match 2, 3P, Air Rifle",
        "data": {
          "Event Name": "Invalid Event",
          "Match Number": 1,
          "Shooter Name": "John Doe",
          // ... other fields
        }
      }
    ],
    "summary": "Import completed: 4 records added, 1 records failed. 1 validation errors occurred."
  }
}
```

### Error Responses

#### 400 Bad Request
- Invalid file format
- Missing required columns
- File parsing errors

#### 403 Forbidden
- Non-admin user attempting import

#### 500 Internal Server Error
- Database connection issues
- Unexpected processing errors

## Example Usage

### cURL Example
```bash
curl -X POST "http://localhost:8000/scores/import-issf" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@scores.xlsx"
```

### Python Example
```python
import requests

url = "http://localhost:8000/scores/import-issf"
headers = {"Authorization": "Bearer YOUR_ADMIN_TOKEN"}

with open("scores.xlsx", "rb") as f:
    files = {"file": ("scores.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    response = requests.post(url, headers=headers, files=files)

print(response.json())
```

## Sample File Format

### Excel/CSV Header Row
```
Event Name,Match Number,Shooter Name,Shooter ID,Club,Division/Class,Veteran,Series 1,Series 2,Series 3,Series 4,Series 5,Series 6,Total,Place
```

### Sample Data Row
```
Prone Match 1,1,John Doe,SH001,Test Club,Senior,N,100.5,98.2,101.0,99.8,100.1,97.9,597.5,1
```

## Error Handling

### Row-Level Validation
- Each row is validated independently
- Invalid rows are skipped and reported in the errors array
- Valid rows are processed and stored
- The import continues even if some rows fail validation

### Error Reporting
- Row number (1-indexed, including header)
- Field name that failed validation
- Specific error message
- Complete row data for debugging

### Common Error Types
1. **Invalid Event Name**: Event not in allowed list
2. **Missing Required Fields**: Empty shooter name or club
3. **Invalid Series Scores**: Values outside 0.0-109.0 range
4. **Total Mismatch**: Total doesn't equal sum of series
5. **Invalid Veteran Status**: Not "Y" or "N"

## Database Storage

Imported scores are stored with the following additional metadata:
- `importedBy`: Admin user ID who performed the import
- `importedAt`: Timestamp of import
- `status`: Automatically set to "approved"
- `createdAt`/`updatedAt`: Standard timestamps

## Testing

### Sample Files
Use the provided sample files for testing:
- `sample_issf_scores.xlsx` - Valid data
- `sample_issf_scores.csv` - Valid data  
- `sample_invalid_issf_scores.xlsx` - Invalid data for error testing

### Running Tests
```bash
# Run the comprehensive test suite
pytest test_issf_import.py -v

# Generate sample files
python sample_issf_scores.py
```

## Security Considerations

- Admin-only access prevents unauthorized imports
- File type validation prevents malicious uploads
- Data validation ensures data integrity
- Import metadata tracks who performed each import

## Performance Notes

- Large files are processed row by row
- Memory usage scales with file size
- Database operations are performed individually per row
- Consider chunking very large files for better performance

## Troubleshooting

### Common Issues

1. **"Missing required columns"**
   - Ensure all 15 columns are present
   - Check column names match exactly (case-sensitive)

2. **"Event name must be one of"**
   - Verify event names match the allowed list exactly
   - Check for extra spaces or typos

3. **"Total does not match sum of series"**
   - Recalculate totals in your spreadsheet
   - Check for rounding errors

4. **"Series scores out of range"**
   - Ensure all series scores are between 0.0 and 109.0
   - Check for negative values or values over 109.0

### Debug Tips
- Use the sample files as templates
- Check the error response for specific row and field information
- Validate your data in Excel/CSV before uploading
- Use the test suite to verify your file format 