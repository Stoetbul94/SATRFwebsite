import { getPublicRegistrationStatus } from '@/lib/eventRegistrationUi';
import { isEventPast } from '@/lib/eventDisplay';
import type { EventHubStatusLabel } from '@/lib/eventHub/types';

export function deriveEventHubStatus(input: {
  status?: string;
  eventDate: Date | null;
  maxParticipants?: number;
  currentParticipants?: number;
  registrationDeadline?: Date | null;
}): EventHubStatusLabel {
  const raw = String(input.status || 'open').toLowerCase();
  if (raw === 'cancelled' || raw === 'canceled') return 'CANCELLED';

  const registrationStatus = getPublicRegistrationStatus({
    status: input.status,
    maxParticipants: input.maxParticipants,
    currentParticipants: input.currentParticipants,
    registrationDeadline: input.registrationDeadline ?? undefined,
  });

  const past = input.eventDate ? isEventPast(input.eventDate) : false;
  if (past || ['completed', 'closed', 'concluded'].includes(raw)) return 'COMPLETED';
  if (registrationStatus === 'full') return 'EVENT FULL';
  if (registrationStatus === 'closed') return 'ENTRIES CLOSED';
  if (registrationStatus === 'open') return 'OPEN FOR ENTRIES';
  return 'ENTRIES CLOSED';
}

export function hubStatusColor(label: EventHubStatusLabel): string {
  switch (label) {
    case 'OPEN FOR ENTRIES':
      return 'green';
    case 'EVENT FULL':
      return 'orange';
    case 'ENTRIES CLOSED':
      return 'yellow';
    case 'COMPLETED':
      return 'gray';
    case 'CANCELLED':
      return 'red';
    default:
      return 'gray';
  }
}
