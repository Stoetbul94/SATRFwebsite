import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  createNotification,
  listNotificationsForEvent,
} from '@/lib/notifications/repository';
import { sanitizeNotificationHref, buildEventHubHref } from '@/lib/notifications/hrefSafety';
import type { NotificationType } from '@/lib/notifications/types';
import { NOTIFICATION_TYPES } from '@/lib/notifications/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { isAdmin, userId } = await verifyAdminFromToken(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { id: eventId } = req.query;
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  try {
    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventTitle = String(eventDoc.data()?.title || 'SATRF Event');

    if (req.method === 'GET') {
      const notifications = await listNotificationsForEvent(db, eventId);
      return res.status(200).json({
        eventId,
        eventTitle,
        notifications,
        audienceLabel: 'All registered website users',
      });
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const typeRaw = String(body.type || 'event-update');
      const type: NotificationType = NOTIFICATION_TYPES.includes(typeRaw as NotificationType)
        ? (typeRaw as NotificationType)
        : 'event-update';
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!title) return res.status(400).json({ error: 'Title is required' });
      if (!message) return res.status(400).json({ error: 'Message is required' });

      const href =
        sanitizeNotificationHref(body.href) || buildEventHubHref(eventId);

      if (body.action === 'preview') {
        return res.status(200).json({
          preview: {
            type,
            title,
            message,
            href,
            audienceLabel: 'All registered website users',
          },
        });
      }

      const notification = await createNotification(db, {
        type,
        title,
        message,
        href,
        eventId,
        audience: { type: 'all-website-users' },
        createdBy: userId,
        sourceType: 'admin-manual',
        sourceId: eventId,
        status: 'published',
      });

      if (userId) {
        await db.collection('adminActions').add({
          adminId: userId,
          action: 'publish_notification',
          targetId: notification.id,
          details: {
            eventId,
            type: notification.type,
            audience: 'all-website-users',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(201).json({ notification });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Event communications API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
