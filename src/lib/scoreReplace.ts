import type { Score, ScoreInput } from '@/types/scores';

type ScoreDoc = Score & { deleted?: boolean };

/** True when an existing score should be replaced by a new import for the same shooter/event. */
export function scoreMatchesReplaceKey(score: ScoreDoc, input: ScoreInput): boolean {
  if (score.deleted) return false;

  const stage = input.stage ?? 'qualification';
  if ((score.stage ?? 'qualification') !== stage) return false;
  if (score.discipline !== input.discipline) return false;

  if (input.eventId?.trim()) {
    if (score.eventId !== input.eventId.trim()) return false;
  } else {
    if (score.eventName?.trim().toLowerCase() !== input.eventName?.trim().toLowerCase()) return false;
    const scoreDate = score.date?.slice(0, 10);
    const inputDate = input.date?.slice(0, 10);
    if (scoreDate !== inputDate) return false;
  }

  if (input.userId && score.userId && input.userId === score.userId) return true;

  const nameMatch =
    score.shooterName?.trim().toLowerCase() === input.shooterName?.trim().toLowerCase();
  const clubMatch = score.club?.trim().toLowerCase() === input.club?.trim().toLowerCase();
  return Boolean(nameMatch && clubMatch);
}

export async function findReplaceableScores(
  db: FirebaseFirestore.Firestore,
  input: ScoreInput
): Promise<string[]> {
  const stage = input.stage ?? 'qualification';
  let snapshot: FirebaseFirestore.QuerySnapshot;

  if (input.eventId?.trim()) {
    snapshot = await db
      .collection('scores')
      .where('eventId', '==', input.eventId.trim())
      .where('discipline', '==', input.discipline)
      .where('stage', '==', stage)
      .get();
  } else {
    const date = input.date?.slice(0, 10) ?? input.date;
    snapshot = await db
      .collection('scores')
      .where('eventName', '==', input.eventName.trim())
      .where('date', '==', date)
      .where('discipline', '==', input.discipline)
      .where('stage', '==', stage)
      .get();
  }

  return snapshot.docs
    .filter((doc) => scoreMatchesReplaceKey({ id: doc.id, ...doc.data() } as ScoreDoc, input))
    .map((doc) => doc.id);
}

export async function softDeleteScores(
  db: FirebaseFirestore.Firestore,
  ids: string[],
  adminUid: string
): Promise<number> {
  if (ids.length === 0) return 0;
  const now = new Date().toISOString();
  const batch = db.batch();
  for (const id of ids) {
    batch.update(db.collection('scores').doc(id), {
      deleted: true,
      deletedAt: now,
      deletedBy: adminUid,
    });
  }
  await batch.commit();
  return ids.length;
}
