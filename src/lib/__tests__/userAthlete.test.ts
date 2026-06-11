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
    it('redirects admin-only, not admin-athletes or members', () => {
      expect(shouldRedirectAdminFromDashboard(adminOnly)).toBe(true);
      expect(shouldRedirectAdminFromDashboard({ role: 'admin' })).toBe(true);
      expect(shouldRedirectAdminFromDashboard(adminAthlete)).toBe(false);
      expect(shouldRedirectAdminFromDashboard(member)).toBe(false);
    });
  });

  describe('getMemberDashboardPath', () => {
    it('sends admin-only users to admin dashboard', () => {
      expect(getMemberDashboardPath(adminOnly)).toBe('/admin/dashboard');
    });
    it('sends athletes and members to member dashboard', () => {
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

    it('honours redirect for admin-athletes on member paths', () => {
      expect(resolvePostLoginPath(adminAthlete, '/dashboard')).toBe('/dashboard');
      expect(resolvePostLoginPath(adminAthlete, '/profile')).toBe('/profile');
      expect(resolvePostLoginPath(adminAthlete, '/events/abc')).toBe('/events/abc');
      expect(resolvePostLoginPath(adminAthlete, '/admin/users')).toBe('/admin/users');
    });

    it('overrides non-admin redirects for admin-only users', () => {
      expect(resolvePostLoginPath(adminOnly, '/dashboard')).toBe('/admin/dashboard');
      expect(resolvePostLoginPath(adminOnly, '/profile')).toBe('/admin/dashboard');
      expect(resolvePostLoginPath(adminOnly, '/admin/events')).toBe('/admin/events');
    });

    it('blocks non-admins from admin redirects', () => {
      expect(resolvePostLoginPath(member, '/admin/dashboard')).toBe('/dashboard');
    });
  });
});
