import { NextApiRequest, NextApiResponse } from 'next';
import { scoresAPI } from '@/lib/api';

/**
 * Next.js API Route: /api/dashboard/scores
 * 
 * Provides recent scores for dashboard display.
 * Requires authentication - returns user's own scores.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from request
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 5;
    
    // This would need to be called from client-side with auth token
    // For now, return empty array or proxy to backend
    return res.status(200).json([]);
  } catch (error) {
    console.error('Dashboard scores API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}









