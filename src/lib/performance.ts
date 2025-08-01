import { trackPagePerformance, trackSlowPageLoad } from './analytics'

export const measurePageLoad = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const metrics = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          domLoad: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          windowLoad: navigation.loadEventEnd - navigation.navigationStart,
        }
        
        // Send to analytics
        trackPagePerformance(metrics)
        
        // Alert if slow (over 5 seconds)
        if (metrics.windowLoad > 5000) {
          trackSlowPageLoad(window.location.href, metrics.windowLoad)
        }
      }
    })
  }
}

export const measureCoreWebVitals = () => {
  if (typeof window !== 'undefined') {
    // Measure Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      if (lastEntry) {
        trackEvent('core_web_vital', {
          name: 'LCP',
          value: lastEntry.startTime,
          url: window.location.href
        })
      }
    })
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
    
    // Measure First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        trackEvent('core_web_vital', {
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          url: window.location.href
        })
      })
    })
    
    fidObserver.observe({ entryTypes: ['first-input'] })
    
    // Measure Cumulative Layout Shift (CLS)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      trackEvent('core_web_vital', {
        name: 'CLS',
        value: clsValue,
        url: window.location.href
      })
    })
    
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  }
}

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

export const getPerformanceMetrics = () => {
  if (typeof window !== 'undefined') {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        domLoad: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        windowLoad: navigation.loadEventEnd - navigation.navigationStart,
        totalSize: navigation.transferSize,
        cacheHit: navigation.transferSize === 0
      }
    }
  }
  
  return null
}

export const isSlowConnection = () => {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection
    return connection && (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.effectiveType === '3g'
    )
  }
  return false
} 