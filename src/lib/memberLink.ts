import type { Firestore } from 'firebase-admin/firestore';
import { deriveAgeCategory } from '@/lib/memberFields';

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
