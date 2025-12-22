# 🔍 SATRF Website Monitoring & Alerting System

**Version:** 1.0  
**Date:** December 2024  
**Status:** ✅ **READY FOR PRODUCTION**

---

## 📊 Quick Overview

### **Monitoring Stack**
- **Error Tracking:** Sentry (Frontend & Backend)
- **Analytics:** Google Analytics 4 + Firebase Analytics
- **Performance:** Lighthouse CI + Vercel Analytics
- **Uptime:** Vercel Status + Custom Health Checks
- **Alerts:** Sentry Alerts + Email/Slack Notifications
- **Dashboard:** Real-time monitoring dashboard at `/monitoring`

### **Key Metrics**
- **Error Rate:** < 1% of requests
- **Page Load Time:** < 3 seconds (homepage), < 4 seconds (other pages)
- **Uptime:** > 99.9%
- **Performance Score:** > 80 (Lighthouse)

---

## 🚀 Quick Setup

### **1. Environment Variables (Vercel Dashboard)**
```bash
# Required
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Optional
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SLACK_WEBHOOK_URL=your-slack-webhook
LHCI_TOKEN=your-lighthouse-token
```

### **2. Automated Setup**
```bash
# Run enhanced setup script
npm run monitor:setup

# Or manually
node scripts/setup-monitoring-enhanced.js
```

### **3. Test Monitoring**
```bash
# Test error tracking
npm run monitor:test

# Check health status
npm run monitor:health

# Run performance audit
npm run monitor:performance

# View alerts
npm run monitor:alerts
```

---

## 📈 Dashboard Access

### **Monitoring Dashboard**
- **URL:** `https://your-domain.vercel.app/monitoring`
- **Features:** Real-time status, health checks, alerts, performance metrics
- **Auto-refresh:** Every 30 seconds

### **External Dashboards**
- **Sentry:** https://sentry.io/organizations/your-org/projects/satrf-website/
- **Google Analytics:** https://analytics.google.com/analytics/web/
- **Vercel Analytics:** https://vercel.com/your-org/satrf-website/analytics
- **Firebase Analytics:** https://console.firebase.google.com/project/your-project/analytics

---

## 🚨 Alert Configuration

### **Alert Levels & Thresholds**
```javascript
// Critical Alerts (Immediate Response)
- Error Rate: > 5% for 5 minutes
- Uptime: < 99% for 10 minutes
- Page Load Time: > 10 seconds for 10% of requests

// High Priority Alerts (Response within 1 hour)
- Error Rate: > 2% for 15 minutes
- Page Load Time: > 5 seconds for 5% of requests
- Performance Score: < 70 on Lighthouse

// Medium Priority Alerts (Response within 4 hours)
- Error Rate: > 1% for 30 minutes
- Page Load Time: > 3 seconds for 10% of requests
```

### **Notification Channels**
- **Email:** dev-team@satrf.com, cto@satrf.com
- **Slack:** #satrf-alerts, #satrf-alerts-critical
- **SMS:** Emergency contacts (optional)

---

## 🔧 API Endpoints

### **Health Check**
```bash
GET /api/health
# Returns system status, uptime, health checks
```

### **Alerts**
```bash
POST /api/alerts
# Create new alert

GET /api/alerts?status=active&limit=10
# Retrieve alerts with filtering

PUT /api/alerts
# Update alert status
```

### **Test Error**
```bash
POST /api/test-error
# Test Sentry integration
```

---

## 📊 Monitoring Components

### **Frontend Monitoring**
- **File:** `src/lib/monitoring.ts` - Central monitoring library
- **File:** `src/components/monitoring/MonitoringDashboard.tsx` - Dashboard component
- **File:** `src/pages/monitoring.tsx` - Dashboard page

### **Backend Monitoring**
- **File:** `src/pages/api/health.ts` - Health check endpoint
- **File:** `src/pages/api/alerts.ts` - Alert management
- **File:** `sentry.client.config.js` - Sentry configuration

### **Performance Monitoring**
- **File:** `lighthouserc.js` - Lighthouse CI configuration
- **File:** `scripts/setup-monitoring-enhanced.js` - Setup script

---

## 🔍 Troubleshooting

### **Common Issues**

#### **Sentry Not Working**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SENTRY_DSN

# Test error tracking
curl -X POST https://your-domain.vercel.app/api/test-error
```

#### **Health Check Failing**
```bash
# Check health endpoint
curl https://your-domain.vercel.app/api/health

# Verify environment variables
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

#### **Alerts Not Sending**
```bash
# Check alert endpoint
curl -X POST https://your-domain.vercel.app/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"level":"critical","title":"Test","message":"Test alert"}'

# Verify Slack webhook
echo $SLACK_WEBHOOK_URL
```

### **Performance Issues**
```bash
# Run Lighthouse audit
npm run monitor:performance

# Check Core Web Vitals
# Visit Google Analytics > Reports > Core Web Vitals
```

---

## 📞 Support Contacts

### **Technical Issues**
- **Development Team:** dev-team@satrf.com
- **DevOps Team:** devops@satrf.com
- **Project Manager:** pm@satrf.com

### **Emergency Contacts**
- **CTO:** cto@satrf.com
- **Emergency Hotline:** [emergency-number]

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

## 📚 Available Scripts

### **Monitoring Commands**
```bash
npm run monitor:health      # Check system health
npm run monitor:performance # Run performance audit
npm run monitor:alerts      # View active alerts
npm run monitor:test        # Test error tracking
npm run monitor:report      # Generate monitoring report
npm run monitor:setup       # Run enhanced setup
```

### **Manual Testing**
```bash
# Test Sentry integration
curl -X POST https://your-domain.vercel.app/api/test-error

# Test health check
curl https://your-domain.vercel.app/api/health

# Test alerts
curl -X POST https://your-domain.vercel.app/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"level":"critical","title":"Test","message":"Test alert"}'
```

---

**Status:** ✅ **MONITORING SYSTEM READY FOR PRODUCTION**

🎯 **The SATRF website monitoring and alerting system is fully configured and ready for production deployment!**

### **Next Steps:**
1. **Set environment variables** in Vercel Dashboard
2. **Deploy to production** and test all monitoring components
3. **Verify dashboards** are receiving data
4. **Configure team notifications** for alerts
5. **Monitor system** and adjust thresholds as needed 