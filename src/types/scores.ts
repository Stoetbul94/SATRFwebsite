/**
 * Canonical ISSF score model for SATRF.
 *
 * Launch disciplines:
 *  - 50m Rifle Prone        (60 shots, 6 series of 10, single position)
 *  - 50m Rifle 3 Positions  (120 shots, 3 positions x 40, 4 series of 10 each)
 *
 * Scoring is decimal-first (e.g. 10.9 max per shot) with the integer
 * ring-count kept alongside, matching official electronic-target sheets
 * (e.g. "361.5 (345)", series "88.7 (85)").
 */

export type Discipline = 'prone_50m' | 'three_position_50m';

export type Position = 'kneeling' | 'prone' | 'standing';

export type Category = 'open' | 'junior' | 'veteran' | 'ladies';

export type ScoringType = 'decimal' | 'integer';

export type ScoreStatus = 'official' | 'provisional';

export type ScoreSource = 'manual' | 'excel' | 'pdf';

/** A single 10-shot series. */
export interface ShotSeries {
  seriesNumber: number;
  /** Optional per-shot decimal values (length up to 10), captured from imports. */
  shots?: number[];
  /** Series decimal total, e.g. 88.7 */
  decimal: number;
  /** Series integer ring total, e.g. 85 */
  integer: number;
  innerTens?: number;
}

/** One position block. Prone discipline has a single block; 3P has three. */
export interface PositionBlock {
  position: Position;
  series: ShotSeries[];
  decimalTotal: number;
  integerTotal: number;
  innerTens?: number;
}

export interface Score {
  id: string;
  /** Linked SATRF member UID, or null if the shooter is not a member. */
  userId: string | null;
  shooterName: string;
  club: string;
  category: Category;

  eventId: string;
  eventName: string;
  /** ISO date string of the match. */
  date: string;

  discipline: Discipline;
  scoringType: ScoringType;

  positions: PositionBlock[];

  decimalTotal: number;
  integerTotal: number;
  innerTens: number;
  totalShots: number;

  status: ScoreStatus;
  source: ScoreSource;

  /** Diagnostics from electronic targets (optional, not used for ranking). */
  groupMm?: number;
  mpi?: { x: number; y: number };

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted by manual entry / import before computed totals are derived. */
export interface ScoreInput {
  userId?: string | null;
  shooterName: string;
  club: string;
  category: Category;
  eventId?: string;
  eventName: string;
  date: string;
  discipline: Discipline;
  scoringType?: ScoringType;
  status?: ScoreStatus;
  source?: ScoreSource;
  positions: {
    position: Position;
    series: { seriesNumber?: number; shots?: number[]; decimal: number; integer: number; innerTens?: number }[];
  }[];
}
