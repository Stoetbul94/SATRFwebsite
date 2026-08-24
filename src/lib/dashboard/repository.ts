import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { startOfToday } from '@/lib/eventDisplay';
import { serializeEventDoc } from '@/lib/firestoreEvents';
import type { EventRegistration } from '@/lib/registrations';
import type { Score } from '@/types/scores';
import { isUpcomingEvent, type EventLike } from '@/lib/dashboard/nextEvent';

const REGISTRATIONS = 'registrations';
const SCORES = 'scores';
const EVENTS = 'events';
const USERS = 'users';
const EVENT_DOCUMENTS = 'eventDocuments';

/** Max fallback open events fetched when no registered upcoming event exists. */
export const DASHBOARD_CANDIDATE_EVENT_LIMIT = 20;

/** Score query buffer — filter deleted/invalid stages, then take latest 5. */
export const DASHBOARD_SCORE_QUERY_LIMIT = 20;

export type DashboardUserDoc = {
  firstName?: string | null;
  lastName?: string | null;
  club?: string | null;
  province?: string | null;
  email?: string | null;
};

/** Map canonical serialized event doc → dashboard EventLike. */
export function eventLikeFromFirestore(id: string, data: Record<string, unknown>): EventLike {
  const serialized = serializeEventDoc(id, data);
  return {
    id: serialized.id,
    title: serialized.title || 'Event',
    date: serialized.date,
    location: serialized.location || null,
    status: serialized.status || 'open',
    maxParticipants: serialized.maxParticipants,
    currentParticipants: serialized.currentParticipants,
  };
}

export async function loadDashboardUser(
  db: Firestore,
  uid: string,
): Promise<DashboardUserDoc | null> {
  const snap = await db.collection(USERS).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return {
    firstName: typeof data.firstName === 'string' ? data.firstName : null,
    lastName: typeof data.lastName === 'string' ? data.lastName : null,
    club: typeof data.club === 'string' ? data.club : null,
    province: typeof data.province === 'string' ? data.province : null,
    email: typeof data.email === 'string' ? data.email : null,
  };
}

/**
 * Active registrations for the authenticated website user.
 * Canonical link: registrations.memberId == Firebase Auth uid.
 */
export async function loadUserRegistrations(
  db: Firestore,
  uid: string,
): Promise<EventRegistration[]> {
  const snap = await db
    .collection(REGISTRATIONS)
    .where('memberId', '==', uid)
    .where('status', '==', 'registered')
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      eventId: String(data.eventId || ''),
      eventTitle: String(data.eventTitle || ''),
      name: String(data.name || ''),
      email: String(data.email || ''),
      club: String(data.club || ''),
      phone: data.phone ?? null,
      discipline: data.discipline ?? null,
      createdAt: String(data.createdAt || ''),
      paid: Boolean(data.paid),
      isMember: Boolean(data.isMember),
      memberId: data.memberId ?? null,
      paymentMethod: data.paymentMethod ?? null,
      status: data.status === 'cancelled' ? 'cancelled' : 'registered',
    } as EventRegistration;
  });
}

/**
 * Bounded recent scores for dashboard.
 * Canonical storage: `date` is ISO date string (YYYY-MM-DD or full ISO).
 */
export async function loadUserScores(
  db: Firestore,
  uid: string,
  limit = DASHBOARD_SCORE_QUERY_LIMIT,
): Promise<Array<Score & { deleted?: boolean }>> {
  const snap = await db
    .collection(SCORES)
    .where('userId', '==', uid)
    .orderBy('date', 'desc')
    .limit(limit)
    .get();

  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Score & { deleted?: boolean })
    .filter((s) => !s.deleted);
}

/**
 * Fetch event documents by id, skipping ids already present in `existing`.
 */
export async function loadEventsByIds(
  db: Firestore,
  eventIds: string[],
  existing: Record<string, EventLike> = {},
): Promise<Record<string, EventLike>> {
  const byId: Record<string, EventLike> = { ...existing };
  const missing = Array.from(new Set(eventIds.filter((id) => id && !byId[id])));

  await Promise.all(
    missing.map(async (id) => {
      const doc = await db.collection(EVENTS).doc(id).get();
      if (!doc.exists) return;
      byId[id] = eventLikeFromFirestore(doc.id, (doc.data() || {}) as Record<string, unknown>);
    }),
  );

  return byId;
}

/**
 * Fallback open/upcoming events — only when no registered upcoming event applies.
 *
 * Primary: admin-created events store Firestore Timestamp on `date`; query upcoming
 * directly (date ASC, limit 20).
 *
 * Fallback: bounded desc window + client upcoming filter for legacy/mixed-type edge cases.
 */
export async function loadCandidateOpenEvents(
  db: Firestore,
  limit = DASHBOARD_CANDIDATE_EVENT_LIMIT,
): Promise<EventLike[]> {
  const today = startOfToday();

  try {
    const snap = await db
      .collection(EVENTS)
      .where('date', '>=', Timestamp.fromDate(today))
      .orderBy('date', 'asc')
      .limit(limit)
      .get();

    if (!snap.empty) {
      return snap.docs.map((doc) =>
        eventLikeFromFirestore(doc.id, (doc.data() || {}) as Record<string, unknown>),
      );
    }
  } catch {
    // Index missing or mixed date types — fall through to bounded desc scan.
  }

  const snap = await db.collection(EVENTS).orderBy('date', 'desc').limit(limit).get();
  return snap.docs
    .map((doc) => eventLikeFromFirestore(doc.id, (doc.data() || {}) as Record<string, unknown>))
    .filter((event) => isUpcomingEvent(event, today));
}

/** True if a published Call for Entries exists for the event (no signed URL). */
export async function hasPublishedCallForEntries(
  db: Firestore,
  eventId: string,
): Promise<boolean> {
  if (!eventId) return false;
  const snap = await db
    .collection(EVENT_DOCUMENTS)
    .where('linkedEventIds', 'array-contains', eventId)
    .where('type', '==', 'call-for-entries')
    .where('status', '==', 'published')
    .limit(1)
    .get();
  return !snap.empty;
}
