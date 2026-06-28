import type { Firestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { deriveAgeCategory } from '@/lib/memberFields';
import { normalizeEmail } from '@/lib/registrations';

export interface SignupMemberFields {
  firstName: string;
  lastName: string;
  email: string;
  membershipType: 'junior' | 'senior' | 'veteran';
  club: string;
  province: string;
  dateOfBirth: string;
  phone: string;
  disciplines?: string[];
}

/** Find an existing Firestore member record by email (users collection). */
export async function findExistingMemberByEmail(
  db: Firestore,
  email: string
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const snap = await db.collection('users').where('email', '==', email).limit(5).get();
  if (snap.empty) return null;

  // Prefer a legacy record (doc id differs from stored authUid) or any unlinked record.
  const unlinked = snap.docs.find((doc) => {
    const data = doc.data();
    const authUid = data.authUid as string | undefined;
    return !authUid || authUid !== doc.id;
  });
  return unlinked ?? snap.docs[0];
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Merge signup data into an existing member doc — fill gaps only, preserve admin data. */
export function mergeMemberData(
  existing: FirebaseFirestore.DocumentData,
  signup: SignupMemberFields,
  authUid: string,
  now: string
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...existing };

  const fillIfEmpty = (key: string, value: unknown) => {
    if (isEmpty(value)) return;
    if (isEmpty(merged[key])) merged[key] = value;
  };

  fillIfEmpty('firstName', signup.firstName.trim());
  fillIfEmpty('lastName', signup.lastName.trim());
  fillIfEmpty('club', signup.club.trim());
  fillIfEmpty('membershipType', signup.membershipType);
  fillIfEmpty('province', signup.province);
  fillIfEmpty('dateOfBirth', signup.dateOfBirth);
  fillIfEmpty('phone', signup.phone.trim());
  fillIfEmpty('phoneNumber', signup.phone.trim());

  if (isEmpty(merged.disciplines) && signup.disciplines?.length) {
    merged.disciplines = signup.disciplines;
  }

  if (isEmpty(merged.ageCategory)) {
    merged.ageCategory = deriveAgeCategory(signup.dateOfBirth);
  }

  merged.id = authUid;
  merged.authUid = authUid;
  merged.email = signup.email;
  merged.updatedAt = now;

  if (!merged.createdAt) merged.createdAt = now;
  if (!merged.role) merged.role = 'user';
  if (!merged.status) merged.status = 'pending';
  if (merged.isActive === undefined) merged.isActive = true;
  if (merged.emailConfirmed === undefined) merged.emailConfirmed = false;
  if (merged.loginCount === undefined) merged.loginCount = 0;

  return merged;
}

const BATCH_LIMIT = 450;

/** Re-key scores (and other refs) from a legacy member doc id to the new Auth uid. */
export async function migrateMemberReferences(
  db: Firestore,
  oldDocId: string,
  newUid: string
): Promise<void> {
  if (oldDocId === newUid) return;

  const scoresSnap = await db.collection('scores').where('userId', '==', oldDocId).get();

  let batch = db.batch();
  let ops = 0;

  const commitIfNeeded = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const scoreDoc of scoresSnap.docs) {
    batch.update(scoreDoc.ref, { userId: newUid });
    ops += 1;
    if (ops >= BATCH_LIMIT) await commitIfNeeded();
  }

  // eventRegistrations (legacy name on some deployments)
  for (const collectionName of ['eventRegistrations', 'registrations']) {
    try {
      const regSnap = await db.collection(collectionName).where('userId', '==', oldDocId).get();
      for (const regDoc of regSnap.docs) {
        batch.update(regDoc.ref, { userId: newUid });
        ops += 1;
        if (ops >= BATCH_LIMIT) await commitIfNeeded();
      }
    } catch {
      /* collection may not exist */
    }
  }

  await commitIfNeeded();
}

export interface MemberLinkProfile {
  userId: string;
  firstName: string;
  lastName: string;
  club?: string;
  email?: string;
}

export interface LinkableScorePreview {
  id: string;
  shooterName: string;
  club: string;
  eventName: string;
  date: string;
  discipline: string;
}

export interface LinkableRegistrationPreview {
  id: string;
  eventTitle: string;
  name: string;
  email: string;
  createdAt: string;
}

export function memberDisplayName(user: { firstName?: string; lastName?: string }): string {
  return `${(user.firstName || '').trim()} ${(user.lastName || '').trim()}`.trim();
}

export function scoreMatchesMemberProfile(
  score: {
    shooterName?: string;
    club?: string;
    userId?: string | null;
    deleted?: boolean;
  },
  member: { firstName?: string; lastName?: string; club?: string }
): boolean {
  if (score.deleted) return false;
  if (score.userId) return false;

  const memberName = memberDisplayName(member).toLowerCase();
  const scoreName = (score.shooterName || '').trim().toLowerCase();
  if (!memberName || memberName !== scoreName) return false;

  const memberClub = (member.club || '').trim().toLowerCase();
  const scoreClub = (score.club || '').trim().toLowerCase();
  if (memberClub && scoreClub && memberClub !== scoreClub) return false;

  return true;
}

function toScorePreview(id: string, data: Record<string, unknown>): LinkableScorePreview {
  return {
    id,
    shooterName: String(data.shooterName || ''),
    club: String(data.club || ''),
    eventName: String(data.eventName || ''),
    date: String(data.date || ''),
    discipline: String(data.discipline || ''),
  };
}

function toRegistrationPreview(id: string, data: Record<string, unknown>): LinkableRegistrationPreview {
  const toIso = (d: unknown): string => {
    if (!d) return '';
    if (typeof d === 'object' && d !== null && 'toDate' in d) {
      return (d as { toDate: () => Date }).toDate().toISOString();
    }
    return typeof d === 'string' ? d : '';
  };

  return {
    id,
    eventTitle: String(data.eventTitle || ''),
    name: String(data.name || ''),
    email: String(data.email || ''),
    createdAt: toIso(data.createdAt),
  };
}

/** Find guest scores that match a member profile (name + club when both set). */
export async function findUnlinkedScoresForMember(
  db: Firestore,
  member: MemberLinkProfile
): Promise<LinkableScorePreview[]> {
  const snap = await db.collection('scores').where('userId', '==', null).get();
  return snap.docs
    .filter((doc) => scoreMatchesMemberProfile(doc.data() as Record<string, unknown>, member))
    .map((doc) => toScorePreview(doc.id, doc.data() as Record<string, unknown>));
}

/** Find guest registrations for the member's email. */
export async function findUnlinkedRegistrationsForMember(
  db: Firestore,
  member: MemberLinkProfile
): Promise<LinkableRegistrationPreview[]> {
  const email = member.email?.trim();
  if (!email) return [];

  const normalized = normalizeEmail(email);
  const snap = await db.collection('registrations').where('email', '==', normalized).get();

  return snap.docs
    .filter((doc) => {
      const data = doc.data();
      return !data.memberId;
    })
    .map((doc) => toRegistrationPreview(doc.id, doc.data() as Record<string, unknown>));
}

export async function linkScoresToMember(
  db: Firestore,
  userId: string,
  scoreIds: string[]
): Promise<number> {
  if (scoreIds.length === 0) return 0;

  const now = new Date().toISOString();
  let batch = db.batch();
  let ops = 0;
  let linked = 0;

  const commitIfNeeded = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const scoreId of scoreIds) {
    const ref = db.collection('scores').doc(scoreId);
    const doc = await ref.get();
    if (!doc.exists) continue;
    const data = doc.data() as Record<string, unknown>;
    if (data.deleted || data.userId) continue;

    batch.update(ref, { userId, updatedAt: now });
    ops += 1;
    linked += 1;
    if (ops >= BATCH_LIMIT) await commitIfNeeded();
  }

  await commitIfNeeded();
  return linked;
}

export async function linkRegistrationsByEmail(
  db: Firestore,
  userId: string,
  email: string
): Promise<number> {
  const normalized = normalizeEmail(email);
  if (!normalized) return 0;

  const snap = await db.collection('registrations').where('email', '==', normalized).get();
  const toLink = snap.docs.filter((doc) => !doc.data().memberId);
  if (toLink.length === 0) return 0;

  let batch = db.batch();
  let ops = 0;
  let linked = 0;

  const commitIfNeeded = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const doc of toLink) {
    batch.update(doc.ref, {
      memberId: userId,
      isMember: true,
      updatedAt: Timestamp.now(),
    });
    ops += 1;
    linked += 1;
    if (ops >= BATCH_LIMIT) await commitIfNeeded();
  }

  await commitIfNeeded();
  return linked;
}

export function memberProfileFromUserDoc(
  userId: string,
  data: Record<string, unknown>
): MemberLinkProfile {
  return {
    userId,
    firstName: String(data.firstName || ''),
    lastName: String(data.lastName || ''),
    club: typeof data.club === 'string' ? data.club : '',
    email: typeof data.email === 'string' ? data.email : '',
  };
}
