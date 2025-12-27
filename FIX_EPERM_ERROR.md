# Fix: EPERM Error on .next/trace

## Problem
```
Error: EPERM: operation not permitted, open 'C:\Users\User\Desktop\SATRF WEBSITE\.next\trace'
```

## Root Cause
- `.next/trace` file is locked by another process or has permission issues
- Port 3000 is already in use (process 23488)
- Multiple Node processes may be holding file locks

## Solution

### Step 1: Kill All Node Processes
```powershell
Get-Process -Name node | Stop-Process -Force
```

### Step 2: Clear .next Directory
```powershell
# Wait a moment for processes to release files
Start-Sleep -Seconds 2

# Remove trace file specifically
Remove-Item -Path ".next\trace" -Force -ErrorAction SilentlyContinue

# Remove entire .next directory
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

### Step 3: If Still Locked, Use Alternative Method
```powershell
# Close any file explorers or IDEs that might have the folder open
# Then try:
Get-ChildItem -Path .next -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path .next -Force -Recurse -ErrorAction SilentlyContinue
```

### Step 4: Restart Dev Server
```powershell
npm run dev
```

## Prevention

Add to `.gitignore` (already present):
```
.next/
```

## Alternative: Disable Tracing

If the issue persists, you can disable Next.js tracing by adding to `next.config.js`:

```javascript
const nextConfig = {
  // ... existing config
  experimental: {
    // Disable tracing to prevent .next/trace file issues
    instrumentationHook: false,
  },
};
```

However, this is usually not necessary - the file permission fix should resolve it.
