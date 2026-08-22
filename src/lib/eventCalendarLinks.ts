const JOHANNESBURG = 'Africa/Johannesburg';

export type CalendarEventInput = {
  title: string;
  description?: string;
  location?: string;
  eventUrl: string;
  /** ISO date/time or Date */
  start: Date | string | null;
  end?: Date | string | null;
  startTime?: string | null;
  endTime?: string | null;
};

type CivilDate = { y: number; m: number; d: number };

function civilDateInJohannesburg(value: Date | string): CivilDate | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JOHANNESBURG,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function formatIcsDate({ y, m, d }: CivilDate): string {
  return `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`;
}

function addDays(civil: CivilDate, days: number): CivilDate {
  const dt = new Date(Date.UTC(civil.y, civil.m - 1, civil.d + days));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function hasExplicitTimes(input: CalendarEventInput): boolean {
  return Boolean(input.startTime?.trim() || input.endTime?.trim());
}

function parseTimeOnCivilDate(civil: CivilDate, time: string): Date | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  // Construct as if local Johannesburg wall time using offset +02:00 (SAST, no DST)
  const iso = `${civil.y}-${String(civil.m).padStart(2, '0')}-${String(civil.d).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+02:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toGoogleDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string | null {
  if (!input.start) return null;
  const params = new URLSearchParams({ action: 'TEMPLATE', text: input.title });
  if (input.location) params.set('location', input.location);
  const details = [input.description, input.eventUrl].filter(Boolean).join('\n\n');
  if (details) params.set('details', details);

  const startCivil = civilDateInJohannesburg(input.start);
  if (!startCivil) return null;

  if (hasExplicitTimes(input) && input.startTime) {
    const startDt = parseTimeOnCivilDate(startCivil, input.startTime);
    const endDt =
      input.endTime && parseTimeOnCivilDate(startCivil, input.endTime)
        ? parseTimeOnCivilDate(startCivil, input.endTime)
        : startDt
          ? new Date(startDt.getTime() + 2 * 60 * 60 * 1000)
          : null;
    if (startDt && endDt) {
      params.set('dates', `${toGoogleDateTime(startDt)}/${toGoogleDateTime(endDt)}`);
      params.set('ctz', JOHANNESBURG);
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }
  }

  const endCivil = input.end ? civilDateInJohannesburg(input.end) : startCivil;
  const endExclusive = addDays(endCivil ?? startCivil, 1);
  params.set('dates', `${formatIcsDate(startCivil)}/${formatIcsDate(endExclusive)}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookWebUrl(input: CalendarEventInput): string | null {
  if (!input.start) return null;
  const startCivil = civilDateInJohannesburg(input.start);
  if (!startCivil) return null;

  let startIso: string;
  let endIso: string;
  if (hasExplicitTimes(input) && input.startTime) {
    const startDt = parseTimeOnCivilDate(startCivil, input.startTime);
    const endDt =
      input.endTime && parseTimeOnCivilDate(startCivil, input.endTime)
        ? parseTimeOnCivilDate(startCivil, input.endTime)
        : startDt
          ? new Date(startDt.getTime() + 2 * 60 * 60 * 1000)
          : null;
    if (!startDt || !endDt) return null;
    startIso = startDt.toISOString();
    endIso = endDt.toISOString();
  } else {
    startIso = `${startCivil.y}-${String(startCivil.m).padStart(2, '0')}-${String(startCivil.d).padStart(2, '0')}T00:00:00+02:00`;
    const endCivil = addDays(startCivil, 1);
    endIso = `${endCivil.y}-${String(endCivil.m).padStart(2, '0')}-${String(endCivil.d).padStart(2, '0')}T00:00:00+02:00`;
  }

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: input.title,
    startdt: startIso,
    enddt: endIso,
  });
  if (input.location) params.set('location', input.location);
  const body = [input.description, input.eventUrl].filter(Boolean).join('\n\n');
  if (body) params.set('body', body);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function buildIcsFileContent(input: CalendarEventInput, uid: string): string | null {
  if (!input.start) return null;
  const startCivil = civilDateInJohannesburg(input.start);
  if (!startCivil) return null;

  let dtStart: string;
  let dtEnd: string;
  if (hasExplicitTimes(input) && input.startTime) {
    const startDt = parseTimeOnCivilDate(startCivil, input.startTime);
    const endDt =
      input.endTime && parseTimeOnCivilDate(startCivil, input.endTime)
        ? parseTimeOnCivilDate(startCivil, input.endTime)
        : startDt
          ? new Date(startDt.getTime() + 2 * 60 * 60 * 1000)
          : null;
    if (!startDt || !endDt) return null;
    dtStart = `DTSTART:${toGoogleDateTime(startDt)}`;
    dtEnd = `DTEND:${toGoogleDateTime(endDt)}`;
  } else {
    const endCivil = addDays(startCivil, 1);
    dtStart = `DTSTART;VALUE=DATE:${formatIcsDate(startCivil)}`;
    dtEnd = `DTEND;VALUE=DATE:${formatIcsDate(endCivil)}`;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SATRF//Event Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(uid)}`,
    dtStart,
    dtEnd,
    `SUMMARY:${escapeIcs(input.title)}`,
    input.location ? `LOCATION:${escapeIcs(input.location)}` : null,
    input.description || input.eventUrl
      ? `DESCRIPTION:${escapeIcs([input.description, input.eventUrl].filter(Boolean).join('\\n\\n'))}`
      : null,
    input.eventUrl ? `URL:${escapeIcs(input.eventUrl)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return `${lines.join('\r\n')}\r\n`;
}

export function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
