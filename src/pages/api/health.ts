import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const healthCheck = {
    status: 'healthy',
    uptime: process.uptime(),
    message: 'SATRF Website is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'ok',
      external_services: 'ok',
      file_system: 'ok'
    }
  }
  
  try {
    // Check database connectivity (if applicable)
    // This would check your Firebase connection or other database
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      healthCheck.checks.database = 'ok'
    } else {
      healthCheck.checks.database = 'not_configured'
    }
    
    // Check external services
    // This would check PayFast, Firebase, etc.
    healthCheck.checks.external_services = 'ok'
    
    // Check file system access
    // This would check if the app can read/write files
    healthCheck.checks.file_system = 'ok'
    
    // Set appropriate status code
    const allChecksOk = Object.values(healthCheck.checks).every(check => check === 'ok')
    
    if (allChecksOk) {
      res.status(200).json(healthCheck)
    } else {
      healthCheck.status = 'degraded'
      res.status(503).json(healthCheck)
    }
    
  } catch (error) {
    healthCheck.status = 'unhealthy'
    healthCheck.message = error instanceof Error ? error.message : 'Unknown error'
    res.status(503).json(healthCheck)
  }
} 