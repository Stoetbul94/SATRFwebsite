import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Spinner,
  Text,
  Textarea,
  VStack,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminEventSubNav from '@/components/admin/AdminEventSubNav';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { formatEventDate } from '@/lib/eventDisplay';
import type { SerializedNotification } from '@/lib/notifications/types';
import { NOTIFICATION_TYPES } from '@/lib/notifications/types';

async function getToken(): Promise<string | null> {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

export default function AdminEventCommunicationsPage() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const router = useRouter();
  const { id } = router.query;
  const eventId = typeof id === 'string' ? id : '';
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [eventTitle, setEventTitle] = useState('');
  const [notifications, setNotifications] = useState<SerializedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState<{
    type: string;
    title: string;
    message: string;
    href: string;
    audienceLabel: string;
  } | null>(null);

  const [form, setForm] = useState({
    type: 'event-update',
    title: '',
    message: '',
    href: '',
  });

  const fetchCommunications = useCallback(async () => {
    if (!isAdmin || !eventId) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/admin/events/${eventId}/communications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setEventTitle(data.eventTitle || '');
      setNotifications(data.notifications || []);
      setForm((prev) =>
        prev.href ? prev : { ...prev, href: `/events/${eventId}` },
      );
    } catch {
      toast({ title: 'Failed to load communications', status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, eventId, toast]);

  useEffect(() => {
    void fetchCommunications();
  }, [fetchCommunications]);

  const handlePreview = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const response = await fetch(`/api/admin/events/${eventId}/communications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...form, action: 'preview' }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Preview failed');
      }
      const data = await response.json();
      setPreview(data.preview);
    } catch (error: unknown) {
      toast({
        title: 'Preview failed',
        description: error instanceof Error ? error.message : 'Preview failed',
        status: 'error',
      });
    }
  };

  const handlePublish = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      setPublishing(true);
      const response = await fetch(`/api/admin/events/${eventId}/communications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Publish failed');
      }
      toast({ title: 'Notification published', status: 'success' });
      setForm({ type: 'event-update', title: '', message: '', href: `/events/${eventId}` });
      setPreview(null);
      await fetchCommunications();
    } catch (error: unknown) {
      toast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'Publish failed',
        status: 'error',
      });
    } finally {
      setPublishing(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout title="Communications">
        <Center py={20}>
          <Spinner size="xl" color="satrf.navy" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout title="Event Communications">
      <Head>
        <title>{eventTitle || 'Event'} Communications — SATRF Admin</title>
      </Head>

      <VStack align="stretch" spacing={6}>
        <Button
          as={Link}
          href="/admin/events"
          variant="ghost"
          leftIcon={<FiArrowLeft />}
          alignSelf="flex-start"
          size="sm"
        >
          Back to Events
        </Button>

        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="satrf.navy">
            {eventTitle || 'Loading…'}
          </Text>
          <Text color="text.muted" mt={1}>
            In-app notifications for registered website users
          </Text>
        </Box>

        <AdminEventSubNav eventId={eventId} />

        {loading ? (
          <Center py={12}>
            <Spinner color="satrf.navy" />
          </Center>
        ) : (
          <>
            <Box
              p={5}
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              data-testid="admin-communications-history"
            >
              <Text fontWeight="bold" mb={3}>
                Published notifications
              </Text>
              {notifications.length === 0 ? (
                <Text color="text.muted">
                  No notifications have been published for this event.
                </Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {notifications.map((item) => (
                    <Box key={item.id} p={3} borderWidth="1px" borderRadius="md">
                      <HStack justify="space-between" flexWrap="wrap" gap={2}>
                        <Box>
                          <Text fontWeight="semibold">{item.title}</Text>
                          <Text fontSize="sm" color="text.muted">
                            {item.message}
                          </Text>
                          <HStack mt={1} spacing={2}>
                            <Badge>{item.status}</Badge>
                            <Badge variant="outline">{item.type}</Badge>
                            {item.publishedAt && (
                              <Text fontSize="xs" color="text.muted">
                                {formatEventDate(item.publishedAt)}
                              </Text>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            <Box
              p={5}
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              data-testid="admin-communications-compose"
            >
              <Text fontWeight="bold" mb={4}>
                Send event notification
              </Text>
              <Alert status="info" mb={4} borderRadius="md">
                <AlertIcon />
                Publishes an in-app notification only. Email is not sent in this phase.
              </Alert>

              <VStack align="stretch" spacing={4}>
                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {NOTIFICATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Audience</FormLabel>
                  <Input value="All registered website users" isReadOnly />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Message</FormLabel>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Link</FormLabel>
                  <Input
                    value={form.href}
                    onChange={(e) => setForm({ ...form, href: e.target.value })}
                    placeholder={`/events/${eventId}`}
                  />
                </FormControl>

                {preview && (
                  <Box p={4} borderWidth="1px" borderRadius="md" data-testid="notification-preview">
                    <Text fontSize="sm" color="text.muted" mb={2}>
                      Preview
                    </Text>
                    <Text fontWeight="bold">🔔 {preview.type}</Text>
                    <Text fontWeight="semibold" mt={2}>
                      {preview.title}
                    </Text>
                    <Text mt={1}>{preview.message}</Text>
                    <Text fontSize="sm" color="satrf.green.700" mt={2}>
                      {preview.href} →
                    </Text>
                    <Text fontSize="xs" color="text.muted" mt={2}>
                      Audience: {preview.audienceLabel}
                    </Text>
                  </Box>
                )}

                <HStack>
                  <Button variant="outline" onClick={() => void handlePreview()}>
                    Preview
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={() => void handlePublish()}
                    isLoading={publishing}
                  >
                    Publish Notification
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </AdminLayout>
  );
}
