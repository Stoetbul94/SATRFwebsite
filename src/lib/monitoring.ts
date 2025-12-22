// Comprehensive monitoring library for SATRF website
import * as Sentry from '@sentry/nextjs'

// Types for monitoring events and metrics
export interface MonitoringEvent {
  type: 'error' | 'performance' | 'user_action' | 'system'
  name: string
  data?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

export interface PerformanceMetrics {
  pageLoadTime: number
  timeToFirstByte: number
  domContentLoaded: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  url: string
  timestamp: number
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  checks: {
    database: 'ok' | 'error' | 'not_configured'
    external_services: 'ok' | 'error'
    file_system: 'ok' | 'error'
    memory_usage: 'ok' | 'warning' | 'error'
  }
  timestamp: number
  message: string
}

export interface AlertConfig {
  level: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  data?: Record<string, any>
  recipients?: string[]
  channels?: ('email' | 'slack' | 'sms')[]
}

// Alert levels
export const ALERT_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const

// Main monitoring class
class SATRFMonitoring {
  private static instance: SATRFMonitoring
  private alertThresholds: Record<string, number> = {
    errorRate: 0.05, // 5%
    pageLoadTime: 5000, // 5 seconds
    memoryUsage: 0.8, // 80%
    uptime: 0.99 // 99%
  }

  private constructor() {
    this.initializeSentry()
    this.setupPerformanceMonitoring()
  }

  public static getInstance(): SATRFMonitoring {
    if (!SATRFMonitoring.instance) {
      SATRFMonitoring.instance = new SATRFMonitoring()
    }
    return SATRFMonitoring.instance
  }

  private initializeSentry() {
    // Sentry is already initialized in sentry.client.config.js
    // This method can be used for additional Sentry configuration
  }

  // Error tracking
  public trackError(error: Error | string, context?: Record<string, any>) {
    const errorMessage = typeof error === 'string' ? error : error.message
    
    Sentry.captureException(error, {
      tags: {
        component: 'monitoring',
        ...context?.tags
      },
      extra: {
        ...context?.extra,
        timestamp: Date.now()
      }
    })

    // Track custom error event
    this.trackEvent({
      type: 'error',
      name: 'application_error',
      data: {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        ...context
      }
    })
  }

  // Performance monitoring
  private setupPerformanceMonitoring() {
    if (typeof window !== 'undefined') {
      // Monitor Core Web Vitals
      this.monitorCoreWebVitals()
      
      // Monitor page load performance
      this.monitorPageLoadPerformance()
      
      // Monitor memory usage
      this.monitorMemoryUsage()
    }
  }

  private monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry
        const lcp = lastEntry.startTime

        this.trackPerformanceMetric('lcp', lcp)
        
        if (lcp > 2500) {
          this.trackPerformanceAlert('slow_lcp', { lcp, url: window.location.href })
        }
      })
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          // Type assertion for first-input entries
          const firstInputEntry = entry as PerformanceEventTiming
          const fid = firstInputEntry.processingStart - firstInputEntry.startTime
          this.trackPerformanceMetric('fid', fid)
          
          if (fid > 100) {
            this.trackPerformanceAlert('slow_fid', { fid, url: window.location.href })
          }
        })
      })
      
      fidObserver.observe({ entryTypes: ['first-input'] })
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEntry[]
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        this.trackPerformanceMetric('cls', clsValue)
        
        if (clsValue > 0.1) {
          this.trackPerformanceAlert('high_cls', { cls: clsValue, url: window.location.href })
        }
      })
      
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  private monitorPageLoadPerformance() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        timeToFirstByte: navigation.responseStart - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        url: window.location.href,
        timestamp: Date.now()
      }

      this.trackPerformanceMetrics(metrics)
      
      // Alert if page load is slow
      if (metrics.pageLoadTime > this.alertThresholds.pageLoadTime) {
        this.trackPerformanceAlert('slow_page_load', {
          loadTime: metrics.pageLoadTime,
          url: metrics.url
        })
      }
    })
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        
        this.trackPerformanceMetric('memory_usage', usagePercent)
        
        if (usagePercent > this.alertThresholds.memoryUsage) {
          this.trackPerformanceAlert('high_memory_usage', {
            usage: usagePercent,
            used: memory.usedJSHeapSize,
            limit: memory.jsHeapSizeLimit
          })
        }
      }, 30000) // Check every 30 seconds
    }
  }

  // Event tracking
  public trackEvent(event: MonitoringEvent) {
    // Send to Sentry
    Sentry.addBreadcrumb({
      category: event.type,
      message: event.name,
      data: event.data,
      level: 'info'
    })

    // Send to analytics (if configured)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, {
        event_category: event.type,
        event_label: event.data?.url || window.location.href,
        value: event.data?.value,
        ...event.data
      })
    }

    // Store locally for debugging
    this.storeEventLocally(event)
  }

  // User tracking
  public setUser(userId: string, userData?: Record<string, any>) {
    Sentry.setUser({
      id: userId,
      ...userData
    })
  }

  // Performance tracking
  private trackPerformanceMetric(name: string, value: number) {
    this.trackEvent({
      type: 'performance',
      name: `performance_${name}`,
      data: { value, url: window.location.href }
    })
  }

  private trackPerformanceMetrics(metrics: PerformanceMetrics) {
    this.trackEvent({
      type: 'performance',
      name: 'page_performance',
      data: metrics
    })
  }

  private trackPerformanceAlert(type: string, data: Record<string, any>) {
    this.trackEvent({
      type: 'system',
      name: `performance_alert_${type}`,
      data: { ...data, alertType: type }
    })
  }

  // Health checks
  public async performHealthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch('/api/health')
      const healthData = await response.json()
      
      return {
        status: healthData.status,
        uptime: healthData.uptime,
        checks: healthData.checks,
        timestamp: Date.now(),
        message: healthData.message
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: 0,
        checks: {
          database: 'error',
          external_services: 'error',
          file_system: 'error',
          memory_usage: 'error'
        },
        timestamp: Date.now(),
        message: 'Health check failed'
      }
    }
  }

  // Alert management
  public async createAlert(config: AlertConfig): Promise<void> {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...config,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create alert: ${response.statusText}`)
      }
    } catch (error) {
      this.trackError(error as Error, {
        context: 'alert_creation',
        alertConfig: config
      })
    }
  }

  public async sendAlert(config: AlertConfig): Promise<void> {
    // Create alert record
    await this.createAlert(config)
    
    // Send to Sentry for critical alerts
    if (config.level === ALERT_LEVELS.CRITICAL) {
      Sentry.captureMessage(config.title, {
        level: 'fatal',
        tags: {
          alert_level: config.level,
          alert_type: 'system_alert'
        },
        extra: {
          alert_data: config.data,
          recipients: config.recipients
        }
      })
    }
  }

  // Alert condition checking
  public checkAlertConditions(metrics: Record<string, number>): void {
    // Check error rate
    if (metrics.errorRate && metrics.errorRate > this.alertThresholds.errorRate) {
      this.sendAlert({
        level: ALERT_LEVELS.CRITICAL,
        title: 'High Error Rate Detected',
        message: `Error rate is ${(metrics.errorRate * 100).toFixed(2)}%, exceeding threshold of ${(this.alertThresholds.errorRate * 100).toFixed(2)}%`,
        data: { errorRate: metrics.errorRate, threshold: this.alertThresholds.errorRate }
      })
    }

    // Check page load time
    if (metrics.pageLoadTime && metrics.pageLoadTime > this.alertThresholds.pageLoadTime) {
      this.sendAlert({
        level: ALERT_LEVELS.HIGH,
        title: 'Slow Page Load Detected',
        message: `Page load time is ${metrics.pageLoadTime}ms, exceeding threshold of ${this.alertThresholds.pageLoadTime}ms`,
        data: { pageLoadTime: metrics.pageLoadTime, threshold: this.alertThresholds.pageLoadTime }
      })
    }
  }

  // Local storage for events
  private storeEventLocally(event: MonitoringEvent) {
    try {
      const events = JSON.parse(localStorage.getItem('satrf_monitoring_events') || '[]')
      events.push({ ...event, timestamp: event.timestamp || Date.now() })
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }
      
      localStorage.setItem('satrf_monitoring_events', JSON.stringify(events))
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  // Get stored events (for debugging)
  public getStoredEvents(): MonitoringEvent[] {
    try {
      return JSON.parse(localStorage.getItem('satrf_monitoring_events') || '[]')
    } catch {
      return []
    }
  }

  // Clear stored events
  public clearStoredEvents(): void {
    try {
      localStorage.removeItem('satrf_monitoring_events')
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}

// Export singleton instance
export const monitoring = SATRFMonitoring.getInstance()

// Convenience exports
export const trackError = (error: Error | string, context?: Record<string, any>) => 
  monitoring.trackError(error, context)

export const trackEvent = (event: MonitoringEvent) => 
  monitoring.trackEvent(event)

export const setUser = (userId: string, userData?: Record<string, any>) => 
  monitoring.setUser(userId, userData)

export const performHealthCheck = () => 
  monitoring.performHealthCheck()

export const createAlert = (config: AlertConfig) => 
  monitoring.createAlert(config)

export const sendAlert = (config: AlertConfig) => 
  monitoring.sendAlert(config)

export const checkAlertConditions = (metrics: Record<string, number>) => 
  monitoring.checkAlertConditions(metrics)

export const getStoredEvents = () => 
  monitoring.getStoredEvents()

export const clearStoredEvents = () => 
  monitoring.clearStoredEvents()

export default monitoring 