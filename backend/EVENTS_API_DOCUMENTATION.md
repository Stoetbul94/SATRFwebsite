# SATRF Events API Documentation

## Overview

The SATRF Events API provides comprehensive event management functionality for the South African Target Rifle Federation. This API allows users to create, manage, and register for shooting events, with support for both local SATRF events and international ISSF events.

## Base URL

```
https://api.satrf.org.za/api/v1
```

## Authentication

All endpoints require JWT-based authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Data Models

### Event Model

```typescript
interface Event {
  id: string;
  title: string;                    // Event title (3-200 characters)
  description?: string;             // Event description (max 1000 characters)
  start: string;                    // Event start date and time (ISO 8601)
  end: string;                      // Event end date and time (ISO 8601)
  location: string;                 // Event location (2-200 characters)
  discipline: EventDiscipline;      // Shooting discipline
  category: string;                 // Event category (Senior, Junior, etc.)
  price: number;                    // Event price
  maxSpots?: number;                // Maximum number of participants
  currentSpots: number;             // Current number of registered participants
  status: EventStatus;              // Event status
  registrationDeadline: string;     // Registration deadline (ISO 8601)
  image?: string;                   // URL to event image
  requirements?: string[];          // Event requirements
  schedule?: string[];              // Event schedule
  contactInfo?: {                   // Contact information
    name: string;
    email: string;
    phone: string;
  };
  isLocal: boolean;                 // Whether this is a local SATRF event
  source: EventSource;              // Event source (SATRF or ISSF)
  createdAt: string;                // Creation timestamp (ISO 8601)
  updatedAt?: string;               // Last update timestamp (ISO 8601)
}
```

### Event Disciplines

```typescript
enum EventDiscipline {
  THREE_POSITION = "3P";
  PRONE = "Prone";
  AIR_RIFLE = "Air Rifle";
  AIR_PISTOL = "Air Pistol";
  TARGET_RIFLE = "Target Rifle";
}
```

### Event Status

```typescript
enum EventStatus {
  UPCOMING = "upcoming";
  ONGOING = "ongoing";
  COMPLETED = "completed";
  CANCELLED = "cancelled";
  OPEN = "open";
  FULL = "full";
  CLOSED = "closed";
}
```

### Event Source

```typescript
enum EventSource {
  SATRF = "satrf";
  ISSF = "issf";
}
```

### Event Registration Model

```typescript
interface EventRegistration {
  eventId: string;
  userId: string;
  status: string;                   // "registered", "waitlist", "cancelled"
  registeredAt: string;             // Registration timestamp (ISO 8601)
  paymentStatus?: string;           // "pending", "paid", "refunded"
  confirmationNumber?: string;      // Unique confirmation number
  paymentMethod?: string;           // Payment method used
  specialRequirements?: string;     // Special requirements
}
```

## Endpoints

### 1. Create Event

**POST** `/events/`

Create a new event (Admin only).

**Request Body:**
```json
{
  "title": "SATRF National Championship 2024",
  "description": "The premier target rifle shooting championship of the year",
  "start": "2024-03-15T08:00:00Z",
  "end": "2024-03-17T18:00:00Z",
  "location": "Johannesburg Shooting Range",
  "discipline": "Target Rifle",
  "category": "Senior",
  "price": 500.0,
  "maxSpots": 50,
  "status": "upcoming",
  "registrationDeadline": "2024-03-01T23:59:59Z",
  "image": "/images/events/national-championship.jpg",
  "requirements": [
    "Valid shooting license",
    "Minimum 6 months experience",
    "Own equipment"
  ],
  "schedule": [
    "Day 1: Registration and Practice (8:00 AM - 5:00 PM)",
    "Day 2: Qualification Rounds (7:00 AM - 6:00 PM)",
    "Day 3: Finals and Awards (8:00 AM - 4:00 PM)"
  ],
  "contactInfo": {
    "name": "John Smith",
    "email": "john.smith@satrf.org.za",
    "phone": "+27 11 123 4567"
  },
  "isLocal": true,
  "source": "satrf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {
      "id": "event123",
      "title": "SATRF National Championship 2024",
      "currentSpots": 0,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      // ... other event fields
    }
  }
}
```

### 2. Get Events

**GET** `/events/`

Get paginated list of events with optional filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Number of events per page (default: 50, max: 100)
- `discipline` (optional): Filter by discipline
- `category` (optional): Filter by category
- `status` (optional): Filter by status
- `source` (optional): Filter by source (satrf/issf)
- `location` (optional): Filter by location
- `start_date` (optional): Filter events starting after this date
- `end_date` (optional): Filter events ending before this date
- `show_completed` (optional): Include completed events (default: false)

**Example Request:**
```
GET /events/?discipline=Air Rifle&status=upcoming&page=1&limit=20
```

**Response:**
```json
{
  "events": [
    {
      "id": "event123",
      "title": "SATRF National Championship 2024",
      "description": "The premier target rifle shooting championship",
      "start": "2024-03-15T08:00:00Z",
      "end": "2024-03-17T18:00:00Z",
      "location": "Johannesburg Shooting Range",
      "discipline": "Target Rifle",
      "category": "Senior",
      "price": 500.0,
      "maxSpots": 50,
      "currentSpots": 35,
      "status": "upcoming",
      "registrationDeadline": "2024-03-01T23:59:59Z",
      "image": "/images/events/national-championship.jpg",
      "requirements": ["Valid shooting license", "Minimum 6 months experience"],
      "schedule": ["Day 1: Registration and Practice", "Day 2: Qualification Rounds"],
      "contactInfo": {
        "name": "John Smith",
        "email": "john.smith@satrf.org.za",
        "phone": "+27 11 123 4567"
      },
      "isLocal": true,
      "source": "satrf",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

### 3. Get Event by ID

**GET** `/events/{event_id}`

Get a specific event by ID.

**Response:**
```json
{
  "id": "event123",
  "title": "SATRF National Championship 2024",
  "description": "The premier target rifle shooting championship",
  "start": "2024-03-15T08:00:00Z",
  "end": "2024-03-17T18:00:00Z",
  "location": "Johannesburg Shooting Range",
  "discipline": "Target Rifle",
  "category": "Senior",
  "price": 500.0,
  "maxSpots": 50,
  "currentSpots": 35,
  "status": "upcoming",
  "registrationDeadline": "2024-03-01T23:59:59Z",
  "image": "/images/events/national-championship.jpg",
  "requirements": ["Valid shooting license", "Minimum 6 months experience"],
  "schedule": ["Day 1: Registration and Practice", "Day 2: Qualification Rounds"],
  "contactInfo": {
    "name": "John Smith",
    "email": "john.smith@satrf.org.za",
    "phone": "+27 11 123 4567"
  },
  "isLocal": true,
  "source": "satrf",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 4. Update Event

**PUT** `/events/{event_id}`

Update an existing event (Admin only).

**Request Body:**
```json
{
  "title": "Updated Event Title",
  "description": "Updated event description",
  "price": 600.0,
  "maxSpots": 60
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "event": {
      "id": "event123",
      "title": "Updated Event Title",
      "description": "Updated event description",
      "price": 600.0,
      "maxSpots": 60,
      "updatedAt": "2024-01-15T11:30:00Z",
      // ... other event fields
    }
  }
}
```

### 5. Delete Event

**DELETE** `/events/{event_id}`

Delete an event (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### 6. Register for Event

**POST** `/events/{event_id}/register`

Register for an event.

**Request Body:**
```json
{
  "eventId": "event123",
  "paymentMethod": "credit_card",
  "specialRequirements": "Vegetarian meal preference"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully registered for event",
  "data": {
    "registrationId": "reg123",
    "confirmationNumber": "REG-A1B2C3D4"
  }
}
```

### 7. Unregister from Event

**DELETE** `/events/{event_id}/register`

Unregister from an event.

**Response:**
```json
{
  "success": true,
  "message": "Successfully unregistered from event"
}
```

### 8. Get User Registrations

**GET** `/events/registrations`

Get user's event registrations.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of registrations per page (default: 20, max: 100)
- `status` (optional): Filter by registration status

**Response:**
```json
{
  "data": [
    {
      "id": "reg123",
      "eventId": "event123",
      "userId": "user123",
      "status": "registered",
      "registeredAt": "2024-01-15T10:30:00Z",
      "paymentStatus": "pending",
      "confirmationNumber": "REG-A1B2C3D4",
      "paymentMethod": "credit_card",
      "specialRequirements": "Vegetarian meal preference",
      "event": {
        "id": "event123",
        "title": "SATRF National Championship 2024",
        "start": "2024-03-15T08:00:00Z",
        "end": "2024-03-17T18:00:00Z",
        "location": "Johannesburg Shooting Range",
        "discipline": "Target Rifle",
        "category": "Senior",
        "price": 500.0,
        "status": "upcoming",
        // ... other event fields
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

### 9. Get Upcoming Events

**GET** `/events/upcoming`

Get upcoming events (next N days).

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 30, min: 1, max: 365)
- `limit` (optional): Maximum number of events (default: 10, max: 50)

**Response:**
```json
[
  {
    "id": "event123",
    "title": "SATRF National Championship 2024",
    "start": "2024-03-15T08:00:00Z",
    "end": "2024-03-17T18:00:00Z",
    "location": "Johannesburg Shooting Range",
    "discipline": "Target Rifle",
    "category": "Senior",
    "price": 500.0,
    "status": "upcoming",
    // ... other event fields
  }
]
```

### 10. Get Events by Discipline

**GET** `/events/discipline/{discipline}`

Get events by discipline.

**Response:**
```json
[
  {
    "id": "event123",
    "title": "Air Rifle Championship",
    "discipline": "Air Rifle",
    "start": "2024-04-15T08:00:00Z",
    "end": "2024-04-15T18:00:00Z",
    "location": "Cape Town Shooting Club",
    "category": "Senior",
    "price": 300.0,
    "status": "upcoming",
    // ... other event fields
  }
]
```

### 11. Get SATRF Events

**GET** `/events/satrf`

Get SATRF local events.

**Response:**
```json
[
  {
    "id": "event123",
    "title": "SATRF National Championship 2024",
    "source": "satrf",
    "isLocal": true,
    "start": "2024-03-15T08:00:00Z",
    "end": "2024-03-17T18:00:00Z",
    "location": "Johannesburg Shooting Range",
    "discipline": "Target Rifle",
    "category": "Senior",
    "price": 500.0,
    "status": "upcoming",
    // ... other event fields
  }
]
```

### 12. Get ISSF Events

**GET** `/events/issf`

Get ISSF international events.

**Response:**
```json
[
  {
    "id": "event456",
    "title": "ISSF World Cup - Air Rifle",
    "source": "issf",
    "isLocal": false,
    "start": "2024-04-20T09:00:00Z",
    "end": "2024-04-25T17:00:00Z",
    "location": "Munich, Germany",
    "discipline": "Air Rifle",
    "category": "International",
    "price": 0.0,
    "status": "upcoming",
    // ... other event fields
  }
]
```

### 13. Search Events

**GET** `/events/search`

Search events by title, description, or location.

**Query Parameters:**
- `q` (required): Search query (min length: 1)

**Response:**
```json
[
  {
    "id": "event123",
    "title": "SATRF National Championship 2024",
    "description": "The premier target rifle shooting championship",
    "location": "Johannesburg Shooting Range",
    "start": "2024-03-15T08:00:00Z",
    "end": "2024-03-17T18:00:00Z",
    "discipline": "Target Rifle",
    "category": "Senior",
    "price": 500.0,
    "status": "upcoming",
    // ... other event fields
  }
]
```

## Admin Endpoints

### 14. Get Event Registrations (Admin)

**GET** `/events/admin/{event_id}/registrations`

Get all registrations for a specific event (Admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of registrations per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "reg123",
      "eventId": "event123",
      "userId": "user123",
      "status": "registered",
      "registeredAt": "2024-01-15T10:30:00Z",
      "paymentStatus": "pending",
      "confirmationNumber": "REG-A1B2C3D4",
      "userName": "John Doe",
      "userEmail": "john.doe@example.com"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

### 15. Sync ISSF Events (Admin)

**POST** `/events/admin/sync-issf`

Manually trigger ISSF events synchronization (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "ISSF events synchronization started"
}
```

### 16. Get ISSF Sync Status (Admin)

**GET** `/events/admin/issf-sync-status`

Get ISSF synchronization status (Admin only).

**Response:**
```json
{
  "lastSync": "2024-01-15T10:30:00Z",
  "nextSync": "2024-01-15T16:30:00Z",
  "syncStatus": "success",
  "totalISSFEvents": 5,
  "lastError": null
}
```

## Error Responses

### Validation Error (422)

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Not Found Error (404)

```json
{
  "detail": "Event with ID 'nonexistent' not found"
}
```

### Conflict Error (409)

```json
{
  "detail": "User already registered for this event"
}
```

### Bad Request Error (400)

```json
{
  "detail": "Event registration is not open"
}
```

### Unauthorized Error (401)

```json
{
  "detail": "Not authenticated"
}
```

### Forbidden Error (403)

```json
{
  "detail": "Admin access required"
}
```

### Internal Server Error (500)

```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authenticated users**: 100 requests per minute
- **Admin users**: 200 requests per minute
- **Event registration**: 10 requests per minute per user

## Integration Examples

### Frontend Integration (JavaScript)

```javascript
// Get events with filters
const getEvents = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/events/?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  
  return response.json();
};

// Register for an event
const registerForEvent = async (eventId, registrationData) => {
  const response = await fetch(`/api/v1/events/${eventId}/register`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(registrationData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  
  return response.json();
};

// Get user registrations
const getUserRegistrations = async () => {
  const response = await fetch('/api/v1/events/registrations', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch registrations');
  }
  
  return response.json();
};
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const useEvents = (filters = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(filters);
        const response = await fetch(`/api/v1/events/?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filters]);

  return { events, loading, error };
};
```

### Python Integration

```python
import requests

class SATRFEventsAPI:
    def __init__(self, base_url, access_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    
    def get_events(self, filters=None):
        """Get events with optional filters"""
        params = filters or {}
        response = requests.get(
            f'{self.base_url}/events/',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def register_for_event(self, event_id, registration_data):
        """Register for an event"""
        response = requests.post(
            f'{self.base_url}/events/{event_id}/register',
            headers=self.headers,
            json=registration_data
        )
        response.raise_for_status()
        return response.json()
    
    def get_user_registrations(self):
        """Get user's event registrations"""
        response = requests.get(
            f'{self.base_url}/events/registrations',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage example
api = SATRFEventsAPI('https://api.satrf.org.za/api/v1', 'your_access_token')

# Get upcoming Air Rifle events
events = api.get_events({
    'discipline': 'Air Rifle',
    'status': 'upcoming',
    'limit': 10
})

# Register for an event
registration = api.register_for_event('event123', {
    'paymentMethod': 'credit_card',
    'specialRequirements': 'None'
})
```

## Testing

### Running Tests

```bash
# Run all event tests
pytest tests/test_events_api.py -v

# Run specific test class
pytest tests/test_events_api.py::TestEventsAPI -v

# Run specific test method
pytest tests/test_events_api.py::TestEventsAPI::test_create_event_success -v

# Run with coverage
pytest tests/test_events_api.py --cov=app.routers.events --cov-report=html
```

### Test Coverage

The test suite covers:

- ✅ Event CRUD operations
- ✅ Event registration/unregistration
- ✅ User registration management
- ✅ Event filtering and search
- ✅ Pagination
- ✅ Admin endpoints
- ✅ ISSF synchronization
- ✅ Error handling
- ✅ Data validation
- ✅ Authentication and authorization

## Deployment

### Environment Variables

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url

# JWT Configuration
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@satrf.org.za
SENDGRID_FROM_NAME=SATRF

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://satrf.org.za
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Health Check

```bash
# Check API health
curl -X GET "https://api.satrf.org.za/api/v1/health"

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

## Support

For technical support or questions about the Events API:

- **Email**: tech@satrf.org.za
- **Documentation**: https://docs.satrf.org.za/api/events
- **GitHub Issues**: https://github.com/satrf/api/issues

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial release of Events API
- Complete CRUD operations for events
- Event registration system
- ISSF events synchronization
- Comprehensive filtering and search
- Admin management endpoints
- Full test coverage
- OpenAPI documentation 