# Fix Environment Variable Warnings

## Root Cause Analysis

### Issue 1: Non-standard NODE_ENV
**Current:** `NODE_ENV=production`  
**Problem:** Next.js expects `development`, `production`, or `test`. Using `production` in local dev causes inconsistencies.  
**Severity:** ⚠️ Non-critical but causes warnings and dev mode issues

### Issue 2: NODE_TLS_REJECT_UNAUTHORIZED=0
**Current:** `NODE_TLS_REJECT_UNAUTHORIZED=0`  
**Problem:** Disables SSL certificate verification, making all HTTPS connections insecure.  
**Severity:** 🔴 **CRITICAL SECURITY RISK** - Never use in production

## Fix Commands

### PowerShell (Recommended)

```powershell
# 1. Remove NODE_ENV from user environment (if set)
[System.Environment]::SetEnvironmentVariable('NODE_ENV', $null, 'User')

# 2. Remove NODE_TLS_REJECT_UNAUTHORIZED from user environment (if set)
[System.Environment]::SetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', $null, 'User')

# 3. Remove from machine environment (if set - requires admin)
# [System.Environment]::SetEnvironmentVariable('NODE_ENV', $null, 'Machine')
# [System.Environment]::SetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', $null, 'Machine')

# 4. Clear current session variables
$env:NODE_ENV = $null
$env:NODE_TLS_REJECT_UNAUTHORIZED = $null

# 5. Verify removal
Write-Host "NODE_ENV: $([System.Environment]::GetEnvironmentVariable('NODE_ENV', 'User'))"
Write-Host "NODE_TLS_REJECT_UNAUTHORIZED: $([System.Environment]::GetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', 'User'))"
```

### CMD (Alternative)

```cmd
REM Remove from user environment
setx NODE_ENV ""
setx NODE_TLS_REJECT_UNAUTHORIZED ""

REM Clear current session
set NODE_ENV=
set NODE_TLS_REJECT_UNAUTHORIZED=

REM Verify (requires new CMD window)
echo %NODE_ENV%
echo %NODE_TLS_REJECT_UNAUTHORIZED%
```

## Next.js Best Practice: Use .env.local

Create `.env.local` for local development (git-ignored):

```bash
# .env.local - Local development only
# This file is git-ignored and should NOT be committed

# Next.js will automatically set NODE_ENV=development in dev mode
# No need to set it manually

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add other local-only variables here
```

## Verification Checklist

After running the fixes:

- [ ] Close and reopen terminal/PowerShell window
- [ ] Run `npm run dev`
- [ ] Verify NO warnings appear
- [ ] Check that dev server starts on http://localhost:3000
- [ ] Verify hot reload works
- [ ] Confirm no SSL/TLS warnings in console

## Why This Matters

1. **NODE_ENV=production** in dev mode:
   - Disables React DevTools
   - Enables production optimizations (slower builds)
   - Hides helpful error messages
   - Can cause caching issues

2. **NODE_TLS_REJECT_UNAUTHORIZED=0**:
   - Makes ALL HTTPS requests insecure
   - Vulnerable to man-in-the-middle attacks
   - Can cause issues in production
   - Violates security best practices


