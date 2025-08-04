# SATRF Website - Manual Testing Checklist

## Overview
This comprehensive manual testing checklist ensures the SATRF website is fully ready for production deployment. Test all features systematically, focusing on critical user flows, security, accessibility, and responsive behavior.

---

## 🚨 CRITICAL PRIORITY TESTS

### 1. User Authentication System

#### 1.1 User Registration
**Priority: CRITICAL**

- [ ] **Test Registration Form Access**
  - Navigate to `/register` from homepage
  - Verify form loads correctly with all required fields
  - Check that "Join SATRF" button in navbar links to registration

- [ ] **Test Form Validation**
  - Submit empty form → Should show validation errors for all required fields
  - Test first name: enter "A" → Should show "First name must be at least 2 characters"
  - Test last name: enter "A" → Should show "Last name must be at least 2 characters"
  - Test email: enter "invalid-email" → Should show "Please enter a valid email"
  - Test password: enter "weak" → Should show password strength requirements
  - Test confirm password: enter different password → Should show "Passwords must match"
  - Test club name: enter "A" → Should show "Club name must be at least 2 characters"

- [ ] **Test Successful Registration**
  - Fill all fields with valid data
  - Submit form → Should show success message
  - Verify user is redirected to login page
  - Check that account is created in database

- [ ] **Test Duplicate Email**
  - Try registering with existing email → Should show "Email already registered"

#### 1.2 User Login
**Priority: CRITICAL**

- [ ] **Test Login Form Access**
  - Navigate to `/login` from homepage
  - Verify form loads with email and password fields
  - Check "Remember me" checkbox is present

- [ ] **Test Invalid Credentials**
  - Enter wrong email/password → Should show "Invalid credentials" error
  - Enter empty fields → Should show validation errors

- [ ] **Test Successful Login**
  - Enter valid credentials → Should redirect to dashboard
  - Verify JWT token is stored securely
  - Check navbar shows user name and logout button

- [ ] **Test Remember Me**
  - Check "Remember me" and login → Close browser, reopen → Should stay logged in

#### 1.3 Password Reset
**Priority: CRITICAL**

- [ ] **Test Forgot Password**
  - Click "Forgot Password" link on login page
  - Enter valid email → Should show "Reset email sent" message
  - Enter invalid email → Should show appropriate error

- [ ] **Test Password Reset Flow**
  - Check email for reset link (if email service configured)
  - Click reset link → Should open password reset form
  - Enter new password → Should allow login with new password

#### 1.4 User Logout
**Priority: CRITICAL**

- [ ] **Test Logout Functionality**
  - Click logout button in navbar → Should redirect to homepage
  - Verify JWT token is cleared
  - Try accessing protected pages → Should redirect to login

- [ ] **Test Session Expiry**
  - Wait for token to expire (if configured) → Should redirect to login
  - Try accessing dashboard with expired token → Should show login page

---

### 2. User Profile and Dashboard

#### 2.1 Profile Management
**Priority: HIGH**

- [ ] **Test Profile Access**
  - Login and navigate to `/profile` → Should show user information
  - Verify all profile fields are populated correctly

- [ ] **Test Profile Editing**
  - Click "Edit Profile" → Should open edit form
  - Modify first name → Should save and update display
  - Modify last name → Should save and update display
  - Modify club name → Should save and update display
  - Test phone number validation → Should accept valid formats
  - Test date of birth validation → Should reject future dates

- [ ] **Test Password Change**
  - Navigate to password change section
  - Enter current password + new password → Should update successfully
  - Enter wrong current password → Should show error

#### 2.2 User Dashboard
**Priority: HIGH**

- [ ] **Test Dashboard Access**
  - Login and navigate to `/dashboard` → Should show personal overview
  - Verify dashboard loads with user's data

- [ ] **Test Dashboard Content**
  - Check personal scores are displayed
  - Verify recent events are shown
  - Test analytics/statistics display
  - Check quick action buttons work

- [ ] **Test Dashboard Navigation**
  - Click on score entries → Should navigate to detailed view
  - Click on event entries → Should navigate to event details

---

### 3. Events Calendar System

#### 3.1 Events Display
**Priority: HIGH**

- [ ] **Test Events Page Access**
  - Navigate to `/events` → Should show events calendar
  - Verify events are displayed in calendar format
  - Check list view option works

- [ ] **Test Event Filtering**
  - Use discipline filter → Should filter events by discipline
  - Use date range filter → Should filter events by date
  - Use status filter → Should filter open/closed events
  - Use search function → Should find events by title/location

- [ ] **Test Event Details**
  - Click on any event → Should open event details modal
  - Verify all event information is displayed correctly
  - Check event description, location, dates, capacity

#### 3.2 Event Registration
**Priority: HIGH**

- [ ] **Test Event Registration (Logged In)**
  - Login and navigate to events
  - Click "Register" on open event → Should register successfully
  - Verify registration confirmation message
  - Check event shows as "Registered" status

- [ ] **Test Event Registration (Not Logged In)**
  - Try to register without login → Should redirect to login page
  - After login → Should return to events page

- [ ] **Test Event Unregistration**
  - Click "Cancel Registration" on registered event → Should cancel successfully
  - Verify cancellation confirmation message
  - Check event shows as available again

- [ ] **Test Registration Limits**
  - Try registering for full event → Should show "Event Full" message
  - Verify spot count updates correctly

#### 3.3 Event Calendar Features
**Priority: MEDIUM**

- [ ] **Test Calendar Navigation**
  - Use month/week/day view buttons → Should change calendar view
  - Navigate between months → Should load correct events
  - Test today button → Should return to current date

- [ ] **Test Event Categories**
  - Filter by ISSF events → Should show only ISSF events
  - Filter by local events → Should show only local events
  - Test multiple category selection

---

### 4. Coaching Page

#### 4.1 Page Content and Navigation
**Priority: MEDIUM**

- [ ] **Test Page Access**
  - Navigate to `/coaching` → Should load coaching services page
  - Verify hero section displays correctly

- [ ] **Test Content Accuracy**
  - Check coach profiles are displayed correctly
  - Verify coach credentials and achievements
  - Test coach contact information (email, phone)
  - Check testimonials section loads

- [ ] **Test CTA Buttons**
  - Click "Book Your Free Consultation" → Should navigate to contact page
  - Verify contact form pre-fills with "coaching" service
  - Click "Meet Our Coaches" → Should scroll to coaches section
  - Test phone number links → Should open phone dialer

#### 4.2 Responsive Design
**Priority: MEDIUM**

- [ ] **Test Mobile Layout**
  - View on mobile device → Should display properly
  - Test coach cards stack correctly
  - Verify CTA buttons are accessible on mobile

- [ ] **Test Desktop Layout**
  - View on desktop → Should use full width effectively
  - Check coach profiles display in grid format

---

### 5. Leaderboard System

#### 5.1 Leaderboard Access
**Priority: HIGH**

- [ ] **Test Leaderboard Page**
  - Navigate to `/scores/leaderboard` → Should load leaderboard
  - Verify rankings are displayed correctly
  - Check user names, clubs, scores are shown

- [ ] **Test Leaderboard Filtering**
  - Use discipline filter → Should filter by shooting discipline
  - Use category filter (junior/senior/veteran) → Should filter by age category
  - Use time period filter → Should filter by date range
  - Test multiple filter combinations

#### 5.2 Leaderboard Functionality
**Priority: HIGH**

- [ ] **Test Sorting**
  - Click on score columns → Should sort by score
  - Click on rank columns → Should sort by rank
  - Verify sorting works in both ascending/descending order

- [ ] **Test Pagination**
  - Navigate through multiple pages → Should load correct data
  - Check page numbers and navigation buttons
  - Verify results per page selector works

- [ ] **Test Data Accuracy**
  - Verify scores match user submissions
  - Check rankings are calculated correctly
  - Test that only approved scores are included

#### 5.3 Accessibility
**Priority: MEDIUM**

- [ ] **Test Keyboard Navigation**
  - Use Tab key to navigate leaderboard → Should be accessible
  - Use arrow keys to navigate → Should work properly

- [ ] **Test Screen Reader**
  - Use screen reader → Should announce rankings and scores
  - Verify table headers are properly labeled

---

### 6. Rules & Documentation

#### 6.1 Rules Page Access
**Priority: MEDIUM**

- [ ] **Test Page Navigation**
  - Navigate to `/rules` → Should load rules documentation page
  - Verify all rule categories are displayed

- [ ] **Test Search Functionality**
  - Use search bar → Should filter documents by title/description
  - Test search with partial terms → Should find relevant documents
  - Test search with no results → Should show "no results" message

#### 6.2 Document Access
**Priority: MEDIUM**

- [ ] **Test Document Links**
  - Click "View Online" → Should open ISSF website in new tab
  - Click "Download PDF" → Should download PDF file
  - Test all document types (Technical, Rifle, Anti-Doping, Disciplinary)

- [ ] **Test Download All**
  - Click "Download All PDFs" → Should open all PDFs in new tabs
  - Verify all available PDFs are accessible

- [ ] **Test External Links**
  - Verify all external links open in new tabs
  - Check that links point to correct ISSF pages

#### 6.3 Content Organization
**Priority: LOW**

- [ ] **Test Category Filtering**
  - Use category filters → Should show only relevant documents
  - Test "All Documents" filter → Should show all documents

- [ ] **Test Document Display**
  - Verify document descriptions are accurate
  - Check document icons are displayed correctly

---

### 7. Donate Page

#### 7.1 Payment Form
**Priority: HIGH**

- [ ] **Test Page Access**
  - Navigate to `/donate` → Should load donation page
  - Verify donation options are displayed

- [ ] **Test Payment Method Selection**
  - Click "PayFast" → Should show PayFast form
  - Click "EFT Transfer" → Should show banking details
  - Verify payment method switching works

#### 7.2 PayFast Integration
**Priority: HIGH**

- [ ] **Test Amount Selection**
  - Click preset amounts (R100, R250, R500) → Should select correctly
  - Enter custom amount → Should update form
  - Test minimum amount validation (R10)

- [ ] **Test PayFast Form**
  - Fill donation form → Should submit to PayFast
  - Verify all hidden fields are populated correctly
  - Test form opens in new tab/window

- [ ] **Test Form Validation**
  - Submit with invalid amount → Should show validation error
  - Test amount formatting → Should display as RXXX.XX

#### 7.3 EFT Transfer
**Priority: MEDIUM**

- [ ] **Test Banking Details**
  - Verify account details are displayed correctly
  - Test "Copy to Clipboard" buttons → Should copy details
  - Verify reference format is shown

- [ ] **Test Contact Information**
  - Check email address is correct
  - Verify phone number is displayed

#### 7.4 Success/Failure Flows
**Priority: HIGH**

- [ ] **Test Success Flow**
  - Complete PayFast donation → Should redirect to thank you page
  - Verify thank you page displays correctly

- [ ] **Test Failure Flow**
  - Cancel PayFast payment → Should return to donate page
  - Verify error handling works properly

---

### 8. Navigation and UI Elements

#### 8.1 Navbar Functionality
**Priority: HIGH**

- [ ] **Test Desktop Navigation**
  - Click all navbar links → Should navigate to correct pages
  - Verify active page is highlighted
  - Test logo click → Should return to homepage

- [ ] **Test Mobile Navigation**
  - Open mobile menu → Should display all navigation options
  - Click hamburger menu → Should toggle menu
  - Test all mobile menu links → Should work correctly
  - Verify menu closes after navigation

- [ ] **Test User Menu**
  - Login → Should show user name and dashboard link
  - Click dashboard → Should navigate to user dashboard
  - Click logout → Should log out user

#### 8.2 Footer Functionality
**Priority: MEDIUM**

- [ ] **Test Footer Links**
  - Click all footer links → Should navigate to correct pages
  - Test social media links → Should open in new tabs
  - Verify contact information is correct

- [ ] **Test Footer Content**
  - Check copyright information is current
  - Verify SATRF logo is displayed
  - Test responsive layout on mobile

#### 8.3 Responsive Design
**Priority: HIGH**

- [ ] **Test Desktop Layout (1920x1080)**
  - Verify all elements display correctly
  - Check navigation is horizontal
  - Test hover effects work

- [ ] **Test Tablet Layout (768x1024)**
  - Verify responsive breakpoints work
  - Check navigation adapts properly
  - Test form layouts adjust

- [ ] **Test Mobile Layout (375x667)**
  - Verify mobile menu works
  - Check all content is readable
  - Test touch interactions work
  - Verify no horizontal scrolling

- [ ] **Test Landscape Mobile (667x375)**
  - Verify layout adapts to landscape
  - Check navigation remains accessible

---

## 🔒 SECURITY TESTING

### 9. Security Validation
**Priority: CRITICAL**

- [ ] **Test Unauthorized Access**
  - Try accessing `/dashboard` without login → Should redirect to login
  - Try accessing `/admin` without admin rights → Should show access denied
  - Test direct URL access to protected pages

- [ ] **Test Input Validation**
  - Enter SQL injection in forms → Should be sanitized
  - Enter XSS scripts in text fields → Should be escaped
  - Test file upload with malicious files → Should be rejected

- [ ] **Test Session Security**
  - Copy session token → Should not work in different browser
  - Test concurrent login → Should handle properly
  - Verify HTTPS is enforced on all pages

- [ ] **Test CSRF Protection**
  - Try submitting forms without CSRF token → Should be rejected
  - Test form resubmission → Should be prevented

---

## ♿ ACCESSIBILITY TESTING

### 10. Accessibility Compliance
**Priority: HIGH**

- [ ] **Test Keyboard Navigation**
  - Use Tab key to navigate entire site → Should be logical order
  - Use Enter/Space to activate buttons → Should work
  - Test skip links → Should jump to main content

- [ ] **Test Screen Reader**
  - Use screen reader on all pages → Should announce content properly
  - Verify form labels are associated correctly
  - Test error messages are announced

- [ ] **Test Color Contrast**
  - Verify text has sufficient contrast against backgrounds
  - Test color-blind friendly design
  - Check focus indicators are visible

- [ ] **Test Alt Text**
  - Verify all images have descriptive alt text
  - Test decorative images have empty alt attributes
  - Check logo alt text is meaningful

---

## ⚡ PERFORMANCE TESTING

### 11. Performance Validation
**Priority: MEDIUM**

- [ ] **Test Page Load Times**
  - Homepage loads in < 3 seconds
  - Events page loads in < 4 seconds
  - Leaderboard loads in < 5 seconds
  - Profile page loads in < 2 seconds

- [ ] **Test Image Optimization**
  - Verify images are properly compressed
  - Check responsive images load correct sizes
  - Test lazy loading works on long pages

- [ ] **Test Form Responsiveness**
  - Submit forms → Should show loading states
  - Verify no double submissions
  - Test error handling doesn't freeze page

---

## 📱 CROSS-BROWSER TESTING

### 12. Browser Compatibility
**Priority: HIGH**

- [ ] **Test Chrome (Latest)**
  - All features work correctly
  - No console errors
  - Responsive design works

- [ ] **Test Firefox (Latest)**
  - All features work correctly
  - No console errors
  - Responsive design works

- [ ] **Test Safari (Latest)**
  - All features work correctly
  - No console errors
  - Responsive design works

- [ ] **Test Edge (Latest)**
  - All features work correctly
  - No console errors
  - Responsive design works

---

## 📊 ISSUE LOGGING

### How to Log Issues

For each test that fails, document:

1. **Test Case**: Which test failed
2. **Priority**: CRITICAL/HIGH/MEDIUM/LOW
3. **Steps to Reproduce**: Exact steps taken
4. **Expected Result**: What should happen
5. **Actual Result**: What actually happened
6. **Browser/Device**: What was used for testing
7. **Screenshots**: If applicable
8. **Console Errors**: Any JavaScript errors

### Issue Priority Definitions

- **CRITICAL**: Blocks core functionality, security vulnerability, data loss risk
- **HIGH**: Major feature broken, poor user experience, accessibility issue
- **MEDIUM**: Minor feature issue, cosmetic problem, performance concern
- **LOW**: Nice-to-have improvement, minor UI tweak

---

## ✅ COMPLETION CHECKLIST

Before marking testing complete:

- [ ] All CRITICAL priority tests pass
- [ ] All HIGH priority tests pass
- [ ] All MEDIUM priority tests pass
- [ ] All security tests pass
- [ ] All accessibility tests pass
- [ ] Cross-browser testing completed
- [ ] Performance benchmarks met
- [ ] All issues logged and prioritized
- [ ] Stakeholder approval received

---

**Last Updated**: [Date]
**Tested By**: [Name]
**Version**: [Website Version] 