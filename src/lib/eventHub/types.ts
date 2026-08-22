import type { Discipline } from '@/types/scores';
import type { PublicRegistrationStatus } from '@/lib/eventRegistrationUi';

/** Phase 2 proposal — not stored in Firestore yet. */
export type EventDocumentType =
  | 'call-for-entries'
  | 'programme'
  | 'range-instructions'
  | 'results'
  | 'other';

export type EventHubDocument = {
  id: string;
  eventId: string;
  type: EventDocumentType;
  title: string;
  fileUrl: string;
  publishedAt?: string | null;
  status?: 'draft' | 'published';
};

export type EventHubStatusLabel =
  | 'OPEN FOR ENTRIES'
  | 'ENTRIES CLOSED'
  | 'EVENT FULL'
  | 'COMPLETED'
  | 'CANCELLED';

export type EventHubViewModel = {
  id: string;
  title: string;
  description: string;
  eventDate: Date | null;
  location: string;
  disciplines: Discipline[];
  disciplineLabels: string[];
  price: number | null;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  hubStatus: EventHubStatusLabel;
  registrationStatus: PublicRegistrationStatus;
  imageUrl: string | null;
  payfastUrl: string | null;
  eftInstructions: string | null;
  isPast: boolean;
  latitude?: number;
  longitude?: number;
  documents: EventHubDocument[];
  /** Explicit admin-provided closing date only — not inferred from event date. */
  registrationDeadline: Date | null;
  startTime?: string | null;
  endTime?: string | null;
};
