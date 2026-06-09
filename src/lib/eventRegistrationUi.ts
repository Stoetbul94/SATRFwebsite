export type PublicRegistrationStatus = 'open' | 'full' | 'closed';

export function getPublicRegistrationStatus(event: {
  status?: string;
  maxSpots?: number;
  maxParticipants?: number;
  currentSpots?: number;
  currentParticipants?: number;
  registrationDeadline?: Date | string | null;
}): PublicRegistrationStatus {
  const status = String(event.status || 'open').toLowerCase();
  if (['closed', 'cancelled', 'completed', 'concluded'].includes(status)) {
    return 'closed';
  }
  const max = Number(event.maxSpots ?? event.maxParticipants) || 0;
  const current = Number(event.currentSpots ?? event.currentParticipants) || 0;
  if (max > 0 && current >= max) return 'full';
  if (event.registrationDeadline) {
    const deadline = event.registrationDeadline instanceof Date
      ? event.registrationDeadline
      : new Date(event.registrationDeadline);
    if (!isNaN(deadline.getTime()) && new Date() > deadline) return 'closed';
  }
  return 'open';
}
