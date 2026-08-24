import type { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import {
  findDuplicateRegistration,
  findRegistrationByMemberId,
  normalizeEmail,
  resolveMemberByEmail,
  resolvePaymentMethod,
  serializeRegistrationDoc,
  syncEventRegistrationCount,
  type CreateRegistrationInput,
  type EventRegistration,
  type PaymentMethod,
} from '@/lib/registrations';

export interface AuthenticatedRegistrant {
  uid: string;
  email: string;
}

export type GuestRegistrationLinkResult = 'link' | 'already_owned' | 'conflict';

/** Decide whether an existing email duplicate can be linked to the authenticated account. */
export function evaluateGuestRegistrationLink(
  existing: EventRegistration,
  authUid: string,
  authEmail: string,
): GuestRegistrationLinkResult {
  if (existing.memberId === authUid) return 'already_owned';
  if (existing.memberId && existing.memberId !== authUid) return 'conflict';
  if (normalizeEmail(existing.email) !== normalizeEmail(authEmail)) return 'conflict';
  return 'link';
}

/** Canonical registration email — authenticated account email always wins. */
export function resolveRegistrationEmail(
  inputEmail: string,
  authenticated: AuthenticatedRegistrant | null,
): string {
  if (authenticated) return authenticated.email;
  return normalizeEmail(inputEmail);
}

export async function resolveAuthenticatedEmail(
  db: Firestore,
  uid: string,
  tokenEmail: string | null,
): Promise<string | null> {
  if (tokenEmail) return normalizeEmail(tokenEmail);
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  const email = snap.data()?.email;
  return typeof email === 'string' ? normalizeEmail(email) : null;
}

export interface SubmitRegistrationParams {
  db: Firestore;
  eventId: string;
  eventTitle: string;
  eventPrice: number | null;
  payfastUrl: string | null;
  eftInstructions: string | null;
  input: CreateRegistrationInput;
  authenticated: AuthenticatedRegistrant | null;
}

export type SubmitRegistrationResult =
  | {
      kind: 'created';
      registration: EventRegistration;
      paymentMethod: PaymentMethod;
      payfastUrl: string | null;
      eftInstructions: string | null;
    }
  | {
      kind: 'already_registered';
      registration: EventRegistration;
      linkedAccount: boolean;
      paymentMethod: PaymentMethod;
      payfastUrl: string | null;
      eftInstructions: string | null;
    }
  | { kind: 'conflict'; message: string };

export async function submitEventRegistration(
  params: SubmitRegistrationParams,
): Promise<SubmitRegistrationResult> {
  const { db, eventId, eventTitle, input, authenticated } = params;
  const paymentMethod = resolvePaymentMethod({
    price: params.eventPrice,
    payfastUrl: params.payfastUrl,
    eftInstructions: params.eftInstructions,
  });

  const payfastUrl = params.payfastUrl || null;
  const eftInstructions = params.eftInstructions || null;

  if (authenticated) {
    const email = authenticated.email;
    const byMember = await findRegistrationByMemberId(db, eventId, authenticated.uid);
    if (byMember) {
      return {
        kind: 'already_registered',
        registration: byMember,
        linkedAccount: false,
        paymentMethod: byMember.paymentMethod,
        payfastUrl,
        eftInstructions,
      };
    }

    const byEmail = await findDuplicateRegistration(db, eventId, email);
    if (byEmail) {
      const linkDecision = evaluateGuestRegistrationLink(byEmail, authenticated.uid, email);
      if (linkDecision === 'conflict') {
        return {
          kind: 'conflict',
          message: 'This registration is linked to another account',
        };
      }
      if (linkDecision === 'already_owned') {
        return {
          kind: 'already_registered',
          registration: byEmail,
          linkedAccount: false,
          paymentMethod: byEmail.paymentMethod,
          payfastUrl,
          eftInstructions,
        };
      }

      const member = await resolveMemberByEmail(db, email);
      await db.collection('registrations').doc(byEmail.id).update({
        memberId: authenticated.uid,
        isMember: member.isMember,
        updatedAt: Timestamp.now(),
      });

      const linked: EventRegistration = {
        ...byEmail,
        memberId: authenticated.uid,
        isMember: member.isMember,
      };

      return {
        kind: 'already_registered',
        registration: linked,
        linkedAccount: true,
        paymentMethod: linked.paymentMethod,
        payfastUrl,
        eftInstructions,
      };
    }

    const member = await resolveMemberByEmail(db, email);
    const docRef = await db.collection('registrations').add({
      eventId,
      eventTitle,
      name: input.name,
      email,
      club: input.club,
      phone: input.phone || null,
      discipline: input.discipline || null,
      createdAt: Timestamp.now(),
      paid: paymentMethod === 'free',
      isMember: member.isMember,
      memberId: authenticated.uid,
      paymentMethod,
      status: 'registered',
    });

    await syncEventRegistrationCount(db, eventId);

    return {
      kind: 'created',
      registration: serializeRegistrationDoc(docRef.id, {
        eventId,
        eventTitle,
        name: input.name,
        email,
        club: input.club,
        phone: input.phone || null,
        discipline: input.discipline || null,
        createdAt: new Date().toISOString(),
        paid: paymentMethod === 'free',
        isMember: member.isMember,
        memberId: authenticated.uid,
        paymentMethod,
        status: 'registered',
      }),
      paymentMethod,
      payfastUrl,
      eftInstructions,
    };
  }

  const email = normalizeEmail(input.email);
  const existing = await findDuplicateRegistration(db, eventId, email);
  if (existing) {
    return {
      kind: 'already_registered',
      registration: existing,
      linkedAccount: false,
      paymentMethod: existing.paymentMethod,
      payfastUrl,
      eftInstructions,
    };
  }

  const member = await resolveMemberByEmail(db, email);
  const docRef = await db.collection('registrations').add({
    eventId,
    eventTitle,
    name: input.name,
    email,
    club: input.club,
    phone: input.phone || null,
    discipline: input.discipline || null,
    createdAt: Timestamp.now(),
    paid: paymentMethod === 'free',
    isMember: member.isMember,
    memberId: member.memberId,
    paymentMethod,
    status: 'registered',
  });

  await syncEventRegistrationCount(db, eventId);

  return {
    kind: 'created',
    registration: serializeRegistrationDoc(docRef.id, {
      eventId,
      eventTitle,
      name: input.name,
      email,
      club: input.club,
      phone: input.phone || null,
      discipline: input.discipline || null,
      createdAt: new Date().toISOString(),
      paid: paymentMethod === 'free',
      isMember: member.isMember,
      memberId: member.memberId,
      paymentMethod,
      status: 'registered',
    }),
    paymentMethod,
    payfastUrl,
    eftInstructions,
  };
}
