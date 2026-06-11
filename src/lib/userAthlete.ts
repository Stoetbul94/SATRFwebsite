/**
 * Admin-athlete dashboard access (isAthlete flag).
 * Does NOT affect /admin/* permissions — UI/routing only.
 */
import { isUserAdmin, type UserData } from '@/lib/userRole';

export type AthleteCapableUser = UserData & { isAthlete?: boolean };

/** Admin with athlete dashboard enabled. */
export function isAdminAthlete(user: AthleteCapableUser | null | undefined): boolean {
  if (!user || !isUserAdmin(user)) return false;
  return user.isAthlete === true;
}

/** Redirect admin away from /dashboard when they are admin-only. */
export function shouldRedirectAdminFromDashboard(user: AthleteCapableUser | null | undefined): boolean {
  return isUserAdmin(user) && !isAdminAthlete(user);
}

/** Member dashboard path for profile back-links etc. */
export function getMemberDashboardPath(user: AthleteCapableUser | null | undefined): string {
  if (shouldRedirectAdminFromDashboard(user)) return '/admin/dashboard';
  return '/dashboard';
}

/**
 * Post-login / post-register destination.
 * All admins default to /admin/dashboard; honour ?redirect= for admin-athletes.
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

  if (isAdminAthlete(user)) {
    return redirect;
  }

  return redirect.startsWith('/admin') ? redirect : '/admin/dashboard';
}
