# Event Creation Debugging Guide

## Issue: Events Not Saving to Firestore

If events are hanging or not being saved, follow these debugging steps:

## Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try creating an event
4. Look for error messages starting with `[EVENT CREATE]` or `[EVENT API]`
5. Copy any error messages you see

## Step 2: Check Server Logs

1. Check your Next.js server terminal/console
2. Look for log messages starting with `[EVENT CREATE]` or `[EVENT API]`
3. These will show exactly where the process is failing

## Step 3: Test Firebase Connection

1. As an admin, navigate to: `/api/admin/test-firebase`
2. This will test:
   - Firebase Admin SDK initialization
   - Firestore read access
   - Firestore write access
3. Check the response - it will tell you what's working and what's not

## Step 4: Check Environment Variables

The API needs `FIREBASE_SERVICE_ACCOUNT_KEY` to work properly. Check if it's set:

1. Create/check `.env.local` file in project root
2. Add this variable (get it from Firebase Console):
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"satrf-website",...}
   ```
3. Restart your Next.js dev server after adding

## Step 5: Verify Firebase Admin Setup

### Option A: Using Service Account Key (Recommended)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the entire JSON
4. Add to `.env.local` as `FIREBASE_SERVICE_ACCOUNT_KEY` (as a single-line JSON string)

### Option B: Using Application Default Credentials

If running on Google Cloud (Cloud Run, App Engine, etc.), credentials are automatic.

## Common Issues & Solutions

### Issue 1: "Firebase Admin not initialized"
**Solution:** Add `FIREBASE_SERVICE_ACCOUNT_KEY` to `.env.local` and restart server

### Issue 2: "Permission denied"
**Solution:** 
- Check Firestore rules allow admin writes
- Verify service account has proper permissions in Firebase Console
- Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is valid JSON

### Issue 3: "Timeout after 15 seconds"
**Solution:**
- Check internet connection
- Verify Firebase project ID is correct
- Check if Firestore is enabled in Firebase Console

### Issue 4: Events API returns 500 error
**Solution:**
- Check server console for detailed error logs
- Verify all required fields are provided
- Check date format is valid

## Quick Test

Run this in browser console while logged in as admin:

```javascript
fetch('/api/admin/test-firebase', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

This will show you exactly what's working and what's not.

## Next Steps

1. Try creating an event again
2. Check browser console for `[EVENT CREATE]` logs
3. Check server console for detailed logs
4. Share the error messages if issue persists

