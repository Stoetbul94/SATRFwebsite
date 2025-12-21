import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js API Route: /api/events/[id]
 * 
 * ROOT CAUSE FIX: Proxy route for individual event details.
 * Prevents Network Errors by handling requests server-side.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
    const backendUrl = `${API_BASE_URL}/${API_VERSION}/events/${id}`;

    // Get auth token from request headers
    const authToken = req.headers.authorization?.replace('Bearer ', '') || null;

    try {
      const backendResponse = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        signal: AbortSignal.timeout(10000),
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return res.status(200).json(data);
      }

      const errorData = await backendResponse.json().catch(() => ({}));
      return res.status(backendResponse.status).json({
        error: errorData.detail || errorData.message || 'Event not found',
        status: backendResponse.status,
      });
    } catch (fetchError: any) {
      console.warn('Backend unavailable for event details:', {
        error: fetchError.message,
        eventId: id,
        url: backendUrl,
      });

      // Return 404 if backend unavailable (event doesn't exist)
      return res.status(404).json({
        error: 'Event not found or backend unavailable',
        eventId: id,
      });
    }
  } catch (error) {
    console.error('Event API route error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

