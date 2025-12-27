# Fix npm ENOENT Errors - Permanent Solution

## Root Cause
npm commands run from wrong directory → can't find `package.json` → ENOENT error

## Permanent Fix (Run Once)

### PowerShell Setup
```powershell
# Navigate to project root
cd "C:\Users\User\Desktop\SATRF WEBSITE"

# Run setup script
.\setup-npm-guardrails.ps1

# Reload profile (or restart PowerShell)
. $PROFILE
```

## How It Works

1. **PowerShell Function Override**: Wraps `npm` command to check directory first
2. **Automatic Validation**: Verifies `package.json` exists before executing
3. **Clear Error Messages**: Shows current vs expected directory
4. **Auto-suggest Fix**: Provides exact `cd` command to fix

## Guardrails Installed

- ✅ Prevents npm from running outside project directory
- ✅ Validates `package.json` exists before execution
- ✅ Works for all npm commands (`npm run dev`, `npm install`, etc.)
- ✅ Persistent across PowerShell sessions

## Manual Validation (Alternative)

If you prefer manual checks, use the validation script:

```powershell
# Validate current directory
.\scripts\validate-npm-directory.ps1

# Or run npm command through validator
.\scripts\validate-npm-directory.ps1 -Command "npm run dev"
```

## Remove Guardrails (If Needed)

```powershell
# Edit profile
notepad $PROFILE

# Remove the "SATRF npm guardrails" section
# Save and restart PowerShell
```

## Best Practices

1. **Always start in project root**: `cd "C:\Users\User\Desktop\SATRF WEBSITE"`
2. **Use VS Code terminal**: Opens in correct directory automatically
3. **Check before running**: Quick `Test-Path package.json` check
4. **Use absolute paths in scripts**: Prevents directory issues
