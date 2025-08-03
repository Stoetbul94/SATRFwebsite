# SATRF Events Calendar Frontend Integration

## Overview

The SATRF Events Calendar is a comprehensive React-based calendar system that integrates with the FastAPI backend to provide an interactive events management experience. The system features real-time event data, user registration capabilities, advanced filtering, and responsive design.

## Features

### Core Functionality
- **Interactive Calendar Views**: Month, Week, and List views using FullCalendar
- **Real-time Event Data**: Integration with FastAPI backend for live event data
- **User Registration**: Register/unregister for events with authentication
- **Advanced Filtering**: Filter by discipline, source, status, date range, and search
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Accessibility**: ARIA attributes and keyboard navigation support

### Calendar Features
- **Event Display**: Color-coded events based on source (SATRF/ISSF) and status
- **Event Details Modal**: Comprehensive event information with tabs
- **Registration Management**: Real-time registration status and cancellation
- **Export/Share**: iCal export and social sharing capabilities
- **Pagination**: Load more events with infinite scroll support

## Architecture

### Component Structure
```
src/
├── components/events/
│   └── EventsCalendar.tsx          # Main calendar component
├── pages/events/
│   └── calendar.tsx                # Calendar page wrapper
├── lib/
│   └── events.ts                   # API utilities and types
└── __tests__/events/
    └── EventsCalendar.test.tsx     # Component tests
```

### Data Flow
1. **Page Load**: `calendar.tsx` fetches events from backend API
2. **User Interaction**: Events are filtered and displayed in `EventsCalendar`
3. **Registration**: User actions trigger API calls through `events.ts`
4. **State Management**: React state updates reflect changes in real-time

## Setup and Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend API running (FastAPI server)
- Environment variables configured

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_VERSION=v1
```

### Installation Steps
```bash
# Install dependencies
npm install

# Install calendar-specific dependencies
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list

# Start development server
npm run dev
```

## API Integration

### Backend Connection
The calendar integrates with the FastAPI backend through the `eventsAPI` utility:

```typescript
// src/lib/events.ts
export const eventsAPI = {
  getEvents: async (filters?: EventFilters, page?: number, limit?: number),
  registerForEvent: async (eventId: string),
  cancelRegistration: async (eventId: string),
  getUserRegistrations: async (),
  // ... other methods
};
```

### Authentication
- JWT tokens are automatically included in API requests
- Token refresh is handled automatically on 401 responses
- Unauthenticated users can view events but cannot register

### Error Handling
- Network errors fall back to mock data in development
- User-friendly error messages with toast notifications
- Graceful degradation when API is unavailable

## Component Usage

### Basic Calendar Implementation
```tsx
import EventsCalendar from '@/components/events/EventsCalendar';

function MyCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <EventsCalendar
      events={events}
      loading={loading}
      onEventRegister={handleRegister}
      onEventUnregister={handleUnregister}
    />
  );
}
```

### Advanced Usage with Filters
```tsx
function AdvancedCalendarPage() {
  const [filters, setFilters] = useState({});
  const [userRegistrations, setUserRegistrations] = useState([]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Trigger API call with new filters
  };

  return (
    <EventsCalendar
      events={events}
      filters={filters}
      onFiltersChange={handleFiltersChange}
      userRegistrations={userRegistrations}
      onEventRegister={handleRegister}
      onEventUnregister={handleUnregister}
    />
  );
}
```

## Event Data Structure

### Event Interface
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  start: string;                    // ISO date string
  end: string;                      // ISO date string
  location: string;
  category: string;
  discipline: string;               // 3P, Prone, Air Rifle, etc.
  price: number;
  maxSpots: number;
  currentSpots: number;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED';
  registrationDeadline: string;     // ISO date string
  source: 'SATRF' | 'ISSF';        // Event source
  isLocal: boolean;
  // Optional fields
  image?: string;
  requirements?: string[];
  schedule?: string[];
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}
```

### Filter Interface
```typescript
interface EventFilters {
  discipline?: string;              // Filter by discipline
  category?: string;                // Filter by category
  status?: string;                  // Filter by status
  source?: 'SATRF' | 'ISSF' | 'all'; // Filter by source
  location?: string;                // Search by location
  startDate?: string;               // Filter by start date
  endDate?: string;                 // Filter by end date
  showCompleted?: boolean;          // Show/hide completed events
}
```

## Styling and Theming

### SATRF Brand Colors
```css
/* Tailwind config */
colors: {
  satrf: {
    navy: '#2C5282',
    red: '#E53E3E',
    steel: '#4A5568',
  }
}
```

### Custom Calendar Styles
```css
/* src/styles/calendar.css */
.fc-event {
  border-radius: 4px;
  font-weight: 500;
}

.fc-event-satrf {
  background-color: #2C5282;
  border-color: #2C5282;
}

.fc-event-issf {
  background-color: #3182CE;
  border-color: #3182CE;
}
```

## Filtering and Search

### Available Filters
1. **Discipline**: 3P, Prone, Air Rifle, Air Pistol, Target Rifle
2. **Source**: SATRF (local), ISSF (international), or All
3. **Status**: Open, Full, Closed, Cancelled
4. **Date Range**: Start and end date filters
5. **Search**: Text search across title, description, and location
6. **Completed Events**: Toggle to show/hide completed events

### Filter Implementation
```typescript
// Filter events based on criteria
const filteredEvents = events.filter(event => {
  if (searchQuery && !event.title.toLowerCase().includes(searchQuery)) return false;
  if (filters.discipline && event.discipline !== filters.discipline) return false;
  if (filters.source && filters.source !== 'all' && event.source !== filters.source) return false;
  // ... additional filters
  return true;
});
```

## User Registration Flow

### Registration Process
1. **Authentication Check**: Verify user is logged in
2. **Event Validation**: Check if event is open and has available spots
3. **API Call**: Send registration request to backend
4. **State Update**: Update local state and refresh event data
5. **User Feedback**: Show success/error notifications

### Registration States
- **Not Registered**: Show "Register for Event" button
- **Registered**: Show "You are registered" message with cancel option
- **Event Full**: Show "Event is full" message
- **Registration Closed**: Show "Registration closed" message

## Responsive Design

### Breakpoint Strategy
- **Mobile (< 768px)**: Stacked layout, simplified filters
- **Tablet (768px - 1024px)**: Side-by-side layout, expanded filters
- **Desktop (> 1024px)**: Full layout with all features

### Mobile Optimizations
- Touch-friendly event interactions
- Swipe gestures for calendar navigation
- Collapsible filter panels
- Optimized modal layouts

## Accessibility Features

### ARIA Support
- Proper ARIA labels for interactive elements
- Screen reader support for event information
- Keyboard navigation for all interactive elements

### Keyboard Navigation
- Tab navigation through calendar controls
- Enter/Space to select events
- Escape to close modals
- Arrow keys for date navigation

## Testing

### Test Coverage
- Component rendering and interactions
- API integration and error handling
- Filter functionality and search
- User registration flows
- Accessibility compliance
- Responsive design behavior

### Running Tests
```bash
# Run all tests
npm test

# Run calendar-specific tests
npm test EventsCalendar

# Run with coverage
npm test -- --coverage
```

## Performance Optimization

### Loading Strategies
- **Lazy Loading**: Load events in batches with pagination
- **Caching**: Cache event data to reduce API calls
- **Debouncing**: Debounce search input to reduce API requests
- **Memoization**: Memoize expensive calculations

### Bundle Optimization
- **Code Splitting**: Separate calendar components
- **Tree Shaking**: Remove unused FullCalendar plugins
- **Image Optimization**: Optimize event images

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- Fallback to cached data when available
- User-friendly error messages
- Graceful degradation to mock data

### User Errors
- Form validation with helpful messages
- Registration deadline validation
- Duplicate registration prevention
- Conflict resolution for concurrent updates

## Deployment

### Build Process
```bash
# Build for production
npm run build

# Export static files (if needed)
npm run export
```

### Environment Configuration
```bash
# Production environment variables
NEXT_PUBLIC_API_BASE_URL=https://api.satrf.org.za/api
NEXT_PUBLIC_API_VERSION=v1
NODE_ENV=production
```

### CDN and Caching
- Static assets served from CDN
- API responses cached appropriately
- Service worker for offline functionality

## Troubleshooting

### Common Issues

#### Calendar Not Loading
- Check API endpoint configuration
- Verify authentication tokens
- Check browser console for errors
- Ensure FullCalendar dependencies are installed

#### Events Not Displaying
- Verify event data format matches interface
- Check date format (ISO strings required)
- Ensure events have valid start/end dates
- Check filter settings

#### Registration Not Working
- Verify user authentication
- Check event status and availability
- Ensure API endpoints are accessible
- Check network connectivity

#### Styling Issues
- Verify Tailwind CSS is properly configured
- Check custom CSS imports
- Ensure theme colors are defined
- Test on different screen sizes

### Debug Mode
```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Calendar Debug:', { events, filters, userRegistrations });
}
```

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live event updates
- **Advanced Search**: Full-text search with filters
- **Event Recommendations**: AI-powered event suggestions
- **Social Features**: Event sharing and comments
- **Offline Support**: Service worker for offline access
- **Analytics**: Event engagement tracking

### Performance Improvements
- **Virtual Scrolling**: For large event lists
- **Image Optimization**: Lazy loading and compression
- **Bundle Splitting**: Further code optimization
- **Caching Strategy**: Advanced caching mechanisms

## Contributing

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Maintain accessibility standards
- Document new features
- Follow the existing code style

### Code Review Checklist
- [ ] Component renders correctly
- [ ] Tests pass and cover new functionality
- [ ] Accessibility requirements met
- [ ] Responsive design verified
- [ ] Error handling implemented
- [ ] Performance impact assessed

## Support

### Documentation
- [Backend API Documentation](../backend/EVENTS_API_DOCUMENTATION.md)
- [Frontend Authentication Guide](FRONTEND_AUTHENTICATION_README.md)
- [Component Library Documentation](../docs/components.md)

### Contact
- **Technical Issues**: Create an issue in the repository
- **Feature Requests**: Submit through the project board
- **General Questions**: Contact the development team

---

*This documentation covers the complete integration of the SATRF Events Calendar with the FastAPI backend. For specific implementation details, refer to the individual component files and API documentation.* 