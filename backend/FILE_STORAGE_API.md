# File Storage API Documentation

## Overview

The File Storage API provides secure file upload, download, and management capabilities for the SATRF application. It integrates with Firebase Storage for reliable cloud storage and includes authentication and role-based access controls.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## File Types and Limits

### Supported File Types
- **Images**: JPEG, PNG, GIF
- **Documents**: PDF

### File Size Limits
- **Maximum file size**: 10MB per file

### Storage Paths
- **Profile Images**: `profile-images/`
- **Score Documents**: `score-documents/`
- **Event Images**: `event-images/`

## Endpoints

### 1. Upload Profile Image

**POST** `/upload/profile-image`

Upload a profile image for the authenticated user.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response:**
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "filename": "user123_20241201_143022_abc123.jpg",
    "file_url": "https://storage.googleapis.com/bucket/profile-images/user123_20241201_143022_abc123.jpg",
    "file_size": 245760,
    "content_type": "image/jpeg",
    "storage_path": "profile-images/user123_20241201_143022_abc123.jpg"
  }
}
```

**Permissions:**
- Any authenticated user can upload their own profile image

---

### 2. Upload Score Document

**POST** `/upload/score-document`

Upload a score document (PDF, image) for score verification.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` and `event_id` fields

**Response:**
```json
{
  "success": true,
  "message": "Score document uploaded successfully",
  "data": {
    "filename": "user123_20241201_143022_abc123.pdf",
    "file_url": "https://storage.googleapis.com/bucket/score-documents/user123_20241201_143022_abc123_event456.pdf",
    "file_size": 1024000,
    "content_type": "application/pdf",
    "storage_path": "score-documents/user123_20241201_143022_abc123_event456.pdf",
    "event_id": "event456"
  }
}
```

**Permissions:**
- Any authenticated user can upload their own score documents

---

### 3. Upload Event Image

**POST** `/upload/event-image`

Upload an event image (admin/event scorer only).

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` and `event_id` fields

**Response:**
```json
{
  "success": true,
  "message": "Event image uploaded successfully",
  "data": {
    "filename": "event456_20241201_143022_abc123.jpg",
    "file_url": "https://storage.googleapis.com/bucket/event-images/event456_20241201_143022_abc123.jpg",
    "file_size": 512000,
    "content_type": "image/jpeg",
    "storage_path": "event-images/event456_20241201_143022_abc123.jpg"
  }
}
```

**Permissions:**
- Admin or Event Scorer role required

---

### 4. List User Files

**GET** `/files/user/{user_id}`

List all files for a specific user.

**Query Parameters:**
- `file_type` (optional): Filter by file type (`profile_image`, `score_document`)

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 3 files for user user123",
  "data": {
    "files": [
      {
        "name": "profile-images/user123_20241201_143022_abc123.jpg",
        "size": 245760,
        "content_type": "image/jpeg",
        "created": "2024-12-01T14:30:22.123Z",
        "updated": "2024-12-01T14:30:22.123Z",
        "public_url": "https://storage.googleapis.com/bucket/profile-images/user123_20241201_143022_abc123.jpg"
      }
    ],
    "count": 1
  }
}
```

**Permissions:**
- Users can only see their own files
- Admins can see all files

---

### 5. Get File Information

**GET** `/files/info/{storage_path}`

Get detailed information about a specific file.

**Response:**
```json
{
  "success": true,
  "message": "File information retrieved successfully",
  "data": {
    "name": "profile-images/user123_20241201_143022_abc123.jpg",
    "size": 245760,
    "content_type": "image/jpeg",
    "created": "2024-12-01T14:30:22.123Z",
    "updated": "2024-12-01T14:30:22.123Z",
    "public_url": "https://storage.googleapis.com/bucket/profile-images/user123_20241201_143022_abc123.jpg"
  }
}
```

**Permissions:**
- Users can only see their own files
- Admins can see all files

---

### 6. Delete File

**DELETE** `/files/{storage_path}`

Delete a file from storage.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Permissions:**
- Users can only delete their own files
- Admins can delete any file

---

### 7. Generate Download URL

**GET** `/files/download/{storage_path}`

Generate a signed download URL for a file.

**Query Parameters:**
- `expires_in` (optional): URL expiration time in seconds (default: 3600)

**Response:**
```json
{
  "success": true,
  "message": "Download URL generated successfully",
  "data": {
    "download_url": "https://storage.googleapis.com/bucket/file.jpg?X-Goog-Algorithm=...",
    "expires_in": 3600,
    "expires_at": 1701441022.123
  }
}
```

**Permissions:**
- Users can only download their own files
- Admins can download any file

## Error Responses

### 400 Bad Request
```json
{
  "detail": "File type image/webp not allowed. Allowed types: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions. Only admins and event scorers can upload event images."
}
```

### 404 Not Found
```json
{
  "detail": "File not found"
}
```

### 413 Payload Too Large
```json
{
  "detail": "File size 15728640 bytes exceeds maximum allowed size of 10485760 bytes"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to upload profile image: Connection error"
}
```

## Integration Examples

### Frontend Integration (JavaScript)

```javascript
// Upload profile image
async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/v1/upload/profile-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}

// Upload score with document
async function uploadScore(scoreData, file) {
  const formData = new FormData();
  formData.append('eventId', scoreData.eventId);
  formData.append('discipline', scoreData.discipline);
  formData.append('score', scoreData.score);
  formData.append('xCount', scoreData.xCount);
  formData.append('notes', scoreData.notes);
  if (file) {
    formData.append('file', file);
  }
  
  const response = await fetch('/api/v1/scores/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}
```

### Python Integration

```python
import requests

# Upload profile image
def upload_profile_image(token, file_path):
    url = "http://localhost:8000/api/v1/upload/profile-image"
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, headers=headers, files=files)
    
    return response.json()

# Upload score with document
def upload_score_with_document(token, score_data, file_path=None):
    url = "http://localhost:8000/api/v1/scores/upload"
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {
        'eventId': score_data['eventId'],
        'discipline': score_data['discipline'],
        'score': score_data['score'],
        'xCount': score_data.get('xCount'),
        'notes': score_data.get('notes')
    }
    
    files = {}
    if file_path:
        with open(file_path, 'rb') as f:
            files['file'] = f
            response = requests.post(url, headers=headers, data=data, files=files)
    else:
        response = requests.post(url, headers=headers, data=data)
    
    return response.json()
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access controls for different operations
3. **File Validation**: File type and size validation on upload
4. **Secure URLs**: Signed URLs for private file access
5. **User Isolation**: Users can only access their own files (except admins)

## Configuration

The file storage system uses the following environment variables:

```env
# Firebase Storage Configuration
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_STORAGE_BASE_URL=https://storage.googleapis.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=["image/jpeg","image/png","image/gif","application/pdf"]

# File Storage Paths
PROFILE_IMAGES_PATH=profile-images
SCORE_DOCUMENTS_PATH=score-documents
EVENT_IMAGES_PATH=event-images
```

## Best Practices

1. **File Naming**: Use unique, timestamped filenames to avoid conflicts
2. **Error Handling**: Always handle upload errors gracefully
3. **File Cleanup**: Implement cleanup for unused files
4. **Caching**: Cache file URLs when appropriate
5. **Monitoring**: Monitor storage usage and costs
6. **Backup**: Implement backup strategies for critical files 