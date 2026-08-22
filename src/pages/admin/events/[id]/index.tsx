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
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiArrowLeft, FiEdit } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminEventSubNav from '@/components/admin/AdminEventSubNav';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { disciplinePublicLabel } from '@/lib/eventDisciplines';
import { formatEventDate } from '@/lib/eventDisplay';
import type { SerializedEvent } from '@/lib/firestoreEvents';

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export default function AdminEventOverviewPage() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const router = useRouter();
  const { id } = router.query;
  const eventId = typeof id === 'string' ? id : '';
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [event, setEvent] = useState<SerializedEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = useCallback(async () => {
    if (!isAdmin || !eventId) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/admin/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load event');
      const data = await response.json();
      setEvent(data.event);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, eventId]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  if (authLoading) {
    return (
      <AdminLayout title="Event Overview">
        <Center py={20}>
          <Spinner size="xl" color="satrf.navy" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout title="Event Overview">
      <Head>
        <title>{event?.title || 'Event'} — SATRF Admin</title>
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

        {loading ? (
          <Center py={12}>
            <Spinner color="satrf.navy" />
          </Center>
        ) : !event ? (
          <Alert status="error">
            <AlertIcon />
            Event not found
          </Alert>
        ) : (
          <>
            <HStack justify="space-between" flexWrap="wrap" gap={3}>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="satrf.navy">
                  {event.title}
                </Text>
                <HStack mt={2} spacing={2}>
                  <Badge colorScheme="blue">{event.status}</Badge>
                  {event.date && (
                    <Text fontSize="sm" color="text.muted">
                      {formatEventDate(event.date)}
                    </Text>
                  )}
                </HStack>
              </Box>
              <Button
                leftIcon={<FiEdit />}
                colorScheme="green"
                onClick={() => router.push('/admin/events')}
              >
                Edit in Events List
              </Button>
            </HStack>

            <AdminEventSubNav eventId={eventId} />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {[
                { label: 'Venue', value: event.location },
                { label: 'Entry fee', value: event.price != null ? `R${event.price}` : '—' },
                { label: 'Start time', value: event.startTime || '—' },
                { label: 'End time', value: event.endTime || '—' },
                {
                  label: 'Equipment inspection',
                  value: event.equipmentInspectionTime || '—',
                },
                {
                  label: 'Registration closes',
                  value: event.registrationDeadline
                    ? formatEventDate(event.registrationDeadline)
                    : '—',
                },
                { label: 'Map URL', value: event.mapUrl || '—' },
                {
                  label: 'Disciplines',
                  value: event.disciplines.map(disciplinePublicLabel).join(' · ') || '—',
                },
              ].map((row) => (
                <Box
                  key={row.label}
                  p={4}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                >
                  <Text fontSize="xs" color="text.muted" textTransform="uppercase">
                    {row.label}
                  </Text>
                  <Text mt={1}>{row.value}</Text>
                </Box>
              ))}
            </SimpleGrid>

            {event.description && (
              <Box p={4} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
                <Text fontSize="xs" color="text.muted" textTransform="uppercase" mb={2}>
                  Description
                </Text>
                <Text whiteSpace="pre-wrap">{event.description}</Text>
              </Box>
            )}
          </>
        )}
      </VStack>
    </AdminLayout>
  );
}
