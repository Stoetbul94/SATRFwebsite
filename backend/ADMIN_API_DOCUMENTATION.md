# SATRF Admin API Documentation

## Overview

The Admin API provides comprehensive dashboard functionality for SATRF administrators. All endpoints require admin authentication and are secured with JWT tokens.

**Base URL**: `/api/v1/admin`

**Authentication**: Bearer token required for all endpoints

## Authentication

All admin endpoints require a valid JWT token with admin role. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Dashboard Statistics

### Get Dashboard Overview
```
GET /admin/stats/overview
```

Returns comprehensive dashboard statistics including:
- Total users, events, and scores
- Active events and pending scores
- Recent activity (30 days)
- Membership breakdown
- Top clubs

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalEvents": 25,
      "totalScores": 1200,
      "activeEvents": 8,
      "pendingScores": 15,
      "recentUsers": 12,
      "recentScores": 45
    },
    "membershipBreakdown": {
      "junior": 30,
      "senior": 100,
      "veteran": 20
    },
    "topClubs": [
      {"club": "Cape Town Rifle Club", "count": 25},
      {"club": "Pretoria Shooting Club", "count": 20}
    ]
  }
}
```

### Get User Statistics
```
GET /admin/stats/users?period=30d
```

**Query Parameters**:
- `period` (optional): Time period - "7d", "30d", "90d", "1y" (default: "30d")

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "newUsers": 12,
    "roleBreakdown": {
      "admin": 3,
      "user": 145,
      "event_scorer": 2
    },
    "membershipBreakdown": {
      "junior": 30,
      "senior": 100,
      "veteran": 20
    },
    "dailyRegistrations": {
      "2024-01-15": 2,
      "2024-01-16": 1,
      "2024-01-17": 3
    }
  }
}
```

### Get Event Statistics
```
GET /admin/stats/events
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalEvents": 25,
    "upcomingEvents": 8,
    "statusBreakdown": {
      "open": 5,
      "full": 2,
      "closed": 18
    },
    "typeBreakdown": {
      "precision": 15,
      "rapid_fire": 8,
      "air_rifle": 2
    },
    "averageParticipation": 48.0,
    "eventParticipation": {
      "January Championship": 45,
      "February Match": 52
    }
  }
}
```

### Get Score Statistics
```
GET /admin/stats/scores
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalScores": 1200,
    "statusBreakdown": {
      "pending": 15,
      "approved": 1150,
      "rejected": 35
    },
    "disciplineBreakdown": {
      "precision": 800,
      "rapid_fire": 350,
      "air_rifle": 50
    },
    "scoreDistribution": {
      "0-100": 5,
      "101-200": 15,
      "201-300": 45,
      "301-400": 120,
      "401-500": 350,
      "501-600": 665
    },
    "disciplineAverages": {
      "precision": 485.5,
      "rapid_fire": 420.3,
      "air_rifle": 380.2
    }
  }
}
```

## User Management

### Get Users (Paginated)
```
GET /admin/users?page=1&limit=20&search=john&role=user&membership_type=senior
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page, 1-100 (default: 20)
- `search` (optional): Search in name, email, or club
- `role` (optional): Filter by user role
- `membership_type` (optional): Filter by membership type

**Response**:
```json
{
  "data": [
    {
      "id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "user",
      "membershipType": "senior",
      "club": "Cape Town Rifle Club",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "total_pages": 8
}
```

### Get User Details
```
GET /admin/users/{user_id}
```

**Response**:
```json
{
  "id": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "user",
  "membershipType": "senior",
  "club": "Cape Town Rifle Club",
  "profileImageUrl": "https://example.com/profile.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:15:00Z"
}
```

### Update User Role
```
PUT /admin/users/{user_id}/role
```

**Request Body**:
```json
{
  "role": "event_scorer"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User role updated to event_scorer",
  "data": {
    "userId": "user123",
    "newRole": "event_scorer"
  }
}
```

### Deactivate User
```
DELETE /admin/users/{user_id}
```

**Response**:
```json
{
  "success": true,
  "message": "User account deactivated",
  "data": {
    "userId": "user123"
  }
}
```

## Event Management

### Get Events (Paginated)
```
GET /admin/events?page=1&limit=20&status=open&event_type=precision
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page, 1-100 (default: 20)
- `status` (optional): Filter by event status
- `event_type` (optional): Filter by event type

**Response**:
```json
{
  "data": [
    {
      "id": "event123",
      "title": "January Championship",
      "description": "Annual precision shooting championship",
      "date": "2024-01-25T09:00:00Z",
      "location": "Cape Town Shooting Range",
      "type": "precision",
      "status": "open",
      "maxParticipants": 100,
      "currentParticipants": 45,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "total_pages": 2
}
```

### Update Event Status
```
PUT /admin/events/{event_id}/status
```

**Request Body**:
```json
{
  "status": "closed"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event status updated to closed",
  "data": {
    "eventId": "event123",
    "newStatus": "closed"
  }
}
```

### Delete Event
```
DELETE /admin/events/{event_id}
```

**Response**:
```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "eventId": "event123"
  }
}
```

## Score Management

### Get Pending Scores
```
GET /admin/scores/pending?page=1&limit=20
```

**Response**:
```json
{
  "data": [
    {
      "id": "score123",
      "eventId": "event123",
      "userId": "user123",
      "userName": "John Doe",
      "club": "Cape Town Rifle Club",
      "eventTitle": "January Championship",
      "eventDate": "2024-01-25T09:00:00Z",
      "discipline": "precision",
      "score": 485,
      "xCount": 12,
      "status": "pending",
      "createdAt": "2024-01-26T14:30:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

### Approve Score
```
PUT /admin/scores/{score_id}/approve
```

**Response**:
```json
{
  "success": true,
  "message": "Score approved successfully",
  "data": {
    "scoreId": "score123"
  }
}
```

### Reject Score
```
PUT /admin/scores/{score_id}/reject
```

**Request Body**:
```json
{
  "reason": "Score document is unclear"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Score rejected successfully",
  "data": {
    "scoreId": "score123",
    "reason": "Score document is unclear"
  }
}
```

### Get All Scores
```
GET /admin/scores?page=1&limit=20&status=approved&discipline=precision&event_id=event123
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page, 1-100 (default: 20)
- `status` (optional): Filter by score status
- `discipline` (optional): Filter by discipline
- `event_id` (optional): Filter by event ID

## System Administration

### Get System Health
```
GET /admin/system/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "collections": {
      "users": 150,
      "events": 25,
      "scores": 1200
    },
    "storage": {
      "estimatedSizeKB": 450,
      "estimatedSizeMB": 0.44
    },
    "status": "healthy",
    "timestamp": "2024-01-26T15:30:00Z"
  }
}
```

### Trigger Backup
```
POST /admin/system/backup
```

**Response**:
```json
{
  "success": true,
  "message": "Backup triggered successfully",
  "data": {
    "backupId": "backup_20240126_153000"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE"
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions (not admin)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

Admin endpoints are subject to rate limiting:
- 100 requests per minute per admin user
- 1000 requests per hour per admin user

## Security Considerations

1. **JWT Token Security**: Tokens expire after 24 hours
2. **Role-Based Access**: Only users with admin role can access these endpoints
3. **Input Validation**: All inputs are validated and sanitized
4. **Audit Logging**: All admin actions are logged for security purposes
5. **HTTPS Required**: All endpoints must be accessed over HTTPS in production

## Usage Examples

### Frontend Integration

```javascript
// Get dashboard stats
const response = await fetch('/api/v1/admin/stats/overview', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Approve a score
const response = await fetch(`/api/v1/admin/scores/${scoreId}/approve`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Update user role
const response = await fetch(`/api/v1/admin/users/${userId}/role`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role: 'event_scorer' })
});
```

### Python Client Example

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get pending scores
response = requests.get(
    'http://localhost:8000/api/v1/admin/scores/pending',
    headers=headers
)

# Approve score
response = requests.put(
    f'http://localhost:8000/api/v1/admin/scores/{score_id}/approve',
    headers=headers
)
``` 