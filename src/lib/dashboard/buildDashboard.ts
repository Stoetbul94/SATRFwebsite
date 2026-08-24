import type { Firestore } from 'firebase-admin/firestore';
import { isEventRegistrationOpen } from '@/lib/registrations';
import { listDashboardNotificationSummary } from '@/lib/notifications/repository';
import {
  selectNextEvent,
  selectUpcomingRegistrations,
  type EventLike,
  type RegistrationLike,
} from '@/lib/dashboard/nextEvent';
import {
  hasLinkedResults,
  isProfileIncomplete,
  selectRecentResults,
} from '@/lib/dashboard/results';
import {
  DASHBOARD_NOTIFICATION_LIMIT,
  DASHBOARD_REGISTRATION_LIMIT,
  DASHBOARD_RESULTS_LIMIT,
  type DashboardResponse,
} from '@/lib/dashboard/types';
import {
  hasPublishedCallForEntries,
  loadCandidateOpenEvents,
  loadDashboardUser,
  loadEventsByIds,
  loadUserRegistrations,
  loadUserScores,
} from '@/lib/dashboard/repository';
import type { Score } from '@/types/scores';

function registrationLikes(
  regs: Array<{ id: string; eventId: string; eventTitle: string; status: string }>,
): RegistrationLike[] {
  return regs.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    eventTitle: r.eventTitle,
    status: r.status,
  }));
}

export function buildDashboardDto(input: {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    club?: string | null;
    province?: string | null;
  } | null;
  next: { event: EventLike; isRegistered: boolean } | null;
  upcomingRegs: Array<RegistrationLike & { event: EventLike }>;
  scores: Array<Score & { deleted?: boolean }>;
  notifications: {
    unreadCount: number;
    recent: Array<{
      id: string;
      title: string;
      message: string;
      publishedAt: string | null;
      href?: string | null;
      unread: boolean;
    }>;
  };
  hasCallForEntries: boolean;
  errors?: DashboardResponse['errors'];
}): DashboardResponse {
  const firstName = input.user?.firstName?.trim() || 'Athlete';

  const results = selectRecentResults(input.scores, DASHBOARD_RESULTS_LIMIT);
  const linkedResults = hasLinkedResults(input.scores);

  const nextEvent = input.next
    ? {
        id: input.next.event.id,
        title: input.next.event.title,
        date: input.next.event.date ?? null,
        location: input.next.event.location ?? null,
        status: input.next.event.status || 'open',
        isRegistered: input.next.isRegistered,
        registrationOpen: isEventRegistrationOpen(input.next.event).open,
        hasCallForEntries: input.hasCallForEntries,
      }
    : null;

  return {
    user: {
      firstName,
      lastName: input.user?.lastName?.trim() || null,
      club: input.user?.club?.trim() || null,
      province: input.user?.province?.trim() || null,
      hasLinkedResults: linkedResults,
      profileIncomplete: isProfileIncomplete({
        firstName: input.user?.firstName,
        club: input.user?.club,
        province: input.user?.province,
      }),
    },
    nextEvent,
    registrations: input.upcomingRegs.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      eventTitle: r.event.title || r.eventTitle,
      eventDate: r.event.date ?? null,
      location: r.event.location ?? null,
      statusLabel: 'Registered' as const,
    })),
    results,
    notifications: {
      unreadCount: input.notifications.unreadCount,
      recent: input.notifications.recent.slice(0, DASHBOARD_NOTIFICATION_LIMIT).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        publishedAt: n.publishedAt,
        href: n.href ?? null,
        unread: n.unread,
      })),
    },
    ...(input.errors && Object.keys(input.errors).length > 0
      ? { errors: input.errors }
      : {}),
  };
}

/**
 * Assemble personal dashboard for verified Firebase uid only.
 * Never accepts client-supplied uid / athleteId overrides.
 */
export async function getPersonalDashboard(
  db: Firestore,
  uid: string,
): Promise<DashboardResponse> {
  const errors: NonNullable<DashboardResponse['errors']> = {};

  const userSettled = await Promise.allSettled([loadDashboardUser(db, uid)]);
  const user = userSettled[0].status === 'fulfilled' ? userSettled[0].value : null;

  const [regsSettled, scoresSettled, notifSettled] = await Promise.allSettled([
    loadUserRegistrations(db, uid),
    loadUserScores(db, uid),
    listDashboardNotificationSummary(db, uid, DASHBOARD_NOTIFICATION_LIMIT),
  ]);

  const registrations =
    regsSettled.status === 'fulfilled' ? regsSettled.value : [];
  if (regsSettled.status === 'rejected') {
    errors.registrations = 'Registrations could not be loaded';
  }

  const scores = scoresSettled.status === 'fulfilled' ? scoresSettled.value : [];
  if (scoresSettled.status === 'rejected') {
    errors.results = 'Results could not be loaded';
  }

  let notificationPayload = {
    unreadCount: 0,
    recent: [] as DashboardResponse['notifications']['recent'],
  };
  if (notifSettled.status === 'fulfilled') {
    const result = notifSettled.value;
    notificationPayload = {
      unreadCount: result.unreadCount,
      recent: result.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        publishedAt: n.publishedAt,
        href: n.href ?? null,
        unread: n.unread,
      })),
    };
  } else {
    errors.notifications = 'Notifications could not be loaded';
  }

  const regLikes = registrationLikes(registrations);
  const registeredEventIds = Array.from(
    new Set(regLikes.map((r) => r.eventId).filter(Boolean)),
  );

  let eventsById: Record<string, EventLike> = {};
  let openEvents: EventLike[] = [];

  try {
    eventsById = await loadEventsByIds(db, registeredEventIds);
  } catch {
    errors.events = 'Events could not be loaded';
  }

  // Prefer registered upcoming events — skip broad fallback query when sufficient.
  let next = selectNextEvent({
    eventsById,
    registrations: regLikes,
    openEvents: [],
  });

  if (!next) {
    try {
      openEvents = await loadCandidateOpenEvents(db);
      for (const event of openEvents) {
        eventsById[event.id] = event;
      }
      next = selectNextEvent({
        eventsById,
        registrations: regLikes,
        openEvents,
      });
    } catch {
      errors.events = 'Events could not be loaded';
    }
  }

  const upcomingRegs = selectUpcomingRegistrations({
    registrations: regLikes,
    eventsById,
    limit: DASHBOARD_REGISTRATION_LIMIT,
  });

  let hasCallForEntries = false;
  if (next?.isRegistered) {
    try {
      hasCallForEntries = await hasPublishedCallForEntries(db, next.event.id);
    } catch {
      hasCallForEntries = false;
    }
  }

  return buildDashboardDto({
    user,
    next,
    upcomingRegs,
    scores,
    notifications: notificationPayload,
    hasCallForEntries,
    errors,
  });
}
