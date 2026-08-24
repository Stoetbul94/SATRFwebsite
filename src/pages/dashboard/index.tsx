import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Link as ChakraLink,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import { useAuth, useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { formatEventDate } from '@/lib/eventDisplay';
import type { DashboardResponse } from '@/lib/dashboard/types';

async function getToken(): Promise<string | null> {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Box
      as="section"
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="md"
      p={{ base: 4, md: 5 }}
      h="full"
    >
      <HStack justify="space-between" align="start" mb={3} spacing={3}>
        <Heading as="h2" size="sm" color="satrf.navy" letterSpacing="0.04em" textTransform="uppercase">
          {title}
        </Heading>
        {action}
      </HStack>
      {children}
    </Box>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <Text
      as="span"
      display="inline-block"
      fontSize="xs"
      fontWeight="700"
      letterSpacing="0.04em"
      textTransform="uppercase"
      color="satrf.green.700"
      borderWidth="1px"
      borderColor="satrf.green.500"
      px={2}
      py={0.5}
      borderRadius="sm"
    >
      {label}
    </Text>
  );
}

export default function MySatrfDashboardPage() {
  useProtectedRoute();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setError('Please sign in again.');
        setData(null);
        return;
      }
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = (await res.json()) as DashboardResponse;
      setData(json);
    } catch {
      setError('Dashboard could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      void load();
    } else if (isInitialized && !isAuthenticated) {
      setLoading(false);
    }
  }, [isInitialized, isAuthenticated, load]);

  const firstName = data?.user.firstName || user?.firstName || 'Athlete';
  const clubLine = [data?.user.club, data?.user.province].filter(Boolean).join(' · ');

  return (
    <Layout>
      <Head>
        <title>My SATRF | South African Target Rifle Federation</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Your personal SATRF home — events, entries, results, and notifications." />
      </Head>

      <PublicPageShell>
        <Container maxW="6xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
          <Box
            mb={6}
            pb={4}
            borderBottomWidth="3px"
            borderBottomColor="satrf.green.500"
          >
            <Text
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.12em"
              color="satrf.green.600"
              textTransform="uppercase"
              mb={1}
            >
              My SATRF
            </Text>
            <Heading as="h1" size={{ base: 'lg', md: 'xl' }} color="satrf.navy" fontFamily="heading">
              Welcome back, {firstName}
            </Heading>
            {clubLine ? (
              <Text mt={1} color="text.muted" fontSize="sm">
                {clubLine}
              </Text>
            ) : null}
            <HStack mt={2} spacing={4} fontSize="sm" flexWrap="wrap">
              <ChakraLink as={Link} href="/profile" color="satrf.navy" fontWeight="600">
                Account / Profile
              </ChakraLink>
              {data?.user.profileIncomplete ? (
                <Text color="orange.700" fontWeight="600">
                  Complete your profile
                </Text>
              ) : null}
            </HStack>
          </Box>

          {loading ? (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="140px" borderRadius="md" />
              ))}
            </SimpleGrid>
          ) : error ? (
            <Box borderWidth="1px" borderColor="red.200" bg="red.50" p={4} borderRadius="md">
              <Text color="red.700" mb={3}>
                {error}
              </Text>
              <Button size="sm" onClick={() => void load()} colorScheme="blue">
                Retry
              </Button>
            </Box>
          ) : (
            <Grid
              templateColumns={{ base: '1fr', lg: '1.4fr 1fr' }}
              templateAreas={{
                base: `
                  "next"
                  "entries"
                  "results"
                  "notif"
                  "actions"
                `,
                lg: `
                  "next notif"
                  "entries actions"
                  "results results"
                `,
              }}
              gap={4}
              alignItems="start"
            >
              <GridItem area="next">
                <SectionCard title="Next Event">
                  {!data?.nextEvent ? (
                    <VStack align="start" spacing={3}>
                      <Text color="text.muted">No upcoming registrations yet.</Text>
                      <Button as={Link} href="/events" size="sm" colorScheme="green" minH="44px">
                        Browse Events
                      </Button>
                    </VStack>
                  ) : (
                    <VStack align="stretch" spacing={3}>
                      <Box>
                        <Text fontWeight="700" color="satrf.navy" fontSize="lg">
                          {data.nextEvent.title}
                        </Text>
                        <Text fontSize="sm" color="text.muted" mt={1}>
                          {formatEventDate(data.nextEvent.date)}
                          {data.nextEvent.location ? ` · ${data.nextEvent.location}` : ''}
                        </Text>
                      </Box>
                      <HStack spacing={2} flexWrap="wrap">
                        {data.nextEvent.isRegistered ? (
                          <StatusPill label="Registered" />
                        ) : data.nextEvent.registrationOpen ? (
                          <StatusPill label="Open for Entries" />
                        ) : (
                          <StatusPill label={data.nextEvent.status || 'Event'} />
                        )}
                      </HStack>
                      {data.nextEvent.hasCallForEntries ? (
                        <Text fontSize="sm" color="text.muted">
                          Call for Entries available
                        </Text>
                      ) : null}
                      <HStack spacing={2} flexWrap="wrap">
                        <Button as={Link} href={`/events/${data.nextEvent.id}`} size="sm" colorScheme="blue" minH="44px">
                          View Event
                        </Button>
                        {!data.nextEvent.isRegistered && data.nextEvent.registrationOpen ? (
                          <Button
                            as={Link}
                            href={`/events/${data.nextEvent.id}#register`}
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            minH="44px"
                          >
                            Register
                          </Button>
                        ) : null}
                      </HStack>
                    </VStack>
                  )}
                </SectionCard>
              </GridItem>

              <GridItem area="notif">
                <SectionCard
                  title="Notifications"
                  action={
                    <ChakraLink as={Link} href="/notifications" fontSize="sm" fontWeight="600" color="satrf.navy">
                      View Notifications
                    </ChakraLink>
                  }
                >
                  {data?.errors?.notifications ? (
                    <Text color="text.muted">{data.errors.notifications}</Text>
                  ) : data && data.notifications.unreadCount > 0 ? (
                    <VStack align="stretch" spacing={3}>
                      <Text fontWeight="700" color="satrf.navy">
                        {data.notifications.unreadCount} unread
                      </Text>
                      {data.notifications.recent.map((n) => (
                        <Box key={n.id}>
                          <Text fontWeight="600" fontSize="sm">
                            {n.title}
                          </Text>
                          <Text fontSize="sm" color="text.muted" noOfLines={2}>
                            {n.message}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="text.muted">No unread notifications.</Text>
                  )}
                </SectionCard>
              </GridItem>

              <GridItem area="entries">
                <SectionCard title="My Entries">
                  {data?.errors?.registrations ? (
                    <Text color="text.muted">{data.errors.registrations}</Text>
                  ) : !data?.registrations.length ? (
                    <VStack align="start" spacing={3}>
                      <Text color="text.muted">You have no upcoming entries.</Text>
                      <Button as={Link} href="/events" size="sm" variant="outline" colorScheme="green" minH="44px">
                        Browse Events
                      </Button>
                    </VStack>
                  ) : (
                    <Stack spacing={3} divider={<Box borderBottomWidth="1px" borderColor="border.subtle" />}>
                      {data.registrations.map((r) => (
                        <Box key={r.id}>
                          <Text fontWeight="600" color="satrf.navy">
                            {r.eventTitle}
                          </Text>
                          <Text fontSize="sm" color="text.muted">
                            {formatEventDate(r.eventDate)}
                            {r.location ? ` · ${r.location}` : ''}
                          </Text>
                          <HStack mt={2} spacing={3}>
                            <StatusPill label={r.statusLabel} />
                            <ChakraLink
                              as={Link}
                              href={`/events/${r.eventId}`}
                              fontSize="sm"
                              fontWeight="600"
                              color="satrf.navy"
                            >
                              View Event
                            </ChakraLink>
                          </HStack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </SectionCard>
              </GridItem>

              <GridItem area="actions">
                <SectionCard title="Quick Actions">
                  <SimpleGrid columns={2} spacing={2}>
                    {[
                      { href: '/events', label: 'Events' },
                      { href: '/rules', label: 'Rule Finder' },
                      { href: '/scores', label: 'Scores' },
                      { href: '/coaching', label: 'Coaching' },
                      { href: '/profile', label: 'My Profile' },
                    ].map((item) => (
                      <Button
                        key={item.href}
                        as={Link}
                        href={item.href}
                        size="sm"
                        variant="outline"
                        justifyContent="flex-start"
                        h="40px"
                        borderColor="border.subtle"
                        color="satrf.navy"
                      >
                        {item.label}
                      </Button>
                    ))}
                  </SimpleGrid>
                </SectionCard>
              </GridItem>

              <GridItem area="results">
                <SectionCard
                  title="Competition Results"
                  action={
                    data?.user.hasLinkedResults ? (
                      <ChakraLink as={Link} href="/dashboard/results" fontSize="sm" fontWeight="600" color="satrf.navy">
                        View My Performance
                      </ChakraLink>
                    ) : null
                  }
                >
                  {data?.errors?.results ? (
                    <Text color="text.muted">{data.errors.results}</Text>
                  ) : !data?.user.hasLinkedResults ? (
                    <Text color="text.muted" fontSize="sm">
                      No competition results are linked to your account yet. Results entered for your website account
                      will appear here.
                    </Text>
                  ) : !data.results.length ? (
                    <Text color="text.muted">No recent results yet.</Text>
                  ) : (
                    <Stack spacing={3} display={{ base: 'flex', md: 'none' }}>
                      {data.results.map((r) => (
                        <Box key={r.id} borderBottomWidth="1px" borderColor="border.subtle" pb={3}>
                          <Text fontWeight="700" color="satrf.navy">
                            {r.disciplineLabel}
                          </Text>
                          <Text fontSize="lg" fontWeight="700">
                            {r.scoreLabel}
                          </Text>
                          <Text fontSize="sm" color="text.muted">
                            {r.eventName} · {formatEventDate(r.date)} · {r.stageLabel}
                          </Text>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {data?.user.hasLinkedResults && data.results.length > 0 ? (
                    <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
                      <Box as="table" w="full" fontSize="sm" sx={{ borderCollapse: 'collapse' }}>
                        <Box as="thead">
                          <Box as="tr" borderBottomWidth="1px" borderColor="border.subtle">
                            {['Discipline', 'Event', 'Score', 'Stage', 'Date'].map((h) => (
                              <Box
                                as="th"
                                key={h}
                                textAlign="left"
                                py={2}
                                pr={3}
                                color="text.muted"
                                fontWeight="600"
                              >
                                {h}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                        <Box as="tbody">
                          {data.results.map((r) => (
                            <Box as="tr" key={r.id} borderBottomWidth="1px" borderColor="border.subtle">
                              <Box as="td" py={2} pr={3} fontWeight="600">
                                {r.disciplineLabel}
                              </Box>
                              <Box as="td" py={2} pr={3}>
                                {r.eventName}
                              </Box>
                              <Box as="td" py={2} pr={3} fontWeight="700">
                                {r.scoreLabel}
                              </Box>
                              <Box as="td" py={2} pr={3}>
                                {r.stageLabel}
                              </Box>
                              <Box as="td" py={2}>
                                {formatEventDate(r.date)}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  ) : null}
                </SectionCard>
              </GridItem>
            </Grid>
          )}
        </Container>
      </PublicPageShell>
    </Layout>
  );
}
