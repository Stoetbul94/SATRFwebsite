# Admin Page Testing Guide

## ✅ Setup Complete

The demo user has been temporarily set to **admin role** for testing.

**Demo Credentials:**
- Email: `demo@satrf.org.za`
- Password: `DemoPass123`
- Role: **admin** (temporarily enabled)

## 🧪 Testing Steps

### 1. Login as Admin
1. Go to: `http://localhost:3000/login`
2. Enter:
   - Email: `demo@satrf.org.za`
   - Password: `DemoPass123`
3. Click "Sign In"
4. You should be redirected to dashboard

### 2. Navigate to Admin Score Import Page
1. Go to: `http://localhost:3000/admin/scores/import`
2. **Expected**: Page loads with "Admin Score Import & Entry" heading
3. **Should see**:
   - Two tabs: "Upload Excel/CSV" and "Manual Entry"
   - Download template link
   - File upload area (drag & drop)

### 3. Test File Upload Tab
1. Click "Upload Excel/CSV" tab
2. **Test drag & drop**:
   - Drag an Excel/CSV file onto the upload area
   - Or click to browse files
3. **Expected**: File is accepted and parsed
4. **Check**: Validation errors are shown if data is invalid

### 4. Test Manual Entry Tab
1. Click "Manual Entry" tab
2. **Test adding rows**:
   - Click "Add Row" button
   - Fill in score data:
     - Event Name: `Prone Match 1`, `Prone Match 2`, `3P`, or `Air Rifle`
     - Match Number: e.g., `001`
     - Shooter Name: e.g., `John Doe`
     - Club: e.g., `SATRF Club`
     - Division: `Open`, `Junior`, `Veteran`, or `Master`
     - Veteran: `Y` or `N`
     - Series 1-6: Numbers between 0-109
     - Total: Sum of all series
     - Place: (optional) e.g., `1`
3. **Test validation**:
   - Try invalid data (e.g., series > 109)
   - Check that errors are shown
4. **Test import**:
   - Click "Import Scores" button
   - Check success/error messages

### 5. Test Template Download
1. Click "📥 Download Excel Template" link
2. **Expected**: Excel template file downloads
3. **Check**: Template has correct column headers

## 📋 Test Checklist

### Access Control
- [ ] Non-admin users are redirected (test with regular user)
- [ ] Admin users can access the page
- [ ] Page shows loading spinner while checking auth

### File Upload
- [ ] Drag & drop works
- [ ] Click to browse works
- [ ] Excel files are accepted
- [ ] CSV files are accepted
- [ ] Invalid files are rejected
- [ ] File parsing works correctly
- [ ] Validation errors are displayed
- [ ] Import button works

### Manual Entry
- [ ] Add row button works
- [ ] Remove row button works
- [ ] Form validation works
- [ ] Invalid data shows errors
- [ ] Valid data can be submitted
- [ ] Import button works

### Data Validation
- [ ] Event names must be valid (Prone Match 1, Prone Match 2, 3P, Air Rifle)
- [ ] Divisions must be valid (Open, Junior, Veteran, Master)
- [ ] Series scores must be 0-109
- [ ] Total must match sum of series
- [ ] Required fields are enforced

### API Integration
- [ ] Import calls `/api/admin/scores/import`
- [ ] Auth token is included in request
- [ ] Success messages are shown
- [ ] Error messages are shown
- [ ] Network errors are handled gracefully

## 🔍 What to Look For

### ✅ Good (Expected)
- Page loads without errors
- Tabs switch correctly
- File upload works
- Manual entry form works
- Validation errors are clear
- Success/error messages appear
- No Network Errors in console

### ❌ Bad (Should NOT See)
- "Access Denied" errors (if logged in as admin)
- Network Errors when importing
- Page crashes
- Form doesn't submit
- Validation not working

## 🐛 Known Issues

1. **Backend Required**: The import will fail if backend is not running, but should show a clear error message
2. **Network Errors**: If backend is down, you'll see Network Errors - this is expected and handled gracefully

## 📝 Notes

- The demo user role is **temporarily** set to admin for testing
- After testing, change `role: 'admin'` back to `role: 'user'` in `src/lib/auth.ts`
- The admin page requires authentication AND admin role

---

**Last Updated**: 2024-12-20  
**Status**: Ready for Testing

