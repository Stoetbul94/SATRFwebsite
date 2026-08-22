import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import {
  listDropdownNotificationsForUser,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/repository';
import { formatUnreadBadge } from '@/lib/notifications/serialize';
import { DROPDOWN_LIMIT, HISTORY_LIMIT, INBOX_SCAN_LIMIT } from '@/lib/notifications/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyRequestUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = getAdminDb();

    if (req.method === 'GET') {
      const view = typeof req.query.view === 'string' ? req.query.view : 'history';
      const unreadOnly = req.query.unread === '1' || req.query.unread === 'true';
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;

      if (view === 'dropdown') {
        const result = await listDropdownNotificationsForUser(db, user.uid);
        return res.status(200).json({
          notifications: result.notifications,
          unreadCount: result.unreadCount,
          badge: formatUnreadBadge(result.unreadCount),
          limit: DROPDOWN_LIMIT,
          scanLimit: INBOX_SCAN_LIMIT,
          /** Unread among eligible in the most recent INBOX_SCAN_LIMIT published. */
          unreadSemantics: `capped:${INBOX_SCAN_LIMIT}`,
        });
      }

      const result = await listNotificationsForUser(db, user.uid, {
        limit: HISTORY_LIMIT,
        unreadOnly,
        cursor,
      });

      // Badge for history page: inbox scan on first page only (not every Load more).
      let unreadCount = result.unreadCount;
      let badge = formatUnreadBadge(result.unreadCount);
      if (!cursor) {
        const inbox = await listDropdownNotificationsForUser(db, user.uid);
        unreadCount = inbox.unreadCount;
        badge = formatUnreadBadge(inbox.unreadCount);
      }

      return res.status(200).json({
        notifications: result.notifications,
        nextCursor: result.nextCursor,
        unreadCount,
        badge,
        limit: HISTORY_LIMIT,
        scanLimit: INBOX_SCAN_LIMIT,
        unreadSemantics: `capped:${INBOX_SCAN_LIMIT}`,
      });
    }

    if (req.method === 'POST') {
      const action = typeof req.body?.action === 'string' ? req.body.action : '';
      if (action === 'read-all') {
        const result = await markAllNotificationsRead(db, user.uid);
        return res.status(200).json({ success: true, ...result });
      }
      if (action === 'read' && typeof req.body?.notificationId === 'string') {
        await markNotificationRead(db, user.uid, req.body.notificationId);
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
