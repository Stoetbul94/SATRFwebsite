/**
 * Normalize Firestore date fields (Timestamp, ISO string, Date) to ISO strings.
 */
export function toIsoString(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === 'object' && value !== null) {
    if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    if ('_seconds' in value && typeof (value as { _seconds: number })._seconds === 'number') {
      const d = new Date((value as { _seconds: number })._seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  return null;
}

export function formatIsoDate(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(locale);
}
