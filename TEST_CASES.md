# SATRF Website - Test Cases

## Overview
This document contains comprehensive test cases for the SATRF website, covering all major user workflows and system functionality.

---

## Table of Contents
1. [Registration Test Cases](#registration-test-cases)
2. [Event Signup Test Cases](#event-signup-test-cases)
3. [Score Upload Test Cases](#score-upload-test-cases)
4. [Leaderboard Test Cases](#leaderboard-test-cases)
5. [Admin Workflow Test Cases](#admin-workflow-test-cases)
6. [Authentication Test Cases](#authentication-test-cases)
7. [Performance Test Cases](#performance-test-cases)
8. [Security Test Cases](#security-test-cases)

---

## Registration Test Cases

### TC-REG-001: Successful User Registration
**Priority:** High  
**Type:** Positive  
**Precondition:** User is on registration page

**Test Steps:**
1. Navigate to registration page
2. Enter valid first name: "John"
3. Enter valid last name: "Doe"
4. Enter valid email: "john.doe@example.com"
5. Enter valid password: "SecurePass123"
6. Confirm password: "SecurePass123"
7. Select membership type: "senior"
8. Enter club name: "Cape Town Shooting Club"
9. Accept terms and conditions
10. Click "Create Account"

**Expected Results:**
- Account created successfully
- Success message displayed
- User redirected to login page
- Email verification sent (if configured)

### TC-REG-002: Registration with Invalid Email
**Priority:** High  
**Type:** Negative  
**Precondition:** User is on registration page

**Test Steps:**
1. Fill all fields with valid data
2. Enter invalid email: "invalid-email"
3. Click "Create Account"

**Expected Results:**
- Form validation error displayed
- Account not created
- User remains on registration page

### TC-REG-003: Registration with Weak Password
**Priority:** High  
**Type:** Negative  
**Precondition:** User is on registration page

**Test Steps:**
1. Fill all fields with valid data
2. Enter weak password: "123"
3. Click "Create Account"

**Expected Results:**
- Password strength error displayed
- Account not created
- User remains on registration page

### TC-REG-004: Registration with Mismatched Passwords
**Priority:** High  
**Type:** Negative  
**Precondition:** User is on registration page

**Test Steps:**
1. Fill all fields with valid data
2. Enter password: "SecurePass123"
3. Enter confirm password: "DifferentPass123"
4. Click "Create Account"

**Expected Results:**
- Password mismatch error displayed
- Account not created
- User remains on registration page

### TC-REG-005: Registration with Existing Email
**Priority:** Medium  
**Type:** Negative  
**Precondition:** User account already exists with email "existing@example.com"

**Test Steps:**
1. Fill all fields with valid data
2. Enter existing email: "existing@example.com"
3. Click "Create Account"

**Expected Results:**
- Email already exists error displayed
- Account not created
- User remains on registration page

### TC-REG-006: Registration with Empty Required Fields
**Priority:** High  
**Type:** Negative  
**Precondition:** User is on registration page

**Test Steps:**
1. Leave first name empty
2. Fill all other fields with valid data
3. Click "Create Account"

**Expected Results:**
- Field validation error displayed
- Account not created
- User remains on registration page

---

## Event Signup Test Cases

### TC-EVT-001: Successful Event Registration
**Priority:** High  
**Type:** Positive  
**Precondition:** User is logged in, event is open for registration

**Test Steps:**
1. Navigate to events page
2. Click on an open event
3. Click "Register" button
4. Review event details
5. Confirm registration

**Expected Results:**
- Registration successful
- Confirmation message displayed
- User added to event participants
- Confirmation email sent
- Event participant count updated

### TC-EVT-002: Event Registration for Full Event
**Priority:** Medium  
**Type:** Negative  
**Precondition:** Event is at maximum capacity

**Test Steps:**
1. Navigate to full event page
2. Attempt to click "Register" button

**Expected Results:**
- Register button disabled or shows "Event Full"
- Registration not allowed
- Clear indication that event is full

### TC-EVT-003: Event Registration for Closed Event
**Priority:** Medium  
**Type:** Negative  
**Precondition:** Event registration is closed

**Test Steps:**
1. Navigate to closed event page
2. Attempt to register

**Expected Results:**
- Register button not available
- Clear indication that registration is closed
- Registration deadline displayed

### TC-EVT-004: Event Registration for Non-Logged User
**Priority:** High  
**Type:** Negative  
**Precondition:** User is not logged in

**Test Steps:**
1. Navigate to event page while not logged in
2. Click "Register" button

**Expected Results:**
- Redirected to login page
- Registration not completed
- Return to event page after login

### TC-EVT-005: Event Unregistration
**Priority:** Medium  
**Type:** Positive  
**Precondition:** User is registered for an event

**Test Steps:**
1. Navigate to user dashboard
2. Find registered event
3. Click "Unregister" button
4. Confirm unregistration

**Expected Results:**
- Unregistration successful
- User removed from event participants
- Event participant count updated
- Confirmation message displayed

### TC-EVT-006: Event Registration with Payment
**Priority:** High  
**Type:** Positive  
**Precondition:** Event requires payment, user is logged in

**Test Steps:**
1. Navigate to paid event
2. Click "Register" button
3. Review payment details
4. Complete payment process
5. Confirm registration

**Expected Results:**
- Payment processed successfully
- Registration confirmed
- Payment receipt generated
- User added to event participants

---

## Score Upload Test Cases

### TC-SCR-001: Successful Score Upload
**Priority:** High  
**Type:** Positive  
**Precondition:** User is logged in, event exists

**Test Steps:**
1. Navigate to score upload page
2. Select event from dropdown
3. Select discipline
4. Enter score: 595
5. Enter X-count: 45
6. Add notes: "Good performance"
7. Upload score sheet file
8. Click "Submit Score"

**Expected Results:**
- Score uploaded successfully
- Status set to "Pending"
- Confirmation message displayed
- Score appears in user's score history
- Email notification sent to admins

### TC-SCR-002: Score Upload with Invalid Score
**Priority:** High  
**Type:** Negative  
**Precondition:** User is on score upload page

**Test Steps:**
1. Fill all fields with valid data
2. Enter invalid score: 650
3. Click "Submit Score"

**Expected Results:**
- Score validation error displayed
- Score not uploaded
- User remains on upload page

### TC-SCR-003: Score Upload with Large File
**Priority:** Medium  
**Type:** Negative  
**Precondition:** User is on score upload page

**Test Steps:**
1. Fill all fields with valid data
2. Upload file larger than 10MB
3. Click "Submit Score"

**Expected Results:**
- File size error displayed
- Score not uploaded
- User remains on upload page

### TC-SCR-004: Score Upload with Invalid File Type
**Priority:** Medium  
**Type:** Negative  
**Precondition:** User is on score upload page

**Test Steps:**
1. Fill all fields with valid data
2. Upload file with invalid extension (.txt)
3. Click "Submit Score"

**Expected Results:**
- File type error displayed
- Score not uploaded
- User remains on upload page

### TC-SCR-005: Score Upload Without Required Fields
**Priority:** High  
**Type:** Negative  
**Precondition:** User is on score upload page

**Test Steps:**
1. Leave event selection empty
2. Fill other fields with valid data
3. Click "Submit Score"

**Expected Results:**
- Field validation error displayed
- Score not uploaded
- User remains on upload page

### TC-SCR-006: Score Upload for Non-Existent Event
**Priority:** Medium  
**Type:** Negative  
**Precondition:** User is on score upload page

**Test Steps:**
1. Select non-existent event from dropdown
2. Fill other fields with valid data
3. Click "Submit Score"

**Expected Results:**
- Event validation error displayed
- Score not uploaded
- User remains on upload page

### TC-SCR-007: Score Edit (Pending Status)
**Priority:** Medium  
**Type:** Positive  
**Precondition:** User has pending score

**Test Steps:**
1. Navigate to score history
2. Find pending score
3. Click "Edit" button
4. Modify score details
5. Click "Save Changes"

**Expected Results:**
- Score updated successfully
- Changes saved to database
- Confirmation message displayed

### TC-SCR-008: Score Edit (Approved Status)
**Priority:** Medium  
**Type:** Negative  
**Precondition:** User has approved score

**Test Steps:**
1. Navigate to score history
2. Find approved score
3. Attempt to edit score

**Expected Results:**
- Edit button not available
- Clear indication that approved scores cannot be edited

---

## Leaderboard Test Cases

### TC-LDR-001: View Overall Leaderboard
**Priority:** High  
**Type:** Positive  
**Precondition:** Leaderboard has data

**Test Steps:**
1. Navigate to leaderboard page
2. Select "Overall Rankings"
3. View leaderboard data

**Expected Results:**
- Leaderboard displays correctly
- Rankings sorted by best score
- User names and clubs displayed
- Statistics shown (best score, average, X-count)

### TC-LDR-002: Filter Leaderboard by Discipline
**Priority:** Medium  
**Type:** Positive  
**Precondition:** Leaderboard has data for multiple disciplines

**Test Steps:**
1. Navigate to leaderboard page
2. Select discipline filter: "10m Air Rifle"
3. View filtered results

**Expected Results:**
- Only scores for selected discipline displayed
- Rankings recalculated for discipline
- Filter clearly indicated

### TC-LDR-003: Filter Leaderboard by Category
**Priority:** Medium  
**Type:** Positive  
**Precondition:** Leaderboard has data for multiple categories

**Test Steps:**
1. Navigate to leaderboard page
2. Select category filter: "senior"
3. View filtered results

**Expected Results:**
- Only senior category scores displayed
- Rankings recalculated for category
- Filter clearly indicated

### TC-LDR-004: Filter Leaderboard by Time Period
**Priority:** Medium  
**Type:** Positive  
**Precondition:** Leaderboard has historical data

**Test Steps:**
1. Navigate to leaderboard page
2. Select time period: "month"
3. View filtered results

**Expected Results:**
- Only scores from last month displayed
- Rankings recalculated for time period
- Filter clearly indicated

### TC-LDR-005: View Event-Specific Leaderboard
**Priority:** Medium  
**Type:** Positive  
**Precondition:** Event has completed scores

**Test Steps:**
1. Navigate to event page
2. Click "View Results" or "Leaderboard"
3. View event-specific rankings

**Expected Results:**
- Event-specific leaderboard displayed
- Only scores from selected event shown
- Event details clearly indicated

### TC-LDR-006: View Club Leaderboard
**Priority:** Medium  
**Type:** Positive  
**Precondition:** Multiple clubs have scores

**Test Steps:**
1. Navigate to leaderboard page
2. Select "Club Rankings"
3. View club leaderboard

**Expected Results:**
- Club rankings displayed
- Club names and statistics shown
- Rankings sorted by club performance

### TC-LDR-007: Leaderboard Pagination
**Priority:** Low  
**Type:** Positive  
**Precondition:** Leaderboard has more than 50 entries

**Test Steps:**
1. Navigate to leaderboard page
2. Scroll to bottom of first page
3. Click "Next Page" button

**Expected Results:**
- Next page of results displayed
- Pagination controls functional
- Page numbers clearly indicated

### TC-LDR-008: Export Leaderboard
**Priority:** Low  
**Type:** Positive  
**Precondition:** Leaderboard has data

**Test Steps:**
1. Navigate to leaderboard page
2. Click "Export" button
3. Select export format (PDF/Excel)

**Expected Results:**
- Export file generated
- File downloaded successfully
- Data formatted correctly

---

## Admin Workflow Test Cases

### TC-ADM-001: Admin Login
**Priority:** High  
**Type:** Positive  
**Precondition:** Admin account exists

**Test Steps:**
1. Navigate to admin login page
2. Enter admin credentials
3. Click "Login"

**Expected Results:**
- Admin logged in successfully
- Admin dashboard displayed
- Admin privileges available

### TC-ADM-002: View Admin Dashboard
**Priority:** High  
**Type:** Positive  
**Precondition:** Admin is logged in

**Test Steps:**
1. Access admin dashboard
2. View system statistics
3. Check recent activity

**Expected Results:**
- Dashboard loads correctly
- Statistics displayed accurately
- Recent activity shown
- Quick actions available

### TC-ADM-003: View All Users
**Priority:** High  
**Type:** Positive  
**Precondition:** Admin is logged in, users exist

**Test Steps:**
1. Navigate to "Users" section
2. View user list
3. Use search and filter options

**Expected Results:**
- All users displayed
- Search functionality works
- Filter options functional
- User details accessible

### TC-ADM-004: Change User Role
**Priority:** High  
**Type:** Positive  
**Precondition:** Admin is logged in, user exists

**Test Steps:**
1. Navigate to user management
2. Select user
3. Change role to "event_scorer"
4. Save changes

**Expected Results:**
- User role updated successfully
- Confirmation message displayed
- User permissions updated
- Audit trail recorded

### TC-ADM-005: Deactivate User Account
**Priority:** Medium  
**Type:** Positive  
**Precondition:** Admin is logged in, user exists

**Test Steps:**
1. Navigate to user management
2. Select user
3. Click "Deactivate Account"
4. Confirm deactivation

**Expected Results:**
- Account deactivated successfully
- User cannot log in
- Confirmation message displayed
- Audit trail recorded

### TC-ADM-006: View Pending Scores
**Priority:** High  
**Type:** Positive  
**Precondition:** Admin is logged in, pending scores exist

**Test Steps:**
1. Navigate to "Scores" → "Pending Approval"
2. View pending scores list
3. Review score details

**Expected Results:**
- Pending scores displayed
- Score details visible
- User information shown
- Action buttons available

### TC-ADM-007: Approve Score
**Priority:** High  
**Type:** Positive  
**Precondition:** Admin is logged in, pending score exists

**Test Steps:**
1. Navigate to pending scores
2. Select score to approve
3. Click "Approve" button
4. Confirm approval

**Expected Results:**
- Score approved successfully
- Status changed to "Approved"
- User notified via email
- Leaderboard updated
- Audit trail recorded

### TC-ADM-008: Reject Score
**Priority:** High  
**Type:** Positive  
**Precondition:** Admin is logged in, pending score exists

**Test Steps:**
1. Navigate to pending scores
2. Select score to reject
3. Click "Reject" button
4. Enter rejection reason
5. Confirm rejection

**Expected Results:**
- Score rejected successfully
- Status changed to "Rejected"
- User notified with reason
- Audit trail recorded

### TC-ADM-009: Create New Event
**Priority:** High  
**Type:** Positive  
**Precondition:** Admin is logged in

**Test Steps:**
1. Navigate to "Events" → "Create Event"
2. Fill event details:
   - Title: "Test Championship"
   - Date: Future date
   - Location: "Test Range"
   - Type: "Championship"
   - Max participants: 100
3. Click "Create Event"

**Expected Results:**
- Event created successfully
- Event appears in events list
- Event status set to "draft"
- Confirmation message displayed

### TC-ADM-010: Update Event Status
**Priority:** Medium  
**Type:** Positive  
**Precondition:** Admin is logged in, event exists

**Test Steps:**
1. Navigate to event management
2. Select event
3. Change status to "open"
4. Save changes

**Expected Results:**
- Event status updated
- Registration now available
- Confirmation message displayed
- Audit trail recorded

### TC-ADM-011: View System Statistics
**Priority:** Medium  
**Type:** Positive  
**Precondition:** Admin is logged in

**Test Steps:**
1. Navigate to "Statistics" section
2. View user statistics
3. View event statistics
4. View score statistics

**Expected Results:**
- Statistics displayed correctly
- Data is current and accurate
- Charts and graphs functional
- Export options available

### TC-ADM-012: Generate System Backup
**Priority:** Low  
**Type:** Positive  
**Precondition:** Admin is logged in

**Test Steps:**
1. Navigate to "System" → "Backup"
2. Click "Create Backup"
3. Wait for backup completion

**Expected Results:**
- Backup created successfully
- Backup file generated
- Confirmation message displayed
- Backup listed in backup history

---

## Authentication Test Cases

### TC-AUTH-001: Successful Login
**Priority:** High  
**Type:** Positive  
**Precondition:** User account exists

**Test Steps:**
1. Navigate to login page
2. Enter valid email and password
3. Click "Sign In"

**Expected Results:**
- Login successful
- JWT token issued
- User redirected to dashboard
- Session established

### TC-AUTH-002: Failed Login with Invalid Credentials
**Priority:** High  
**Type:** Negative  
**Precondition:** User account exists

**Test Steps:**
1. Navigate to login page
2. Enter invalid email or password
3. Click "Sign In"

**Expected Results:**
- Login failed
- Error message displayed
- User remains on login page
- No session established

### TC-AUTH-003: Logout
**Priority:** High  
**Type:** Positive  
**Precondition:** User is logged in

**Test Steps:**
1. Click "Logout" button
2. Confirm logout

**Expected Results:**
- Session terminated
- JWT token invalidated
- User redirected to homepage
- No access to protected pages

### TC-AUTH-004: Access Protected Page Without Authentication
**Priority:** High  
**Type:** Negative  
**Precondition:** User is not logged in

**Test Steps:**
1. Navigate directly to protected page (e.g., dashboard)
2. Attempt to access content

**Expected Results:**
- Redirected to login page
- Access denied
- No content displayed

### TC-AUTH-005: Session Timeout
**Priority:** Medium  
**Type:** Positive  
**Precondition:** User is logged in

**Test Steps:**
1. Leave page idle for 30 minutes
2. Attempt to perform action

**Expected Results:**
- Session expired
- Redirected to login page
- Clear indication of session timeout

---

## Performance Test Cases

### TC-PERF-001: Page Load Time
**Priority:** High  
**Type:** Performance  
**Precondition:** System is running

**Test Steps:**
1. Measure homepage load time
2. Measure dashboard load time
3. Measure leaderboard load time

**Expected Results:**
- Homepage loads in < 3 seconds
- Dashboard loads in < 2 seconds
- Leaderboard loads in < 3 seconds

### TC-PERF-002: API Response Time
**Priority:** High  
**Type:** Performance  
**Precondition:** API is running

**Test Steps:**
1. Measure user registration API response
2. Measure score upload API response
3. Measure leaderboard API response

**Expected Results:**
- All API responses < 1 second
- No timeout errors
- Consistent response times

### TC-PERF-003: File Upload Performance
**Priority:** Medium  
**Type:** Performance  
**Precondition:** File upload is enabled

**Test Steps:**
1. Upload 5MB file
2. Upload 10MB file
3. Measure upload times

**Expected Results:**
- 5MB file uploads in < 15 seconds
- 10MB file uploads in < 30 seconds
- Progress indicator works correctly

### TC-PERF-004: Concurrent User Load
**Priority:** Medium  
**Type:** Performance  
**Precondition:** System is running

**Test Steps:**
1. Simulate 50 concurrent users
2. Simulate 100 concurrent users
3. Monitor system performance

**Expected Results:**
- System handles 50 users without degradation
- System handles 100 users with acceptable performance
- No crashes or data corruption

---

## Security Test Cases

### TC-SEC-001: SQL Injection Prevention
**Priority:** High  
**Type:** Security  
**Precondition:** System is running

**Test Steps:**
1. Attempt SQL injection in login form
2. Attempt SQL injection in search fields
3. Attempt SQL injection in registration form

**Expected Results:**
- All injection attempts blocked
- No database errors exposed
- Input properly sanitized

### TC-SEC-002: XSS Prevention
**Priority:** High  
**Type:** Security  
**Precondition:** System is running

**Test Steps:**
1. Attempt XSS in user input fields
2. Attempt XSS in file uploads
3. Attempt XSS in comments

**Expected Results:**
- All XSS attempts blocked
- Scripts not executed
- Content properly escaped

### TC-SEC-003: CSRF Protection
**Priority:** High  
**Type:** Security  
**Precondition:** System is running

**Test Steps:**
1. Attempt CSRF attack on forms
2. Test form submission without tokens
3. Test token validation

**Expected Results:**
- CSRF attacks blocked
- Forms require valid tokens
- Invalid tokens rejected

### TC-SEC-004: File Upload Security
**Priority:** High  
**Type:** Security  
**Precondition:** File upload is enabled

**Test Steps:**
1. Upload executable file
2. Upload file with malicious content
3. Upload file with double extension

**Expected Results:**
- Executable files rejected
- Malicious content detected
- Double extensions handled safely

### TC-SEC-005: Authentication Security
**Priority:** High  
**Type:** Security  
**Precondition:** System is running

**Test Steps:**
1. Test password strength requirements
2. Test session management
3. Test token expiration

**Expected Results:**
- Weak passwords rejected
- Sessions properly managed
- Tokens expire correctly

---

## Test Execution Guidelines

### Test Environment Setup
1. **Development Environment**
   - Local development server
   - Test database with sample data
   - Mock external services

2. **Staging Environment**
   - Production-like environment
   - Real database with test data
   - Integrated external services

3. **Production Environment**
   - Live system
   - Real data
   - All services integrated

### Test Data Requirements
- **User Accounts:** Test users for each role
- **Events:** Sample events in various states
- **Scores:** Sample scores for different scenarios
- **Files:** Test files for upload testing

### Test Execution Order
1. **Unit Tests:** Individual component testing
2. **Integration Tests:** Component interaction testing
3. **System Tests:** End-to-end workflow testing
4. **Performance Tests:** Load and stress testing
5. **Security Tests:** Vulnerability assessment

### Test Reporting
- **Test Results:** Pass/Fail status for each test case
- **Defect Tracking:** Issues found during testing
- **Performance Metrics:** Response times and throughput
- **Coverage Report:** Code and functionality coverage

---

## Test Automation

### Automated Test Suites
- **API Tests:** REST API endpoint testing
- **UI Tests:** Frontend user interface testing
- **Database Tests:** Data integrity and performance testing
- **Security Tests:** Automated security scanning

### Continuous Integration
- **Build Verification:** Automated build testing
- **Regression Testing:** Automated regression test suite
- **Deployment Testing:** Post-deployment verification
- **Monitoring:** Continuous system monitoring

---

**Test Case Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** March 2025 