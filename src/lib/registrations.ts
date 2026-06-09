import type { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { isValidEventDiscipline } from '@/lib/eventDisciplines';
import type { Discipline } from '@/types/scores';

export type RegistrationStatus = 'registered' | 'cancelled';
export type PaymentMethod = 'payfast' | 'eft' | 'free' | null;

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  club: string;
  phone?: string | null;
  discipline?: string | null;
  createdAt: string;
  paid: boolean;
  isMember: boolean;
  memberId: string | null;
  paymentMethod: PaymentMethod;
  status: RegistrationStatus;
}

export interface CreateRegistrationInput {
  name: string;
  email: string;
  club: string;
  phone?: string;
  discipline?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRegistrationInput(body: Record<string, unknown>): {
  ok: boolean;
  errors: string[];
  data?: CreateRegistrationInput;
} {
  const errors: string[] = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const club = typeof body.club === 'string' ? body.club.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
  const discipline = typeof body.discipline === 'string' ? body.discipline.trim() : undefined;

  if (!name) errors.push('Full name is required');
  if (!email) errors.push('Email is required');
  else if (!EMAIL_RE.test(email)) errors.push('Invalid email format');
  if (!club) errors.push('Club is required');
  if (discipline && !isValidEventDiscipline(discipline)) {
    errors.push('Invalid discipline');
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    data: {
      name,
      email,
      club,
      phone: phone || undefined,
      discipline: discipline || undefined,
    },
  };
}

export function isEventRegistrationOpen(event: {
  status?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  date?: string | null;
}): { open: boolean; reason?: string } {
  const status = String(event.status || 'open').toLowerCase();
  if (['closed', 'cancelled', 'completed', 'concluded'].includes(status)) {
    return { open: false, reason: 'Registration is closed for this event' };
  }
  const max = Number(event.maxParticipants) || 0;
  const current = Number(event.currentParticipants) || 0;
  if (max > 0 && current >= max) {
    return { open: false, reason: 'This event is full' };
  }
  if (event.date) {
    const eventDate = new Date(event.date);
    if (!isNaN(eventDate.getTime()) && eventDate < new Date()) {
      return { open: false, reason: 'This event has already concluded' };
    }
  }
  return { open: true };
}

export function resolvePaymentMethod(event: {
  price?: number | null;
  payfastUrl?: string | null;
  eftInstructions?: string | null;
}): PaymentMethod {
  const fee = event.price ?? 0;
  if (fee <= 0) return 'free';
  if (event.payfastUrl) return 'payfast';
  if (event.eftInstructions) return 'eft';
  return null;
}

/** Match registrant email to an active member in `users`. */
export async function resolveMemberByEmail(
  db: Firestore,
  email: string
): Promise<{ isMember: boolean; memberId: string | null }> {
  const normalized = normalizeEmail(email);
  const snap = await db.collection('users').where('email', '==', normalized).limit(5).get();
  if (snap.empty) {
    // Case-insensitive fallback scan (Firestore is case-sensitive on equality)
    const all = await db.collection('users').limit(500).get();
    for (const doc of all.docs) {
      const data = doc.data();
      const userEmail = typeof data.email === 'string' ? normalizeEmail(data.email) : '';
      if (userEmail === normalized && data.status === 'active') {
        return { isMember: true, memberId: doc.id };
      }
    }
    return { isMember: false, memberId: null };
  }
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.status === 'active') {
      return { isMember: true, memberId: doc.id };
    }
  }
  return { isMember: false, memberId: null };
}

export async function countActiveRegistrations(db: Firestore, eventId: string): Promise<number> {
  const snap = await db
    .collection('registrations')
    .where('eventId', '==', eventId)
    .where('status', '==', 'registered')
    .get();
  return snap.size;
}

export async function syncEventRegistrationCount(db: Firestore, eventId: string): Promise<number> {
  const count = await countActiveRegistrations(db, eventId);
  await db.collection('events').doc(eventId).set(
    {
      currentParticipants: count,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  return count;
}

export async function findDuplicateRegistration(
  db: Firestore,
  eventId: string,
  email: string
): Promise<EventRegistration | null> {
  const normalized = normalizeEmail(email);
  const snap = await db
    .collection('registrations')
    .where('eventId', '==', eventId)
    .where('email', '==', normalized)
    .where('status', '==', 'registered')
    .limit(1)
    .get();
  if (snap.empty) return null;
  return serializeRegistrationDoc(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);
}

export function serializeRegistrationDoc(
  id: string,
  data: Record<string, unknown>
): EventRegistration {
  const toIso = (d: unknown): string => {
    if (!d) return new Date().toISOString();
    if (typeof d === 'object' && d !== null && 'toDate' in d) {
      return (d as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof d === 'string') return d;
    return new Date().toISOString();
  };

  return {
    id,
    eventId: String(data.eventId || ''),
    eventTitle: String(data.eventTitle || ''),
    name: String(data.name || ''),
    email: String(data.email || ''),
    club: String(data.club || ''),
    phone: data.phone ? String(data.phone) : null,
    discipline: data.discipline ? String(data.discipline) : null,
    createdAt: toIso(data.createdAt),
    paid: Boolean(data.paid),
    isMember: Boolean(data.isMember),
    memberId: data.memberId ? String(data.memberId) : null,
    paymentMethod: (data.paymentMethod as PaymentMethod) ?? null,
    status: (data.status as RegistrationStatus) || 'registered',
  };
}
