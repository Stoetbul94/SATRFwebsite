# SATRF Backend API Documentation

## Overview
The SATRF (South African Target Rifle Federation) API provides a comprehensive backend service for managing target rifle shooting events, scores, and user data. Built with FastAPI and Firebase Firestore.

**Base URL:** `http://localhost:8000/api/v1`  
**Documentation:** `http://localhost:8000/docs` (Swagger UI)  
**Alternative Docs:** `http://localhost:8000/redoc` (ReDoc)

## Authentication

### JWT Token Authentication
All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Format
- **Type:** JWT (JSON Web Token)
- **Algorithm:** HS256
- **Expiration:** 30 minutes (configurable)
- **Refresh:** Not implemented (re-login required)

## API Endpoints

### Authentication Endpoints

#### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "membershipType": "senior",
  "club": "Cape Town Shooting Club"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "membershipType": "senior",
      "club": "Cape Town Shooting Club",
      "role": "user",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `firstName`: 2-50 characters
- `lastName`: 2-50 characters
- `email`: Valid email format, unique
- `password`: Min 8 chars, must contain uppercase, lowercase, and number
- `membershipType`: "junior", "senior", or "veteran"
- `club`: 2-100 characters

#### POST `/auth/login`
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "membershipType": "senior",
    "club": "Cape Town Shooting Club",
    "role": "user",
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

#### POST `/auth/logout`
Logout user (client-side token invalidation).

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

#### GET `/auth/me`
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "id": "user_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "membershipType": "senior",
  "club": "Cape Town Shooting Club",
  "role": "user",
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-01T10:00:00Z"
}
```

### Events Endpoints

#### GET `/events`
Get all events with optional filtering.

**Query Parameters:**
- `type` (optional): Filter by event type
- `location` (optional): Filter by location
- `status` (optional): Filter by status ("open", "full", "closed")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "event_123",
      "title": "National Championship 2024",
      "description": "Annual national championship event",
      "date": "2024-12-15T09:00:00Z",
      "location": "Pretoria Shooting Range",
      "type": "Championship",
      "maxParticipants": 100,
      "currentParticipants": 45,
      "status": "open",
      "createdAt": "2024-11-01T10:00:00Z",
      "updatedAt": "2024-11-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

#### GET `/events/{event_id}`
Get specific event details.

**Response (200 OK):**
```json
{
  "id": "event_123",
  "title": "National Championship 2024",
  "description": "Annual national championship event",
  "date": "2024-12-15T09:00:00Z",
  "location": "Pretoria Shooting Range",
  "type": "Championship",
  "maxParticipants": 100,
  "currentParticipants": 45,
  "status": "open",
  "createdAt": "2024-11-01T10:00:00Z",
  "updatedAt": "2024-11-01T10:00:00Z"
}
```

#### POST `/events/{event_id}/register`
Register current user for an event.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully registered for event"
}
```

#### DELETE `/events/{event_id}/register`
Unregister current user from an event.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully unregistered from event"
}
```

### Scores Endpoints

#### POST `/scores/upload`
Upload a new score with optional file attachment.

**Headers:** `Authorization: Bearer <token>`

**Request Body (multipart/form-data):**
```
score_data: {
  "eventId": "event_123",
  "discipline": "10m Air Rifle",
  "score": 595,
  "xCount": 45,
  "notes": "Good performance in windy conditions"
}
file: [optional file upload]
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Score uploaded successfully",
  "data": {
    "score": {
      "id": "score_123",
      "eventId": "event_123",
      "discipline": "10m Air Rifle",
      "score": 595,
      "xCount": 45,
      "notes": "Good performance in windy conditions",
      "status": "pending",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  }
}
```

**Validation Rules:**
- `eventId`: Must exist in events collection
- `discipline`: 2-100 characters
- `score`: 0-600
- `xCount`: 0-60 (optional)
- `notes`: Max 500 characters (optional)
- `file`: Max 10MB, types: PDF, JPG, PNG (optional)

#### GET `/scores/my-scores`
Get current user's scores with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 100)
- `status` (optional): Filter by status ("pending", "approved", "rejected")

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "score_123",
      "eventId": "event_123",
      "discipline": "10m Air Rifle",
      "score": 595,
      "xCount": 45,
      "notes": "Good performance in windy conditions",
      "status": "approved",
      "createdAt": "2024-12-01T10:00:00Z",
      "updatedAt": "2024-12-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

#### GET `/scores/event/{event_id}`
Get all scores for a specific event.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)
- `discipline` (optional): Filter by discipline

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "score_123",
      "eventId": "event_123",
      "discipline": "10m Air Rifle",
      "score": 595,
      "xCount": 45,
      "notes": "Good performance in windy conditions",
      "status": "approved",
      "userName": "John Doe",
      "club": "Cape Town Shooting Club",
      "createdAt": "2024-12-01T10:00:00Z",
      "updatedAt": "2024-12-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

#### PUT `/scores/{score_id}`
Update a score (owner or admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "score": 598,
  "xCount": 47,
  "notes": "Updated notes"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Score updated successfully"
}
```

#### DELETE `/scores/{score_id}`
Delete a score (owner or admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Score deleted successfully"
}
```

#### PUT `/scores/{score_id}/approve`
Approve a score (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Score approved successfully"
}
```

#### PUT `/scores/{score_id}/reject`
Reject a score with reason (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Score sheet not provided"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Score rejected successfully"
}
```

### Leaderboard Endpoints

#### GET `/leaderboard/overall`
Get overall leaderboard rankings.

**Query Parameters:**
- `discipline` (optional): Filter by discipline
- `category` (optional): Filter by category ("junior", "senior", "veteran")
- `time_period` (optional): Time period ("all", "year", "month", "week")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "rank": 1,
      "userId": "user_123",
      "userName": "John Doe",
      "club": "Cape Town Shooting Club",
      "category": "senior",
      "bestScore": 595,
      "averageScore": 590.5,
      "totalScore": 2362,
      "totalXCount": 180,
      "eventCount": 4
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50,
  "total_pages": 1,
  "filters": {
    "discipline": "10m Air Rifle",
    "category": "senior",
    "time_period": "all"
  }
}
```

#### GET `/leaderboard/event/{event_id}`
Get leaderboard for a specific event.

**Query Parameters:**
- `discipline` (optional): Filter by discipline
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "rank": 1,
      "userId": "user_123",
      "userName": "John Doe",
      "club": "Cape Town Shooting Club",
      "category": "senior",
      "bestScore": 595,
      "averageScore": 595,
      "totalScore": 595,
      "totalXCount": 45,
      "eventCount": 1
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50,
  "total_pages": 1,
  "filters": {
    "event_id": "event_123",
    "discipline": "10m Air Rifle"
  }
}
```

#### GET `/leaderboard/club`
Get club leaderboard rankings.

**Query Parameters:**
- `time_period` (optional): Time period ("all", "year", "month", "week")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "rank": 1,
      "userId": "",
      "userName": "Cape Town Shooting Club",
      "club": "Cape Town Shooting Club",
      "category": "club",
      "bestScore": 595,
      "averageScore": 590.5,
      "totalScore": 2362,
      "totalXCount": 180,
      "eventCount": 4,
      "memberCount": 5
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50,
  "total_pages": 1,
  "filters": {
    "time_period": "all"
  }
}
```

#### GET `/leaderboard/statistics`
Get current user's leaderboard statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalScores": 4,
      "bestScore": 595,
      "averageScore": 590.5,
      "totalXCount": 180,
      "currentRank": 15,
      "clubRank": 3,
      "categoryRank": 8
    }
  }
}
```

## Error Responses

### Standard Error Format
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
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Example Error Responses

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "message": "Password must contain at least one uppercase letter",
    "code": "VALIDATION_ERROR"
  }
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Incorrect email or password",
  "error": {
    "message": "Invalid credentials",
    "code": "AUTH_ERROR"
  }
}
```

**Permission Error (403):**
```json
{
  "success": false,
  "message": "Not authorized to update this score",
  "error": {
    "message": "Insufficient permissions",
    "code": "PERMISSION_ERROR"
  }
}
```

## Rate Limiting
Currently not implemented. Planned for production deployment.

## File Upload
- **Max File Size:** 10MB
- **Allowed Types:** PDF, JPG, PNG
- **Storage:** File metadata stored in database (actual file storage TBD)

## Pagination
All list endpoints support pagination with the following parameters:
- `page`: Page number (1-based)
- `limit`: Results per page (max varies by endpoint)

Response includes:
- `total`: Total number of results
- `page`: Current page number
- `limit`: Results per page
- `total_pages`: Total number of pages

## Filtering
Most endpoints support filtering via query parameters:
- **Events:** `type`, `location`, `status`
- **Scores:** `status`, `discipline`
- **Leaderboard:** `discipline`, `category`, `time_period`

## Sorting
- **Events:** By date (newest first)
- **Scores:** By creation date (newest first)
- **Leaderboard:** By best score (highest first), then by average score

## Development Setup

### Prerequisites
- Python 3.11+
- Firebase project with Firestore
- Environment variables configured

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables
Create `.env` file:
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

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Running the Server
```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Testing
API endpoints can be tested using:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Any HTTP client (Postman, curl, etc.)

## Production Considerations
- Enable HTTPS
- Implement rate limiting
- Add comprehensive logging
- Set up monitoring and alerting
- Configure proper CORS origins
- Implement file storage (AWS S3, Google Cloud Storage)
- Add email notifications
- Set up automated backups

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Contact:** Development Team 