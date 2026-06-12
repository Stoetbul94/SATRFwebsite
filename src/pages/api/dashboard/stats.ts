import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import type { DashboardStats } from '@/lib/api';

function parseFirestoreDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === 'function') return toDate.call(value);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function effectiveMemberStatus(data: Record<string, unknown>): string {
  if (typeof data.status === 'string' && data.status) return data.status;
  return data.isActive === false ? 'suspended' : 'active';
}

function isInCurrentMonth(date: Date, now = new Date()): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

const FALLBACK_STATS: DashboardStats = {
  members: 0,
  events: 0,
  scores: 'Real time',
  news: 'Latest',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  try {
    const db = getAdminDb();
    const now = new Date();

    const [usersSnapshot, eventsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('events').get(),
    ]);

    const members = usersSnapshot.docs.filter((doc) => {
      const data = doc.data() as Record<string, unknown>;
      if (data.isTestUser === true || data.isTestAccount === true) return false;
      return effectiveMemberStatus(data) === 'active';
    }).length;

    const events = eventsSnapshot.docs.filter((doc) => {
      const data = doc.data() as Record<string, unknown>;
      if (data.isTestEvent === true) return false;
      const eventDate = parseFirestoreDate(data.date);
      return eventDate ? isInCurrentMonth(eventDate, now) : false;
    }).length;

    const stats: DashboardStats = {
      members,
      events,
      scores: 'Real time',
      news: 'Latest',
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return res.status(200).json(FALLBACK_STATS);
  }
}
