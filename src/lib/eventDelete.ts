/** Returns a user-facing block message when linked scores prevent delete, else null. */
export function eventDeleteBlockedMessage(scoreCount: number): string | null {
  if (scoreCount <= 0) return null;
  const noun = scoreCount === 1 ? 'score' : 'scores';
  return `Cannot delete: ${scoreCount} ${noun} linked to this event. Remove them from Admin → Scores first.`;
}

export function countLinkedActiveScores(
  docs: { data: () => Record<string, unknown> }[]
): number {
  return docs.filter((doc) => doc.data().deleted !== true).length;
}

const FIRESTORE_BATCH_LIMIT = 500;

/** Delete Firestore docs in batches (max 500 per commit). */
export async function deleteDocsInBatches(
  db: FirebaseFirestore.Firestore,
  docs: FirebaseFirestore.QueryDocumentSnapshot[]
): Promise<void> {
  for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + FIRESTORE_BATCH_LIMIT)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}
