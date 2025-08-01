# 🔍 SATRF Website Production Monitoring & Analytics Setup

**Version:** 1.0  
**Date:** December 2024  
**Purpose:** Complete production monitoring and analytics configuration  
**Status:** ✅ **READY FOR SETUP**

---

## 📋 Monitoring Overview

### **Monitoring Stack**
- **Error Tracking:** Sentry (Frontend & Backend)
- **Analytics:** Google Analytics 4 + Firebase Analytics
- **Performance:** Lighthouse CI + Vercel Analytics
- **Uptime:** Vercel Status + Custom Health Checks
- **Alerts:** Sentry Alerts + Email/Slack Notifications

### **Key Metrics to Monitor**
- **Error Rate:** < 1% of requests
- **Page Load Time:** < 3 seconds (homepage), < 4 seconds (other pages)
- **Uptime:** > 99.9%
- **User Engagement:** Session duration, bounce rate
- **Performance:** Lighthouse scores > 80

---

## 🚨 Error Tracking Setup (Sentry)

### **Current Status: ✅ CONFIGURED**
Sentry is already integrated with the following configuration files:
- `sentry.client.config.js` - Frontend error tracking
- `sentry.server.config.js` - Backend error tracking  
- `sentry.edge.config.js` - Edge runtime tracking

### **Step 1: Environment Variables**
Set these in your Vercel project settings:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=satrf-website
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### **Step 2: Sentry Project Setup**
1. **Create Sentry Project:**
   - Go to [Sentry.io](https://sentry.io)
   - Create new project: "SATRF Website"
   - Platform: Next.js
   - Copy DSN to environment variables

2. **Configure Release Tracking:**
   ```bash
   # Install Sentry CLI
   npm install -g @sentry/cli
   
   # Create releases
   sentry-cli releases new $VERSION
   sentry-cli releases set-commits $VERSION --auto
   sentry-cli releases finalize $VERSION
   ```

3. **Setup Source Maps:**
   ```bash
   # Upload source maps for error tracking
   sentry-cli releases files $VERSION upload-sourcemaps ./out
   ```

### **Step 3: Alert Configuration**

#### **Critical Error Alerts**
```javascript
// Sentry Alert Rules
{
  "name": "Critical Errors - SATRF Website",
  "conditions": [
    {
      "id": "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition",
      "name": "A new issue is created"
    },
    {
      "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
      "name": "The number of errors in an issue is greater than 10 in 1m"
    }
  ],
  "actions": [
    {
      "id": "sentry.mail.actions.NotifyEmailAction",
      "name": "Send email to team@satrf.com"
    },
    {
      "id": "sentry.slack.actions.NotifySlackAction",
      "name": "Send Slack notification to #satrf-alerts"
    }
  ],
  "frequency": 300
}
```

#### **Performance Alerts**
```javascript
// Performance Threshold Alerts
{
  "name": "Performance Degradation",
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
      "name": "Page load time > 5 seconds for 5% of requests"
    }
  ],
  "actions": [
    {
      "id": "sentry.mail.actions.NotifyEmailAction",
      "name": "Send email to dev-team@satrf.com"
    }
  ]
}
```

---

## 📊 Analytics Setup (Google Analytics + Firebase)

### **Current Status: ✅ PARTIALLY CONFIGURED**
Firebase Analytics is configured, but Google Analytics 4 needs setup.

### **Step 1: Google Analytics 4 Setup**

1. **Create GA4 Property:**
   - Go to [Google Analytics](https://analytics.google.com)
   - Create new property: "SATRF Website"
   - Property type: Web
   - Copy Measurement ID (G-XXXXXXXXXX)

2. **Add GA4 to Environment Variables:**
   ```bash
   NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
   ```

3. **Create Analytics Component:**
   ```typescript
   // src/components/GoogleAnalytics.tsx
   import Script from 'next/script'
   
   export default function GoogleAnalytics() {
     const gaId = process.env.NEXT_PUBLIC_GA_TRACKING_ID
   
     if (!gaId) return null
   
     return (
       <>
         <Script
           src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
           strategy="afterInteractive"
         />
         <Script id="google-analytics" strategy="afterInteractive">
           {`
             window.dataLayer = window.dataLayer || [];
             function gtag(){dataLayer.push(arguments);}
             gtag('js', new Date());
             gtag('config', '${gaId}', {
               page_title: document.title,
               page_location: window.location.href,
             });
           `}
         </Script>
       </>
     )
   }
   ```

4. **Add to Layout:**
   ```typescript
   // src/pages/_app.tsx
   import GoogleAnalytics from '../components/GoogleAnalytics'
   
   function MyApp({ Component, pageProps }) {
     return (
       <>
         <GoogleAnalytics />
         <Component {...pageProps} />
       </>
     )
   }
   ```

### **Step 2: Custom Event Tracking**

```typescript
// src/lib/analytics.ts
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// Usage examples
trackEvent('user_registration', { method: 'email' })
trackEvent('score_upload', { file_type: 'excel' })
trackEvent('donation_made', { amount: 100, currency: 'ZAR' })
```

### **Step 3: Firebase Analytics Integration**

Firebase Analytics is already configured. Add custom events:

```typescript
// src/lib/firebase-analytics.ts
import { analytics } from './firebase'
import { logEvent } from 'firebase/analytics'

export const logCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, eventName, parameters)
  }
}

// Usage
logCustomEvent('score_import_success', { 
  file_size: fileSize,
  record_count: recordCount 
})
```

---

## ⚡ Performance Monitoring Setup

### **Step 1: Lighthouse CI Configuration**

1. **Install Lighthouse CI:**
   ```bash
   npm install -g @lhci/cli
   ```

2. **Create Lighthouse CI Config:**
   ```javascript
   // lighthouserc.js
   module.exports = {
     ci: {
       collect: {
         url: ['https://your-domain.vercel.app'],
         numberOfRuns: 3,
         settings: {
           chromeFlags: '--no-sandbox --disable-dev-shm-usage',
         },
       },
       assert: {
         assertions: {
           'categories:performance': ['warn', { minScore: 0.8 }],
           'categories:accessibility': ['error', { minScore: 0.9 }],
           'categories:best-practices': ['warn', { minScore: 0.8 }],
           'categories:seo': ['warn', { minScore: 0.8 }],
         },
       },
       upload: {
         target: 'lhci',
         serverBaseUrl: 'https://your-lhci-server.com',
         token: process.env.LHCI_TOKEN,
       },
     },
   }
   ```

3. **Add to CI/CD Pipeline:**
   ```yaml
   # .github/workflows/lighthouse.yml
   name: Lighthouse CI
   on: [push]
   jobs:
     lighthouse:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Run Lighthouse CI
           run: |
             npm install -g @lhci/cli
             lhci autorun
   ```

### **Step 2: Vercel Analytics**

1. **Enable Vercel Analytics:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Analytics tab
   - Enable Web Analytics

2. **Add Analytics Script:**
   ```typescript
   // src/components/VercelAnalytics.tsx
   import { Analytics } from '@vercel/analytics/react'
   
   export default function VercelAnalytics() {
     return <Analytics />
   }
   ```

### **Step 3: Custom Performance Monitoring**

```typescript
// src/lib/performance.ts
export const measurePageLoad = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        domLoad: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        windowLoad: navigation.loadEventEnd - navigation.navigationStart,
      }
      
      // Send to analytics
      trackEvent('page_performance', metrics)
      
      // Alert if slow
      if (metrics.windowLoad > 5000) {
        trackEvent('slow_page_load', { 
          url: window.location.href,
          loadTime: metrics.windowLoad 
        })
      }
    })
  }
}
```

---

## 🏥 Health Checks & Uptime Monitoring

### **Step 1: Health Check Endpoint**

```typescript
// src/pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  }
  
  try {
    // Check database connectivity
    // Check external services
    // Check file system access
    
    res.status(200).json(healthCheck)
  } catch (error) {
    healthCheck.message = error.message
    res.status(503).json(healthCheck)
  }
}
```

### **Step 2: Uptime Monitoring Setup**

1. **UptimeRobot Configuration:**
   - URL: `https://your-domain.vercel.app/api/health`
   - Check interval: 5 minutes
   - Alert threshold: 2 consecutive failures
   - Notification: Email + Slack

2. **Vercel Status Page:**
   - Enable Vercel Status Page
   - Configure incident notifications
   - Set up maintenance windows

---

## 📈 Dashboard Access & Monitoring

### **Sentry Dashboard**
- **URL:** https://sentry.io/organizations/your-org/projects/satrf-website/
- **Access:** Development team
- **Key Metrics:**
  - Error rate and trends
  - Performance metrics
  - User impact analysis
  - Release health

### **Google Analytics Dashboard**
- **URL:** https://analytics.google.com/analytics/web/
- **Access:** Marketing team + Development team
- **Key Metrics:**
  - Page views and sessions
  - User engagement
  - Conversion tracking
  - Real-time data

### **Firebase Analytics Dashboard**
- **URL:** https://console.firebase.google.com/project/your-project/analytics
- **Access:** Development team
- **Key Metrics:**
  - User behavior
  - Custom events
  - Crash reporting
  - Performance monitoring

### **Vercel Analytics Dashboard**
- **URL:** https://vercel.com/your-org/satrf-website/analytics
- **Access:** Development team
- **Key Metrics:**
  - Page performance
  - Core Web Vitals
  - User experience metrics

---

## 🚨 Alert Configuration & Escalation

### **Alert Thresholds**

#### **Critical Alerts (Immediate Response)**
- **Error Rate:** > 5% for 5 minutes
- **Uptime:** < 99% for 10 minutes
- **Page Load Time:** > 10 seconds for 10% of requests
- **Database Errors:** Any database connection failures

#### **High Priority Alerts (Response within 1 hour)**
- **Error Rate:** > 2% for 15 minutes
- **Page Load Time:** > 5 seconds for 5% of requests
- **Performance Score:** < 70 on Lighthouse
- **Security Issues:** Any security-related errors

#### **Medium Priority Alerts (Response within 4 hours)**
- **Error Rate:** > 1% for 30 minutes
- **Page Load Time:** > 3 seconds for 10% of requests
- **Analytics Issues:** Data collection failures

### **Escalation Path**

#### **Level 1: Automated Alerts**
- **Channel:** Email + Slack
- **Recipients:** Development team
- **Response Time:** 15 minutes

#### **Level 2: Manual Escalation**
- **Channel:** Phone call + SMS
- **Recipients:** Senior developers + Project manager
- **Response Time:** 1 hour

#### **Level 3: Emergency Response**
- **Channel:** Emergency contact system
- **Recipients:** CTO + DevOps team
- **Response Time:** 30 minutes

### **Alert Templates**

#### **Critical Alert Template**
```
🚨 CRITICAL ALERT - SATRF Website

Issue: [Error description]
Impact: [User impact assessment]
Current Status: [Investigating/Fixing/Resolved]
ETA: [Estimated resolution time]

Actions Taken:
- [ ] Issue identified
- [ ] Team notified
- [ ] Investigation started
- [ ] Fix deployed
- [ ] Monitoring resumed

Next Update: [Time]
```

#### **Performance Alert Template**
```
⚠️ PERFORMANCE ALERT - SATRF Website

Metric: [Page load time/Error rate/etc.]
Current Value: [X]
Threshold: [Y]
Duration: [Z minutes]

Affected Pages: [List of pages]
User Impact: [Estimated affected users]

Actions:
- [ ] Performance analysis started
- [ ] Optimization identified
- [ ] Fix deployed
- [ ] Monitoring continued
```

---

## 📊 Monitoring Reports

### **Daily Reports**
- Error rate summary
- Performance metrics
- User engagement stats
- Security incidents

### **Weekly Reports**
- Trend analysis
- Performance improvements
- User behavior insights
- Infrastructure health

### **Monthly Reports**
- Comprehensive analytics
- Performance benchmarks
- User growth metrics
- Technical debt assessment

---

## 🔧 Setup Commands

### **Quick Setup Script**
```bash
#!/bin/bash
# setup-monitoring.sh

echo "Setting up SATRF Website monitoring..."

# Install dependencies
npm install @sentry/nextjs @vercel/analytics

# Setup environment variables
echo "Please configure the following environment variables:"
echo "NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn"
echo "NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX"
echo "SENTRY_AUTH_TOKEN=your-sentry-auth-token"

# Setup Lighthouse CI
npm install -g @lhci/cli

# Create monitoring directories
mkdir -p monitoring/reports
mkdir -p monitoring/alerts

echo "Monitoring setup complete!"
```

### **Verification Commands**
```bash
# Test Sentry integration
curl -X POST "https://your-domain.vercel.app/api/test-error"

# Test health check
curl "https://your-domain.vercel.app/api/health"

# Run Lighthouse audit
lighthouse https://your-domain.vercel.app --output=json --output-path=./lighthouse-report.json

# Check analytics
# Visit Google Analytics real-time dashboard
```

---

## 📞 Support & Maintenance

### **Monitoring Team Contacts**
- **Primary:** [Dev team lead email]
- **Secondary:** [DevOps team email]
- **Emergency:** [Emergency contact]

### **Maintenance Schedule**
- **Daily:** Review error reports and performance metrics
- **Weekly:** Analyze trends and optimize performance
- **Monthly:** Review and update monitoring configuration

### **Documentation Updates**
- Update this guide when configuration changes
- Maintain runbooks for common issues
- Keep contact information current

---

## 🎯 Success Metrics

### **Monitoring Effectiveness**
- **Alert Accuracy:** > 95% (minimal false positives)
- **Response Time:** < 15 minutes for critical alerts
- **Resolution Time:** < 2 hours for critical issues
- **Uptime:** > 99.9%

### **Performance Targets**
- **Page Load Time:** < 3 seconds (homepage), < 4 seconds (other pages)
- **Error Rate:** < 1% of requests
- **Lighthouse Scores:** > 80 (Performance, Accessibility, Best Practices, SEO)

---

**Status:** ✅ **MONITORING SETUP READY**

🎯 **The SATRF website monitoring and analytics setup is ready for production deployment!** 