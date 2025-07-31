# SATRF Admin Dashboard Setup Guide

## Overview

The SATRF Admin Dashboard provides comprehensive administrative functionality for managing users, events, scores, and system operations. This guide will help you set up and use the admin features.

## Prerequisites

1. **Backend Server Running**: Ensure the FastAPI backend is running on `http://localhost:8000`
2. **Database Setup**: Firebase/Firestore should be configured and accessible
3. **Python Dependencies**: All required packages should be installed

## Quick Setup

### 1. Create Admin User

First, create an admin user account:

```bash
cd backend
python create_admin_user.py
```

This script will:
- Create a user with email `admin@satrf.com` and password `AdminPass123`
- Test the login functionality
- Provide instructions for setting the admin role

### 2. Set Admin Role

After creating the user, you need to set their role to "admin". You can do this by:

**Option A: Using Firebase Console**
1. Go to Firebase Console → Firestore Database
2. Navigate to the `users` collection
3. Find the user with email `admin@satrf.com`
4. Update the `role` field to `"admin"`

**Option B: Using Admin API (if you have another admin user)**
```bash
curl -X PUT "http://localhost:8000/api/v1/admin/users/{user_id}/role" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

**Option C: Direct Database Update**
```python
# Using the database module directly
from app.database import db
from app.config import settings

user = await db.get_document_by_field(settings.firestore_collection_users, "email", "admin@satrf.com")
if user:
    user["role"] = "admin"
    await db.update_document(settings.firestore_collection_users, user["id"], user)
```

### 3. Test Admin API

Run the test script to verify all admin endpoints work:

```bash
python test_admin_api.py
```

## Admin API Endpoints

### Dashboard Statistics

- `GET /api/v1/admin/stats/overview` - Comprehensive dashboard overview
- `GET /api/v1/admin/stats/users?period=30d` - User statistics
- `GET /api/v1/admin/stats/events` - Event statistics  
- `GET /api/v1/admin/stats/scores` - Score statistics

### User Management

- `GET /api/v1/admin/users` - List users (paginated, searchable, filterable)
- `GET /api/v1/admin/users/{user_id}` - Get user details
- `PUT /api/v1/admin/users/{user_id}/role` - Update user role
- `DELETE /api/v1/admin/users/{user_id}` - Deactivate user

### Event Management

- `GET /api/v1/admin/events` - List events (paginated, filterable)
- `PUT /api/v1/admin/events/{event_id}/status` - Update event status
- `DELETE /api/v1/admin/events/{event_id}` - Delete event

### Score Management

- `GET /api/v1/admin/scores/pending` - Get pending scores for approval
- `PUT /api/v1/admin/scores/{score_id}/approve` - Approve score
- `PUT /api/v1/admin/scores/{score_id}/reject` - Reject score with reason
- `GET /api/v1/admin/scores` - Get all scores (filterable)

### System Administration

- `GET /api/v1/admin/system/health` - System health check
- `POST /api/v1/admin/system/backup` - Trigger system backup

## Authentication

All admin endpoints require a valid JWT token with admin role. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Usage Examples

### Frontend Integration

```javascript
// Get dashboard stats
const getDashboardStats = async (token) => {
  const response = await fetch('/api/v1/admin/stats/overview', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Approve a score
const approveScore = async (scoreId, token) => {
  const response = await fetch(`/api/v1/admin/scores/${scoreId}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Update user role
const updateUserRole = async (userId, role, token) => {
  const response = await fetch(`/api/v1/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role })
  });
  return response.json();
};
```

### Python Client

```python
import requests

class SATRFAdminClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_dashboard_stats(self):
        response = requests.get(
            f'{self.base_url}/api/v1/admin/stats/overview',
            headers=self.headers
        )
        return response.json()
    
    def approve_score(self, score_id):
        response = requests.put(
            f'{self.base_url}/api/v1/admin/scores/{score_id}/approve',
            headers=self.headers
        )
        return response.json()
    
    def get_pending_scores(self, page=1, limit=20):
        response = requests.get(
            f'{self.base_url}/api/v1/admin/scores/pending',
            params={'page': page, 'limit': limit},
            headers=self.headers
        )
        return response.json()

# Usage
client = SATRFAdminClient('http://localhost:8000', 'your-jwt-token')
stats = client.get_dashboard_stats()
```

## Security Considerations

1. **JWT Token Security**: Tokens expire after 24 hours
2. **Role-Based Access**: Only users with admin role can access these endpoints
3. **Input Validation**: All inputs are validated and sanitized
4. **Audit Logging**: All admin actions should be logged for security purposes
5. **HTTPS Required**: All endpoints must be accessed over HTTPS in production

## Error Handling

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

Common HTTP status codes:
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

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that your JWT token is valid and not expired
2. **403 Forbidden**: Ensure the user has admin role
3. **404 Not Found**: Verify the resource ID exists
4. **500 Internal Server Error**: Check server logs for detailed error information

### Debug Mode

Enable debug mode in your FastAPI configuration to get detailed error messages:

```python
# In app/config.py
debug = True
```

### Logging

Enable detailed logging to troubleshoot issues:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

## Next Steps

1. **Frontend Integration**: Build admin dashboard UI components
2. **Email Notifications**: Set up email notifications for admin actions
3. **Audit Trail**: Implement comprehensive audit logging
4. **Backup System**: Set up automated backup procedures
5. **Monitoring**: Add system monitoring and alerting

## Support

For issues or questions:
1. Check the API documentation at `/docs` when the server is running
2. Review the test scripts for usage examples
3. Check server logs for error details
4. Ensure all prerequisites are met 