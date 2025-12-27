# Quick Fix: npm ENOENT Errors

## Problem
npm can't find `package.json` → running from wrong directory

## Solution (3 Options)

### Option 1: PowerShell Guardrails (Recommended - Already Installed)
```powershell
# Already installed! Just reload profile:
. $PROFILE

# Now npm will auto-validate directory
npm run dev
```

### Option 2: Always Use Project Root
```powershell
# Create alias in PowerShell profile
function cd-satrf { Set-Location "C:\Users\User\Desktop\SATRF WEBSITE" }

# Then always use:
cd-satrf
npm run dev
```

### Option 3: VS Code Terminal
- VS Code terminal opens in project root automatically
- Use `Ctrl+`` to open terminal
- Always in correct directory

## Quick Check Before Running npm
```powershell
# Quick validation
Test-Path package.json

# If False, navigate to project root:
cd "C:\Users\User\Desktop\SATRF WEBSITE"
```

## What's Installed

✅ **PowerShell npm wrapper** - Validates directory automatically  
✅ **package.json pre-hooks** - Validates before dev/build/start  
✅ **Validation script** - `.\scripts\validate-npm-directory.ps1`

## Test It
```powershell
# Try from wrong directory (should fail)
cd C:\
npm run dev  # Should show error

# From correct directory (should work)
cd "C:\Users\User\Desktop\SATRF WEBSITE"
npm run dev  # Should work
```
