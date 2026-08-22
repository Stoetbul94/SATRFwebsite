import { disciplinePublicLabel, parseEventDisciplines } from '@/lib/eventDisciplines';
import { getPublicRegistrationStatus } from '@/lib/eventRegistrationUi';
import { isEventPast } from '@/lib/eventDisplay';
import { parseEventDocuments } from '@/lib/eventHub/documents';
import type { EventHubDocument } from '@/lib/eventHub/types';
import { deriveEventHubStatus } from '@/lib/eventHub/status';
import type { EventHubViewModel } from '@/lib/eventHub/types';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Map API / Firestore payload to Event Hub view model. */
export function transformApiEventToHub(
  raw: Record<string, unknown>,
  publishedDocuments: EventHubDocument[] = [],
): EventHubViewModel {
  const id = String(raw.id || '');
  const disciplines = Array.isArray(raw.disciplines)
    ? parseEventDisciplines(raw)
    : parseEventDisciplines({ type: raw.type });
  const eventDate = toDate(raw.date ?? raw.startDate ?? raw.start);
  const explicitDeadline = toDate(raw.registrationDeadline ?? raw.deadline);
  const maxParticipants = Number(raw.maxParticipants ?? raw.maxSpots) || 0;
  const currentParticipants = Number(raw.currentParticipants ?? raw.currentSpots) || 0;
  const status = String(raw.status || 'upcoming');
  const registrationDeadline = explicitDeadline;
  const registrationStatus = getPublicRegistrationStatus({
    status,
    maxParticipants,
    currentParticipants,
    registrationDeadline: registrationDeadline ?? undefined,
  });

  return {
    id,
    title: String(raw.title || raw.name || 'Event'),
    description: String(raw.description || ''),
    eventDate,
    location: String(raw.location || raw.venue || ''),
    disciplines,
    disciplineLabels: disciplines.map(disciplinePublicLabel),
    price: raw.price != null ? Number(raw.price) : null,
    maxParticipants,
    currentParticipants,
    status,
    hubStatus: deriveEventHubStatus({
      status,
      eventDate,
      maxParticipants,
      currentParticipants,
      registrationDeadline,
    }),
    registrationStatus,
    imageUrl:
      (typeof raw.imageUrl === 'string' && raw.imageUrl) ||
      (typeof raw.imageURL === 'string' && raw.imageURL) ||
      (typeof raw.image === 'string' && raw.image) ||
      null,
    payfastUrl: typeof raw.payfastUrl === 'string' ? raw.payfastUrl : null,
    eftInstructions: typeof raw.eftInstructions === 'string' ? raw.eftInstructions : null,
    isPast: eventDate ? isEventPast(eventDate) : false,
    latitude:
      typeof raw.latitude === 'number'
        ? raw.latitude
        : typeof raw.lat === 'number'
          ? raw.lat
          : undefined,
    longitude:
      typeof raw.longitude === 'number'
        ? raw.longitude
        : typeof raw.lng === 'number'
          ? raw.lng
          : undefined,
    documents:
      publishedDocuments.length > 0 ? publishedDocuments : parseEventDocuments(id, raw),
    registrationDeadline,
    startTime: typeof raw.startTime === 'string' ? raw.startTime : null,
    endTime: typeof raw.endTime === 'string' ? raw.endTime : null,
    equipmentInspectionTime:
      typeof raw.equipmentInspectionTime === 'string' ? raw.equipmentInspectionTime : null,
    mapUrl: typeof raw.mapUrl === 'string' ? raw.mapUrl : null,
  };
}
