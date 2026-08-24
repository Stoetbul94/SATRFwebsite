import {
  isAdminAthlete,
  shouldRedirectAdminFromDashboard,
  getMemberDashboardPath,
  resolvePostLoginPath,
} from '../userAthlete';

const adminOnly = { role: 'admin' as const, isAthlete: false };
const adminAthlete = { role: 'admin' as const, isAthlete: true };
const member = { role: 'user' as const };

describe('userAthlete', () => {
  describe('isAdminAthlete', () => {
    it('is true only for admin with isAthlete true', () => {
      expect(isAdminAthlete(adminAthlete)).toBe(true);
      expect(isAdminAthlete(adminOnly)).toBe(false);
      expect(isAdminAthlete({ role: 'admin' })).toBe(false);
      expect(isAdminAthlete(member)).toBe(false);
      expect(isAdminAthlete({ role: 'user', isAthlete: true })).toBe(false);
    });
  });

  describe('shouldRedirectAdminFromDashboard', () => {
    it('never redirects — My SATRF is for all authenticated users', () => {
      expect(shouldRedirectAdminFromDashboard(adminOnly)).toBe(false);
      expect(shouldRedirectAdminFromDashboard(adminAthlete)).toBe(false);
      expect(shouldRedirectAdminFromDashboard(member)).toBe(false);
    });
  });

  describe('getMemberDashboardPath', () => {
    it('always returns /dashboard', () => {
      expect(getMemberDashboardPath(adminOnly)).toBe('/dashboard');
      expect(getMemberDashboardPath(adminAthlete)).toBe('/dashboard');
      expect(getMemberDashboardPath(member)).toBe('/dashboard');
    });
  });

  describe('resolvePostLoginPath', () => {
    it('defaults members to /dashboard and admins to /admin/dashboard', () => {
      expect(resolvePostLoginPath(member)).toBe('/dashboard');
      expect(resolvePostLoginPath(adminOnly)).toBe('/admin/dashboard');
      expect(resolvePostLoginPath(adminAthlete)).toBe('/admin/dashboard');
    });

    it('honours redirect for admins including My SATRF', () => {
      expect(resolvePostLoginPath(adminOnly, '/dashboard')).toBe('/dashboard');
      expect(resolvePostLoginPath(adminOnly, '/profile')).toBe('/profile');
      expect(resolvePostLoginPath(adminAthlete, '/dashboard')).toBe('/dashboard');
      expect(resolvePostLoginPath(adminAthlete, '/admin/users')).toBe('/admin/users');
    });

    it('blocks non-admins from admin redirects', () => {
      expect(resolvePostLoginPath(member, '/admin/dashboard')).toBe('/dashboard');
    });
  });
});
