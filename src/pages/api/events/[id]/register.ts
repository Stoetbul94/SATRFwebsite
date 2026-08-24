import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, verifyOptionalRequestUser } from '@/lib/firebaseAdmin';
import { parseEntryFee } from '@/lib/eventDisciplines';
import {
  resolveAuthenticatedEmail,
  submitEventRegistration,
  type AuthenticatedRegistrant,
} from '@/lib/registrationSubmit';
import {
  isEventRegistrationOpen,
  syncEventRegistrationCount,
  validateRegistrationInput,
} from '@/lib/registrations';

/**
 * POST /api/events/[id]/register
 *
 * Public guest registration OR authenticated website registration (optional Bearer token).
 * Never trusts client-supplied memberId / uid / userId.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const authResult = await verifyOptionalRequestUser(req.headers.authorization);
  if (authResult.kind === 'invalid') {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    // Ignore client identity overrides — never trust these fields.
    delete body.memberId;
    delete body.uid;
    delete body.userId;

    const validation = validateRegistrationInput(body);
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

    let authenticated: AuthenticatedRegistrant | null = null;
    if (authResult.kind === 'authenticated') {
      const accountEmail = await resolveAuthenticatedEmail(db, authResult.uid, authResult.email);
      if (!accountEmail) {
        return res.status(400).json({
          error: 'Your account does not have an email address. Update your profile before registering.',
        });
      }
      authenticated = { uid: authResult.uid, email: accountEmail };
    }

    const result = await submitEventRegistration({
      db,
      eventId: id,
      eventTitle,
      eventPrice: price,
      payfastUrl,
      eftInstructions,
      input: validation.data,
      authenticated,
    });

    if (result.kind === 'conflict') {
      return res.status(409).json({ error: result.message });
    }

    const paymentMessage =
      result.paymentMethod === 'payfast'
        ? 'Registration saved — redirecting to payment'
        : result.paymentMethod === 'eft'
          ? 'Registration saved — see EFT instructions below'
          : 'You are registered for this event';

    if (result.kind === 'already_registered') {
      const linkedMsg = result.linkedAccount
        ? 'Your existing registration is now linked to your My SATRF account'
        : 'You are already registered for this event';

      return res.status(200).json({
        success: true,
        alreadyRegistered: true,
        linkedAccount: result.linkedAccount,
        registration: result.registration,
        paymentMethod: result.paymentMethod,
        payfastUrl: result.payfastUrl,
        eftInstructions: result.eftInstructions,
        message: linkedMsg,
      });
    }

    return res.status(201).json({
      success: true,
      registration: result.registration,
      paymentMethod: result.paymentMethod,
      payfastUrl: result.payfastUrl,
      eftInstructions: result.eftInstructions,
      message: paymentMessage,
      accountLinked: Boolean(authenticated),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register', details: message });
  }
}
