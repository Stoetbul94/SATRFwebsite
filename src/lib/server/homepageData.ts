import { getAdminDb } from '@/lib/firebaseAdmin';
import { serializeEventDoc } from '@/lib/firestoreEvents';
import type { DashboardStats, Event } from '@/lib/api';

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
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export const FALLBACK_HOME_STATS: DashboardStats = {
  members: 0,
  events: 0,
  scores: 'Real time',
  news: 'Latest',
};

export async function fetchDashboardStatsServer(): Promise<DashboardStats> {
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

    return {
      members,
      events,
      scores: 'Real time',
      news: 'Latest',
    };
  } catch (error) {
    console.error('fetchDashboardStatsServer error:', error);
    return FALLBACK_HOME_STATS;
  }
}

export async function fetchOpenEventsServer(limit = 3): Promise<Event[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('events').orderBy('date', 'desc').limit(500).get();

    const events = snapshot.docs.map((doc) =>
      serializeEventDoc(doc.id, doc.data() as Record<string, unknown>),
    ) as Event[];

    return events.filter((event) => event.status === 'open').slice(0, limit);
  } catch (error) {
    console.error('fetchOpenEventsServer error:', error);
    return [];
  }
}
