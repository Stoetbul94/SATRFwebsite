import { rank3pFinalists, rankProneFinalists } from '@/lib/issf';
import type { Discipline, Score, ScoreStage } from '@/types/scores';

export type FinalStage = 'prone_final' | '3p_final';

export interface FinalistDoc {
  id: string;
  decimalTotal: number;
  eliminatedAtShot?: number | null;
}

export function isFinalStage(stage: ScoreStage | undefined): stage is FinalStage {
  return stage === 'prone_final' || stage === '3p_final';
}

export function computeFinalRankMap(stage: FinalStage, docs: FinalistDoc[]): Map<string, number> {
  if (stage === '3p_final') {
    return rank3pFinalists(
      docs.map((d) => ({
        id: d.id,
        eliminatedAtShot: d.eliminatedAtShot,
        decimalTotal: d.decimalTotal,
      })),
    );
  }
  return rankProneFinalists(docs.map((d) => ({ id: d.id, decimalTotal: d.decimalTotal })));
}

export interface RecomputeFinalRanksParams {
  eventId: string;
  discipline: Discipline;
  stage: FinalStage;
}

type FirestoreDb = FirebaseFirestore.Firestore;

export async function recomputeFinalRanksForEvent(
  db: FirestoreDb,
  { eventId, discipline, stage }: RecomputeFinalRanksParams,
): Promise<void> {
  if (!eventId) return;

  const snapshot = await db
    .collection('scores')
    .where('eventId', '==', eventId)
    .where('discipline', '==', discipline)
    .where('stage', '==', stage)
    .where('status', '==', 'official')
    .get();

  const docs = snapshot.docs
    .filter((d) => !(d.data() as Score & { deleted?: boolean }).deleted)
    .map((d) => {
      const data = d.data() as Score;
      return {
        id: d.id,
        decimalTotal: data.decimalTotal,
        eliminatedAtShot: data.eliminatedAtShot,
      };
    });

  if (docs.length === 0) return;

  const rankMap = computeFinalRankMap(stage, docs);
  const batch = db.batch();
  const updatedAt = new Date().toISOString();

  for (const doc of docs) {
    const rank = rankMap.get(doc.id);
    if (rank != null) {
      batch.update(db.collection('scores').doc(doc.id), { finalRank: rank, updatedAt });
    }
  }

  await batch.commit();
}

export function finalGroupsToRecomputeAfterUpdate(
  existing: Pick<Score, 'eventId' | 'discipline' | 'stage' | 'decimalTotal'>,
  updated: Pick<Score, 'eventId' | 'discipline' | 'stage' | 'decimalTotal'>,
): RecomputeFinalRanksParams[] {
  const oldStage = existing.stage ?? 'qualification';
  const newStage = updated.stage ?? 'qualification';
  const groups: RecomputeFinalRanksParams[] = [];
  const seen = new Set<string>();

  const add = (eventId: string, discipline: Discipline, stage: FinalStage) => {
    if (!eventId) return;
    const key = `${eventId}|${discipline}|${stage}`;
    if (seen.has(key)) return;
    seen.add(key);
    groups.push({ eventId, discipline, stage });
  };

  if (isFinalStage(newStage)) {
    add(updated.eventId, updated.discipline, newStage);
  }

  const leftOldFinalGroup =
    isFinalStage(oldStage) &&
    (oldStage !== newStage ||
      existing.eventId !== updated.eventId ||
      existing.discipline !== updated.discipline);

  if (leftOldFinalGroup) {
    add(existing.eventId, existing.discipline, oldStage);
  }

  return groups;
}
