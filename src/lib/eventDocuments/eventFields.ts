import { Timestamp } from 'firebase-admin/firestore';

export function parseOptionalTime(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function parseOptionalDateTime(value: unknown): Timestamp | null {
  if (!value) return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
}

export function applyOptionalEventFields(
  body: Record<string, unknown>,
  target: Record<string, unknown>,
): void {
  if ('startTime' in body) {
    const startTime = parseOptionalTime(body.startTime);
    target.startTime = startTime;
  }
  if ('endTime' in body) {
    const endTime = parseOptionalTime(body.endTime);
    target.endTime = endTime;
  }
  if ('equipmentInspectionTime' in body) {
    const equipmentInspectionTime = parseOptionalTime(body.equipmentInspectionTime);
    target.equipmentInspectionTime = equipmentInspectionTime;
  }
  if ('registrationDeadline' in body) {
    const registrationDeadline = parseOptionalDateTime(body.registrationDeadline);
    target.registrationDeadline = registrationDeadline;
  }
  if ('mapUrl' in body) {
    const mapUrl = typeof body.mapUrl === 'string' ? body.mapUrl.trim() : '';
    target.mapUrl = mapUrl || null;
  }
}

export function readOptionalEventFields(data: Record<string, unknown>) {
  return {
    startTime: typeof data.startTime === 'string' ? data.startTime : null,
    endTime: typeof data.endTime === 'string' ? data.endTime : null,
    equipmentInspectionTime:
      typeof data.equipmentInspectionTime === 'string' ? data.equipmentInspectionTime : null,
    registrationDeadline:
      data.registrationDeadline &&
      typeof data.registrationDeadline === 'object' &&
      'toDate' in (data.registrationDeadline as object)
        ? (data.registrationDeadline as { toDate: () => Date }).toDate().toISOString()
        : typeof data.registrationDeadline === 'string'
          ? data.registrationDeadline
          : null,
    mapUrl: typeof data.mapUrl === 'string' ? data.mapUrl : null,
  };
}
