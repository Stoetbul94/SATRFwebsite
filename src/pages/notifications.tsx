import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import { useAuth, useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { formatNotificationWhen } from '@/lib/notifications/formatRelative';
import type { UserNotificationView } from '@/lib/notifications/types';

async function getToken(): Promise<string | null> {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

export default function NotificationsPage() {
  useProtectedRoute();
  const { isAuthenticated, isInitialized } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<UserNotificationView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      setLoading(true);
      const query = filter === 'unread' ? '?unread=1' : '';
      const response = await fetch(`/api/notifications${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setItems(data.notifications || []);
    } catch {
      toast({ title: 'Could not load notifications', status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      void fetchNotifications();
    }
  }, [isInitialized, isAuthenticated, fetchNotifications]);

  const markRead = async (item: UserNotificationView) => {
    const token = await getToken();
    if (!token) return;
    if (item.unread) {
      await fetch(`/api/notifications/${item.id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, unread: false, readAt: new Date().toISOString() } : row,
      ),
    );
  };

  const markAll = async () => {
    const token = await getToken();
    if (!token) return;
    await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'read-all' }),
    });
    setItems((prev) =>
      prev.map((row) => ({ ...row, unread: false, readAt: row.readAt || new Date().toISOString() })),
    );
  };

  return (
    <Layout>
      <Head>
        <title>Notifications | SATRF</title>
      </Head>
      <PublicPageShell>
        <Container maxW="container.md" py={{ base: 6, md: 10 }}>
          <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
            <Heading size="lg" color="satrf.navy">
              Notifications
            </Heading>
            <Button size="sm" variant="outline" onClick={() => void markAll()} minH="44px">
              Mark all as read
            </Button>
          </HStack>

          <HStack mb={4} spacing={2}>
            <Button
              size="sm"
              variant={filter === 'all' ? 'solid' : 'outline'}
              colorScheme="green"
              onClick={() => setFilter('all')}
              minH="40px"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'unread' ? 'solid' : 'outline'}
              colorScheme="green"
              onClick={() => setFilter('unread')}
              minH="40px"
            >
              Unread
            </Button>
          </HStack>

          {loading ? (
            <HStack justify="center" py={12}>
              <Spinner />
            </HStack>
          ) : items.length === 0 ? (
            <Box py={10} data-testid="notifications-empty">
              <Text fontWeight="medium">No notifications yet.</Text>
              <Text color="text.muted" mt={1}>
                Important event and account updates will appear here.
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" spacing={0} divider={<Divider />} data-testid="notifications-list">
              {items.map((item) => (
                <Box
                  key={item.id}
                  py={4}
                  px={3}
                  bg={item.unread ? 'blackAlpha.50' : 'transparent'}
                  borderRadius="md"
                >
                  <Text fontWeight={item.unread ? 'bold' : 'semibold'}>{item.title}</Text>
                  <Text color="text.muted" mt={1}>
                    {item.message}
                  </Text>
                  <Text fontSize="sm" color="text.muted" mt={2}>
                    {formatNotificationWhen(item.publishedAt)}
                  </Text>
                  <HStack mt={3} spacing={2}>
                    {item.href && (
                      <Button
                        as={Link}
                        href={item.href}
                        size="sm"
                        colorScheme="green"
                        minH="44px"
                        onClick={() => void markRead(item)}
                      >
                        Open
                      </Button>
                    )}
                    {item.unread && (
                      <Button
                        size="sm"
                        variant="ghost"
                        minH="44px"
                        onClick={() => void markRead(item)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Container>
      </PublicPageShell>
    </Layout>
  );
}
