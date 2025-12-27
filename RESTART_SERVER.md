# ⚠️ IMPORTANT: Restart Dev Server

## Issue Found
The error shows: `"7 PERMISSION_DENIED: Permission denied on resource project your_project_id"`

This means the server is still using the old environment variable value.

## Fix Applied
✅ Updated `.env.local`:
- Changed `NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id` 
- To `NEXT_PUBLIC_FIREBASE_PROJECT_ID=satrf-website`

## Action Required
**You MUST restart your dev server** for the environment variable change to take effect:

1. **Stop the current server:**
   - Press `Ctrl+C` in the terminal where `pnpm dev` is running

2. **Start it again:**
   ```bash
   pnpm dev
   ```

3. **Wait for it to fully start** (you'll see "Ready on http://localhost:3000")

4. **Then try creating the event again**

## Why This Is Needed
Next.js only reads environment variables when the server starts. Changes to `.env.local` require a server restart to take effect.

## Verification
After restarting, the server logs should show:
```
[EVENT API] Project ID: satrf-website
```

Instead of:
```
[EVENT API] Project ID: your_project_id
```








