import type { Discipline, ScoreStage } from '@/types/scores';

export type DashboardNextEvent = {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
  status: string;
  isRegistered: boolean;
  registrationOpen: boolean;
  hasCallForEntries: boolean;
};

export type DashboardRegistration = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string | null;
  location: string | null;
  statusLabel: 'Registered';
};

export type DashboardResult = {
  id: string;
  discipline: Discipline;
  disciplineLabel: string;
  eventId: string;
  eventName: string;
  date: string;
  scoreLabel: string;
  stage: ScoreStage;
  stageLabel: string;
};

export type DashboardNotificationItem = {
  id: string;
  title: string;
  message: string;
  publishedAt: string | null;
  href: string | null;
  unread: boolean;
};

export type DashboardResponse = {
  user: {
    firstName: string;
    lastName: string | null;
    club: string | null;
    province: string | null;
    competitionProfileLinked: boolean;
    profileIncomplete: boolean;
  };
  nextEvent: DashboardNextEvent | null;
  registrations: DashboardRegistration[];
  results: DashboardResult[];
  notifications: {
    unreadCount: number;
    recent: DashboardNotificationItem[];
  };
  errors?: {
    registrations?: string;
    results?: string;
    notifications?: string;
    events?: string;
  };
};

export const DASHBOARD_REGISTRATION_LIMIT = 3;
export const DASHBOARD_RESULTS_LIMIT = 5;
export const DASHBOARD_NOTIFICATION_LIMIT = 3;
