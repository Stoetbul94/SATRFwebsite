/**
 * Admin-athlete dashboard access (isAthlete flag).
 * Does NOT affect /admin/* permissions — UI/routing only.
 *
 * Phase 4: /dashboard (My SATRF) is available to every authenticated website
 * account, including admin-only users. Admin Panel remains a separate menu item.
 */
import { isUserAdmin, type UserData } from '@/lib/userRole';

export type AthleteCapableUser = UserData & { isAthlete?: boolean };

/** Admin with athlete dashboard enabled (legacy flag; My SATRF no longer gated). */
export function isAdminAthlete(user: AthleteCapableUser | null | undefined): boolean {
  if (!user || !isUserAdmin(user)) return false;
  return user.isAthlete === true;
}

/**
 * Previously redirected admin-only users away from /dashboard.
 * My SATRF is the personal home for all authenticated users — never redirect.
 */
export function shouldRedirectAdminFromDashboard(
  _user?: AthleteCapableUser | null,
): boolean {
  return false;
}

/** Member / personal dashboard path for profile back-links etc. */
export function getMemberDashboardPath(_user?: AthleteCapableUser | null): string {
  return '/dashboard';
}

/**
 * Post-login / post-register destination.
 * Admins default to /admin/dashboard; honour ?redirect= including /dashboard.
 */
export function resolvePostLoginPath(
  user: AthleteCapableUser | null | undefined,
  redirectParam?: string | null
): string {
  const isAdmin = isUserAdmin(user);
  const fallback = isAdmin ? '/admin/dashboard' : '/dashboard';
  const redirect = typeof redirectParam === 'string' ? redirectParam.trim() : '';

  if (!redirect) return fallback;

  if (!isAdmin) {
    return redirect.startsWith('/admin') ? '/dashboard' : redirect;
  }

  // Admins: honour explicit redirects (My SATRF, profile, admin routes).
  if (redirect.startsWith('/')) return redirect;
  return fallback;
}
