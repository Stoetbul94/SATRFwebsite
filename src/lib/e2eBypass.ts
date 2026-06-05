/** Playwright CI only — never enabled in production builds (see ci.yml). */
export function isE2eAdminBypassActive(): boolean {
  if (process.env.NEXT_PUBLIC_ALLOW_E2E_BYPASS !== '1') return false;
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('__e2e_admin_bypass__') === '1';
}
