# SATRF Interactive Events Calendar

## Overview

The SATRF Interactive Events Calendar is a comprehensive calendar system built with React, Next.js, and FullCalendar that displays both local SATRF events and international ISSF events. The calendar provides an intuitive interface for users to view, filter, and register for shooting competitions and training sessions.

## Features

### Core Functionality
- **Interactive Calendar Views**: Month, Week, and List views with smooth navigation
- **Event Filtering**: Filter by discipline (3P, Prone, Air Rifle, etc.), source (SATRF/ISSF), and status
- **Event Details**: Comprehensive event information with tabs for details, schedule, and registration
- **Direct Registration**: One-click registration for local SATRF events
- **Real-time Updates**: Live spot availability and registration status
- **Responsive Design**: Fully responsive across all device sizes

### Advanced Features
- **Calendar Export**: Export events to iCal format for external calendar applications
- **Social Sharing**: Share calendar links via native sharing or clipboard
- **Accessibility**: Full keyboard navigation and screen reader support
- **Dark Mode Support**: Automatic theme switching based on system preferences
- **Loading States**: Smooth loading indicators and error handling
- **User Authentication**: Integration with existing SATRF authentication system

### Event Management
- **Event Sources**: Distinguishes between SATRF local events and ISSF international events
- **Status Tracking**: Real-time event status (upcoming, ongoing, completed, cancelled)
- **Registration Management**: Track user registrations and spot availability
- **Contact Information**: Direct contact details for event organizers

## Technical Architecture

### Frontend Components

#### 1. EventsCalendar Component (`src/components/events/EventsCalendar.tsx`)
The main calendar component that integrates FullCalendar with SATRF branding.

**Key Features:**
- FullCalendar integration with custom styling
- Event filtering and view controls
- Modal-based event detail display
- Registration handling
- Responsive design

**Props:**
```typescript
interface EventsCalendarProps {
  events: Event[];
  onEventRegister?: (event: Event) => void;
  loading?: boolean;
  error?: string | null;
}
```

#### 2. Calendar Page (`src/pages/events/calendar.tsx`)
The main page that hosts the calendar with additional features.

**Key Features:**
- Event statistics dashboard
- Calendar export functionality
- Social sharing
- User registration tracking
- Upcoming events summary

#### 3. Events API Service (`src/lib/events.ts`)
Comprehensive API service for event management.

**Key Functions:**
- `getEvents()`: Fetch events with filters
- `registerForEvent()`: Register for an event
- `getUserRegistrations()`: Get user's event registrations
- `getISSFEvents()`: Fetch ISSF international events
- `getSATRFEvents()`: Fetch SATRF local events

### Data Models

#### Event Interface
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  category: string;
  discipline: string;
  price: number;
  maxSpots: number;
  currentSpots: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline: string;
  image?: string;
  requirements?: string[];
  schedule?: string[];
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  isLocal: boolean;
  source: 'satrf' | 'issf';
}
```

## Installation and Setup

### 1. Install Dependencies
```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list
```

### 2. Import Calendar Styles
Add the calendar CSS import to `src/styles/globals.css`:
```css
@import './calendar.css';
```

### 3. Environment Configuration
Ensure your `.env.local` file includes:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_VERSION=v1
```

### 4. Backend API Integration
The calendar expects the following API endpoints:

#### GET `/api/v1/events`
Fetch events with optional filters.

**Query Parameters:**
- `discipline`: Filter by discipline
- `category`: Filter by category
- `status`: Filter by status
- `source`: Filter by source (satrf/issf)
- `page`: Page number for pagination
- `limit`: Number of events per page

**Response:**
```json
{
  "events": [Event[]],
  "total": number,
  "page": number,
  "limit": number,
  "hasMore": boolean
}
```

#### POST `/api/v1/events/{eventId}/register`
Register for an event.

**Response:**
```json
{
  "eventId": string,
  "userId": string,
  "status": "registered" | "waitlist",
  "registeredAt": string
}
```

#### GET `/api/v1/events/registrations`
Get user's event registrations.

## Usage Guide

### Basic Implementation

#### 1. Import and Use Calendar Component
```tsx
import EventsCalendar from '@/components/events/EventsCalendar';
import { eventsAPI, MOCK_EVENTS } from '@/lib/events';

const MyCalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getEvents();
      setEvents(response.events);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegister = async (event) => {
    try {
      await eventsAPI.registerForEvent(event.id);
      // Handle successful registration
    } catch (error) {
      // Handle registration error
    }
  };

  return (
    <EventsCalendar
      events={events}
      onEventRegister={handleEventRegister}
      loading={loading}
      error={null}
    />
  );
};
```

#### 2. Custom Event Filtering
```tsx
const [filters, setFilters] = useState({
  discipline: 'Air Rifle',
  source: 'satrf',
  showCompleted: false
});

const filteredEvents = eventUtils.filterEvents(events, filters);
```

#### 3. Calendar Export
```tsx
const exportCalendar = () => {
  const icalContent = events
    .filter(event => event.status === 'upcoming')
    .map(event => {
      // Generate iCal format
    })
    .join('\n');
  
  // Create and download file
};
```

### Styling Customization

#### 1. SATRF Branding Colors
The calendar uses SATRF's color palette:
- **Primary Navy**: `#2C5282` (SATRF local events)
- **International Blue**: `#3182CE` (ISSF events)
- **Accent Red**: `#e53e3e` (cancelled events)
- **Success Green**: `#38A169` (ongoing events)
- **Neutral Gray**: `#718096` (completed events)

#### 2. Custom CSS Variables
```css
:root {
  --satrf-navy: #2C5282;
  --satrf-red: #e53e3e;
  --issf-blue: #3182CE;
  --font-oxanium: var(--font-oxanium);
}
```

#### 3. Responsive Breakpoints
- **Mobile**: `< 768px` - Stacked controls, smaller event text
- **Tablet**: `768px - 1024px` - Side-by-side controls
- **Desktop**: `> 1024px` - Full layout with hover effects

## Testing

### Running Tests
```bash
npm test src/__tests__/events/EventsCalendar.test.tsx
```

### Test Coverage
The test suite covers:
- Component rendering
- Event interactions
- Filtering functionality
- Registration flows
- Accessibility features
- Responsive design
- Error handling

### Manual Testing Checklist
- [ ] Calendar loads with events
- [ ] Month/Week/List view switching
- [ ] Event filtering by discipline and source
- [ ] Event detail modal opens correctly
- [ ] Registration flow works for authenticated users
- [ ] Calendar export generates valid iCal file
- [ ] Social sharing works on mobile devices
- [ ] Keyboard navigation functions properly
- [ ] Screen reader compatibility
- [ ] Responsive design on different screen sizes

## Accessibility Features

### Keyboard Navigation
- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and event selection
- **Arrow Keys**: Navigate calendar views
- **Escape**: Close modals

### Screen Reader Support
- **ARIA Labels**: All interactive elements have proper labels
- **Semantic HTML**: Proper heading structure and landmarks
- **Focus Management**: Logical tab order and focus indicators
- **Status Announcements**: Dynamic content changes are announced

### Color and Contrast
- **High Contrast**: All text meets WCAG AA standards
- **Color Independence**: Information is not conveyed by color alone
- **Focus Indicators**: Clear focus states for all interactive elements

## Performance Optimization

### 1. Event Virtualization
- Only render visible events in the calendar
- Lazy load event details when modal opens
- Implement pagination for large event lists

### 2. Caching Strategy
- Cache event data in React state
- Implement service worker for offline support
- Use React.memo for expensive components

### 3. Bundle Optimization
- Code split calendar components
- Lazy load FullCalendar plugins
- Tree shake unused calendar features

## Deployment Considerations

### 1. Environment Variables
```env
# Production
NEXT_PUBLIC_API_BASE_URL=https://api.satrf.org.za/api
NEXT_PUBLIC_API_VERSION=v1

# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_VERSION=v1
```

### 2. CDN Configuration
- Serve calendar assets from CDN
- Enable gzip compression for CSS/JS files
- Configure proper cache headers

### 3. Monitoring
- Track calendar usage analytics
- Monitor API response times
- Set up error tracking for calendar interactions

## Troubleshooting

### Common Issues

#### 1. Calendar Not Loading
**Symptoms**: Blank calendar area
**Solutions**:
- Check FullCalendar dependencies are installed
- Verify CSS imports are correct
- Check browser console for JavaScript errors

#### 2. Events Not Displaying
**Symptoms**: Calendar loads but no events shown
**Solutions**:
- Verify API endpoint is accessible
- Check event data format matches interface
- Ensure events have valid start/end dates

#### 3. Registration Not Working
**Symptoms**: Registration button doesn't respond
**Solutions**:
- Check user authentication status
- Verify API endpoint permissions
- Check network connectivity

#### 4. Styling Issues
**Symptoms**: Calendar doesn't match SATRF branding
**Solutions**:
- Verify calendar.css is imported
- Check CSS specificity conflicts
- Ensure Tailwind CSS is properly configured

### Debug Mode
Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

This will log detailed information about:
- Event loading
- Filtering operations
- Registration attempts
- API responses

## Future Enhancements

### Planned Features
1. **Recurring Events**: Support for weekly/monthly recurring events
2. **Event Reminders**: Email/SMS notifications for upcoming events
3. **Calendar Sync**: Integration with Google Calendar, Outlook
4. **Advanced Filtering**: Date range, location-based filtering
5. **Event Analytics**: Track event popularity and engagement
6. **Multi-language Support**: Internationalization for ISSF events

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live event updates
2. **Offline Support**: Service worker for offline calendar access
3. **Progressive Web App**: Installable calendar application
4. **Advanced Search**: Full-text search across event descriptions
5. **Event Recommendations**: AI-powered event suggestions

## Support and Maintenance

### Documentation Updates
- Keep this documentation updated with new features
- Maintain API endpoint documentation
- Update testing procedures as needed

### Regular Maintenance
- Update FullCalendar dependencies quarterly
- Monitor API performance and error rates
- Review and update accessibility compliance
- Test cross-browser compatibility

### Contact Information
For technical support or feature requests:
- **Email**: tech@satrf.org.za
- **GitHub**: Create issues in the SATRF repository
- **Documentation**: Refer to this guide and inline code comments

---

*Last updated: December 2024*
*Version: 1.0.0* 