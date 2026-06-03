/**
 * Canonical ISSF score model for SATRF.
 */

export type Discipline =
  | 'prone_50m'
  | 'three_position_50m'
  | 'fclass_open'
  | 'fclass_tr';

export type Position = 'kneeling' | 'prone' | 'standing' | 'fclass';

export type Category = 'open' | 'junior' | 'veteran' | 'ladies';

export type ScoringType = 'decimal' | 'integer';

export type ScoreStatus = 'official' | 'provisional';

export type ScoreSource = 'manual' | 'excel' | 'pdf';

export type ScoreStage = 'qualification' | 'prone_final' | '3p_final';

/** A single 10-shot series. */
export interface ShotSeries {
  seriesNumber: number;
  shots?: number[];
  decimal: number;
  integer: number;
  innerTens?: number;
}

/** One position block. Prone / F-Class have one; 3P has three. */
export interface PositionBlock {
  position: Position;
  series: ShotSeries[];
  decimalTotal: number;
  integerTotal: number;
  innerTens?: number;
  aggregate?: boolean;
}

export interface Score {
  id: string;
  userId: string | null;
  shooterName: string;
  club: string;
  category: Category;

  eventId: string;
  eventName: string;
  date: string;

  discipline: Discipline;
  scoringType: ScoringType;
  stage: ScoreStage;

  positions: PositionBlock[];

  finalShots?: number[];
  finalRank?: number;
  eliminatedAtShot?: number | null;

  decimalTotal: number;
  integerTotal: number;
  innerTens: number;
  totalShots: number;

  status: ScoreStatus;
  source: ScoreSource;

  groupMm?: number;
  mpi?: { x: number; y: number };

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreInputPosition {
  position: Position;
  series: {
    seriesNumber?: number;
    shots?: number[];
    decimal: number;
    integer: number;
    innerTens?: number;
  }[];
  aggregate?: boolean;
}

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
  stage?: ScoreStage;
  positions: ScoreInputPosition[];
  finalShots?: number[];
  eliminatedAtShot?: number | null;
  finalRank?: number;
}
