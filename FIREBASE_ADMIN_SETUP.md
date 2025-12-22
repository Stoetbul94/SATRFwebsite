# Firebase Admin SDK Setup Guide

## Problem: Events Not Saving to Firestore

The admin API routes need Firebase Admin SDK credentials to write to Firestore. Without proper setup, events will hang or fail silently.

## Quick Setup

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **satrf-website**
3. Click the gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (it will download)

### Step 2: Add to Environment Variables

1. Open the downloaded JSON file
2. Copy the **entire JSON** (all of it, including `{` and `}`)
3. Create/update `.env.local` in your project root:

```env
# Firebase Admin SDK (for API routes)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"satrf-website","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# Make sure this is also set
NEXT_PUBLIC_FIREBASE_PROJECT_ID=satrf-website
```

**Important:** The `FIREBASE_SERVICE_ACCOUNT_KEY` must be:
- A single line (no line breaks)
- Valid JSON
- Escaped properly if needed

### Step 3: Restart Dev Server

After adding the environment variable:
```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Connection

1. Log in as admin
2. Open browser console (F12)
3. Run this test:

```javascript
fetch('/api/admin/test-firebase', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Firebase Test Results:', data);
  if (data.status === 'all checks passed') {
    console.log('✅ Firebase is working!');
  } else {
    console.error('❌ Firebase issues:', data);
  }
})
.catch(err => console.error('Test failed:', err));
```

## Alternative: Use Client-Side Firebase (If Admin SDK Fails)

If Admin SDK continues to fail, we can modify the API to use client-side Firebase SDK with proper authentication. However, Admin SDK is preferred for security.

## Troubleshooting

### Error: "Firebase Admin not initialized"
- Check `.env.local` exists and has `FIREBASE_SERVICE_ACCOUNT_KEY`
- Verify the JSON is valid (no syntax errors)
- Restart dev server after adding env vars

### Error: "Permission denied"
- Verify service account has "Firebase Admin SDK Administrator Service Agent" role
- Check Firestore rules allow admin writes (they should, Admin SDK bypasses rules)

### Error: "Timeout"
- Check internet connection
- Verify Firebase project ID is correct
- Check if Firestore is enabled in Firebase Console

## Verify Setup

After setup, try creating an event and check:
1. Browser console for `[EVENT CREATE]` logs
2. Server console for detailed Firebase logs
3. Firestore Console to see if event appears

