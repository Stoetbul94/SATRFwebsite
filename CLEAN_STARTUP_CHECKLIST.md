# Clean Startup Checklist - Zero Warnings

## ✅ Pre-Flight Checks

### 1. Environment Variables Fixed
```powershell
# Verify no problematic env vars are set
$env:NODE_ENV
$env:NODE_TLS_REJECT_UNAUTHORIZED

# Both should be empty/null
```

### 2. .env.local Created (Optional)
- File exists: `.env.local`
- Contains only local development variables
- NOT committed to git (already in .gitignore)

### 3. Dependencies Installed
```powershell
npm install
```

## 🚀 Clean Startup Steps

### Step 1: Open Fresh Terminal
**IMPORTANT:** Close and reopen your terminal/PowerShell window after clearing environment variables.

### Step 2: Navigate to Project
```powershell
cd "C:\Users\User\Desktop\SATRF WEBSITE"
```

### Step 3: Start Dev Server
```powershell
npm run dev
```

### Step 4: Verify Zero Warnings
Expected output:
```
▲ Next.js 15.4.10
- Local:        http://localhost:3000
- Network:      http://192.168.68.102:3000
- Environments: .env.local

✓ Starting...
✓ Ready in X.Xs
```

**NO warnings should appear:**
- ❌ No "non-standard NODE_ENV" warning
- ❌ No "NODE_TLS_REJECT_UNAUTHORIZED" warning
- ❌ No other warnings

## 🔍 Troubleshooting

### If warnings persist:

1. **Check current session:**
   ```powershell
   $env:NODE_ENV
   $env:NODE_TLS_REJECT_UNAUTHORIZED
   ```

2. **Check user environment (requires new terminal):**
   ```powershell
   [System.Environment]::GetEnvironmentVariable('NODE_ENV', 'User')
   [System.Environment]::GetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', 'User')
   ```

3. **Check machine environment (if admin):**
   ```powershell
   [System.Environment]::GetEnvironmentVariable('NODE_ENV', 'Machine')
   [System.Environment]::GetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', 'Machine')
   ```

4. **Clear all scopes:**
   ```powershell
   # User scope
   [System.Environment]::SetEnvironmentVariable('NODE_ENV', $null, 'User')
   [System.Environment]::SetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', $null, 'User')
   
   # Current session
   $env:NODE_ENV = $null
   $env:NODE_TLS_REJECT_UNAUTHORIZED = $null
   
   # Then close and reopen terminal
   ```

## ✅ Success Criteria

After running `npm run dev`:
- [ ] Server starts without warnings
- [ ] No NODE_ENV warnings
- [ ] No TLS security warnings
- [ ] Server accessible at http://localhost:3000
- [ ] Hot reload works
- [ ] Console shows clean startup

## 📝 Notes

- Next.js automatically sets `NODE_ENV=development` in dev mode
- You should NEVER set `NODE_ENV` manually for local development
- `NODE_TLS_REJECT_UNAUTHORIZED=0` should NEVER be used (security risk)
- Use `.env.local` for local-only configuration (git-ignored)

