import type { Firestore } from 'firebase-admin/firestore';
import type { EventRegistration } from '@/lib/registrations';
import type { Score } from '@/types/scores';
import type { EventLike } from '@/lib/dashboard/nextEvent';

const REGISTRATIONS = 'registrations';
const SCORES = 'scores';
const EVENTS = 'events';
const USERS = 'users';
const EVENT_DOCUMENTS = 'eventDocuments';

export type DashboardUserDoc = {
  firstName?: string | null;
  lastName?: string | null;
  club?: string | null;
  province?: string | null;
  email?: string | null;
};

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

/** Scores linked by scores.userId == Firebase Auth uid. Newest-first client sort. */
export async function loadUserScores(db: Firestore, uid: string): Promise<Score[]> {
  const snap = await db.collection(SCORES).where('userId', '==', uid).get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Score & { deleted?: boolean })
    .filter((s) => !s.deleted)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

export async function loadEventsByIds(
  db: Firestore,
  eventIds: string[],
): Promise<Record<string, EventLike>> {
  const unique = Array.from(new Set(eventIds.filter(Boolean)));
  const byId: Record<string, EventLike> = {};
  await Promise.all(
    unique.map(async (id) => {
      const doc = await db.collection(EVENTS).doc(id).get();
      if (!doc.exists) return;
      const data = doc.data() || {};
      byId[id] = {
        id,
        title: String(data.title || 'Event'),
        date: data.date ? String(data.date) : null,
        location: data.location ? String(data.location) : null,
        status: data.status ? String(data.status) : 'open',
        maxParticipants: Number(data.maxParticipants) || 0,
        currentParticipants: Number(data.currentParticipants) || 0,
      };
    }),
  );
  return byId;
}

/**
 * Candidate events for next-event fallback.
 * Newest-first window (same pattern as public /api/events), filtered to upcoming
 * in pure logic — avoids missing future events behind a long past-date head.
 */
export async function loadCandidateOpenEvents(
  db: Firestore,
  limit = 200,
): Promise<EventLike[]> {
  const snap = await db.collection(EVENTS).orderBy('date', 'desc').limit(limit).get();
  return snap.docs.map((doc) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      title: String(data.title || 'Event'),
      date: data.date ? String(data.date) : null,
      location: data.location ? String(data.location) : null,
      status: data.status ? String(data.status) : 'open',
      maxParticipants: Number(data.maxParticipants) || 0,
      currentParticipants: Number(data.currentParticipants) || 0,
    };
  });
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
