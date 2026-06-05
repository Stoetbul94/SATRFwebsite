import type { Discipline } from '@/types/scores';
import {
  disciplinesToLegacyType,
  isValidEventDiscipline,
  parseEntryFee,
  parseEventDisciplines,
} from '@/lib/eventDisciplines';

export interface SerializedEvent {
  id: string;
  title: string;
  description: string;
  date: string | null;
  location: string;
  type: string;
  disciplines: Discipline[];
  status: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number | null;
  imageUrl: string | null;
  payfastUrl: string | null;
  eftInstructions: string | null;
  isTestEvent: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

const toIso = (d: unknown): string | null => {
  if (!d) return null;
  if (typeof d === 'object' && d !== null && 'toDate' in d && typeof (d as { toDate: () => Date }).toDate === 'function') {
    return (d as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof d === 'string') return d;
  return null;
};

export function serializeEventDoc(id: string, data: Record<string, unknown>): SerializedEvent {
  const disciplines = parseEventDisciplines(data);
  const legacyType =
    typeof data.type === 'string' && data.type.trim()
      ? data.type
      : disciplines.length > 0
        ? disciplinesToLegacyType(disciplines)
        : 'Target Rifle';

  const rawPrice = data.price ?? data.entryFee ?? data.fee;
  const price = parseEntryFee(rawPrice);

  return {
    id,
    title: String(data.title || ''),
    description: String(data.description || ''),
    date: toIso(data.date),
    location: String(data.location || ''),
    type: legacyType,
    disciplines,
    status: String(data.status || 'upcoming'),
    maxParticipants: Number(data.maxParticipants) || 0,
    currentParticipants: Number(data.currentParticipants) || 0,
    price,
    imageUrl:
      (typeof data.imageUrl === 'string' && data.imageUrl) ||
      (typeof data.imageURL === 'string' && data.imageURL) ||
      (typeof data.image === 'string' && data.image) ||
      null,
    payfastUrl: typeof data.payfastUrl === 'string' ? data.payfastUrl : null,
    eftInstructions: typeof data.eftInstructions === 'string' ? data.eftInstructions : null,
    isTestEvent: Boolean(data.isTestEvent),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export interface EventPayloadValidation {
  ok: boolean;
  errors: string[];
  disciplines?: Discipline[];
  price?: number;
}

export function validateEventPayload(
  body: Record<string, unknown>,
  options: { requireImage?: boolean; isCreate?: boolean } = {}
): EventPayloadValidation {
  const errors: string[] = [];

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) errors.push('Title is required');

  if (!body.date) errors.push('Date is required');

  const location = typeof body.location === 'string' ? body.location.trim() : '';
  if (!location) errors.push('Location is required');

  let disciplines: Discipline[] = [];
  if (Array.isArray(body.disciplines) && body.disciplines.length > 0) {
    disciplines = body.disciplines.filter(
      (d): d is Discipline => typeof d === 'string' && isValidEventDiscipline(d)
    );
  } else if (typeof body.type === 'string' && body.type.trim()) {
    disciplines = parseEventDisciplines({ type: body.type });
  }

  if (disciplines.length === 0) {
    errors.push('At least one discipline is required');
  }

  const price = parseEntryFee(body.price);
  if (price == null) {
    errors.push('Entry fee is required (must be 0 or greater)');
  }

  const imageUrl =
    (typeof body.imageUrl === 'string' && body.imageUrl.trim()) ||
    (typeof body.imageURL === 'string' && body.imageURL.trim()) ||
    null;

  if (options.requireImage && !imageUrl && !body.imageBase64) {
    errors.push('Event image is required');
  }

  if (options.isCreate && !imageUrl && !body.imageBase64) {
    errors.push('Event image is required');
  }

  return {
    ok: errors.length === 0,
    errors,
    disciplines: disciplines.length > 0 ? disciplines : undefined,
    price: price ?? undefined,
  };
}

export function buildFirestoreEventData(
  body: Record<string, unknown>,
  validation: EventPayloadValidation
): Record<string, unknown> {
  const disciplines = validation.disciplines ?? [];
  const data: Record<string, unknown> = {
    title: String(body.title).trim(),
    location: String(body.location).trim(),
    description: typeof body.description === 'string' ? body.description : '',
    status: body.status || 'open',
    disciplines,
    type: disciplinesToLegacyType(disciplines),
    currentParticipants: Number(body.currentParticipants) || 0,
    price: validation.price ?? 0,
  };

  if (body.maxParticipants != null && body.maxParticipants !== '') {
    data.maxParticipants = parseInt(String(body.maxParticipants), 10);
  }

  const imageUrl =
    (typeof body.imageUrl === 'string' && body.imageUrl.trim()) ||
    (typeof body.imageURL === 'string' && body.imageURL.trim()) ||
    null;
  if (imageUrl) data.imageUrl = imageUrl;

  if (typeof body.payfastUrl === 'string' && body.payfastUrl.trim()) {
    data.payfastUrl = body.payfastUrl.trim();
  }
  if (typeof body.eftInstructions === 'string' && body.eftInstructions.trim()) {
    data.eftInstructions = body.eftInstructions.trim();
  }

  return data;
}
