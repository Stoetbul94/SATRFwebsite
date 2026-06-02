import type { NextApiRequest, NextApiResponse } from 'next';
import { getStorage } from 'firebase-admin/storage';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminApp, getAdminDb } from '@/lib/firebaseAdmin';

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
    const buffer = Buffer.from(imageBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be smaller than 5MB' });
    }

    const type = typeof contentType === 'string' ? contentType : 'image/jpeg';
    const ext = type.includes('png') ? 'png' : type.includes('gif') ? 'gif' : 'jpg';
    const objectPath = `events/${id}/cover.${ext}`;

    const bucket = getStorage(getAdminApp()).bucket();
    const file = bucket.file(objectPath);

    await file.save(buffer, {
      metadata: {
        contentType: type,
        cacheControl: 'public, max-age=31536000',
      },
      resumable: false,
    });

    // Long-lived read URL for the event card.
    const [imageUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
    });

    await getAdminDb().collection('events').doc(id).set(
      { imageUrl, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    return res.status(200).json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('Event image upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      details: error.message || 'Unknown error',
    });
  }
}
