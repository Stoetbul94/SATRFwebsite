declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

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

// SATRF-specific event tracking
export const trackUserRegistration = (method: string = 'email') => {
  trackEvent('user_registration', { method })
}

export const trackUserLogin = (method: string = 'email') => {
  trackEvent('user_login', { method })
}

export const trackScoreUpload = (fileType: string, recordCount: number) => {
  trackEvent('score_upload', { 
    file_type: fileType,
    record_count: recordCount 
  })
}

export const trackScoreImport = (success: boolean, recordCount?: number) => {
  trackEvent('score_import', { 
    success,
    record_count: recordCount 
  })
}

export const trackDonation = (amount: number, currency: string = 'ZAR', method: string = 'payfast') => {
  trackEvent('donation_made', { 
    amount,
    currency,
    payment_method: method
  })
}

export const trackPagePerformance = (metrics: {
  dns: number
  tcp: number
  ttfb: number
  domLoad: number
  windowLoad: number
}) => {
  trackEvent('page_performance', metrics)
}

export const trackError = (errorType: string, errorMessage: string, page?: string) => {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    page: page || window.location.pathname
  })
}

export const trackSlowPageLoad = (url: string, loadTime: number) => {
  trackEvent('slow_page_load', { 
    url,
    load_time: loadTime 
  })
} 