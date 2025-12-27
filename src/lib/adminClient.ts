/**
 * Client-side admin utilities
 * Safe to use in browser/client components (no Node.js dependencies)
 */

/**
 * Check if a user email is in the admin whitelist
 * This is safe to use in client components
 */
export function isEmailAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check environment variable (only available at build time in Next.js)
  // Note: process.env.NEXT_PUBLIC_* vars are available in browser
  const adminEmails = typeof window !== 'undefined' 
    ? [] // Can't access server env vars in browser
    : (process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []);
  
  if (adminEmails.includes(normalizedEmail)) {
    return true;
  }
  
  // Check hardcoded dev list (safe for client-side)
  const devAdminEmails = [
    'demo@satrf.org.za',
    'admin@satrf.org.za',
    'techaim10.9@gmail.com',
  ];
  return devAdminEmails.includes(normalizedEmail);
}








