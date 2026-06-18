import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export function useFiringLineEditorPermission() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [firingLineEditor, setFiringLineEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      setFiringLineEditor(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setFiringLineEditor(false);
            setLoading(false);
          }
          return;
        }

        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (!cancelled) {
            setFiringLineEditor(false);
            setLoading(false);
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setFiringLineEditor(data.permissions?.firingLineEditor === true);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFiringLineEditor(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user]);

  return { firingLineEditor, loading: authLoading || loading };
}
