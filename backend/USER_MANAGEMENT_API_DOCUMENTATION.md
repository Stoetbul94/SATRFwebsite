# SATRF User Management API Documentation

## Overview

The SATRF User Management API provides comprehensive user authentication, profile management, and security features for the South African Target Rifle Federation platform. This API is built with FastAPI and includes JWT-based authentication, role-based access control, and secure password management.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## API Endpoints

### 1. User Registration

**POST** `/users/register`

Register a new user account with comprehensive validation and security features.

#### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "membershipType": "senior",
  "club": "Pretoria Shooting Club"
}
```

#### Field Validation

- **firstName**: 2-50 characters, required
- **lastName**: 2-50 characters, required
- **email**: Valid email format, required, unique
- **password**: Minimum 8 characters, must contain uppercase, lowercase, and number
- **membershipType**: "junior", "senior", or "veteran"
- **club**: 2-100 characters, required

#### Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "membershipType": "senior",
      "club": "Pretoria Shooting Club",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 1800,
    "session_id": "session123"
  }
}
```

#### Error Responses

**400 Bad Request** - User already exists
```json
{
  "detail": "User with this email already exists"
}
```

**400 Bad Request** - Weak password
```json
{
  "detail": {
    "message": "Password does not meet security requirements",
    "errors": [
      "Password must contain at least one uppercase letter",
      "Password must contain at least one number"
    ],
    "warnings": [
      "Consider adding special characters for better security"
    ]
  }
}
```

### 2. User Login

**POST** `/users/login`

Authenticate user and return access tokens.

#### Request Body

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

#### Response (200 OK)

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "membershipType": "senior",
    "club": "Pretoria Shooting Club",
    "role": "user",
    "profileImageUrl": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": null
  }
}
```

#### Error Responses

**401 Unauthorized** - Invalid credentials
```json
{
  "detail": "Invalid email or password"
}
```

**400 Bad Request** - Account deactivated
```json
{
  "detail": "Account is deactivated"
}
```

### 3. Token Refresh

**POST** `/users/refresh`

Refresh access token using refresh token.

#### Request Body

```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Response (200 OK)

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### 4. User Logout

**POST** `/users/logout`

Logout user and invalidate session.

#### Headers

```
Authorization: Bearer <access_token>
X-Session-ID: <session_id>
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### 5. Get User Profile

**GET** `/users/profile`

Get current user's profile information.

#### Headers

```
Authorization: Bearer <access_token>
```

#### Response (200 OK)

```json
{
  "id": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "membershipType": "senior",
  "club": "Pretoria Shooting Club",
  "role": "user",
  "profileImageUrl": "https://storage.googleapis.com/profile-images/user123.jpg",
  "phoneNumber": "+27123456789",
  "dateOfBirth": "1990-05-15",
  "address": "123 Main Street, Pretoria, 0001",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "+27123456788",
  "isActive": true,
  "emailConfirmed": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:45:00Z",
  "lastLoginAt": "2024-01-20T14:45:00Z",
  "loginCount": 15
}
```

### 6. Update User Profile

**PUT** `/users/profile`

Update current user's profile information.

#### Headers

```
Authorization: Bearer <access_token>
```

#### Request Body

```json
{
  "firstName": "Jane",
  "phoneNumber": "+27123456789",
  "address": "456 Oak Avenue, Johannesburg, 2000",
  "emergencyContact": "John Smith",
  "emergencyPhone": "+27123456787"
}
```

#### Response (200 OK)

```json
{
  "id": "user123",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "membershipType": "senior",
  "club": "Pretoria Shooting Club",
  "role": "user",
  "profileImageUrl": "https://storage.googleapis.com/profile-images/user123.jpg",
  "phoneNumber": "+27123456789",
  "dateOfBirth": "1990-05-15",
  "address": "456 Oak Avenue, Johannesburg, 2000",
  "emergencyContact": "John Smith",
  "emergencyPhone": "+27123456787",
  "isActive": true,
  "emailConfirmed": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T15:00:00Z",
  "lastLoginAt": "2024-01-20T14:45:00Z",
  "loginCount": 15
}
```

### 7. Get User Dashboard

**GET** `/users/dashboard`

Get user's dashboard data including profile, score summary, and recent activity.

#### Headers

```
Authorization: Bearer <access_token>
```

#### Response (200 OK)

```json
{
  "profile": {
    "id": "user123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "membershipType": "senior",
    "club": "Pretoria Shooting Club",
    "role": "user",
    "profileImageUrl": "https://storage.googleapis.com/profile-images/user123.jpg",
    "phoneNumber": "+27123456789",
    "dateOfBirth": "1990-05-15",
    "address": "123 Main Street, Pretoria, 0001",
    "emergencyContact": "Jane Doe",
    "emergencyPhone": "+27123456788",
    "isActive": true,
    "emailConfirmed": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z",
    "lastLoginAt": "2024-01-20T14:45:00Z",
    "loginCount": 15
  },
  "scoreSummary": {
    "totalMatches": 25,
    "totalScore": 12500,
    "averageScore": 500.0,
    "personalBest": 580,
    "personalBestEvent": "event456",
    "personalBestDate": "2024-01-10T09:00:00Z",
    "totalXCount": 150,
    "averageXCount": 6.0,
    "disciplines": ["Air Rifle", "Prone", "3P"],
    "recentScores": [
      {
        "id": "score789",
        "eventId": "event456",
        "score": 575,
        "xCount": 8,
        "discipline": "Air Rifle",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  },
  "recentEvents": [
    {
      "id": "event456",
      "title": "January Air Rifle Championship",
      "date": "2024-01-15T09:00:00Z",
      "location": "Pretoria Shooting Range",
      "status": "completed"
    }
  ],
  "upcomingEvents": [
    {
      "id": "event789",
      "title": "February Prone Match",
      "date": "2024-02-15T09:00:00Z",
      "location": "Johannesburg Shooting Club",
      "status": "open"
    }
  ],
  "notifications": []
}
```

### 8. Change Password

**POST** `/users/change-password`

Change user's password.

#### Headers

```
Authorization: Bearer <access_token>
```

#### Request Body

```json
{
  "current_password": "OldPassword123",
  "new_password": "NewSecurePass456"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Error Responses

**400 Bad Request** - Wrong current password
```json
{
  "detail": "Current password is incorrect"
}
```

**400 Bad Request** - Weak new password
```json
{
  "detail": {
    "message": "New password does not meet security requirements",
    "errors": [
      "Password must contain at least one uppercase letter"
    ],
    "warnings": [
      "Consider adding special characters for better security"
    ]
  }
}
```

### 9. Forgot Password

**POST** `/users/forgot-password`

Request password reset.

#### Request Body

```json
{
  "email": "john.doe@example.com"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

### 10. Reset Password

**POST** `/users/reset-password`

Reset password using reset token.

#### Request Body

```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass456"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Error Responses

**400 Bad Request** - Invalid or expired token
```json
{
  "detail": "Invalid or expired reset token"
}
```

### 11. Confirm Email

**POST** `/users/confirm-email`

Confirm user's email address.

#### Request Body

```json
{
  "token": "confirmation_token_here"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Email confirmed successfully"
}
```

#### Error Responses

**400 Bad Request** - Invalid token
```json
{
  "detail": "Invalid confirmation token"
}
```

### 12. Get User Activity

**GET** `/users/activity`

Get user's activity log.

#### Headers

```
Authorization: Bearer <access_token>
```

#### Query Parameters

- `limit` (optional): Number of activities to return (default: 50, max: 100)

#### Response (200 OK)

```json
[
  {
    "id": "activity123",
    "user_id": "user123",
    "action": "user_login",
    "details": {
      "session_id": "session456"
    },
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "timestamp": "2024-01-20T14:45:00Z"
  },
  {
    "id": "activity124",
    "user_id": "user123",
    "action": "profile_updated",
    "details": {
      "updated_fields": ["firstName", "phoneNumber"]
    },
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "timestamp": "2024-01-20T14:30:00Z"
  }
]
```

## Security Features

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Recommended: Special characters and 12+ characters

### JWT Token Security

- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Tokens are signed with HS256 algorithm
- Token type validation prevents misuse

### Input Sanitization

All user inputs are sanitized to prevent:
- XSS attacks
- SQL injection
- HTML injection
- Script injection

### Session Management

- Unique session IDs for each login
- Session activity tracking
- IP address and user agent logging
- Session invalidation on logout

### Activity Logging

All user actions are logged with:
- Timestamp
- IP address
- User agent
- Action details
- User ID

## Error Handling

### Standard Error Response Format

```json
{
  "detail": "Error message description"
}
```

### HTTP Status Codes

- **200 OK**: Successful operation
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error

## Rate Limiting

To prevent abuse, the following rate limits apply:

- Registration: 5 requests per hour per IP
- Login: 10 requests per minute per IP
- Password reset: 3 requests per hour per email
- API calls: 1000 requests per hour per user

## Testing

### Running Tests

```bash
cd backend
pytest tests/test_user_management.py -v
```

### Test Coverage

The test suite covers:
- User registration with validation
- Login and authentication
- Profile management
- Password operations
- Token refresh
- Security features
- Error handling

### Mock JWT Tokens for Testing

```python
# Create test token
from app.auth import create_access_token, create_user_token_data

user_data = {
    "id": "test_user_123",
    "email": "test@example.com",
    "role": "user"
}

token_data = create_user_token_data(user_data)
test_token = create_access_token(token_data)

# Use in tests
headers = {"Authorization": f"Bearer {test_token}"}
```

## Integration Examples

### Frontend Integration (JavaScript)

```javascript
// User registration
const registerUser = async (userData) => {
  const response = await fetch('/api/v1/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store tokens
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
    localStorage.setItem('session_id', data.data.session_id);
  }
  
  return data;
};

// Authenticated request
const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('/api/v1/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Session-ID': localStorage.getItem('session_id')
    }
  });
  
  return await response.json();
};

// Token refresh
const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token');
  
  const response = await fetch('/api/v1/users/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token })
  });
  
  const data = await response.json();
  
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
  }
  
  return data;
};
```

### Python Client Example

```python
import requests
import json

class SATRFClient:
    def __init__(self, base_url="http://localhost:8000/api/v1"):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.session_id = None
    
    def register(self, user_data):
        """Register a new user"""
        response = requests.post(
            f"{self.base_url}/users/register",
            json=user_data
        )
        
        if response.status_code == 201:
            data = response.json()["data"]
            self.access_token = data["access_token"]
            self.refresh_token = data["refresh_token"]
            self.session_id = data["session_id"]
        
        return response.json()
    
    def login(self, email, password):
        """Login user"""
        response = requests.post(
            f"{self.base_url}/users/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data["access_token"]
            self.refresh_token = data["refresh_token"]
        
        return response.json()
    
    def get_profile(self):
        """Get user profile"""
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "X-Session-ID": self.session_id
        }
        
        response = requests.get(
            f"{self.base_url}/users/profile",
            headers=headers
        )
        
        return response.json()
    
    def update_profile(self, profile_data):
        """Update user profile"""
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.put(
            f"{self.base_url}/users/profile",
            json=profile_data,
            headers=headers
        )
        
        return response.json()

# Usage example
client = SATRFClient()

# Register new user
user_data = {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "membershipType": "senior",
    "club": "Pretoria Shooting Club"
}

result = client.register(user_data)
print(f"Registration: {result}")

# Get profile
profile = client.get_profile()
print(f"Profile: {profile}")
```

## Deployment Considerations

### Environment Variables

Ensure the following environment variables are set:

```bash
# JWT Configuration
SECRET_KEY=your-secure-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@satrf.org.za
SENDGRID_FROM_NAME=SATRF
```

### Security Checklist

- [ ] Use strong secret key for JWT signing
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable input validation
- [ ] Configure proper logging
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Performance Optimization

- Database indexing on frequently queried fields
- Caching for user sessions
- Connection pooling for database
- CDN for static assets
- Load balancing for high traffic

## Support

For technical support or questions about the API:

- Email: tech-support@satrf.org.za
- Documentation: https://docs.satrf.org.za
- GitHub Issues: https://github.com/satrf/api/issues

## Version History

- **v1.0.0** (2024-01-15): Initial release with basic user management
- **v1.1.0** (2024-01-20): Added refresh tokens and enhanced security
- **v1.2.0** (2024-01-25): Added activity logging and dashboard features 