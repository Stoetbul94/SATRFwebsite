import type { ScoreInput } from '@/types/scores';
import { membershipIsVeteran, parseIsVeteranFlag } from '@/lib/scoreVeteran';

export interface MemberLookup {
  uid: string | null;
  club: string;
  membershipType?: string;
  isVeteran: boolean;
}

export async function lookupMemberByName(
  db: FirebaseFirestore.Firestore,
  shooterName: string,
  cache: Map<string, MemberLookup | null>
): Promise<MemberLookup | null> {
  const key = shooterName.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const parts = shooterName.trim().split(/\s+/);
    if (parts.length < 2) {
      cache.set(key, null);
      return null;
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    const snap = await db
      .collection('users')
      .where('firstName', '==', firstName)
      .where('lastName', '==', lastName)
      .limit(3)
      .get();
    if (snap.empty) {
      cache.set(key, null);
      return null;
    }
    const doc = snap.docs[0];
    const d = doc.data();
    const membershipType = (d.membershipType as string) || undefined;
    const result: MemberLookup = {
      uid: doc.id,
      club: (d.club as string) || '',
      membershipType,
      isVeteran: membershipIsVeteran(membershipType),
    };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export async function lookupMemberByUid(
  db: FirebaseFirestore.Firestore,
  uid: string,
  cache: Map<string, MemberLookup | null>
): Promise<MemberLookup | null> {
  if (cache.has(uid)) return cache.get(uid)!;
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      cache.set(uid, null);
      return null;
    }
    const d = doc.data()!;
    const membershipType = (d.membershipType as string) || undefined;
    const result: MemberLookup = {
      uid: doc.id,
      club: (d.club as string) || '',
      membershipType,
      isVeteran: membershipIsVeteran(membershipType),
    };
    cache.set(uid, result);
    return result;
  } catch {
    cache.set(uid, null);
    return null;
  }
}

/** Link member + apply isVeteran from profile when not explicitly set on input. */
export async function enrichScoreInput(
  db: FirebaseFirestore.Firestore,
  input: ScoreInput,
  uidCache: Map<string, string | null>,
  memberCache: Map<string, MemberLookup | null>
): Promise<ScoreInput> {
  let userId = input.userId?.trim() ? input.userId : null;
  let club = input.club?.trim() ?? '';
  let isVeteran = input.isVeteran === true;

  if (!userId && club) {
    const parts = input.shooterName.trim().split(/\s+/);
    if (parts.length >= 2) {
      const key = `${input.shooterName.toLowerCase()}|${club.toLowerCase()}`;
      if (uidCache.has(key)) {
        userId = uidCache.get(key)!;
      } else {
        try {
          const snap = await db
            .collection('users')
            .where('firstName', '==', parts[0])
            .where('lastName', '==', parts.slice(1).join(' '))
            .where('club', '==', club)
            .limit(1)
            .get();
          userId = snap.empty ? null : snap.docs[0].id;
        } catch {
          userId = null;
        }
        uidCache.set(key, userId);
      }
    }
  }

  if (userId) {
    const member = await lookupMemberByUid(db, userId, memberCache);
    if (member) {
      if (!club) club = member.club;
      if (!isVeteran && member.isVeteran) isVeteran = true;
    }
  } else {
    const member = await lookupMemberByName(db, input.shooterName, memberCache);
    if (member) {
      userId = member.uid;
      if (!club) club = member.club;
      if (!isVeteran && member.isVeteran) isVeteran = true;
    }
  }

  return {
    ...input,
    userId,
    club,
    isVeteran: isVeteran ? true : undefined,
  };
}

export function veteranFlagFromImportData(data: Record<string, unknown>): boolean {
  if (data.veteran != null && String(data.veteran).trim() !== '') {
    return parseIsVeteranFlag(data.veteran);
  }
  return false;
}
