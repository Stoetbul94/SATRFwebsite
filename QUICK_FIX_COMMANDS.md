# Quick Fix Commands - Copy & Paste

## 🔴 CRITICAL: Security Issue
**NODE_TLS_REJECT_UNAUTHORIZED=0** disables SSL verification - **REMOVE IMMEDIATELY**

## ⚠️ WARNING: Development Issue  
**NODE_ENV=production** in local dev causes Next.js warnings and dev mode problems

---

## PowerShell Commands (Run These Now)

```powershell
# 1. Remove problematic environment variables from User scope
[System.Environment]::SetEnvironmentVariable('NODE_ENV', $null, 'User')
[System.Environment]::SetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', $null, 'User')

# 2. Clear current session variables
$env:NODE_ENV = $null
$env:NODE_TLS_REJECT_UNAUTHORIZED = $null

# 3. Verify removal (should show empty)
Write-Host "NODE_ENV: $([System.Environment]::GetEnvironmentVariable('NODE_ENV', 'User'))"
Write-Host "NODE_TLS_REJECT_UNAUTHORIZED: $([System.Environment]::GetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', 'User'))"
```

## CMD Commands (Alternative)

```cmd
REM Remove from user environment
setx NODE_ENV ""
setx NODE_TLS_REJECT_UNAUTHORIZED ""

REM Clear current session
set NODE_ENV=
set NODE_TLS_REJECT_UNAUTHORIZED=
```

**⚠️ IMPORTANT:** After running these commands, **CLOSE AND REOPEN** your terminal window.

---

## Verification Steps

1. **Close and reopen terminal/PowerShell**
2. **Navigate to project:**
   ```powershell
   cd "C:\Users\User\Desktop\SATRF WEBSITE"
   ```
3. **Start dev server:**
   ```powershell
   npm run dev
   ```
4. **Verify NO warnings appear**

---

## Expected Clean Output

```
▲ Next.js 15.4.10
- Local:        http://localhost:3000
- Network:      http://192.168.68.102:3000
- Environments: .env.local

✓ Starting...
✓ Ready in X.Xs
```

**No warnings should appear!**

---

## Why These Fixes Matter

### NODE_ENV=production (in dev)
- ❌ Disables React DevTools
- ❌ Enables production optimizations (slower)
- ❌ Hides helpful error messages
- ❌ Causes caching issues

### NODE_TLS_REJECT_UNAUTHORIZED=0
- 🔴 **SECURITY RISK** - Disables SSL verification
- 🔴 Vulnerable to man-in-the-middle attacks
- 🔴 Will cause production deployment issues
- 🔴 Violates security best practices

---

## Next.js Best Practice

**DO NOT set NODE_ENV manually for local development.**

Next.js automatically sets:
- `NODE_ENV=development` when running `npm run dev`
- `NODE_ENV=production` when running `npm run build` or `npm start`

Use `.env.local` for local-only configuration (already in .gitignore).

