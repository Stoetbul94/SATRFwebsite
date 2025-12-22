# File Storage Setup Guide

## Overview

This guide will help you set up Firebase Storage for file uploads in the SATRF backend API. The system supports profile images, score documents, and event images with secure authentication and role-based access controls.

## Prerequisites

1. Firebase project with Firestore enabled
2. Firebase Storage bucket configured
3. Firebase service account with Storage permissions
4. Python 3.8+ with pip

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Firestore Database
4. Enable Storage

### 1.2 Configure Storage Rules
Update your Firebase Storage rules to allow authenticated access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read their own files
    match /profile-images/{userId}_{fileName} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || request.auth.token.role == 'admin');
      allow write: if request.auth != null && 
        (request.auth.uid == userId || request.auth.token.role == 'admin');
    }
    
    // Allow authenticated users to read/write score documents
    match /score-documents/{fileName} {
      allow read, write: if request.auth != null;
    }
    
    // Allow admins and event scorers to manage event images
    match /event-images/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'event_scorer');
    }
  }
}
```

### 1.3 Create Service Account
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Keep this file secure - it contains sensitive credentials

## Step 2: Environment Configuration

### 2.1 Copy Environment Template
```bash
cp env.example .env
```

### 2.2 Configure Firebase Credentials
Edit `.env` file with your Firebase project details:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account-email%40your-project.iam.gserviceaccount.com

# Firebase Storage Configuration
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_STORAGE_BASE_URL=https://storage.googleapis.com
```

### 2.3 Configure File Upload Settings
```env
# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=["image/jpeg", "image/png", "image/gif", "application/pdf"]

# File Storage Paths
PROFILE_IMAGES_PATH=profile-images
SCORE_DOCUMENTS_PATH=score-documents
EVENT_IMAGES_PATH=event-images
```

## Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 4: Test the Setup

### 4.1 Start the Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4.2 Test File Upload
Use the API documentation at `http://localhost:8000/docs` to test:

1. **Register a user** (POST `/api/v1/auth/register`)
2. **Login** (POST `/api/v1/auth/login`) to get a token
3. **Upload profile image** (POST `/api/v1/upload/profile-image`)

### 4.3 Example cURL Commands

```bash
# Register user
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "Password123",
    "membershipType": "senior",
    "club": "Test Club"
  }'

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'

# Upload profile image (replace TOKEN with actual token)
curl -X POST "http://localhost:8000/api/v1/upload/profile-image" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/image.jpg"
```

## Step 5: Frontend Integration

### 5.1 JavaScript Example
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

### 5.2 React Example
```jsx
import React, { useState } from 'react';

function ProfileImageUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/upload/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        console.log('Upload successful:', result.data.file_url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
```

## Step 6: Security Considerations

### 6.1 File Validation
- File type validation is enforced server-side
- File size limits are configured in environment variables
- Malicious file uploads are prevented

### 6.2 Access Control
- Users can only access their own files
- Admins have access to all files
- Role-based permissions for different operations

### 6.3 Secure URLs
- Public URLs for profile images and event images
- Signed URLs for private file access
- URL expiration for sensitive files

## Step 7: Monitoring and Maintenance

### 7.1 Storage Monitoring
- Monitor Firebase Storage usage in Firebase Console
- Set up billing alerts for storage costs
- Implement file cleanup for unused files

### 7.2 Error Handling
- Implement proper error handling in frontend
- Log file upload errors for debugging
- Provide user-friendly error messages

### 7.3 Backup Strategy
- Consider implementing backup for critical files
- Use Firebase Storage versioning if needed
- Implement file recovery procedures

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Firebase service account credentials
   - Check JWT token validity
   - Ensure proper authorization headers

2. **File Upload Failures**
   - Check file size limits
   - Verify allowed file types
   - Ensure Firebase Storage bucket is accessible

3. **CORS Issues**
   - Configure CORS settings in Firebase Storage
   - Check frontend origin settings
   - Verify API endpoint configuration

4. **Storage Quota Exceeded**
   - Monitor storage usage
   - Implement file cleanup
   - Consider upgrading Firebase plan

### Debug Mode
Enable debug mode for detailed error messages:

```env
DEBUG=true
```

### Logs
Check application logs for detailed error information:

```bash
python -m uvicorn app.main:app --reload --log-level debug
```

## Support

For additional support:
1. Check the API documentation at `/docs`
2. Review Firebase Storage documentation
3. Check application logs for error details
4. Verify environment configuration 