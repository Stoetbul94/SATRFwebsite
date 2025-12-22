# SATRF Website Launch Readiness Test Checklist

## Test Environment Setup
- [ ] Development environment running on localhost:3000
- [ ] Production environment accessible
- [ ] Test database with sample data
- [ ] Test user accounts created (regular user + admin)
- [ ] Test payment credentials configured
- [ ] Sentry error monitoring enabled
- [ ] SSL certificates installed (production)

---

## 1. User Authentication & Authorization

### 1.1 User Registration
**Test Steps:**
1. Navigate to `/register`
2. Fill form with valid data:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "TestPassword123!"
   - Confirm Password: "TestPassword123!"
3. Click "Register" button

**Expected Results:**
- [ ] Form submits successfully
- [ ] Success message displayed
- [ ] User redirected to dashboard or login page
- [ ] Email verification sent (if enabled)

**Error Scenarios:**
- [ ] Invalid email format shows error
- [ ] Weak password shows validation error
- [ ] Mismatched passwords show error
- [ ] Duplicate email shows error

### 1.2 User Login
**Test Steps:**
1. Navigate to `/login`
2. Enter valid credentials
3. Click "Login" button

**Expected Results:**
- [ ] Login successful
- [ ] User redirected to dashboard
- [ ] User menu visible with user name
- [ ] Session persists across page refreshes

**Error Scenarios:**
- [ ] Invalid credentials show error message
- [ ] Empty fields show validation errors
- [ ] Account lockout after multiple failed attempts

### 1.3 User Logout
**Test Steps:**
1. Login as user
2. Click user menu
3. Click "Logout"

**Expected Results:**
- [ ] User logged out successfully
- [ ] Redirected to home page
- [ ] Session cleared
- [ ] Cannot access protected pages

### 1.4 Admin Authentication
**Test Steps:**
1. Login with admin credentials
2. Navigate to admin pages

**Expected Results:**
- [ ] Admin login successful
- [ ] Admin dashboard accessible
- [ ] Admin menu visible
- [ ] Score import page accessible

### 1.5 Role-Based Access Control
**Test Steps:**
1. Login as regular user
2. Try to access `/admin/scores/import`

**Expected Results:**
- [ ] Access denied message displayed
- [ ] Redirected to appropriate page
- [ ] No admin functionality visible

---

## 2. Score Import & Validation Flow

### 2.1 File Upload - Valid Excel File
**Test Steps:**
1. Login as admin
2. Navigate to `/admin/scores/import`
3. Upload valid Excel file with correct format
4. Review preview data
5. Click "Import" button

**Expected Results:**
- [ ] File uploaded successfully
- [ ] Preview shows correct data
- [ ] Validation passes
- [ ] Import button enabled
- [ ] Success message displayed
- [ ] Data saved to database

**Test Data (Valid Excel):**
```
EventName | MatchNumber | ShooterName | Club | Division | Veteran | Series1 | Series2 | Series3 | Series4 | Series5 | Series6 | Total | Place
Prone Match 1 | 1 | John Smith | SATRF Club A | Open | No | 98 | 99 | 97 | 100 | 98 | 99 | 591 | 1
```

### 2.2 File Upload - Invalid Format
**Test Steps:**
1. Upload file with wrong extension (.txt)
2. Upload file with wrong structure

**Expected Results:**
- [ ] Error message displayed
- [ ] File rejected
- [ ] Import button disabled

### 2.3 Data Validation
**Test Steps:**
1. Upload file with invalid data:
   - Score > 109
   - Invalid event name
   - Missing required fields
   - Invalid division

**Expected Results:**
- [ ] Validation errors displayed
- [ ] Specific error messages for each issue
- [ ] Import button disabled until fixed

### 2.4 Preview Modal
**Test Steps:**
1. Upload valid file
2. Click "Preview" button

**Expected Results:**
- [ ] Modal opens
- [ ] Data displayed in table format
- [ ] All columns visible
- [ ] Close button works

### 2.5 Import Button State
**Test Steps:**
1. Navigate to import page
2. Upload various file types
3. Observe button state

**Expected Results:**
- [ ] Button disabled initially
- [ ] Button enabled after valid file upload
- [ ] Button disabled after validation errors

---

## 3. Manual Score Entry & Editing

### 3.1 Manual Entry Form
**Test Steps:**
1. Navigate to manual entry tab
2. Fill all required fields:
   - Shooter Name: "Jane Doe"
   - Club: "SATRF Club B"
   - Division: "Open"
   - Series scores: 95, 96, 94, 97, 95, 96
3. Click "Save"

**Expected Results:**
- [ ] Form saves successfully
- [ ] Success message displayed
- [ ] Data appears in results

### 3.2 Input Validation
**Test Steps:**
1. Enter invalid scores (>109)
2. Leave required fields empty
3. Enter non-numeric values

**Expected Results:**
- [ ] Validation errors displayed
- [ ] Form prevents submission
- [ ] Clear error messages

### 3.3 Score Editing
**Test Steps:**
1. Navigate to scores list
2. Click edit button for existing score
3. Modify values
4. Save changes

**Expected Results:**
- [ ] Edit form opens with current data
- [ ] Changes save successfully
- [ ] Updated data visible in results

---

## 4. Results Display & Filtering

### 4.1 Results Page Load
**Test Steps:**
1. Navigate to `/results`
2. Verify page loads with data

**Expected Results:**
- [ ] Page loads within 3 seconds
- [ ] Results table visible
- [ ] Sample data displayed correctly
- [ ] All columns present

### 4.2 Event Filtering
**Test Steps:**
1. Select "Prone Match 1" from event filter
2. Verify filtered results

**Expected Results:**
- [ ] Only Prone Match 1 results shown
- [ ] Other events hidden
- [ ] Filter state maintained

### 4.3 Division Filtering
**Test Steps:**
1. Select "Veteran" from division filter
2. Verify filtered results

**Expected Results:**
- [ ] Only veteran results shown
- [ ] Other divisions hidden
- [ ] Veteran status correctly identified

### 4.4 Veteran Status Filter
**Test Steps:**
1. Toggle veteran filter
2. Verify results change

**Expected Results:**
- [ ] Only veteran shooters shown when enabled
- [ ] All shooters shown when disabled

### 4.5 Sorting Functionality
**Test Steps:**
1. Click "Total" column header
2. Click "Name" column header
3. Click "Place" column header

**Expected Results:**
- [ ] Results sort by total score (descending)
- [ ] Results sort alphabetically by name
- [ ] Results sort by place (ascending)
- [ ] Sort indicators visible

### 4.6 Mobile Responsiveness
**Test Steps:**
1. View on mobile device (375x667)
2. Test table scrolling
3. Test filter interactions

**Expected Results:**
- [ ] Page fits mobile screen
- [ ] Table scrolls horizontally
- [ ] Filters work on mobile
- [ ] Touch interactions work

---

## 5. Donate Page & Payment Integration

### 5.1 Page Content
**Test Steps:**
1. Navigate to `/donate`
2. Verify all content loads

**Expected Results:**
- [ ] Hero section visible
- [ ] Payment options displayed
- [ ] Preset amounts shown
- [ ] Banking details available

### 5.2 Preset Amount Selection
**Test Steps:**
1. Click R100 button
2. Click R250 button
3. Click R500 button

**Expected Results:**
- [ ] Selected amount highlighted
- [ ] Custom amount cleared
- [ ] PayFast amount updated

### 5.3 Custom Amount Entry
**Test Steps:**
1. Enter custom amount: "750"
2. Verify amount selection

**Expected Results:**
- [ ] Custom amount accepted
- [ ] Preset buttons deselected
- [ ] PayFast amount updated to R750.00

### 5.4 PayFast Integration
**Test Steps:**
1. Select amount
2. Click "Pay with PayFast"
3. Verify form submission

**Expected Results:**
- [ ] PayFast form loads
- [ ] Correct amount passed
- [ ] Merchant details correct
- [ ] Return URL configured

### 5.5 EFT Banking Details
**Test Steps:**
1. Switch to EFT tab
2. Verify banking details
3. Test copy functionality

**Expected Results:**
- [ ] Banking details displayed
- [ ] Account number: 02 233 062 3
- [ ] Copy buttons work
- [ ] Success feedback shown

### 5.6 Thank You Page
**Test Steps:**
1. Navigate to `/donate/thank-you`
2. Verify page content

**Expected Results:**
- [ ] Thank you message displayed
- [ ] Confirmation details shown
- [ ] Return to home link works

---

## 6. Rules & FAQ Pages

### 6.1 Rules Page
**Test Steps:**
1. Navigate to `/rules`
2. Verify content loads

**Expected Results:**
- [ ] Page loads without errors
- [ ] Competition rules content visible
- [ ] Proper formatting
- [ ] Navigation works

### 6.2 FAQ Page
**Test Steps:**
1. Navigate to `/faq`
2. Test accordion functionality

**Expected Results:**
- [ ] FAQ items displayed
- [ ] Click to expand works
- [ ] Click to collapse works
- [ ] Content properly formatted

---

## 7. Site Navigation & Responsiveness

### 7.1 Header Navigation
**Test Steps:**
1. Test all navigation links:
   - Home
   - Events
   - Results
   - About
   - Contact
   - Donate

**Expected Results:**
- [ ] All links work
- [ ] Correct pages load
- [ ] Active state indicated
- [ ] No broken links

### 7.2 Footer Links
**Test Steps:**
1. Test footer links:
   - Privacy Policy
   - Terms of Service
   - Contact Info

**Expected Results:**
- [ ] All links work
- [ ] Pages load correctly
- [ ] Contact information accurate

### 7.3 Desktop Responsiveness
**Test Steps:**
1. View on desktop (1920x1080)
2. Test all interactions

**Expected Results:**
- [ ] Desktop navigation visible
- [ ] Full layout displayed
- [ ] All functionality works

### 7.4 Mobile Responsiveness
**Test Steps:**
1. View on mobile (375x667)
2. Test mobile menu
3. Test touch interactions

**Expected Results:**
- [ ] Mobile menu visible
- [ ] Hamburger menu works
- [ ] Touch targets appropriate size
- [ ] No horizontal scroll issues

### 7.5 Breadcrumbs
**Test Steps:**
1. Navigate to nested pages
2. Verify breadcrumb trail

**Expected Results:**
- [ ] Breadcrumbs visible
- [ ] Correct hierarchy shown
- [ ] Links work
- [ ] Current page indicated

---

## 8. Error Monitoring & Reporting

### 8.1 Sentry Integration
**Test Steps:**
1. Open browser console
2. Trigger test error
3. Check Sentry dashboard

**Expected Results:**
- [ ] Sentry script loaded
- [ ] Errors captured
- [ ] Error details logged
- [ ] No console errors

### 8.2 User-Friendly Error Messages
**Test Steps:**
1. Trigger API errors
2. Test network failures
3. Test validation errors

**Expected Results:**
- [ ] Clear error messages
- [ ] Helpful guidance provided
- [ ] No technical jargon
- [ ] Recovery options shown

### 8.3 404 Error Handling
**Test Steps:**
1. Navigate to non-existent page
2. Verify 404 page

**Expected Results:**
- [ ] Custom 404 page displayed
- [ ] Helpful navigation options
- [ ] Search functionality available

---

## 9. Performance & Accessibility

### 9.1 Page Load Times
**Test Steps:**
1. Measure load times for key pages:
   - Home page
   - Results page
   - Admin pages

**Expected Results:**
- [ ] Home page < 3 seconds
- [ ] Results page < 5 seconds
- [ ] Admin pages < 4 seconds

### 9.2 Keyboard Navigation
**Test Steps:**
1. Use Tab key to navigate
2. Use Enter key to activate
3. Use Escape key to close modals

**Expected Results:**
- [ ] All interactive elements accessible
- [ ] Focus indicators visible
- [ ] Logical tab order
- [ ] Keyboard shortcuts work

### 9.3 ARIA Labels
**Test Steps:**
1. Inspect interactive elements
2. Verify ARIA attributes

**Expected Results:**
- [ ] Navigation has aria-label
- [ ] Forms have proper labels
- [ ] Buttons have descriptive text
- [ ] Images have alt text

### 9.4 Heading Hierarchy
**Test Steps:**
1. Check heading structure
2. Verify semantic markup

**Expected Results:**
- [ ] One H1 per page
- [ ] Logical heading order
- [ ] No skipped levels
- [ ] Descriptive headings

---

## 10. Deployment & Environment Validation

### 10.1 Environment Variables
**Test Steps:**
1. Check environment configuration
2. Verify API endpoints

**Expected Results:**
- [ ] All required env vars set
- [ ] API URLs correct
- [ ] Database connections work
- [ ] External services configured

### 10.2 API Endpoints
**Test Steps:**
1. Test health check endpoint
2. Test all API routes
3. Verify response formats

**Expected Results:**
- [ ] Health check returns 200
- [ ] All endpoints respond
- [ ] JSON responses valid
- [ ] Error handling works

### 10.3 HTTPS & SSL
**Test Steps:**
1. Verify HTTPS in production
2. Check SSL certificate
3. Test security headers

**Expected Results:**
- [ ] HTTPS enforced
- [ ] Valid SSL certificate
- [ ] Security headers present
- [ ] No mixed content warnings

---

## Test Data Requirements

### Sample Users
```
Regular User:
- Email: test@example.com
- Password: TestPassword123!
- Name: Test User

Admin User:
- Email: admin@satrf.co.za
- Password: AdminPassword123!
```

### Sample Score Data
```
Valid Excel Format:
- EventName: "Prone Match 1"
- MatchNumber: "1"
- ShooterName: "John Smith"
- Club: "SATRF Club A"
- Division: "Open"
- Veteran: "No"
- Series1-6: 98, 99, 97, 100, 98, 99
- Total: 591
- Place: 1
```

### Test Files
- [ ] Valid Excel file with correct format
- [ ] Invalid Excel file with wrong structure
- [ ] Text file for format validation
- [ ] Large file for performance testing

---

## Pass/Fail Criteria

### Critical (Must Pass)
- [ ] User authentication works
- [ ] Admin access control functions
- [ ] Score import validates correctly
- [ ] Results display and filter properly
- [ ] Payment integration functional
- [ ] Site loads on mobile devices
- [ ] No security vulnerabilities
- [ ] SSL certificate valid

### Important (Should Pass)
- [ ] All navigation links work
- [ ] Error messages are user-friendly
- [ ] Performance meets benchmarks
- [ ] Accessibility standards met
- [ ] Responsive design works
- [ ] API endpoints respond

### Nice to Have
- [ ] Advanced filtering options
- [ ] Export functionality
- [ ] Advanced search
- [ ] Performance optimizations
- [ ] Additional accessibility features

---

## Test Execution Notes

### Environment Setup
- Use incognito/private browsing for each test
- Clear browser cache between tests
- Use different browsers (Chrome, Firefox, Safari)
- Test on different devices (desktop, tablet, mobile)

### Bug Reporting
- Screenshot all failures
- Note exact steps to reproduce
- Include browser/device information
- Document error messages
- Test on multiple browsers

### Sign-off Requirements
- All critical tests must pass
- No security vulnerabilities
- Performance benchmarks met
- Accessibility standards satisfied
- Mobile responsiveness verified
- Payment integration tested
- Error handling validated

---

## Post-Launch Monitoring

### Key Metrics to Track
- [ ] Page load times
- [ ] Error rates
- [ ] User registration success
- [ ] Score import success rate
- [ ] Payment completion rate
- [ ] Mobile vs desktop usage
- [ ] Most visited pages
- [ ] User feedback/support tickets

### Monitoring Tools
- [ ] Sentry for error tracking
- [ ] Google Analytics for usage
- [ ] PageSpeed Insights for performance
- [ ] Browser console for client-side errors
- [ ] Server logs for backend issues 