import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiringLineEditorPermission } from '@/hooks/useFiringLineEditorPermission';

/**
 * Protects Firing Line CMS routes — only the configured content editor may access.
 */
export function useContentEditorRoute(redirectTo: string = '/admin/dashboard') {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { firingLineEditor, loading: permissionLoading } = useFiringLineEditorPermission();
  const router = useRouter();
  const toast = useToast();

  const isLoading = authLoading || permissionLoading;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;

    if (!firingLineEditor) {
      toast({
        title: 'Access Denied',
        description: 'Firing Line editor access is restricted.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push(redirectTo);
    }
  }, [firingLineEditor, isAuthenticated, isLoading, router, redirectTo, toast]);

  return {
    isContentEditor: firingLineEditor,
    isLoading,
    isAuthenticated,
  };
}
