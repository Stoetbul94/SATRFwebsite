import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // This endpoint is for testing Sentry error tracking
    // It will throw an error to verify Sentry integration is working
    
    const testType = req.body.testType || 'generic'
    
    switch (testType) {
      case 'sentry':
        throw new Error('Test error for Sentry integration')
      
      case 'api':
        throw new Error('API test error')
      
      case 'validation':
        throw new Error('Validation error test')
      
      default:
        throw new Error('Generic test error')
    }
    
  } catch (error) {
    // Log the error to Sentry
    console.error('Test error triggered:', error)
    
    res.status(500).json({
      message: 'Test error triggered successfully',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
} 