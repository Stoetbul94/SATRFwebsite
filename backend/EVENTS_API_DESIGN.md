# SATRF Events API Design

## Overview

This document outlines the backend API design for the SATRF Events system, which supports the Interactive Events Calendar frontend. The API provides comprehensive event management, including local SATRF events and ISSF international events synchronization.

## API Endpoints

### Base URL
```
https://api.satrf.org.za/api/v1
```

### Authentication
All endpoints require JWT authentication except where noted.

## Core Endpoints

### 1. Get Events
**GET** `/events`

Fetch events with optional filtering and pagination.

**Query Parameters:**
- `discipline` (string, optional): Filter by discipline (3P, Prone, Air Rifle, etc.)
- `category` (string, optional): Filter by category (Senior, Junior, Women, etc.)
- `status` (string, optional): Filter by status (upcoming, ongoing, completed, cancelled)
- `source` (string, optional): Filter by source (satrf, issf)
- `location` (string, optional): Filter by location (partial match)
- `start_date` (string, optional): Filter events starting after this date (ISO format)
- `end_date` (string, optional): Filter events ending before this date (ISO format)
- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Number of events per page (default: 50, max: 100)
- `show_completed` (boolean, optional): Include completed events (default: false)

**Response:**
```json
{
  "events": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "start": "2024-03-15T08:00:00Z",
      "end": "2024-03-17T18:00:00Z",
      "location": "string",
      "category": "string",
      "discipline": "string",
      "price": 500,
      "max_spots": 50,
      "current_spots": 35,
      "status": "upcoming",
      "registration_deadline": "2024-03-01T23:59:59Z",
      "image": "string",
      "requirements": ["string"],
      "schedule": ["string"],
      "contact_info": {
        "name": "string",
        "email": "string",
        "phone": "string"
      },
      "is_local": true,
      "source": "satrf",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "has_more": true
}
```

### 2. Get Single Event
**GET** `/events/{event_id}`

Fetch detailed information about a specific event.

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "start": "2024-03-15T08:00:00Z",
  "end": "2024-03-17T18:00:00Z",
  "location": "string",
  "category": "string",
  "discipline": "string",
  "price": 500,
  "max_spots": 50,
  "current_spots": 35,
  "status": "upcoming",
  "registration_deadline": "2024-03-01T23:59:59Z",
  "image": "string",
  "requirements": ["string"],
  "schedule": ["string"],
  "contact_info": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "is_local": true,
  "source": "satrf",
  "registrations": [
    {
      "user_id": "string",
      "status": "registered",
      "registered_at": "2024-01-01T00:00:00Z",
      "payment_status": "paid"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 3. Register for Event
**POST** `/events/{event_id}/register`

Register the authenticated user for an event.

**Request Body:**
```json
{
  "payment_method": "string", // optional
  "special_requirements": "string" // optional
}
```

**Response:**
```json
{
  "event_id": "string",
  "user_id": "string",
  "status": "registered",
  "registered_at": "2024-01-01T00:00:00Z",
  "payment_status": "pending",
  "confirmation_number": "string"
}
```

### 4. Cancel Registration
**DELETE** `/events/{event_id}/register`

Cancel the authenticated user's registration for an event.

**Response:**
```json
{
  "message": "Registration cancelled successfully",
  "refund_amount": 500,
  "refund_status": "pending"
}
```

### 5. Get User Registrations
**GET** `/events/registrations`

Get all event registrations for the authenticated user.

**Query Parameters:**
- `status` (string, optional): Filter by registration status
- `page` (integer, optional): Page number for pagination
- `limit` (integer, optional): Number of registrations per page

**Response:**
```json
{
  "registrations": [
    {
      "event_id": "string",
      "event_title": "string",
      "event_start": "2024-03-15T08:00:00Z",
      "event_location": "string",
      "status": "registered",
      "registered_at": "2024-01-01T00:00:00Z",
      "payment_status": "paid",
      "confirmation_number": "string"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

## Specialized Endpoints

### 6. Get Upcoming Events
**GET** `/events/upcoming`

Get upcoming events (next 30 days by default).

**Query Parameters:**
- `days` (integer, optional): Number of days to look ahead (default: 30)
- `limit` (integer, optional): Maximum number of events to return

**Response:**
```json
{
  "events": [Event[]],
  "total": 15
}
```

### 7. Get Events by Discipline
**GET** `/events/discipline/{discipline}`

Get all events for a specific discipline.

**Response:**
```json
{
  "discipline": "Air Rifle",
  "events": [Event[]],
  "total": 25
}
```

### 8. Get SATRF Events
**GET** `/events/satrf`

Get all local SATRF events.

**Query Parameters:**
- Same as main events endpoint

**Response:**
```json
{
  "events": [Event[]],
  "total": 100
}
```

### 9. Get ISSF Events
**GET** `/events/issf`

Get all ISSF international events.

**Query Parameters:**
- Same as main events endpoint

**Response:**
```json
{
  "events": [Event[]],
  "total": 50
}
```

### 10. Search Events
**GET** `/events/search`

Search events by title, description, or location.

**Query Parameters:**
- `q` (string, required): Search query
- `filters` (object, optional): Additional filters

**Response:**
```json
{
  "query": "championship",
  "events": [Event[]],
  "total": 8
}
```

## Admin Endpoints

### 11. Create Event (Admin Only)
**POST** `/admin/events`

Create a new event.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "start": "2024-03-15T08:00:00Z",
  "end": "2024-03-17T18:00:00Z",
  "location": "string",
  "category": "string",
  "discipline": "string",
  "price": 500,
  "max_spots": 50,
  "registration_deadline": "2024-03-01T23:59:59Z",
  "image": "string",
  "requirements": ["string"],
  "schedule": ["string"],
  "contact_info": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "source": "satrf"
}
```

### 12. Update Event (Admin Only)
**PUT** `/admin/events/{event_id}`

Update an existing event.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  // ... other fields
}
```

### 13. Delete Event (Admin Only)
**DELETE** `/admin/events/{event_id}`

Delete an event.

**Response:**
```json
{
  "message": "Event deleted successfully"
}
```

### 14. Get Event Registrations (Admin Only)
**GET** `/admin/events/{event_id}/registrations`

Get all registrations for a specific event.

**Response:**
```json
{
  "event_id": "string",
  "event_title": "string",
  "registrations": [
    {
      "user_id": "string",
      "user_name": "string",
      "user_email": "string",
      "status": "registered",
      "registered_at": "2024-01-01T00:00:00Z",
      "payment_status": "paid",
      "confirmation_number": "string"
    }
  ],
  "total": 35,
  "waitlist": 5
}
```

## ISSF Integration Endpoints

### 15. Sync ISSF Events
**POST** `/admin/events/sync-issf`

Manually trigger ISSF events synchronization.

**Response:**
```json
{
  "message": "ISSF events synchronized successfully",
  "events_added": 15,
  "events_updated": 8,
  "events_removed": 3
}
```

### 16. Get ISSF Sync Status
**GET** `/admin/events/issf-sync-status`

Get the status of ISSF synchronization.

**Response:**
```json
{
  "last_sync": "2024-01-01T12:00:00Z",
  "next_sync": "2024-01-01T18:00:00Z",
  "sync_status": "success",
  "total_issf_events": 150,
  "last_error": null
}
```

## Data Models

### Event Model
```python
class Event(BaseModel):
    id: str
    title: str
    description: str
    start: datetime
    end: datetime
    location: str
    category: str
    discipline: str
    price: float
    max_spots: int
    current_spots: int
    status: EventStatus
    registration_deadline: datetime
    image: Optional[str] = None
    requirements: List[str] = []
    schedule: List[str] = []
    contact_info: Optional[ContactInfo] = None
    is_local: bool
    source: EventSource
    created_at: datetime
    updated_at: datetime

class ContactInfo(BaseModel):
    name: str
    email: str
    phone: str

class EventRegistration(BaseModel):
    event_id: str
    user_id: str
    status: RegistrationStatus
    registered_at: datetime
    payment_status: PaymentStatus
    confirmation_number: str

enum EventStatus:
    upcoming = "upcoming"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"

enum EventSource:
    satrf = "satrf"
    issf = "issf"

enum RegistrationStatus:
    registered = "registered"
    waitlist = "waitlist"
    cancelled = "cancelled"

enum PaymentStatus:
    pending = "pending"
    paid = "paid"
    refunded = "refunded"
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  }
}
```

### Common Error Codes
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Event not found
- `409`: Conflict - Registration conflict
- `422`: Validation Error - Invalid data
- `500`: Internal Server Error - Server error

### Specific Error Examples

#### Event Not Found
```json
{
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event with ID '123' not found",
    "details": "The requested event does not exist or has been removed"
  }
}
```

#### Registration Conflict
```json
{
  "error": {
    "code": "REGISTRATION_CONFLICT",
    "message": "User already registered for this event",
    "details": "User 'user123' is already registered for event '456'"
  }
}
```

#### Event Full
```json
{
  "error": {
    "code": "EVENT_FULL",
    "message": "Event is full",
    "details": "Event '456' has reached maximum capacity of 50 participants"
  }
}
```

## Rate Limiting

### Limits
- **Public endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 1000 requests per minute per user
- **Admin endpoints**: 500 requests per minute per admin user

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Caching

### Cache Headers
- **Event lists**: Cache for 5 minutes
- **Individual events**: Cache for 10 minutes
- **User registrations**: No cache (always fresh)

### ETags
All responses include ETag headers for efficient caching:
```
ETag: "abc123def456"
```

## Webhooks

### Event Registration Webhook
**POST** `/webhooks/event-registration`

Sent when a user registers for an event.

**Payload:**
```json
{
  "event": "event_registration",
  "data": {
    "event_id": "string",
    "user_id": "string",
    "status": "registered",
    "registered_at": "2024-01-01T00:00:00Z"
  }
}
```

### Event Update Webhook
**POST** `/webhooks/event-update`

Sent when an event is updated.

**Payload:**
```json
{
  "event": "event_update",
  "data": {
    "event_id": "string",
    "changes": {
      "title": "Updated Title",
      "location": "New Location"
    },
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## Security Considerations

### Authentication
- All endpoints require JWT authentication except public event viewing
- Admin endpoints require admin role
- Rate limiting prevents abuse

### Data Validation
- All input data is validated using Pydantic models
- SQL injection prevention through parameterized queries
- XSS prevention through input sanitization

### Privacy
- User registration data is encrypted at rest
- Personal information is masked in admin responses
- GDPR compliance for data deletion requests

## Monitoring and Logging

### Metrics
- API response times
- Error rates by endpoint
- Event registration success rates
- ISSF sync performance

### Logs
- All API requests logged with user context
- Error logs with stack traces
- Admin action audit logs
- ISSF sync logs

## Deployment

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/satrf_events

# Authentication
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256

# ISSF Integration
ISSF_API_KEY=your-issf-api-key
ISSF_BASE_URL=https://api.issf-sports.org

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "issf_sync": "connected"
}
```

---

*This API design supports the full functionality of the SATRF Interactive Events Calendar frontend.* 