# Fix: Next.js Dev Server Hang

## Root Cause

**SINGLE BLOCKING ISSUE:** `AuthContext` makes blocking API calls during initialization that hang when backend is unavailable.

### The Problem Chain:

1. **`src/contexts/AuthContext.tsx`** line 144-148: `useEffect` calls `checkAuth()` on mount
2. **`checkAuth()`** line 159: Calls `authFlow.getCurrentUser()` 
3. **`authFlow.getCurrentUser()`** → `authAPI.getProfile()` → HTTP request to `http://localhost:8000/api/v1/users/profile`
4. **If backend isn't running:** Axios hangs for full timeout (10 seconds)
5. **During dev server startup:** This can block compilation/SSR if triggered incorrectly

## Fixes Applied

### 1. Client-Side Guards (`src/contexts/AuthContext.tsx`)
- Added `typeof window === 'undefined'` check to prevent SSR execution
- Added timeout protection (5 seconds) to prevent infinite hangs
- Added Promise.race timeout (3 seconds) for API calls

### 2. Reduced Axios Timeout (`src/lib/auth.ts`)
- Reduced timeout from 10000ms to 3000ms
- Prevents long hangs when backend is unavailable

### 3. Timeout Protection in checkAuth()
- Added Promise.race with 3-second timeout for `getCurrentUser()` call
- Gracefully handles backend unavailability

## Code Changes

### `src/contexts/AuthContext.tsx`
```typescript
// Before: No guards, could run during SSR
useEffect(() => {
  if (router.isReady) {
    checkAuth();
  }
}, [router.isReady]);

// After: Client-side guards + timeout protection
useEffect(() => {
  if (typeof window === 'undefined') {
    dispatch({ type: 'SET_INITIALIZED', payload: true });
    return;
  }
  
  if (!router.isReady) return;
  
  const timeoutId = setTimeout(() => {
    console.warn('Auth check timeout - backend may be unavailable');
    dispatch({ type: 'SET_INITIALIZED', payload: true });
  }, 5000);
  
  checkAuth().finally(() => {
    clearTimeout(timeoutId);
    dispatch({ type: 'SET_INITIALIZED', payload: true });
  });
}, [router.isReady]);
```

### `src/lib/auth.ts`
```typescript
// Before: 10 second timeout
timeout: 10000,

// After: 3 second timeout
timeout: 3000,
```

## Verification Steps

1. **Stop any running dev server:**
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

2. **Clear build cache:**
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```

3. **Start dev server:**
   ```powershell
   npm run dev
   ```

4. **Expected result:**
   - Server starts in < 30 seconds
   - Shows "Ready" message
   - http://localhost:3000 renders content
   - No infinite hangs

5. **If backend is unavailable:**
   - Page still loads (shows "Not authenticated")
   - No blocking/hanging
   - Console shows timeout warning (non-blocking)

## Why This Works

1. **Client-side guards** prevent SSR from making API calls
2. **Timeouts** ensure calls fail fast (3-5 seconds max)
3. **Graceful degradation** allows page to render even if auth fails
4. **Reduced timeout** prevents long hangs during dev

## Testing

- ✅ Dev server starts without backend running
- ✅ Page renders even if auth API is unavailable  
- ✅ Auth check times out gracefully (3-5 seconds)
- ✅ No infinite hangs or blocking
