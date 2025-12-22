# Admin Access Setup Guide

This guide explains how to differentiate and set up admin users for the SATRF website.

## Admin Verification Methods

The system uses **multiple fallback methods** to verify admin access:

### Method 1: Backend Database (Primary - Production)
Admin role is stored in the backend database (Firestore). When a user logs in, their role is checked from the database.

**How to set up:**
1. **Using Backend Script:**
   ```bash
   cd backend
   python create_admin_user.py
   ```
   This will prompt you for:
   - Email address
   - Password
   - The user will be created with `role: "admin"`

2. **Manually in Firestore:**
   - Go to Firebase Console → Firestore
   - Find the user document in the `users` collection
   - Update the `role` field to `"admin"`

3. **Via Backend API (if available):**
   - Use the admin creation endpoint
   - Or update user role via admin panel

### Method 2: Environment Variable (Fallback)
Set admin emails in environment variables for quick setup.

**Setup:**
1. Create/update `.env.local` file:
   ```env
   ADMIN_EMAILS=admin@satrf.org.za,superadmin@satrf.org.za,another@satrf.org.za
   ```

2. The system will check if the logged-in user's email matches any in this list.

**Note:** Emails are case-insensitive and trimmed.

### Method 3: Hardcoded Dev List (Development Only)
For development/testing, there's a hardcoded list in the code.

**Location:** `src/pages/api/admin/scores/import.ts`

**Current dev admins:**
- `demo@satrf.org.za` (demo account)
- `admin@satrf.org.za`

**To add more:**
Edit the `devAdminEmails` array in the admin verification code.

## Current Admin Users

### Demo Account (Testing)
- **Email:** `demo@satrf.org.za`
- **Password:** `DemoPass123`
- **Role:** `admin` (temporary for testing)
- **Note:** This is set in `src/lib/auth.ts` for demo purposes

## How Admin Verification Works

1. **User logs in** → Token is generated/stored
2. **User accesses admin page** → System checks admin status:
   - First: Tries to verify via backend API (`/users/profile`)
   - If backend unavailable: Checks `ADMIN_EMAILS` env variable
   - If still not found: Checks hardcoded dev admin list
3. **If admin verified** → Access granted
4. **If not admin** → Access denied with error message

## Setting Up Production Admins

### Recommended Approach (Production):

1. **Use Backend Database:**
   ```bash
   # Run the admin creation script
   python backend/create_admin_user.py
   ```

2. **Or manually in Firestore:**
   - User document should have: `role: "admin"`

3. **Set Environment Variable (Optional):**
   ```env
   ADMIN_EMAILS=admin@satrf.org.za
   ```

### For Development/Testing:

1. **Use Demo Account:**
   - Email: `demo@satrf.org.za`
   - Password: `DemoPass123`

2. **Or add to dev list:**
   - Edit `src/pages/api/admin/scores/import.ts`
   - Add email to `devAdminEmails` array

## Admin Role Values

The system recognizes these role values:
- `"admin"` - Full admin access
- `"user"` - Regular user (default)
- `"event_scorer"` - Event scorer (limited admin)

## Troubleshooting

### Error: "Unauthorized: Could not verify admin status"

**Causes:**
1. Backend API is not running
2. Token is invalid/expired
3. User doesn't have admin role in database
4. Email not in admin whitelist

**Solutions:**
1. Check if backend is running: `http://localhost:8000`
2. Try logging out and back in
3. Verify user role in database
4. Add email to `ADMIN_EMAILS` env variable
5. Check browser console for detailed error messages

### Error: "Forbidden: Admin access required"

**Cause:** User is authenticated but doesn't have admin role.

**Solution:** 
- Contact system administrator to grant admin access
- Or use one of the setup methods above

## Security Notes

⚠️ **Important:**
- The hardcoded dev admin list should **NOT** be used in production
- Always use backend database verification in production
- Environment variables are more secure than hardcoded lists
- Regularly audit admin user list
- Remove temporary admin access after testing

## Next Steps

1. **For Production:**
   - Set up admin users via backend database
   - Remove or disable demo account
   - Set `ADMIN_EMAILS` environment variable
   - Remove hardcoded dev admin list

2. **For Development:**
   - Use demo account or add test emails to dev list
   - Keep backend running for full verification

