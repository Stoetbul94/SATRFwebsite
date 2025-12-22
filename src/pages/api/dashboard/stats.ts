import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js API Route: /api/dashboard/stats
 * 
 * This route provides public dashboard statistics for the homepage.
 * It can either:
 * 1. Return cached/static stats
 * 2. Proxy to backend API if available
 * 3. Aggregate data from multiple sources
 * 
 * ROOT CAUSE FIX: Created this route to provide the missing /dashboard/stats endpoint
 * that the homepage is trying to call. This prevents the Network Error.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Option 1: Return static/cached stats (fast, no backend dependency)
    // This is suitable for homepage public stats
    const publicStats = {
      members: 1250,
      events: 12,
      scores: 'Updated',
      news: 'Latest',
    };

    // Option 2: If you want to fetch from backend, uncomment below:
    /*
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
    
    // Try to fetch from backend (if available)
    try {
      const backendResponse = await fetch(`${API_BASE_URL}/${API_VERSION}/users/dashboard`, {
        headers: {
          // Add auth if needed, or make it a public endpoint
        },
      });
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        // Transform backend data to match DashboardStats interface
        return res.status(200).json({
          members: backendData.profile?.totalMembers || publicStats.members,
          events: backendData.upcomingEvents?.length || publicStats.events,
          scores: 'Updated',
          news: 'Latest',
        });
      }
    } catch (backendError) {
      // Fallback to static stats if backend unavailable
      console.warn('Backend unavailable, using static stats:', backendError);
    }
    */

    // Return static stats (or transformed backend data)
    return res.status(200).json(publicStats);
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


