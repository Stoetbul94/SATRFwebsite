import { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { name, email, subject, category, priority, message, userAgent, pageUrl } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        subject,
        category: category || 'general',
        priority: priority || 'medium',
        message,
        userAgent,
        pageUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Backend API error');
    }

    // Capture successful submission in Sentry
    Sentry.addBreadcrumb({
      category: 'contact_form',
      message: 'Contact form submitted successfully via API route',
      level: 'info',
      data: {
        category,
        priority,
        subject,
      },
    });

    return res.status(200).json(data);

  } catch (error) {
    console.error('Contact API error:', error);

    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'contact_api',
        action: 'submit',
      },
      extra: {
        requestBody: req.body,
        userAgent: req.headers['user-agent'],
      },
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again.',
    });
  }
} 