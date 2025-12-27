# Firebase Authorized Domains Configuration

## Issue: `auth/unauthorized-continue-uri` Error

When using Firebase Auth's `sendPasswordResetEmail` with a `continueUrl`, Firebase requires that the domain be added to the **Authorized domains** list in Firebase Console.

## Solution: Add Domain to Firebase Console

### Steps:

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com/
   - Select your project: `satrf-website`

2. **Open Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **Settings** tab
   - Scroll down to **Authorized domains** section

3. **Add Your Domain**
   - Click **Add domain**
   - Enter your domain (e.g., `localhost`, `yourdomain.com`, `yourdomain.vercel.app`)
   - Click **Add**

### Required Domains:

For **Development**:
- `localhost` (usually added by default)
- `127.0.0.1` (if using IP address)

For **Production**:
- Your production domain (e.g., `satrf.org.za`)
- Your Vercel deployment domain (e.g., `satrf-website.vercel.app`)

### Current Code Behavior:

The code now:
1. **Uses environment variable** `NEXT_PUBLIC_APP_URL` if available (for production)
2. **Falls back to `window.location.origin`** (for development)
3. **Handles unauthorized domain error** by retrying without `handleCodeInApp` (lets Firebase handle redirect)
4. **Only uses `handleCodeInApp: true` in production** where domain is properly authorized

### Environment Variable Setup:

Add to your `.env.local` (development) or Vercel environment variables (production):

```bash
# Production URL (for Firebase authorized domains)
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### Testing:

1. **Development**: Should work with `localhost` (default Firebase domain)
2. **Production**: Ensure your production domain is added to Firebase authorized domains

### Troubleshooting:

If you still get `auth/unauthorized-continue-uri`:
1. Verify domain is added in Firebase Console → Authentication → Settings → Authorized domains
2. Wait a few minutes for changes to propagate
3. Clear browser cache and try again
4. Check that `NEXT_PUBLIC_APP_URL` matches the domain in Firebase Console

### Alternative Solution:

If you can't add the domain immediately, the code will automatically retry without `handleCodeInApp`, which lets Firebase handle the redirect. This works but users will be redirected to Firebase's default action handler first, then to your site.









