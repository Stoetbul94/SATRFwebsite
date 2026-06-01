/**
 * Client-side admin utilities
 * Safe to use in browser/client components (no Node.js dependencies)
 */

/**
 * @deprecated Admin status is determined by the Firestore user role
 * (see `isUserAdmin` in '@/lib/userRole'), which is the single source of truth.
 *
 * This client-side email check is retained only as a no-op for backward
 * compatibility and intentionally returns false — no admin emails are
 * hardcoded in the client bundle.
 */
export function isEmailAdmin(_email: string | null | undefined): boolean {
  return false;
}








