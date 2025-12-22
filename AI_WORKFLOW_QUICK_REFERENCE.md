# AI-Integrated Workflow Quick Reference

## 🚀 Getting Started

### 1. Setup Workflow
```bash
npm run workflow:setup
```

### 2. Generate New Component
```bash
npm run generate:component ComponentName [category]
# Example: npm run generate:component UserProfile forms
```

### 3. Generate New API Endpoint
```bash
npm run generate:api endpoint-name [methods]
# Example: npm run generate:api user-profile GET POST PUT
```

## 📋 Workflow Steps

### Phase 1: Feature Breakdown
1. **Break down feature** into logical components
2. **Create modular prompts** using templates in `.cursor-prompts/`
3. **Use Cursor AI** to generate initial code

### Phase 2: Local Testing
1. **Run development server:**
   ```bash
   npm run dev
   ```
2. **Test locally:**
   ```bash
   npm run workflow:validate
   ```
3. **Manual testing checklist:**
   - [ ] Component renders correctly
   - [ ] Functionality works as expected
   - [ ] Error states handled properly
   - [ ] Responsive design works
   - [ ] Accessibility features functional

### Phase 3: Commit & Push
1. **Commit with clear message:**
   ```bash
   git add .
   git commit -m "feat: add [ComponentName] for [feature]

   - Implements [specific functionality]
   - Includes unit tests with [coverage]%
   - Integrates with [existing components/APIs]
   - Follows [design system/patterns]"
   ```
2. **Push to trigger CI/CD:**
   ```bash
   git push origin main
   ```

### Phase 4: CI/CD Pipeline
**Automated checks:**
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Build validation (Next.js)
- ✅ Unit tests (Jest)
- ✅ E2E tests (Playwright)
- ✅ Security scanning (npm audit)
- ✅ Performance testing (Lighthouse CI)

### Phase 5: Monitoring & Feedback
1. **Monitor production:**
   ```bash
   npm run monitor:health
   npm run monitor:performance
   ```
2. **Collect feedback** from:
   - Error reports (Sentry)
   - Performance metrics (Vercel Analytics)
   - User feedback (contact forms)
   - Analytics data (Google Analytics)

## 🛠️ Available Scripts

### Generation Scripts
```bash
npm run generate:component [name] [category]  # Generate React component
npm run generate:api [name] [methods]         # Generate API endpoint
```

### Validation Scripts
```bash
npm run validate:component [name]             # Validate component structure
npm run validate:api [name]                   # Validate API endpoint
npm run validate:coverage [name]              # Validate test coverage
```

### Workflow Scripts
```bash
npm run workflow:setup                        # Setup workflow environment
npm run workflow:validate                     # Run all validations
npm run workflow:pre-commit                   # Pre-commit validation
```

### Testing Scripts
```bash
npm test                                      # Run unit tests
npm run test:coverage                         # Run tests with coverage
npm run test:e2e                              # Run E2E tests
npm run test:e2e:smoke                        # Run smoke tests
```

### Monitoring Scripts
```bash
npm run monitor:health                        # Check system health
npm run monitor:performance                   # Run performance tests
npm run monitor:website                       # Monitor website status
```

## 📁 File Structure

### Prompt Templates
```
.cursor-prompts/
├── components/
│   ├── ui-components.md
│   ├── forms.md
│   └── layouts.md
├── api/
│   ├── endpoints.md
│   ├── authentication.md
│   └── validation.md
├── tests/
│   ├── unit-tests.md
│   ├── e2e-tests.md
│   └── integration-tests.md
└── utilities/
    ├── helpers.md
    ├── hooks.md
    └── types.md
```

### Generated Files
```
src/
├── components/[category]/[ComponentName].tsx
├── components/[category]/[ComponentName].test.tsx
├── pages/api/[endpoint].ts
├── lib/validations/[endpoint].ts
├── lib/services/[endpoint].ts
└── __tests__/api-[endpoint].test.ts
```

## 🔄 Workflow Automation

### Pre-commit Hooks
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
npm run workflow:pre-commit
```

### CI/CD Pipeline
- **Trigger:** Push to main branch or PR
- **Build:** Next.js build validation
- **Test:** Unit and E2E tests
- **Deploy:** Vercel deployment
- **Monitor:** Post-deployment health checks

## 📊 Success Metrics

### Development Efficiency
- Time from feature request to deployment
- Code generation accuracy and completeness
- Test coverage maintenance
- Bug rate reduction

### Quality Metrics
- Build success rate
- Test pass rate
- Performance benchmarks
- Security scan results

### User Experience
- Page load times
- Error rates
- User engagement metrics
- Feature adoption rates

## 🚨 Troubleshooting

### Common Issues

**Component generation fails:**
```bash
# Check component name format (must be PascalCase)
npm run generate:component MyComponent ui
```

**API generation fails:**
```bash
# Check endpoint name format (must be kebab-case)
npm run generate:api my-endpoint GET POST
```

**Tests fail:**
```bash
# Run tests with verbose output
npm test -- --verbose
```

**Linting fails:**
```bash
# Fix auto-fixable issues
npm run lint -- --fix
```

### Validation Commands
```bash
# Validate entire workflow
npm run workflow:validate

# Check specific component
npm run validate:component ComponentName

# Check specific API
npm run validate:api endpoint-name

# Check test coverage
npm run validate:coverage ComponentName
```

## 📚 Best Practices

### Prompt Management
- **Version control prompts** in `.cursor-prompts/`
- **Use consistent naming** conventions
- **Include context** about existing patterns
- **Reference specific files** from the project
- **Maintain prompt history** for learning

### Code Quality
- **Small, focused commits** with clear messages
- **Comprehensive testing** for all new code
- **Consistent error handling** patterns
- **Proper TypeScript typing** throughout
- **Accessibility compliance** for UI components

### Performance
- **Optimize bundle size** for new components
- **Implement proper caching** strategies
- **Monitor performance** metrics
- **Use code splitting** for large features
- **Optimize images** and static assets

## 🔗 Useful Links

- [AI Workflow Documentation](./AI_INTEGRATED_WORKFLOW.md)
- [Component Templates](./.cursor-prompts/components/)
- [API Templates](./.cursor-prompts/api/)
- [Test Templates](./.cursor-prompts/tests/)
- [CI/CD Configuration](./.github/workflows/)
- [Monitoring Setup](./MONITORING_SUMMARY.md) 