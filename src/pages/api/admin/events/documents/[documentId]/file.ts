import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getEventDocument } from '@/lib/eventDocuments/repository';
import {
  createDraftReadUrl,
  createPublishedReadUrl,
} from '@/lib/eventDocuments/storage';

/**
 * GET /api/admin/events/documents/[documentId]/file
 * Returns a short-lived signed URL for admin view/download.
 * Drafts never rely on a durable public bearer URL stored in Firestore.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { isAdmin } = await verifyAdminFromToken(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { documentId } = req.query;
  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  try {
    const db = getAdminDb();
    const doc = await getEventDocument(db, documentId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!doc.storagePath) {
      return res.status(404).json({ error: 'Document has no storage file' });
    }

    const fileUrl =
      doc.status === 'published'
        ? await createPublishedReadUrl(doc.storagePath)
        : await createDraftReadUrl(doc.storagePath);

    return res.status(200).json({
      documentId: doc.id,
      status: doc.status,
      fileUrl,
      downloadFileName: doc.downloadFileName || `${doc.id}.pdf`,
      expiresInSeconds: doc.status === 'published' ? 7 * 24 * 60 * 60 : 60 * 60,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin document file URL error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
