# SATRF Website Testing Suite

## Overview

This comprehensive testing suite validates the SATRF website for launch readiness across all critical functionality areas. The suite includes automated tests, manual test checklists, and performance validation tools.

## 🎯 Test Coverage Areas

### 1. User Authentication & Authorization
- User registration and login workflows
- Admin authentication and role-based access control
- Session management and logout functionality
- Error handling for invalid credentials

### 2. Score Import & Validation Flow
- Excel/CSV file upload and parsing
- Data validation with comprehensive error reporting
- Preview modal functionality
- Import button state management
- Success/error message handling

### 3. Manual Score Entry & Editing
- Admin manual entry interface
- Input validation and error display
- Score editing and update workflows
- Data persistence verification

### 4. Results Display & Filtering
- Public results page functionality
- Event, division, and veteran status filtering
- Sorting by total score, name, and place
- Mobile responsiveness validation

### 5. Donate Page & Payment Integration
- PayFast payment form integration
- EFT banking details display
- Custom amount entry functionality
- Thank you page validation

### 6. Site Navigation & Responsiveness
- Header and footer navigation
- Mobile menu functionality
- Breadcrumb navigation
- Cross-browser compatibility

### 7. Error Monitoring & Reporting
- Sentry error capture validation
- User-friendly error messages
- 404 error handling
- API error response testing

### 8. Performance & Accessibility
- Page load time benchmarks
- Keyboard navigation support
- ARIA labels and semantic markup
- Screen reader compatibility

### 9. Deployment & Environment Validation
- Environment variable configuration
- API endpoint availability
- HTTPS and SSL certificate validation
- Production build verification

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SATRF-WEBSITE

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup

1. Copy environment files:
```bash
cp env.example .env.local
cp env.production.example .env.production
```

2. Configure environment variables:
```bash
# Required for testing
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
```

3. Set up test database:
```bash
# Create test users
npm run create-test-users
```

## 🧪 Running Tests

### Automated Test Suite

#### Run All Tests
```bash
# Complete test suite with report generation
node scripts/run-launch-tests.js
```

#### Individual Test Categories

```bash
# Unit tests only
npm test

# End-to-end tests only
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Performance tests
npm run build

# Security audit
npm audit
```

#### Test Data Generation

```bash
# Generate test Excel files
npx ts-node tests/e2e/test-data-generator.ts
```

### Manual Testing

Use the comprehensive manual test checklist:

```bash
# Open the checklist
open LAUNCH_READINESS_TEST_CHECKLIST.md
```

## 📊 Test Reports

### Automated Reports

Test results are automatically generated and saved to:
- `test-results/launch-readiness-report.json` - Detailed JSON report
- `playwright-report/` - Playwright HTML reports
- Console output with color-coded results

### Report Structure

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "summary": {
    "total": 10,
    "passed": 9,
    "failed": 1,
    "passRate": 90.0,
    "isReadyForLaunch": false
  },
  "details": [...],
  "recommendations": {
    "critical": ["Fix authentication tests"],
    "important": [],
    "optional": []
  }
}
```

## 🔧 Test Configuration

### Playwright Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- Multiple browser support (Chrome, Firefox, Safari)
- Mobile device testing (iPhone 12, Pixel 5)
- Screenshot and video capture on failure
- Parallel test execution
- Custom timeouts and retries

### Test Data

Test files are generated in `tests/test-files/`:

- `valid-scores.xlsx` - Valid score data for import testing
- `invalid-scores.xlsx` - Invalid data for validation testing
- `large-scores.xlsx` - Large dataset for performance testing
- `wrong-headers.xlsx` - File with incorrect column headers
- `empty-scores.xlsx` - Empty file for edge case testing

## 🎯 Test Scenarios

### Critical Path Testing

1. **User Journey**: Registration → Login → Dashboard → Logout
2. **Admin Journey**: Admin Login → Score Import → Results Verification
3. **Payment Flow**: Donate Page → Payment Selection → Thank You Page
4. **Results Flow**: Results Page → Filtering → Sorting → Mobile View

### Edge Cases

1. **Invalid File Uploads**: Wrong format, corrupted files, empty files
2. **Network Failures**: API timeouts, connection errors
3. **Browser Compatibility**: Different browsers and devices
4. **Accessibility**: Keyboard navigation, screen readers

### Performance Testing

1. **Load Times**: Page load under 3 seconds
2. **Bundle Size**: Production build optimization
3. **Memory Usage**: No memory leaks during testing
4. **API Response**: Backend endpoint performance

## 🐛 Troubleshooting

### Common Issues

#### Playwright Installation
```bash
# If browsers fail to install
npx playwright install --force
```

#### Test File Generation
```bash
# If Excel generation fails
npm install xlsx
npx ts-node tests/e2e/test-data-generator.ts
```

#### Environment Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Test Failures

1. **Authentication Tests**: Ensure test users exist in database
2. **File Upload Tests**: Verify test files are generated
3. **API Tests**: Check backend server is running
4. **Payment Tests**: Verify PayFast credentials are configured

### Debug Mode

```bash
# Run tests with debug output
DEBUG=pw:api npm run test:e2e

# Run specific test with debug
npx playwright test launch-readiness.spec.ts --debug
```

## 📋 Manual Testing Checklist

The manual testing checklist (`LAUNCH_READINESS_TEST_CHECKLIST.md`) includes:

- Step-by-step test procedures
- Expected results for each test
- Error scenario validation
- Pass/fail criteria
- Test data requirements

### Using the Checklist

1. **Environment Setup**: Verify all prerequisites
2. **Test Execution**: Follow each section systematically
3. **Result Documentation**: Record pass/fail for each test
4. **Issue Reporting**: Document any failures with screenshots
5. **Sign-off**: Complete all critical tests before launch

## 🚀 Launch Readiness Criteria

### Critical (Must Pass)
- ✅ User authentication works correctly
- ✅ Admin access control functions properly
- ✅ Score import validates and saves data
- ✅ Results display and filter correctly
- ✅ Payment integration is functional
- ✅ Site loads on mobile devices
- ✅ No security vulnerabilities
- ✅ SSL certificate is valid

### Important (Should Pass)
- ✅ All navigation links work
- ✅ Error messages are user-friendly
- ✅ Performance meets benchmarks
- ✅ Accessibility standards are met
- ✅ Responsive design works
- ✅ API endpoints respond correctly

### Nice to Have
- ✅ Advanced filtering options
- ✅ Export functionality
- ✅ Advanced search
- ✅ Performance optimizations
- ✅ Additional accessibility features

## 📈 Monitoring & Maintenance

### Post-Launch Monitoring

1. **Error Tracking**: Monitor Sentry for new errors
2. **Performance**: Track page load times and user metrics
3. **User Feedback**: Monitor support tickets and user reports
4. **Security**: Regular security audits and dependency updates

### Test Maintenance

1. **Regular Updates**: Update test data and scenarios
2. **Dependency Updates**: Keep testing libraries current
3. **New Features**: Add tests for new functionality
4. **Performance**: Monitor test execution times

## 🤝 Contributing

### Adding New Tests

1. **Test Structure**: Follow existing test patterns
2. **Data Testids**: Use consistent test-id attributes
3. **Documentation**: Update test documentation
4. **Review**: Submit for code review

### Test Data Management

1. **Test Users**: Maintain test user accounts
2. **Test Files**: Update test data as needed
3. **Environment**: Keep test environment current
4. **Cleanup**: Regular cleanup of test data

## 📞 Support

### Getting Help

1. **Documentation**: Check this README and test files
2. **Issues**: Report issues with detailed information
3. **Team**: Contact the development team
4. **Community**: Check project discussions

### Emergency Procedures

1. **Test Failures**: Document and prioritize fixes
2. **Launch Issues**: Follow rollback procedures
3. **Security Issues**: Immediate security review
4. **Performance Issues**: Performance optimization

---

## 📄 License

This testing suite is part of the SATRF website project and follows the same licensing terms.

## 🏆 Acknowledgments

- Playwright team for the excellent testing framework
- SATRF development team for comprehensive requirements
- QA team for thorough manual testing procedures 