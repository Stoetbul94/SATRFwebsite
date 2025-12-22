import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * Next.js API Route: /api/auth/register
 * 
 * This route proxies registration requests to the backend API.
 * This prevents Network Errors when the backend is unavailable by:
 * 1. Handling the request server-side (no CORS issues)
 * 2. Providing better error handling
 * 3. Centralizing error handling
 * 
 * This route acts as a proxy/gateway to the FastAPI backend.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
    const backendUrl = `${API_BASE_URL}/${API_VERSION}/users/register`;

    // Extract user data from request body
    const userData = req.body;

    // Validate required fields
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'Email, password, first name, and last name are required'
      });
    }

    // Try to register with backend
    try {
      const backendResponse = await axios.post(backendUrl, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (backendResponse.status === 201 || backendResponse.status === 200) {
        return res.status(200).json(backendResponse.data);
      }

      // If backend returns error, forward it
      return res.status(backendResponse.status).json({
        success: false,
        message: backendResponse.data?.detail || backendResponse.data?.message || 'Registration failed',
        error: backendResponse.data?.detail || backendResponse.data?.message || 'Registration failed'
      });
    } catch (axiosError: any) {
      // Backend unavailable or error
      if (axiosError.response) {
        // Backend responded with error
        const status = axiosError.response.status;
        const errorData = axiosError.response.data;
        
        return res.status(status).json({
          success: false,
          message: errorData?.detail || errorData?.message || 'Registration failed',
          error: errorData?.detail || errorData?.message || 'Registration failed'
        });
      } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
        // Backend is not running or unreachable
        console.warn('Backend unavailable for registration:', {
          error: axiosError.message,
          url: backendUrl,
          suggestion: 'Ensure backend is running at ' + API_BASE_URL,
        });

        return res.status(503).json({
          success: false,
          message: 'Registration service is currently unavailable. Please try again later.',
          error: 'Backend service unavailable'
        });
      } else {
        // Other network errors
        console.error('Registration API error:', axiosError.message);
        return res.status(500).json({
          success: false,
          message: 'Registration failed. Please try again.',
          error: axiosError.message || 'Unknown error'
        });
      }
    }
  } catch (error: any) {
    console.error('Registration API route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

