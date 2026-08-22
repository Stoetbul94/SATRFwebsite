import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Button,
  Container,
  Spinner,
  Text,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import EventRegistrationModal from '@/components/events/EventRegistrationModal';
import EventHubShell from '@/components/events/hub/EventHubShell';
import { eventsAPI } from '@/lib/api';
import { mapPublicDocumentsToHub } from '@/lib/eventHub/documents';
import { transformApiEventToHub } from '@/lib/eventHub/transformEvent';
import type { PublicEventDocument } from '@/lib/eventDocuments/types';
import type { CalendarEventInput } from '@/lib/eventCalendarLinks';

const SITE_ORIGIN = 'https://www.rifleshooting.co.za';

function registerLabel(status: 'open' | 'full' | 'closed'): string {
  switch (status) {
    case 'open':
      return 'Register';
    case 'full':
      return 'Event Full';
    case 'closed':
      return 'Registration Closed';
    default:
      return 'Register';
  }
}

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [hubEvent, setHubEvent] = useState<ReturnType<typeof transformApiEventToHub> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      void fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [eventData, documentsResponse] = await Promise.all([
        eventsAPI.getById(eventId),
        fetch(`/api/events/${eventId}/documents`).then(async (response) =>
          response.ok ? response.json() : { documents: [] },
        ),
      ]);

      const publishedDocs = Array.isArray(documentsResponse.documents)
        ? mapPublicDocumentsToHub(
            eventId,
            documentsResponse.documents as PublicEventDocument[],
          )
        : [];

      setHubEvent(
        transformApiEventToHub(eventData as Record<string, unknown>, publishedDocs),
      );
    } catch (err: unknown) {
      console.error('Error fetching event:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Loading Event | SATRF</title>
        </Head>
        <PublicPageShell>
          <VStack py={12}>
            <Spinner size="lg" />
            <Text fontSize="sm">Loading event…</Text>
          </VStack>
        </PublicPageShell>
      </Layout>
    );
  }

  if (error || !hubEvent) {
    return (
      <Layout>
        <Head>
          <title>Event Not Found | SATRF</title>
        </Head>
        <PublicPageShell>
          <Alert status="error" borderRadius="lg" data-testid="event-not-found">
            <AlertIcon />
            {error || 'Event not found'}
          </Alert>
          <Button mt={4} onClick={() => router.push('/events')}>
            Back to Events
          </Button>
        </PublicPageShell>
      </Layout>
    );
  }

  const calendarInput: CalendarEventInput = {
    title: hubEvent.title,
    description: hubEvent.description,
    location: hubEvent.location,
    eventUrl: `${SITE_ORIGIN}/events/${hubEvent.id}`,
    start: hubEvent.eventDate,
    startTime: hubEvent.startTime,
    endTime: hubEvent.endTime,
  };

  const registrationStatus = hubEvent.registrationStatus;
  const canonical = `${SITE_ORIGIN}/events/${hubEvent.id}`;
  const description =
    hubEvent.description.trim().slice(0, 160) ||
    `${hubEvent.title} — SATRF target rifle competition.`;

  return (
    <Layout>
      <Head>
        <title>{`${hubEvent.title} | SATRF Events`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${hubEvent.title} | SATRF Events`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        {hubEvent.imageUrl && <meta property="og:image" content={hubEvent.imageUrl} />}
      </Head>

      <PublicPageShell>
        <Container maxW="container.lg" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
          <Button
            variant="ghost"
            onClick={() => router.push('/events')}
            alignSelf="flex-start"
            mb={4}
            minH="44px"
          >
            ← Back to Events
          </Button>

          <EventHubShell
            event={hubEvent}
            calendarInput={calendarInput}
            onRegister={() => setRegistrationOpen(true)}
            registerDisabled={registrationStatus !== 'open'}
            registerLabel={registerLabel(registrationStatus)}
          />
        </Container>
      </PublicPageShell>

      <EventRegistrationModal
        isOpen={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        event={{
          id: hubEvent.id,
          title: hubEvent.title,
          price: hubEvent.price,
          disciplines: hubEvent.disciplines,
          payfastUrl: hubEvent.payfastUrl,
          eftInstructions: hubEvent.eftInstructions,
        }}
        onSuccess={() => id && typeof id === 'string' && fetchEvent(id)}
      />
    </Layout>
  );
}
