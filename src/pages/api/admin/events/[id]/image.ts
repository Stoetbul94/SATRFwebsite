import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { uploadEventCoverImage } from '@/lib/eventImageUpload';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

/**
 * POST /api/admin/events/[id]/image
 * Upload event cover via Admin SDK (bypasses client Storage permission issues).
 * Body: { imageBase64: string, contentType?: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { isAdmin } = await verifyAdminFromToken(token);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  const { imageBase64, contentType } = req.body ?? {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  try {
    const imageUrl = await uploadEventCoverImage(id, imageBase64, contentType);
    return res.status(200).json({ success: true, imageUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Event image upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      details: message,
    });
  }
}
