import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { FaSearch } from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import { GetServerSideProps } from 'next';
import { eventsAPI } from '@/lib/api';
import EventRegistrationModal from '@/components/events/EventRegistrationModal';
import { getPublicRegistrationStatus } from '@/lib/eventRegistrationUi';
import Head from 'next/head';
import EventHeroCard from '@/components/events/EventHeroCard';
import EventListCard, { type EventCardData } from '@/components/events/EventListCard';
import { disciplinePublicLabel, parseEventDisciplines } from '@/lib/eventDisciplines';
import { isEventPast, startOfToday } from '@/lib/eventDisplay';
import type { Discipline } from '@/types/scores';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startDate: Date;
  endDate: Date;
  location: string;
  disciplines: Discipline[];
  price: number | null;
  maxSpots: number;
  currentSpots: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline: Date;
  image?: string | null;
  payfastUrl?: string | null;
  eftInstructions?: string | null;
}

function toDate(d: unknown): Date | null {
  if (!d) return null;
  if (
    typeof d === 'object' &&
    d !== null &&
    'toDate' in d &&
    typeof (d as { toDate: () => Date }).toDate === 'function'
  ) {
    return (d as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(d as string);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function toEventCardData(event: Event): EventCardData {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventDate: event.startDate,
    location: event.location,
    disciplineLabels: event.disciplines.map(disciplinePublicLabel),
    price: event.price,
    maxSpots: event.maxSpots,
    currentSpots: event.currentSpots,
    registrationDeadline: event.registrationDeadline,
    image: event.image,
    payfastUrl: event.payfastUrl,
    eftInstructions: event.eftInstructions,
    isPast: isEventPast(event.startDate),
  };
}

function registrationLabel(status: ReturnType<typeof getPublicRegistrationStatus>): string {
  switch (status) {
    case 'open':
      return 'Register Now';
    case 'full':
      return 'Full';
    case 'closed':
      return 'Closed';
    default:
      return 'Register';
  }
}

export default function Events() {
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [registrationEvent, setRegistrationEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const eventsData = await eventsAPI.getAll();

      const transformedEvents: Event[] = Array.isArray(eventsData)
        ? eventsData.map((e: Record<string, unknown>) => {
            const dateVal = toDate(e.date);
            const start = toDate(e.startDate) || dateVal;
            const end = toDate(e.endDate) || dateVal;
            const deadline =
              toDate(e.registrationDeadline || e.deadline || e.date) || dateVal || new Date();

            return {
              id: String(e.id),
              title: String(e.title || e.name || 'Untitled Event'),
              description: String(e.description || ''),
              date: dateVal ? dateVal.toISOString() : '',
              startDate: start || new Date(),
              endDate: end || start || new Date(),
              location: String(e.location || ''),
              disciplines: Array.isArray(e.disciplines)
                ? (e.disciplines as Discipline[])
                : parseEventDisciplines(e),
              price: (e.price as number | null) ?? null,
              maxSpots: Number(e.maxParticipants ?? e.maxSpots) || 0,
              currentSpots: Number(e.currentParticipants ?? e.currentSpots) || 0,
              status: (e.status as Event['status']) || 'upcoming',
              registrationDeadline: deadline,
              image: (e.image || e.imageUrl || e.imageURL || null) as string | null,
              payfastUrl: (e.payfastUrl as string | null) || null,
              eftInstructions: (e.eftInstructions as string | null) || null,
            };
          })
        : [];

      setEvents(transformedEvents);
    } catch (err: unknown) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    const today = startOfToday();
    return events.filter((event) => {
      const isPast = isEventPast(event.startDate);
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'upcoming') matchesStatus = !isPast && event.status !== 'cancelled';
      else if (statusFilter === 'completed') matchesStatus = isPast;
      else if (statusFilter === 'ongoing') {
        matchesStatus =
          !isPast &&
          event.status !== 'cancelled' &&
          event.startDate.toDateString() === today.toDateString();
      } else if (statusFilter === 'cancelled') {
        matchesStatus = event.status === 'cancelled';
      }

      const matchesCategory =
        categoryFilter === 'all' || event.disciplines.some((d) => d === categoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [events, searchTerm, statusFilter, categoryFilter]);

  const { heroEvent, upcomingGrid, pastEvents } = useMemo(() => {
    const upcoming = filteredEvents
      .filter((e) => !isEventPast(e.startDate) && e.status !== 'cancelled')
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const past = filteredEvents
      .filter((e) => isEventPast(e.startDate))
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    const hero = upcoming.length > 0 ? upcoming[0] : null;
    const grid = hero ? upcoming.slice(1) : upcoming;

    return { heroEvent: hero, upcomingGrid: grid, pastEvents: past };
  }, [filteredEvents]);

  const openRegistration = (event: Event) => {
    if (getPublicRegistrationStatus(event) === 'open') {
      setRegistrationEvent(event);
    }
  };

  const cardRegistrationProps = (event: Event) => {
    const status = getPublicRegistrationStatus(event);
    return {
      registrationOpen: status === 'open',
      registrationLabel: registrationLabel(status),
      onRegister: () => openRegistration(event),
    };
  };

  const hasNoUpcoming = !isLoading && !error && upcomingGrid.length === 0 && !heroEvent;
  const noMatches = !isLoading && !error && filteredEvents.length === 0;

  return (
    <Layout>
      <Head>
        <title>Events & Competitions - SATRF</title>
        <meta
          name="description"
          content="Discover and register for upcoming shooting events and competitions organized by the South African Target Rifle Federation."
        />
        <meta property="og:title" content="Events & Competitions - SATRF" />
        <meta
          property="og:description"
          content="Discover and register for upcoming shooting events and competitions."
        />
        <meta property="og:type" content="website" />
      </Head>
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          <Box>
            <Heading size="xl" mb={2} color="satrf.navy">
              Events & Competitions
            </Heading>
            <Text color={textColorSecondary} fontSize="lg">
              Discover and register for upcoming shooting events and competitions
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Error loading events</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          {isLoading && (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" color="satrf.lightBlue" />
              <Text mt={4} color={textColorSecondary}>
                Loading events...
              </Text>
            </Box>
          )}

          <Box
            bg={cardBg}
            p={6}
            rounded="lg"
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
              <GridItem>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </GridItem>
              <GridItem>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Past</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </GridItem>
              <GridItem>
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  <option value="prone_50m">Prone</option>
                  <option value="fclass_open">F-Class Open</option>
                  <option value="fclass_tr">F-Class TR</option>
                  <option value="three_position_50m">3-Position</option>
                </Select>
              </GridItem>
            </Grid>
          </Box>

          {!isLoading && !error && (
            <Text color={textColorSecondary}>
              Showing {filteredEvents.length} of {events.length} events
            </Text>
          )}

          {noMatches && (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>No events match your filters</AlertTitle>
              <AlertDescription>Try adjusting your search terms or filters.</AlertDescription>
            </Alert>
          )}

          {!noMatches && heroEvent && (
            <EventHeroCard
              event={toEventCardData(heroEvent)}
              {...cardRegistrationProps(heroEvent)}
            />
          )}

          {!noMatches && hasNoUpcoming && pastEvents.length > 0 && (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>No upcoming events</AlertTitle>
              <AlertDescription>Check back soon — browse past events below.</AlertDescription>
            </Alert>
          )}

          {!noMatches && hasNoUpcoming && pastEvents.length === 0 && (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>No upcoming events</AlertTitle>
              <AlertDescription>Check back soon for new competitions.</AlertDescription>
            </Alert>
          )}

          {upcomingGrid.length > 0 && (
            <VStack align="stretch" spacing={4}>
              {heroEvent && (
                <Heading size="md" color="satrf.navy">
                  More upcoming events
                </Heading>
              )}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {upcomingGrid.map((event, i) => (
                  <EventListCard
                    key={event.id}
                    event={toEventCardData(event)}
                    index={i}
                    variant="grid"
                    {...cardRegistrationProps(event)}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          )}

          {pastEvents.length > 0 && (
            <VStack align="stretch" spacing={4} pt={4}>
              <Heading size="md" color="satrf.navy">
                Past Events
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {pastEvents.map((event, i) => (
                  <EventListCard
                    key={event.id}
                    event={toEventCardData(event)}
                    index={i}
                    variant="past"
                  />
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </Stack>

        {registrationEvent && (
          <EventRegistrationModal
            isOpen={!!registrationEvent}
            onClose={() => setRegistrationEvent(null)}
            event={{
              id: registrationEvent.id,
              title: registrationEvent.title,
              price: registrationEvent.price,
              disciplines: registrationEvent.disciplines,
              payfastUrl: registrationEvent.payfastUrl,
              eftInstructions: registrationEvent.eftInstructions,
            }}
            onSuccess={() => fetchEvents()}
          />
        )}
      </Container>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
