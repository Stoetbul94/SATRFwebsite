# Admin Verification & Access Control Summary

## Overview

This document summarizes how admin access is verified and protected throughout the SATRF website. Only users with `role: 'admin'` in Firestore can perform admin actions like uploading scores and creating events.

## Admin Verification Methods

The system uses **multiple fallback methods** to verify admin access, in this order:

### 1. Firebase Admin SDK (Primary - for Firebase Auth tokens)
- Verifies Firebase ID token using Firebase Admin SDK
- Checks user's role in Firestore `users` collection
- **Location**: `src/lib/admin.ts` → `verifyAdminFromToken()`
- **Used in**: API routes that receive Firebase Auth tokens

### 2. Backend API (Primary - for backend JWT tokens)
- Calls backend API `/users/profile` endpoint
- Backend verifies JWT token and returns user with role
- **Location**: `src/lib/admin.ts` → `verifyAdminFromToken()`
- **Used in**: API routes that receive backend JWT tokens

### 3. Environment Variable Email Whitelist (Fallback)
- Checks `ADMIN_EMAILS` environment variable
- Comma-separated list of admin emails
- **Location**: `src/lib/admin.ts` → `verifyAdminFromToken()`
- **Setup**: Add to `.env.local` or Vercel environment variables:
  ```env
  ADMIN_EMAILS=admin@satrf.org.za,superadmin@satrf.org.za
  ```

### 4. Hardcoded Dev Email List (Development Only)
- Hardcoded list for development/testing
- **Location**: `src/lib/admin.ts` → `verifyAdminFromToken()`
- **Current admins**:
  - `demo@satrf.org.za`
  - `admin@satrf.org.za`
  - `techaim10.9@gmail.com`

## Protected Admin Actions

### 1. Score Import/Upload
- **Page**: `/admin/scores/import`
- **API Route**: `/api/admin/scores/import`
- **Protection**:
  - Frontend: `useAdminRoute()` hook
  - Backend API: `verifyAdminFromToken()` function
  - Firestore Rules: Admin-only write access to `scores` collection

### 2. Event Creation
- **Backend Endpoint**: `POST /events/` (requires `require_admin`)
- **Firestore Rules**: Admin-only write access to `events` collection
- **Note**: No frontend page exists yet for event creation (backend only)

### 3. Admin Dashboard
- **Backend Endpoints**: `/admin/stats/*` (all require `require_admin`)
- **Protection**: Backend verifies admin role via JWT token

## Frontend Protection

### `useAdminRoute` Hook
- **Location**: `src/hooks/useAdminRoute.ts`
- **Usage**: Protects admin pages from non-admin users
- **Behavior**:
  - Checks `user.role === 'admin'`
  - Redirects non-admin users to `/dashboard`
  - Shows error toast notification

### Protected Pages
- `/admin/scores/import` - Score import page
- Any future admin pages should use `useAdminRoute()` hook

## Backend API Protection

### Admin Verification Function
- **Location**: `src/lib/admin.ts`
- **Function**: `verifyAdminFromToken(token: string)`
- **Returns**: `{ isAdmin: boolean, email: string | null, userId: string | null, method?: string }`

### Protected API Routes
- `/api/admin/scores/import` - Score import API

## Firestore Security Rules

### Users Collection
```firestore
match /users/{userId} {
  // Admins can read/write all user documents
  allow read, write: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Scores Collection
```firestore
match /scores/{scoreId} {
  // Admins can read/write all scores
  allow read, write: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Events Collection
```firestore
match /events/{eventId} {
  // Only admins can create/update/delete events
  allow write: if request.auth != null 
              && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Admin Actions Collection
```firestore
match /adminActions/{actionId} {
  // Only admins can read/write admin actions
  allow read, write: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## How to Set Up Admin Users

### Method 1: Set Role in Firestore (Recommended)
1. Go to Firebase Console → Firestore
2. Navigate to `users` collection
3. Find user document by email or UID
4. Update `role` field to `"admin"`

### Method 2: Environment Variable
1. Add email to `ADMIN_EMAILS` environment variable:
   ```env
   ADMIN_EMAILS=admin@satrf.org.za,another@satrf.org.za
   ```
2. Deploy or restart application

### Method 3: Backend Script (if available)
```bash
cd backend
python create_admin_user.py
```

## Testing Admin Access

### Test Admin Login
1. Log in with an admin account
2. Navigate to `/admin/scores/import`
3. Should see admin page (not redirected)

### Test Non-Admin Access
1. Log in with a regular user account
2. Try to navigate to `/admin/scores/import`
3. Should be redirected to `/dashboard` with error message

### Test API Access
1. Get auth token from localStorage (`access_token`)
2. Call `/api/admin/scores/import` with token
3. Non-admin should receive `403 Forbidden` error

## Current Admin Users

### Development/Testing
- `demo@satrf.org.za` - Demo account (temporary admin for testing)
- `admin@satrf.org.za` - Default admin
- `techaim10.9@gmail.com` - Admin email from user request

### Production Setup
For production, set up admins using Method 1 (Firestore) or Method 2 (Environment Variable).

## Security Notes

⚠️ **Important**:
- Hardcoded dev admin list should **NOT** be used in production
- Always verify admin status server-side (API routes)
- Firestore rules provide additional security layer
- Never trust client-side role checks alone
- Use environment variables for production admin emails

## Troubleshooting

### Issue: "Forbidden: Admin access required"
**Causes**:
1. User doesn't have `role: 'admin'` in Firestore
2. Email not in `ADMIN_EMAILS` environment variable
3. Token is invalid or expired
4. Backend API unavailable (for backend JWT tokens)

**Solutions**:
1. Check user's role in Firestore `users` collection
2. Add email to `ADMIN_EMAILS` environment variable
3. Log out and log back in to refresh token
4. Ensure backend API is running (for backend tokens)

### Issue: Admin page redirects to dashboard
**Causes**:
1. User's role is not `'admin'` in AuthContext
2. User document doesn't exist in Firestore
3. Role field is missing or incorrect

**Solutions**:
1. Verify user's role in Firestore
2. Ensure user document exists with correct role
3. Check `src/lib/auth.ts` login flow retrieves role correctly

## Files Modified

- `src/lib/admin.ts` - New admin verification utility
- `src/pages/api/admin/scores/import.ts` - Updated to use new verification
- `src/hooks/useAdminRoute.ts` - Frontend admin route protection
- `firestore.rules` - Security rules for admin access

