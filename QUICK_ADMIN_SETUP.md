# Quick Admin Setup Guide

## How to Make a User an Admin

### Option 1: Set Role in Firestore (Recommended)

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com/
   - Select project: `satrf-website`

2. **Open Firestore Database**
   - Click on **Firestore Database** in the left sidebar
   - Click on **users** collection

3. **Find User Document**
   - Search for the user by email (e.g., `techaim10.9@gmail.com`)
   - Or find by UID if you know it

4. **Update Role Field**
   - Click on the user document
   - Find the `role` field
   - Change value from `"user"` to `"admin"`
   - Click **Update**

### Option 2: Add Email to Environment Variable

1. **Local Development** (`.env.local`):
   ```env
   ADMIN_EMAILS=techaim10.9@gmail.com,admin@satrf.org.za
   ```

2. **Vercel Production**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add variable: `ADMIN_EMAILS`
   - Value: `techaim10.9@gmail.com,admin@satrf.org.za`
   - Redeploy application

### Option 3: Use Demo Account (Testing Only)

- **Email**: `demo@satrf.org.za`
- **Password**: `DemoPass123`
- **Note**: This is already configured as admin for testing

## Verify Admin Access

1. **Log in** with the admin account
2. **Navigate** to `/admin/scores/import`
3. **Should see** the admin score import page (not redirected)
4. **Try uploading** a score to verify API access works

## Current Admin Emails (Hardcoded for Dev)

- `demo@satrf.org.za`
- `admin@satrf.org.za`
- `techaim10.9@gmail.com`

These are in `src/lib/admin.ts` and will work even if Firestore role is not set (for development only).


