# SATRF Website Testing Guide

## Pre-Testing Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Verify backend API is running:**
   - Check that your backend API is accessible at the configured URL
   - Default: `http://localhost:8000/api/v1`

3. **Check environment variables:**
   - Ensure `.env.local` has all required variables (see PRODUCTION_READINESS_SUMMARY.md)

---

## 1. Authentication Testing

### 1.1 Registration Flow
**Test Steps:**
1. Navigate to `/register`
2. Fill in registration form:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@test.com"
   - Password: "TestPass123!"
   - Confirm Password: "TestPass123!"
   - Membership Type: Select "Senior"
   - Club: "Test Club"
3. Click "Register"
4. **Expected:** User registered successfully, redirected to dashboard

**Validation Tests:**
- [ ] Empty fields show error messages
- [ ] Invalid email format shows error
- [ ] Weak password shows validation errors
- [ ] Password mismatch shows error
- [ ] All fields are required

### 1.2 Login Flow
**Test Steps:**
1. Navigate to `/login`
2. Enter credentials:
   - Email: (use registered email or demo@satrf.org.za)
   - Password: (corresponding password or DemoPass123)
3. Click "Login"
4. **Expected:** User logged in, redirected to dashboard

**Validation Tests:**
- [ ] Empty email shows error
- [ ] Invalid email format shows error
- [ ] Empty password shows error
- [ ] Wrong credentials show error message
- [ ] Demo credentials work (if configured)

### 1.3 Logout Flow
**Test Steps:**
1. While logged in, click logout button
2. **Expected:** User logged out, redirected to login page
3. Try accessing `/dashboard` directly
4. **Expected:** Redirected to login page

### 1.4 Protected Routes
**Test Steps:**
1. While logged out, try accessing:
   - `/dashboard`
   - `/profile`
   - `/admin/scores/import`
2. **Expected:** All redirect to login page
3. After login, try accessing `/admin/scores/import` as non-admin user
4. **Expected:** Redirected to dashboard with "Access Denied" message

---

## 2. Public Pages Testing

### 2.1 Homepage (`/`)
**Test Steps:**
1. Navigate to homepage
2. Check all sections load:
   - Hero section
   - Stats section
   - Upcoming events
   - Call-to-action buttons
3. **Expected:** All content displays correctly

**Checks:**
- [ ] Page loads without errors
- [ ] Images load correctly
- [ ] Links work
- [ ] Responsive on mobile/tablet

### 2.2 Events Page (`/events`)
**Test Steps:**
1. Navigate to `/events`
2. Verify events load from API
3. Test filters:
   - Search by event name
   - Filter by status
   - Filter by category
4. Click on an event card
5. **Expected:** Navigate to event detail page

**Checks:**
- [ ] Events display correctly
- [ ] Filters work
- [ ] Search works
- [ ] Event cards are clickable
- [ ] Loading state shows while fetching
- [ ] Error message shows if API fails

### 2.3 Event Detail Page (`/events/[id]`)
**Test Steps:**
1. Navigate to an event detail page
2. Verify all information displays:
   - Event title
   - Description
   - Date and location
   - Requirements
   - Schedule (if available)
   - Contact information
   - Google Map (if coordinates available)
3. Try to register (while logged out)
4. **Expected:** Redirected to login
5. Login and try to register again
6. **Expected:** Registration successful

**Checks:**
- [ ] All event details display
- [ ] Map shows if coordinates provided
- [ ] Registration button works
- [ ] Registration requires login
- [ ] Full events show "Event Full" message
- [ ] Past events show "Registration Closed"

### 2.4 Scores Page (`/scores`)
**Test Steps:**
1. Navigate to `/scores` (while logged out)
2. Verify public scores display
3. Test view modes:
   - Switch between "Scores" and "Leaderboard"
4. Test filters:
   - Filter by category
   - Search by name
5. Test sorting:
   - Sort by score
   - Sort by rank
   - Sort by date

**Checks:**
- [ ] Public scores visible to all
- [ ] Only approved scores shown
- [ ] Filters work correctly
- [ ] Sorting works
- [ ] Leaderboard view works
- [ ] Loading state shows
- [ ] Error handling works

### 2.5 About Page (`/about`)
**Test Steps:**
1. Navigate to `/about`
2. Verify all sections display:
   - Mission
   - Who We Are
   - What We Do
   - Achievements
   - Join Us
   - Contact Information
3. **Expected:** All content displays correctly

### 2.6 Contact Page (`/contact`)
**Test Steps:**
1. Navigate to `/contact`
2. Fill out contact form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Subject: "Test Subject"
   - Category: "General Inquiry"
   - Priority: "Medium"
   - Message: "This is a test message"
3. Submit form
4. **Expected:** Success message displayed

**Validation Tests:**
- [ ] Empty required fields show errors
- [ ] Invalid email shows error
- [ ] Short message shows error
- [ ] Form submits successfully
- [ ] Success toast appears

### 2.7 Coaching Page (`/coaching`)
**Test Steps:**
1. Navigate to `/coaching`
2. Verify all sections display:
   - Hero section
   - Benefits section
   - Coach profiles
   - Contact information
3. Click "Book Free Consultation"
4. **Expected:** Navigate to contact page

### 2.8 Rules Page (`/rules`)
**Test Steps:**
1. Navigate to `/rules`
2. Test search functionality
3. Test category filters
4. Click "View Online" on a rule document
5. Click "Download PDF" on a rule document
6. **Expected:** Links open correctly

### 2.9 Donate Page (`/donate`)
**Test Steps:**
1. Navigate to `/donate`
2. Test payment method selection:
   - Select PayFast
   - Select EFT
3. For PayFast:
   - Select preset amount (R100, R250, R500)
   - Enter custom amount
   - Click "Donate" button
   - **Expected:** Redirects to PayFast (or shows form)
4. For EFT:
   - Verify banking details display
   - Test copy-to-clipboard functionality
   - **Expected:** Details copy correctly

---

## 3. User-Specific Pages Testing

### 3.1 Dashboard (`/dashboard`)
**Test Steps:**
1. Login as a user
2. Navigate to `/dashboard`
3. Verify displays:
   - Welcome message with user's name
   - Stats cards (Total Scores, Best Score, Average Score)
   - User profile information
   - Rankings (if available)
   - Quick action links
4. **Expected:** Only user's own data displayed

**Checks:**
- [ ] Requires authentication
- [ ] Shows user's own scores only
- [ ] Stats calculated from user's scores
- [ ] Quick action links work
- [ ] Loading state shows
- [ ] Error handling works

### 3.2 Profile Page (`/profile`)
**Test Steps:**
1. Navigate to `/profile`
2. Verify all user information displays
3. Click "Edit Profile"
4. Update fields:
   - Phone number
   - Address
   - Emergency contact
5. Click "Save Changes"
6. **Expected:** Profile updated successfully

**Validation Tests:**
- [ ] Requires authentication
- [ ] All fields validate correctly
- [ ] Invalid phone number shows error
- [ ] Profile updates successfully
- [ ] Success message appears
- [ ] Cancel button works

---

## 4. Admin Functionality Testing

### 4.1 Admin Score Import - File Upload
**Test Steps:**
1. Login as admin user
2. Navigate to `/admin/scores/import`
3. Click "Upload Excel/CSV" tab
4. Upload a valid Excel/CSV file
5. **Expected:** File parses, data preview shows
6. Review parsed data
7. Click "Import Scores"
8. **Expected:** Scores imported successfully

**Validation Tests:**
- [ ] Requires admin role
- [ ] Non-admin users redirected
- [ ] Invalid file format shows error
- [ ] Missing required fields show errors
- [ ] Invalid scores show validation errors
- [ ] Valid scores import successfully
- [ ] Error details displayed for invalid rows
- [ ] Success message shows import count

### 4.2 Admin Score Import - Manual Entry
**Test Steps:**
1. Navigate to `/admin/scores/import`
2. Click "Manual Entry" tab
3. Click "Add Row"
4. Fill in score data:
   - Event Name: "Prone Match 1"
   - Match Number: "M001"
   - Shooter Name: "Test Shooter"
   - Club: "Test Club"
   - Division: "Open"
   - Veteran: "N"
   - Series 1-6: Enter valid scores (0-109)
   - Total: Should auto-calculate
5. Add multiple rows
6. Click "Save"
7. **Expected:** Scores saved successfully

**Validation Tests:**
- [ ] Add row button works
- [ ] Remove row button works
- [ ] Total auto-calculates
- [ ] Invalid scores show errors
- [ ] Required fields validated
- [ ] Series scores validated (0-109)
- [ ] Total matches sum of series
- [ ] Multiple rows can be added
- [ ] Only valid rows saved

### 4.3 Admin Access Control
**Test Steps:**
1. Login as regular user (non-admin)
2. Try to access `/admin/scores/import` directly
3. **Expected:** Redirected with "Access Denied" message
4. Login as admin user
5. Access `/admin/scores/import`
6. **Expected:** Page loads successfully

---

## 5. API Integration Testing

### 5.1 Events API
**Test Steps:**
1. Open browser DevTools → Network tab
2. Navigate to `/events`
3. Check API call:
   - **Expected:** GET request to `/api/v1/events`
   - **Expected:** Response contains events array
4. Click on an event
5. Check API call:
   - **Expected:** GET request to `/api/v1/events/[id]`
   - **Expected:** Response contains event details

### 5.2 Scores API
**Test Steps:**
1. Navigate to `/scores`
2. Check API calls:
   - **Expected:** GET request to leaderboard or scores endpoint
   - **Expected:** Response contains scores/leaderboard data
3. Login and navigate to `/dashboard`
4. Check API call:
   - **Expected:** GET request to `/api/v1/scores/my-scores`
   - **Expected:** Response contains only user's scores

### 5.3 Admin Import API
**Test Steps:**
1. As admin, import scores
2. Check API call:
   - **Expected:** POST request to `/api/admin/scores/import`
   - **Expected:** Authorization header present
   - **Expected:** Request body contains scores array
3. Check response:
   - **Expected:** Success response with import count
   - **Expected:** Error details if validation fails

---

## 6. Error Handling Testing

### 6.1 Network Errors
**Test Steps:**
1. Stop backend API server
2. Try to access:
   - `/events`
   - `/scores`
   - `/dashboard`
3. **Expected:** Error messages displayed, not crashes

### 6.2 Invalid Data
**Test Steps:**
1. As admin, try to import invalid scores:
   - Scores > 109
   - Missing required fields
   - Invalid total calculation
2. **Expected:** Validation errors displayed clearly

### 6.3 Authentication Errors
**Test Steps:**
1. Let session expire (or clear tokens)
2. Try to access protected page
3. **Expected:** Redirected to login

---

## 7. SEO & Metadata Testing

### 7.1 Meta Tags
**Test Steps:**
1. For each page, view page source (Ctrl+U)
2. Check for:
   - `<title>` tag
   - `<meta name="description">`
   - `<meta property="og:title">`
   - `<meta property="og:description">`
3. **Expected:** All pages have proper meta tags

### 7.2 Sitemap
**Test Steps:**
1. Navigate to `/sitemap.xml`
2. **Expected:** XML sitemap displays with all public pages

### 7.3 Robots.txt
**Test Steps:**
1. Navigate to `/robots.txt`
2. **Expected:** Robots.txt displays with proper directives

---

## 8. Responsive Design Testing

### 8.1 Mobile Testing
**Test Steps:**
1. Open browser DevTools
2. Switch to mobile view (iPhone, Android)
3. Test all pages:
   - Homepage
   - Events
   - Scores
   - Dashboard
   - Forms
4. **Expected:** All pages responsive, no horizontal scroll

### 8.2 Tablet Testing
**Test Steps:**
1. Test on tablet viewport
2. **Expected:** Layout adapts correctly

---

## 9. Performance Testing

### 9.1 Page Load Times
**Test Steps:**
1. Open DevTools → Network tab
2. Clear cache
3. Load each page and check:
   - Homepage: < 3s
   - Other pages: < 4s
4. **Expected:** Pages load within target times

### 9.2 Image Optimization
**Test Steps:**
1. Check images use Next.js Image component
2. **Expected:** Images optimized and lazy-loaded

---

## 10. Accessibility Testing

### 10.1 Keyboard Navigation
**Test Steps:**
1. Navigate using only keyboard (Tab, Enter, Arrow keys)
2. **Expected:** All interactive elements accessible

### 10.2 Screen Reader
**Test Steps:**
1. Use screen reader (if available)
2. **Expected:** Content is readable and logical

### 10.3 Focus States
**Test Steps:**
1. Tab through page
2. **Expected:** Focus indicators visible on all interactive elements

---

## Test Results Checklist

### Critical Paths ✅
- [ ] User can register
- [ ] User can login
- [ ] User can view events
- [ ] User can view scores (public)
- [ ] User can see own scores in dashboard
- [ ] Admin can import scores
- [ ] Forms validate correctly

### Security ✅
- [ ] Protected routes require authentication
- [ ] Admin routes require admin role
- [ ] Users see only their own data
- [ ] Public scores filtered correctly

### Functionality ✅
- [ ] All API integrations work
- [ ] Error handling works
- [ ] Loading states display
- [ ] Forms submit successfully

### SEO ✅
- [ ] Meta tags present
- [ ] Sitemap accessible
- [ ] Robots.txt accessible

---

## Common Issues & Solutions

### Issue: API calls failing
**Solution:** Check backend API is running and URL is correct in environment variables

### Issue: Admin access denied
**Solution:** Verify user role is set to "admin" in database

### Issue: Scores not showing
**Solution:** Check scores have status "approved" for public visibility

### Issue: Forms not submitting
**Solution:** Check browser console for errors, verify API endpoints

---

## Quick Test Script

Run this quick test sequence:

```bash
# 1. Start dev server
npm run dev

# 2. Test in browser:
# - Visit http://localhost:3000
# - Register new user
# - Login
# - View dashboard
# - View events
# - View scores
# - Try admin import (if admin user)
```

---

## Reporting Issues

When reporting issues, include:
1. **Page/Feature:** Which page or feature
2. **Steps to Reproduce:** Exact steps taken
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happened
5. **Browser/Device:** Browser and device used
6. **Console Errors:** Any errors in browser console
7. **Network Errors:** Any failed API calls in Network tab

---

**Happy Testing! 🎯**
