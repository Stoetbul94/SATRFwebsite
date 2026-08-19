import { eventsAPI } from '@/lib/api';
import {
  normalizeCalendarEvents,
  type CalendarEvent,
} from '@/lib/events/normalizeCalendarEvent';

/**
 * Load calendar events from the same Firestore-backed /api/events feed as /events.
 * Production and preview failures surface to the caller; there is no mock fallback.
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const data = await eventsAPI.getAll();
  return normalizeCalendarEvents(data);
}
