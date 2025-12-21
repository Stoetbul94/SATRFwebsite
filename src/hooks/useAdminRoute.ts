import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@chakra-ui/react';

/**
 * Hook to protect admin-only routes
 * Redirects non-admin users and shows appropriate error messages
 */
export const useAdminRoute = (redirectTo: string = '/dashboard') => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // If not authenticated, redirect will be handled by useProtectedRoute
    if (!isAuthenticated) return;

    // Check if user is admin
    if (user && user.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Admin access required to view this page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push(redirectTo);
    }
  }, [user, isAuthenticated, isLoading, router, redirectTo, toast]);

  // Return whether user is admin (for conditional rendering)
  return {
    isAdmin: user?.role === 'admin',
    isLoading,
    isAuthenticated,
  };
};

