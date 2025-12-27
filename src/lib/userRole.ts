/**
 * Utility functions for checking user roles
 * Handles both flat structure (role: 'admin') and nested structure (roles.admin: true)
 */

export interface UserData {
  role?: string;
  roles?: {
    admin?: boolean;
    event_scorer?: boolean;
  };
}

/**
 * Check if a user is an admin
 * Supports both role structures:
 * - Flat: { role: 'admin' }
 * - Nested: { roles: { admin: true } }
 */
export function isUserAdmin(userData: UserData | null | undefined): boolean {
  if (!userData) return false;
  
  // Check flat structure
  if (userData.role === 'admin') {
    return true;
  }
  
  // Check nested structure
  if (userData.roles?.admin === true) {
    return true;
  }
  
  return false;
}

/**
 * Get user role as string
 * Converts nested structure to flat string
 */
export function getUserRole(userData: UserData | null | undefined): 'user' | 'admin' | 'event_scorer' {
  if (!userData) return 'user';
  
  // Check flat structure first
  if (userData.role && ['user', 'admin', 'event_scorer'].includes(userData.role)) {
    return userData.role as 'user' | 'admin' | 'event_scorer';
  }
  
  // Check nested structure
  if (userData.roles?.admin === true) {
    return 'admin';
  }
  
  if (userData.roles?.event_scorer === true) {
    return 'event_scorer';
  }
  
  return 'user';
}









