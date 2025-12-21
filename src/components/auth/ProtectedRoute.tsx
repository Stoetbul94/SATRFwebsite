import React, { ReactNode } from 'react';
import { useAuth, useProtectedRoute } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Wraps protected content and ensures users are authenticated before rendering.
 * Automatically redirects unauthenticated users to login page.
 * 
 * @param children - The content to render if authenticated
 * @param redirectTo - Where to redirect unauthenticated users (default: '/login')
 * @param fallback - Optional loading component to show while checking auth
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  fallback
}) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  // Use the protected route hook for automatic redirects
  useProtectedRoute(redirectTo);

  // Show fallback while checking authentication
  if (!isInitialized || isLoading) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will be redirected by useProtectedRoute)
  if (!isAuthenticated) {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute; 