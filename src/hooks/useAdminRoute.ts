import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@chakra-ui/react';
import { isEmailAdmin } from '@/lib/adminClient';
import { isUserAdmin } from '@/lib/userRole';

/**
 * Hook to protect admin-only routes
 * Redirects non-admin users and shows appropriate error messages
 * Checks both Firestore role and email whitelist
 */
export const useAdminRoute = (redirectTo: string = '/dashboard') => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Check if user is admin via role (handles both flat and nested) OR email whitelist
  const isAdmin = user ? (isUserAdmin(user as any) || isEmailAdmin(user.email)) : false;

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // If not authenticated, redirect will be handled by useProtectedRoute
    if (!isAuthenticated) return;

    // Check if user is admin (via role or email whitelist)
    if (user && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Admin access required to view this page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push(redirectTo);
    }
  }, [user, isAuthenticated, isLoading, router, redirectTo, toast, isAdmin]);

  // Return whether user is admin (for conditional rendering)
  return {
    isAdmin,
    isLoading,
    isAuthenticated,
  };
};

