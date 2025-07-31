# SATRF API Usage Examples

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

### 1. User Registration

**Endpoint**: `POST /auth/register`

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "password": "SecurePass123",
    "membershipType": "senior",
    "club": "Cape Town Shooting Club"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_123456",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com",
      "membershipType": "senior",
      "club": "Cape Town Shooting Club",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 2. User Login

**Endpoint**: `POST /auth/login`

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@example.com",
    "password": "SecurePass123"
  }'
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user_123456",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "membershipType": "senior",
    "club": "Cape Town Shooting Club",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Get Current User

**Endpoint**: `GET /auth/me`

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "id": "user_123456",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "membershipType": "senior",
  "club": "Cape Town Shooting Club",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 4. User Logout

**Endpoint**: `POST /auth/logout`

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/logout" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

## Events Management

### 1. Create Event (Admin Only)

**Endpoint**: `POST /events`

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Cape Town Championship 2024",
    "description": "Annual championship event for all categories",
    "date": "2024-03-15T09:00:00Z",
    "location": "Cape Town Shooting Range",
    "type": "Championship",
    "maxParticipants": 50,
    "status": "open"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {
      "id": "event_789012",
      "title": "Cape Town Championship 2024",
      "description": "Annual championship event for all categories",
      "date": "2024-03-15T09:00:00Z",
      "location": "Cape Town Shooting Range",
      "type": "Championship",
      "maxParticipants": 50,
      "currentParticipants": 0,
      "status": "open",
      "createdAt": "2024-01-10T14:20:00Z",
      "updatedAt": "2024-01-10T14:20:00Z"
    }
  }
}
```

### 2. Get All Events

**Endpoint**: `GET /events`

**cURL Example**:
```bash
# Get all events
curl -X GET "http://localhost:8000/api/v1/events" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get events with filters
curl -X GET "http://localhost:8000/api/v1/events?status=open&type=Championship&page=1&size=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "items": [
    {
      "id": "event_789012",
      "title": "Cape Town Championship 2024",
      "description": "Annual championship event for all categories",
      "date": "2024-03-15T09:00:00Z",
      "location": "Cape Town Shooting Range",
      "type": "Championship",
      "maxParticipants": 50,
      "currentParticipants": 25,
      "status": "open",
      "createdAt": "2024-01-10T14:20:00Z",
      "updatedAt": "2024-01-15T16:45:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 10,
  "pages": 1
}
```

### 3. Get Specific Event

**Endpoint**: `GET /events/{event_id}`

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/v1/events/event_789012" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "id": "event_789012",
  "title": "Cape Town Championship 2024",
  "description": "Annual championship event for all categories",
  "date": "2024-03-15T09:00:00Z",
  "location": "Cape Town Shooting Range",
  "type": "Championship",
  "maxParticipants": 50,
  "currentParticipants": 25,
  "status": "open",
  "createdAt": "2024-01-10T14:20:00Z",
  "updatedAt": "2024-01-15T16:45:00Z"
}
```

### 4. Update Event (Admin Only)

**Endpoint**: `PUT /events/{event_id}`

**cURL Example**:
```bash
curl -X PUT "http://localhost:8000/api/v1/events/event_789012" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Cape Town Championship 2024 - Updated",
    "maxParticipants": 60
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "event": {
      "id": "event_789012",
      "title": "Cape Town Championship 2024 - Updated",
      "description": "Annual championship event for all categories",
      "date": "2024-03-15T09:00:00Z",
      "location": "Cape Town Shooting Range",
      "type": "Championship",
      "maxParticipants": 60,
      "currentParticipants": 25,
      "status": "open",
      "createdAt": "2024-01-10T14:20:00Z",
      "updatedAt": "2024-01-15T17:30:00Z"
    }
  }
}
```

### 5. Register for Event

**Endpoint**: `POST /events/{event_id}/register`

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/api/v1/events/event_789012/register" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully registered for event"
}
```

### 6. Unregister from Event

**Endpoint**: `DELETE /events/{event_id}/register`

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8000/api/v1/events/event_789012/register" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully unregistered from event"
}
```

### 7. Delete Event (Admin Only)

**Endpoint**: `DELETE /events/{event_id}`

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8000/api/v1/events/event_789012" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

## Error Handling Examples

### 1. Validation Error

**Request**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "J",
    "email": "invalid-email",
    "password": "weak"
  }'
```

**Response**:
```json
{
  "detail": [
    {
      "loc": ["body", "firstName"],
      "msg": "ensure this value has at least 2 characters",
      "type": "value_error.any_str.min_length"
    },
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    },
    {
      "loc": ["body", "password"],
      "msg": "ensure this value has at least 8 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

### 2. Authentication Error

**Request**:
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me"
```

**Response**:
```json
{
  "detail": "Not authenticated"
}
```

### 3. Authorization Error

**Request**:
```bash
curl -X POST "http://localhost:8000/api/v1/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"title": "Test Event"}'
```

**Response**:
```json
{
  "detail": "Not enough permissions"
}
```

### 4. Resource Not Found

**Request**:
```bash
curl -X GET "http://localhost:8000/api/v1/events/nonexistent_id" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "detail": "Event not found"
}
```

## Postman Collection

### Import Collection

1. Open Postman
2. Click "Import"
3. Paste the following JSON:

```json
{
  "info": {
    "name": "SATRF API",
    "description": "SATRF (South African Target Rifle Federation) API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000/api/v1",
      "type": "string"
    },
    {
      "key": "auth_token",
      "value": "",
      "type": "string"
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"firstName\": \"John\",\n  \"lastName\": \"Smith\",\n  \"email\": \"john.smith@example.com\",\n  \"password\": \"SecurePass123\",\n  \"membershipType\": \"senior\",\n  \"club\": \"Cape Town Shooting Club\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/register",
              "host": ["{{base_url}}"],
              "path": ["auth", "register"]
            }
          }
        },
        {
          "name": "Login User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.collectionVariables.set('auth_token', response.access_token);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john.smith@example.com\",\n  \"password\": \"SecurePass123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/auth/me",
              "host": ["{{base_url}}"],
              "path": ["auth", "me"]
            }
          }
        },
        {
          "name": "Logout User",
          "request": {
            "method": "POST",
            "url": {
              "raw": "{{base_url}}/auth/logout",
              "host": ["{{base_url}}"],
              "path": ["auth", "logout"]
            }
          }
        }
      ]
    },
    {
      "name": "Events",
      "item": [
        {
          "name": "Create Event",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Cape Town Championship 2024\",\n  \"description\": \"Annual championship event for all categories\",\n  \"date\": \"2024-03-15T09:00:00Z\",\n  \"location\": \"Cape Town Shooting Range\",\n  \"type\": \"Championship\",\n  \"maxParticipants\": 50,\n  \"status\": \"open\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/events",
              "host": ["{{base_url}}"],
              "path": ["events"]
            }
          }
        },
        {
          "name": "Get All Events",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/events?page=1&size=10",
              "host": ["{{base_url}}"],
              "path": ["events"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "size",
                  "value": "10"
                }
              ]
            }
          }
        },
        {
          "name": "Get Event by ID",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/events/event_789012",
              "host": ["{{base_url}}"],
              "path": ["events", "event_789012"]
            }
          }
        },
        {
          "name": "Update Event",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Updated Event Title\",\n  \"maxParticipants\": 60\n}"
            },
            "url": {
              "raw": "{{base_url}}/events/event_789012",
              "host": ["{{base_url}}"],
              "path": ["events", "event_789012"]
            }
          }
        },
        {
          "name": "Register for Event",
          "request": {
            "method": "POST",
            "url": {
              "raw": "{{base_url}}/events/event_789012/register",
              "host": ["{{base_url}}"],
              "path": ["events", "event_789012", "register"]
            }
          }
        },
        {
          "name": "Unregister from Event",
          "request": {
            "method": "DELETE",
            "url": {
              "raw": "{{base_url}}/events/event_789012/register",
              "host": ["{{base_url}}"],
              "path": ["events", "event_789012", "register"]
            }
          }
        },
        {
          "name": "Delete Event",
          "request": {
            "method": "DELETE",
            "url": {
              "raw": "{{base_url}}/events/event_789012",
              "host": ["{{base_url}}"],
              "path": ["events", "event_789012"]
            }
          }
        }
      ]
    }
  ]
}
```

## Testing with Python

### Using requests library

```python
import requests
import json

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

# Register user
def register_user():
    url = f"{BASE_URL}/auth/register"
    data = {
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@example.com",
        "password": "SecurePass123",
        "membershipType": "senior",
        "club": "Cape Town Shooting Club"
    }
    
    response = requests.post(url, json=data)
    print(f"Register: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

# Login user
def login_user():
    url = f"{BASE_URL}/auth/login"
    data = {
        "email": "john.smith@example.com",
        "password": "SecurePass123"
    }
    
    response = requests.post(url, json=data)
    print(f"Login: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

# Get events
def get_events(token):
    url = f"{BASE_URL}/events"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    print(f"Get Events: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

# Main test
if __name__ == "__main__":
    # Register and login
    register_user()
    login_response = login_user()
    
    # Get token
    token = login_response["access_token"]
    
    # Get events
    get_events(token)
```

## Environment Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment Variables

```bash
cp env.example .env
# Edit .env with your Firebase credentials
```

### 3. Run the Server

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

This comprehensive API usage guide provides all the necessary examples for testing and integrating with the SATRF backend API. 