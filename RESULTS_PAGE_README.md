# SATRF Results Page

A comprehensive public-facing results page for SATRF matches built with Next.js and Tailwind CSS.

## Features

### Core Functionality
- **Route**: `/results`
- **Event Filtering**: Filter results by event type (e.g., "Prone Match 1", "3P")
- **Match Filtering**: Filter by match number
- **Sortable Tables**: Sort by Total, Place, or Name
- **Score Highlighting**: Personal bests and match bests are highlighted
- **Responsive Design**: Mobile-friendly with responsive table columns

### Data Structure
Each result includes:
- Place, Name, Club, Division, Veteran status
- Series 1-6 scores
- Total score
- Personal best and match best flags

### API Integration
- **Endpoint**: `/api/results`
- **Query Parameters**: 
  - `event`: Event name filter
  - `match`: Match number filter
- **Response Format**: JSON with success status and data array

### UI Components

#### Filters Section
- Event dropdown (All Events, Prone Match 1, 3P Match 1, etc.)
- Match number dropdown (All Matches, Match 1, Match 2, etc.)
- Clear filters button

#### Results Table
- Responsive columns (Club hidden on mobile, Division on tablet, Veteran on desktop)
- Sortable headers with visual indicators
- Alternating row colors
- Score highlighting for personal/match bests

#### Visual Indicators
- **Green highlighting**: Match best scores
- **Blue highlighting**: Personal best scores
- **Veteran badge**: Yellow badge for veteran shooters
- **Sort icons**: Chevron indicators for sortable columns

### Mobile Responsiveness
- Horizontal scroll for table on small screens
- Hidden columns on mobile (Club, Division, Veteran)
- Abbreviated column headers (S1, S2, etc.)
- Touch-friendly filter controls

### Error Handling
- Loading states with spinner
- Empty state with friendly message
- API error handling
- Graceful fallbacks

## Implementation Details

### Files Created
1. `src/pages/results.tsx` - Main results page component
2. `src/pages/api/results.ts` - API endpoint for fetching results
3. `src/__tests__/results.test.tsx` - Comprehensive test suite

### API Integration
- Uses `resultsAPI.getResults()` from `src/lib/api.ts`
- Handles query parameters for filtering
- Returns structured response with metadata

### Styling
- Tailwind CSS for responsive design
- Custom color scheme for highlighting
- Consistent with SATRF design system

## Testing

### Test Coverage
- Page rendering and header display
- Loading states
- API integration and error handling
- Filter functionality
- Sorting behavior
- Mobile responsiveness
- Score highlighting
- Veteran badge display

### Running Tests
```bash
npm test results.test.tsx
```

## Future Enhancements

### Potential Additions
- Export functionality (PDF/CSV)
- Advanced filtering (by date, club, division)
- Pagination for large result sets
- Real-time updates
- Historical result comparison
- Performance analytics
- Social sharing

### Database Integration
The API endpoint includes commented SQL query structure for easy database integration with:
- Results table
- Users table
- Events table
- Proper joins and filtering

## Usage

### Accessing the Page
Navigate to `/results` to view match results.

### Filtering Results
1. Select an event from the dropdown
2. Select a match number (optional)
3. Use the clear filters button to reset

### Sorting Results
Click on column headers (Name, Total) to sort results.

### Mobile Usage
The page automatically adapts to mobile screens with:
- Responsive table layout
- Touch-friendly controls
- Optimized column visibility 