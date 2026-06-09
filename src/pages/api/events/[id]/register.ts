import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { parseEntryFee } from '@/lib/eventDisciplines';
import {
  findDuplicateRegistration,
  isEventRegistrationOpen,
  resolveMemberByEmail,
  resolvePaymentMethod,
  serializeRegistrationDoc,
  syncEventRegistrationCount,
  validateRegistrationInput,
} from '@/lib/registrations';

/**
 * POST /api/events/[id]/register — public guest registration (no auth).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    const validation = validateRegistrationInput((req.body ?? {}) as Record<string, unknown>);
    if (!validation.ok || !validation.data) {
      return res.status(400).json({ error: validation.errors.join('; ') });
    }

    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data() as Record<string, unknown>;
    const eventTitle = String(eventData.title || '');
    const price = parseEntryFee(eventData.price);
    const payfastUrl = typeof eventData.payfastUrl === 'string' ? eventData.payfastUrl : null;
    const eftInstructions =
      typeof eventData.eftInstructions === 'string' ? eventData.eftInstructions : null;

    const currentCount = await syncEventRegistrationCount(db, id);
    const openCheck = isEventRegistrationOpen({
      status: String(eventData.status || 'open'),
      maxParticipants: Number(eventData.maxParticipants) || 0,
      currentParticipants: currentCount,
      date: eventData.date
        ? typeof eventData.date === 'object' && eventData.date !== null && 'toDate' in eventData.date
          ? (eventData.date as { toDate: () => Date }).toDate().toISOString()
          : String(eventData.date)
        : null,
    });

    if (!openCheck.open) {
      return res.status(403).json({ error: openCheck.reason || 'Registration is not available' });
    }

    const existing = await findDuplicateRegistration(db, id, validation.data.email);
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyRegistered: true,
        registration: existing,
        paymentMethod: existing.paymentMethod,
        payfastUrl: payfastUrl || null,
        eftInstructions: eftInstructions || null,
        message: 'You are already registered for this event',
      });
    }

    const member = await resolveMemberByEmail(db, validation.data.email);
    const paymentMethod = resolvePaymentMethod({ price, payfastUrl, eftInstructions });

    const docRef = await db.collection('registrations').add({
      eventId: id,
      eventTitle,
      name: validation.data.name,
      email: validation.data.email,
      club: validation.data.club,
      phone: validation.data.phone || null,
      discipline: validation.data.discipline || null,
      createdAt: Timestamp.now(),
      paid: paymentMethod === 'free',
      isMember: member.isMember,
      memberId: member.memberId,
      paymentMethod,
      status: 'registered',
    });

    await syncEventRegistrationCount(db, id);

    const saved = serializeRegistrationDoc(docRef.id, {
      eventId: id,
      eventTitle,
      ...validation.data,
      email: validation.data.email,
      createdAt: new Date().toISOString(),
      paid: paymentMethod === 'free',
      isMember: member.isMember,
      memberId: member.memberId,
      paymentMethod,
      status: 'registered',
    });

    return res.status(201).json({
      success: true,
      registration: saved,
      paymentMethod,
      payfastUrl: payfastUrl || null,
      eftInstructions: eftInstructions || null,
      message:
        paymentMethod === 'payfast'
          ? 'Registration saved — redirecting to payment'
          : paymentMethod === 'eft'
            ? 'Registration saved — see EFT instructions below'
            : 'You are registered for this event',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register', details: message });
  }
}
