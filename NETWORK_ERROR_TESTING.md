# Network Error Fix - Testing Guide

## 🧪 Testing Checklist

### Prerequisites
- ✅ Dev server running on `http://localhost:3000`
- ✅ Backend server (optional - test both scenarios)
- ✅ Browser console open (F12)

---

## Test Scenario 1: Backend Running ✅

### 1. Homepage (Dashboard Stats)
**URL:** `http://localhost:3000/`

**Expected:**
- ✅ Page loads without Network Errors
- ✅ Stats display (members, events, scores, news)
- ✅ Upcoming events section loads
- ✅ No errors in console

**Check Console:**
```javascript
// Should see:
API Configuration: { API_BASE_URL: "...", API_VERSION: "v1", baseURL: "..." }
// Should NOT see:
Network Error
ERR_NETWORK
```

**Test Steps:**
1. Open `http://localhost:3000/`
2. Open browser DevTools (F12) → Console tab
3. Check for any red errors
4. Verify stats are displayed
5. Verify upcoming events section

---

### 2. Events Page
**URL:** `http://localhost:3000/events`

**Expected:**
- ✅ Page loads without Network Errors
- ✅ Events list displays (or empty if no events)
- ✅ Filters work (type, location, status)
- ✅ No errors in console

**Check Console:**
```javascript
// Should see successful API calls:
GET /api/events?status=open 200 OK
// Should NOT see:
Network Error
ERR_NETWORK
```

**Test Steps:**
1. Navigate to `/events`
2. Check console for errors
3. Try filtering by status, type, location
4. Verify events display correctly

---

### 3. Event Details Page
**URL:** `http://localhost:3000/events/[id]`

**Expected:**
- ✅ Page loads without Network Errors
- ✅ Event details display
- ✅ No errors in console

**Test Steps:**
1. Click on an event from the events list
2. Check console for errors
3. Verify event details are displayed

---

### 4. Dashboard (Logged In)
**URL:** `http://localhost:3000/dashboard`

**Expected:**
- ✅ Page loads without Network Errors
- ✅ User stats display
- ✅ No errors in console

**Test Steps:**
1. Log in (if not already)
2. Navigate to `/dashboard`
3. Check console for errors
4. Verify dashboard data loads

---

## Test Scenario 2: Backend Down (Graceful Fallback) ✅

### Purpose
Verify the app handles backend unavailability gracefully without crashing.

### Setup
1. Stop the backend server (if running)
2. Or ensure backend is not accessible

### 1. Homepage (Backend Down)
**Expected:**
- ✅ Page loads WITHOUT Network Errors
- ✅ Fallback stats display (1250 members, 12 events, etc.)
- ✅ Empty events list (graceful fallback)
- ✅ Console shows WARNING (not ERROR) about backend unavailability

**Check Console:**
```javascript
// Should see:
Backend unavailable, returning empty events array: { error: "...", suggestion: "..." }
// Should NOT see:
Network Error
ERR_NETWORK
Uncaught (in promise) Error
```

**Test Steps:**
1. Stop backend server
2. Open `http://localhost:3000/`
3. Verify page loads (no crash)
4. Check console - should see warnings, not errors
5. Verify fallback data is displayed

---

### 2. Events Page (Backend Down)
**Expected:**
- ✅ Page loads WITHOUT Network Errors
- ✅ Empty events list displayed
- ✅ Filters still work (no errors)
- ✅ Console shows warning about backend

**Test Steps:**
1. Navigate to `/events`
2. Verify page loads
3. Check console - warnings OK, errors NOT OK
4. Try filters - should work without errors

---

### 3. Event Details (Backend Down)
**Expected:**
- ✅ Page loads WITHOUT Network Error
- ✅ 404 or "Event not found" message
- ✅ No crash

**Test Steps:**
1. Try to access `/events/some-id`
2. Verify page handles error gracefully
3. Check console - no Network Errors

---

## Test Scenario 3: Invalid baseURL Configuration ✅

### Purpose
Verify the app handles missing/invalid environment variables.

### Setup
1. Temporarily remove or invalidate `NEXT_PUBLIC_API_BASE_URL` in `.env.local`

### Expected:
- ✅ App uses fallback `http://localhost:8000/api`
- ✅ Console shows configuration in development mode
- ✅ No crashes from malformed URLs

**Check Console:**
```javascript
// Should see in development:
API Configuration: {
  API_BASE_URL: "http://localhost:8000/api",
  API_VERSION: "v1",
  baseURL: "http://localhost:8000/api/v1",
  envVarSet: false
}
```

---

## ✅ Success Criteria

### All Scenarios Must Pass:
1. ✅ **No Network Errors** in console (even when backend is down)
2. ✅ **App doesn't crash** when backend unavailable
3. ✅ **Graceful fallbacks** display appropriate data
4. ✅ **Console warnings** (not errors) when backend unavailable
5. ✅ **All pages load** without blocking errors

---

## 🔍 What to Look For

### ✅ GOOD (Expected):
- Console warnings: `Backend unavailable, returning empty events array`
- Fallback data displayed
- Pages load successfully
- No red errors in console

### ❌ BAD (Should NOT See):
- `AxiosError: Network Error`
- `ERR_NETWORK`
- `Uncaught (in promise) Error`
- Blank white screen
- App crashes

---

## 🐛 Debugging Tips

### If You See Network Errors:

1. **Check baseURL:**
   ```javascript
   // In browser console:
   console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
   ```

2. **Check Next.js API routes:**
   - Verify `/api/events` exists
   - Check Network tab → should see requests to `/api/events` (not direct backend)

3. **Check backend:**
   - Is backend running?
   - Is it accessible at configured URL?
   - Check CORS settings

4. **Check environment variables:**
   - Verify `.env.local` has `NEXT_PUBLIC_API_BASE_URL`
   - Restart dev server after changing env vars

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

### Scenario 1: Backend Running
- [ ] Homepage loads: ✅ / ❌
- [ ] Events page loads: ✅ / ❌
- [ ] Event details load: ✅ / ❌
- [ ] Dashboard loads: ✅ / ❌
- [ ] No Network Errors: ✅ / ❌

### Scenario 2: Backend Down
- [ ] Homepage loads (fallback): ✅ / ❌
- [ ] Events page loads (empty): ✅ / ❌
- [ ] No Network Errors: ✅ / ❌
- [ ] Graceful warnings only: ✅ / ❌

### Scenario 3: Invalid Config
- [ ] App uses fallback URL: ✅ / ❌
- [ ] No crashes: ✅ / ❌

### Overall Result: ✅ PASS / ❌ FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🚀 Quick Test Commands

```bash
# Start dev server
npm run dev

# In another terminal, test API routes directly:
curl http://localhost:3000/api/events
curl http://localhost:3000/api/dashboard/stats

# Check if backend is running:
curl http://localhost:8000/api/v1/events
```

---

**Last Updated:** 2024-12-20  
**Status:** Ready for Testing

