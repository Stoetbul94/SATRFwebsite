import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { markNotificationRead } from '@/lib/notifications/repository';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyRequestUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  try {
    const db = getAdminDb();
    await markNotificationRead(db, user.uid, id);
    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Notification not found') {
      return res.status(404).json({ error: message });
    }
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
