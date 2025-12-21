import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js API Route: /api/events
 * 
 * ROOT CAUSE FIX: This route proxies events requests to the backend API.
 * This prevents Network Errors when the backend is unavailable by:
 * 1. Handling the request server-side (no CORS issues)
 * 2. Providing fallback data if backend is down
 * 3. Centralizing error handling
 * 
 * This route acts as a proxy/gateway to the FastAPI backend.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
    const backendUrl = `${API_BASE_URL}/${API_VERSION}/events`;

    // Extract query parameters from request
    const queryParams = new URLSearchParams();
    if (req.query.type) queryParams.append('type', req.query.type as string);
    if (req.query.location) queryParams.append('location', req.query.location as string);
    if (req.query.status) queryParams.append('status', req.query.status as string);
    if (req.query.page) queryParams.append('page', req.query.page as string);
    if (req.query.limit) queryParams.append('limit', req.query.limit as string);

    const queryString = queryParams.toString();
    const fullUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    // Get auth token from request headers
    const authToken = req.headers.authorization?.replace('Bearer ', '') || null;

    // Try to fetch from backend
    try {
      const backendResponse = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000),
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return res.status(200).json(data);
      }

      // If backend returns error, forward it
      const errorData = await backendResponse.json().catch(() => ({}));
      return res.status(backendResponse.status).json({
        error: errorData.detail || errorData.message || 'Backend request failed',
        status: backendResponse.status,
      });
    } catch (fetchError: any) {
      // Backend unavailable - return empty array as fallback
      // This allows the frontend to continue working without crashing
      console.warn('Backend unavailable, returning empty events array:', {
        error: fetchError.message,
        url: fullUrl,
        suggestion: 'Ensure backend is running at ' + API_BASE_URL,
      });

      // Return response in format expected by frontend
      // Frontend expects either array or { data: [] } format
      return res.status(200).json({
        data: [],
        total: 0,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        total_pages: 0,
      });
    }
  } catch (error) {
    console.error('Events API route error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

