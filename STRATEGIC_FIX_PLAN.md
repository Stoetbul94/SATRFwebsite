# Strategic Fix Plan - SATRF Website

## 🎯 Goal
Fix all terminal errors and get `npm run dev` running cleanly.

## 📋 Phase 1: Complete Clean Reinstall (CRITICAL)

### Step 1.1: Stop All Processes
```powershell
# Stop all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2
```

### Step 1.2: Remove All Build Artifacts
```powershell
# Remove build cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Remove TypeScript build info
Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue

# Remove SWC cache
Remove-Item -Recurse -Force .swc -ErrorAction SilentlyContinue

# Remove Turbo cache
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
```

### Step 1.3: Remove Dependencies
```powershell
# Remove node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Remove lock files
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Force yarn.lock -ErrorAction SilentlyContinue
```

## 📋 Phase 2: Verify Configuration Files

### Step 2.1: Verify package.json
- ✅ React: `18.2.0` (locked, no caret)
- ✅ React-DOM: `18.2.0` (locked, no caret)
- ✅ Next.js: `15.4.10` (locked, no caret)
- ✅ Overrides section includes React versions

### Step 2.2: Verify _document.tsx
```tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### Step 2.3: Verify middleware.ts
- ✅ Only imports from `next/server`
- ✅ No Firebase Admin
- ✅ No JWT libraries
- ✅ Only cookie-based auth check

## 📋 Phase 3: Fresh Install

### Step 3.1: Clear npm cache
```powershell
npm cache clean --force
```

### Step 3.2: Install dependencies
```powershell
npm install
```

### Step 3.3: Verify installation
```powershell
npm list react react-dom next
# Should show:
# react@18.2.0
# react-dom@18.2.0
# next@15.4.10
```

## 📋 Phase 4: Start Dev Server

### Step 4.1: Start server
```powershell
npm run dev
```

### Step 4.2: Monitor for errors
Watch terminal for:
- ✅ "Ready on http://localhost:3000"
- ❌ Any red error messages
- ❌ EvalError
- ❌ jsxDEV errors
- ❌ Module not found errors

## 📋 Phase 5: Common Error Fixes

### Error: "Module not found"
**Fix**: Run `npm install` again

### Error: "EvalError: Code generation from strings"
**Fix**: 
- Verify middleware.ts has no eval/Function
- Check for Firebase Admin in middleware (should be none)

### Error: "jsxDEV is not a function"
**Fix**:
- Verify _document.tsx has no React import
- Verify React versions are exactly 18.2.0
- Clear .next cache

### Error: "ENOENT: no such file or directory"
**Fix**:
- Verify all files exist
- Check file paths are correct
- Reinstall dependencies

### Error: "Cannot find module"
**Fix**:
- Delete node_modules
- Delete package-lock.json
- Run `npm install`

## 📋 Phase 6: Testing

### Test 1: Homepage
```powershell
# Should return 200 OK
curl http://localhost:3000
```

### Test 2: Admin Route Protection
```powershell
# Should redirect (302/307) to /login
curl -I http://localhost:3000/admin/dashboard
```

### Test 3: API Route
```powershell
# Should return 401 (no auth token)
curl http://localhost:3000/api/admin/stats
```

## 🔧 Quick Fix Script

Run this complete fix script:

```powershell
# Complete Fix Script
$projectRoot = "C:\Users\User\Desktop\SATRF WEBSITE"
Set-Location $projectRoot

Write-Host "=== COMPLETE FIX SCRIPT ===" -ForegroundColor Cyan

# Step 1: Stop processes
Write-Host "`n[1/6] Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Remove build artifacts
Write-Host "[2/6] Removing build artifacts..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .swc -ErrorAction SilentlyContinue

# Step 3: Remove dependencies
Write-Host "[3/6] Removing dependencies..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue

# Step 4: Clear npm cache
Write-Host "[4/6] Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Step 5: Install dependencies
Write-Host "[5/6] Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 6: Start server
Write-Host "[6/6] Starting dev server..." -ForegroundColor Yellow
Write-Host "`n✅ Fix script complete!" -ForegroundColor Green
Write-Host "Monitor the terminal for compilation status." -ForegroundColor Cyan
npm run dev
```

## ⚠️ If Errors Persist

1. **Share terminal output** - Copy the exact error messages
2. **Check Node version** - Should be Node 18+ or 20+
3. **Check npm version** - Should be npm 9+
4. **Try different package manager**:
   ```powershell
   # Try with pnpm
   pnpm install
   pnpm dev
   
   # Or yarn
   yarn install
   yarn dev
   ```

## 📝 Success Criteria

✅ `npm run dev` starts without errors
✅ Terminal shows "Ready on http://localhost:3000"
✅ Homepage loads (http://localhost:3000)
✅ Admin routes redirect to login
✅ No EvalError in terminal
✅ No jsxDEV errors in terminal
✅ No ENOENT errors in terminal







