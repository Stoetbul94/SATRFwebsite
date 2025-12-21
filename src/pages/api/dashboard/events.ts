import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js API Route: /api/dashboard/events
 * 
 * Provides upcoming events for dashboard display.
 * Uses the main /api/events route to avoid circular dependencies.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    // Call the main events API route
    const baseUrl = req.headers.host?.startsWith('localhost') 
      ? `http://${req.headers.host}` 
      : `https://${req.headers.host}`;
    
    const eventsResponse = await fetch(`${baseUrl}/api/events?status=open`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth token if present
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
    });

    if (!eventsResponse.ok) {
      throw new Error(`Events API returned ${eventsResponse.status}`);
    }

    const eventsData = await eventsResponse.json();
    // Handle both array and paginated response formats
    const events = Array.isArray(eventsData) ? eventsData : (eventsData.data || []);
    const limitedEvents = events.slice(0, limit);
    
    return res.status(200).json(limitedEvents);
  } catch (error) {
    console.error('Dashboard events API error:', error);
    // Return empty array as fallback
    return res.status(200).json([]);
  }
}

