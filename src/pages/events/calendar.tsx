import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FaCalendar, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaClock, 
  FaRegCalendarAlt,
  FaCheckCircle,
  FaDownload,
  FaShare,
  FaRedo
} from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import EventsCalendar from '@/components/events/EventsCalendar';
import EventRegistrationModal from '@/components/events/EventRegistrationModal';
import { useAuth } from '@/contexts/AuthContext';
import { GetServerSideProps } from 'next';
import { Event, EventFilters, eventUtils } from '@/lib/events';
import { fetchCalendarEvents } from '@/lib/events/fetchCalendarEvents';
import {
  civilDateInJohannesburg,
  type CalendarEvent,
} from '@/lib/events/normalizeCalendarEvent';
import type { EventRegistrationTarget } from '@/components/events/EventRegistrationModal';

const EventsCalendarPage: NextPage = () => {
  // All useColorModeValue calls must be at the very top, before any other hooks
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [refreshing, setRefreshing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<EventRegistrationTarget | null>(null);
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const nextEvents = await fetchCalendarEvents();
      setEvents(nextEvents);
    } catch (err: unknown) {
      console.error('Error loading events:', err);
      setEvents([]);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const toRegistrationTarget = (event: CalendarEvent): EventRegistrationTarget => ({
    id: event.id,
    title: event.title,
    price: event.price,
    disciplines: event.disciplines,
    payfastUrl: event.payfastUrl,
    eftInstructions: event.eftInstructions,
  });

  const handleEventRegister = async (event: Event) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to register for events.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const full = events.find((item) => item.id === event.id);
    if (!full) return;
    setRegistrationEvent(toRegistrationTarget(full));
    onClose();
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    onOpen();
  };

  const handleFiltersChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
  };

  const refreshEvents = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const getUpcomingEvents = () => {
    const today = civilDateInJohannesburg(new Date());
    if (!today) return [];
    return events
      .filter((event) => {
        const civil = event.allDay ? event.start.slice(0, 10) : civilDateInJohannesburg(event.start);
        return Boolean(civil && civil >= today && event.status === 'OPEN');
      })
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 5);
  };

  const exportCalendar = () => {
    const icalContent = events
      .filter(event => event.status === 'OPEN')
      .map(event => {
        if (event.allDay) {
          const start = event.start.replace(/-/g, '');
          const [year, month, day] = event.start.split('-').map(Number);
          const next = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
          const endCivil = next.replace(/-/g, '');
          return `BEGIN:VEVENT
UID:${event.id}@satrf.org.za
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${endCivil}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
END:VEVENT`;
        }

        const start = new Date(event.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const end = new Date(event.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        return `BEGIN:VEVENT
UID:${event.id}@satrf.org.za
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
END:VEVENT`;
      })
      .join('\n');

    const fullIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SATRF//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${icalContent}
END:VCALENDAR`;

    const blob = new Blob([fullIcal], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'satrf-events.ics';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Calendar Exported',
      description: 'SATRF events calendar has been downloaded.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const shareCalendar = () => {
    if (navigator.share) {
      navigator.share({
        title: 'SATRF Events Calendar',
        text: 'Check out the upcoming SATRF shooting events!',
        url: window.location.href,
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Calendar link has been copied to clipboard.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout>
      <Head>
        <title>Events Calendar - SATRF</title>
        <meta name="description" content="Interactive calendar of SATRF shooting events. View, filter, and register for upcoming competitions and training sessions." />
        <meta name="keywords" content="SATRF, shooting events, calendar, competitions, ISSF, target rifle, air rifle, prone, 3P" />
      </Head>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={2} color="satrf.navy">
              <HStack>
                <FaCalendar />
                <Text>Events Calendar</Text>
              </HStack>
            </Heading>
            <Text color={textColorSecondary} fontSize="lg">
              Interactive calendar of SATRF shooting events
            </Text>
          </Box>

          {/* Quick Stats */}
          <Box
            bg={bgColor}
            p={6}
            rounded="lg"
            shadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Flex direction={{ base: 'column', md: 'row' }} gap={6} justify="space-between">
              <HStack>
                <FaCalendar color="#2C5282" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="lg">{events.length}</Text>
                  <Text fontSize="sm" color="gray.500">Events</Text>
                </VStack>
              </HStack>
              
              <HStack>
                <FaClock color="#38A169" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="lg">{getUpcomingEvents().length}</Text>
                  <Text fontSize="sm" color="gray.500">Upcoming</Text>
                </VStack>
              </HStack>
            </Flex>
          </Box>

          {/* Calendar Actions */}
          <Box
            bg={bgColor}
            p={4}
            rounded="lg"
            shadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} justify="space-between" align="center">
              <Text fontWeight="medium" color={textColor}>
                Calendar Controls
              </Text>
              
              <HStack spacing={3}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="satrf"
                  leftIcon={<FaRedo />}
                  onClick={refreshEvents}
                  isLoading={refreshing}
                >
                  Refresh
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="satrf"
                  leftIcon={<FaDownload />}
                  onClick={exportCalendar}
                >
                  Export Calendar
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="satrf"
                  leftIcon={<FaShare />}
                  onClick={shareCalendar}
                >
                  Share
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* Main Calendar */}
          <EventsCalendar
            events={events}
            onEventRegister={handleEventRegister}
            loading={loading}
            error={error}
            userRegistrations={[]}
            onFiltersChange={handleFiltersChange}
            filters={filters}
          />

          {/* Upcoming Events Summary */}
          {getUpcomingEvents().length > 0 && (
            <Box
              bg={bgColor}
              p={6}
              rounded="lg"
              shadow="sm"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4} color="satrf.navy">
                <HStack>
                  <FaClock />
                  <Text>Upcoming Events</Text>
                </HStack>
              </Heading>
              
              <VStack align="stretch" spacing={3}>
                {getUpcomingEvents().map((event) => (
                  <Box
                    key={event.id}
                    p={4}
                    borderWidth="1px"
                    borderColor={borderColor}
                    rounded="md"
                    _hover={{ bg: hoverBg }}
                    cursor="pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack>
                          <Text fontWeight="bold">{event.title}</Text>
                          {event.source && (
                            <Badge colorScheme={event.source === 'ISSF' ? 'blue' : 'satrf'}>
                              {event.source}
                            </Badge>
                          )}
                        </HStack>
                        
                        <HStack color="gray.500" fontSize="sm">
                          <FaRegCalendarAlt />
                          <Text>{eventUtils.formatEventDate(event.start, event.end)}</Text>
                        </HStack>
                        
                        <HStack color="gray.500" fontSize="sm">
                          <FaMapMarkerAlt />
                          <Text>{event.location}</Text>
                        </HStack>
                      </VStack>
                      
                      <VStack align="end" spacing={1}>
                        <Text fontWeight="bold" color="satrf.navy">
                          R{event.price}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {event.currentSpots}/{event.maxSpots} spots
                        </Text>
                      </VStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Event Detail Modal */}
          <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <HStack>
                  <FaCalendar color="#2C5282" />
                  <Text>{selectedEvent?.title}</Text>
                </HStack>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {selectedEvent && (
                  <VStack align="stretch" spacing={4}>
                    {/* Event Status and Source */}
                    <HStack justify="space-between">
                      <Badge colorScheme={selectedEvent.status === 'OPEN' ? 'blue' : 'gray'}>
                        {selectedEvent.status}
                      </Badge>
                      {selectedEvent.source && (
                        <Badge colorScheme={selectedEvent.source === 'ISSF' ? 'blue' : 'satrf'}>
                          {selectedEvent.source}
                        </Badge>
                      )}
                    </HStack>

                    {/* Event Details */}
                    <Tabs variant="enclosed">
                      <TabList>
                        <Tab>Details</Tab>
                        <Tab>Schedule</Tab>
                        <Tab>Registration</Tab>
                      </TabList>

                      <TabPanels>
                        {/* Details Tab */}
                        <TabPanel>
                          <VStack align="stretch" spacing={3}>
                            <Text>{selectedEvent.description}</Text>
                            
                            <HStack>
                              <FaMapMarkerAlt color="#2C5282" />
                              <Text fontWeight="medium">{selectedEvent.location}</Text>
                            </HStack>

                            <HStack>
                              <FaRegCalendarAlt color="#2C5282" />
                              <Text>
                                {eventUtils.formatEventDate(selectedEvent.start, selectedEvent.end)}
                              </Text>
                            </HStack>

                            <HStack>
                              <FaUsers color="#2C5282" />
                              <Text>
                                {selectedEvent.currentSpots}/{selectedEvent.maxSpots} spots filled
                              </Text>
                            </HStack>

                            <Text fontWeight="medium" color="satrf.navy">
                              R{selectedEvent.price}
                            </Text>

                            {selectedEvent.requirements && selectedEvent.requirements.length > 0 && (
                              <Box>
                                <Text fontWeight="medium" mb={2}>Requirements:</Text>
                                <List spacing={1}>
                                  {selectedEvent.requirements.map((req, index) => (
                                    <ListItem key={index}>
                                      <ListIcon as={FaCheckCircle} color="green.500" />
                                      {req}
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}

                            {selectedEvent.contactInfo && (
                              <Box>
                                <Text fontWeight="medium" mb={2}>Contact Information:</Text>
                                <Text>{selectedEvent.contactInfo.name}</Text>
                                <Text>{selectedEvent.contactInfo.email}</Text>
                                <Text>{selectedEvent.contactInfo.phone}</Text>
                              </Box>
                            )}
                          </VStack>
                        </TabPanel>

                        {/* Schedule Tab */}
                        <TabPanel>
                          {selectedEvent.schedule && selectedEvent.schedule.length > 0 ? (
                            <List spacing={3}>
                              {selectedEvent.schedule.map((item, index) => (
                                <ListItem key={index}>
                                  <ListIcon as={FaClock} color="#2C5282" />
                                  {item}
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Text color="gray.500">Schedule details not available</Text>
                          )}
                        </TabPanel>

                        {/* Registration Tab */}
                        <TabPanel>
                          <VStack align="stretch" spacing={4}>
                            <Box>
                              <Text fontWeight="medium" mb={2}>Registration Status:</Text>
                              <Badge 
                                colorScheme={eventUtils.getRegistrationStatus(selectedEvent) === 'open' ? 'green' : 'red'}
                                size="lg"
                              >
                                {eventUtils.getRegistrationStatus(selectedEvent).toUpperCase()}
                              </Badge>
                            </Box>

                            <Box>
                              <Text fontWeight="medium" mb={2}>Registration Deadline:</Text>
                              <Text>{eventUtils.formatEventDate(selectedEvent.registrationDeadline, selectedEvent.registrationDeadline)}</Text>
                            </Box>

                            <Box>
                              <Text fontWeight="medium" mb={2}>Available Spots:</Text>
                              <Text>{selectedEvent.maxSpots - selectedEvent.currentSpots} remaining</Text>
                            </Box>

                            {eventUtils.getRegistrationStatus(selectedEvent) === 'open' && isAuthenticated && (
                              <Button
                                colorScheme="satrf"
                                size="lg"
                                onClick={() => handleEventRegister(selectedEvent)}
                                leftIcon={<FaCheckCircle />}
                              >
                                Register for Event
                              </Button>
                            )}

                            {!isAuthenticated && (
                              <Alert status="info">
                                <AlertIcon />
                                <Text>Please log in to register for this event</Text>
                              </Alert>
                            )}

                            {eventUtils.getRegistrationStatus(selectedEvent) === 'closed' && (
                              <Alert status="warning">
                                <AlertIcon />
                                <Text>Registration for this event has closed</Text>
                              </Alert>
                            )}

                            {eventUtils.getRegistrationStatus(selectedEvent) === 'full' && (
                              <Alert status="warning">
                                <AlertIcon />
                                <Text>This event is full. You can join the waitlist.</Text>
                              </Alert>
                            )}
                          </VStack>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </VStack>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
          {registrationEvent && (
            <EventRegistrationModal
              isOpen
              onClose={() => setRegistrationEvent(null)}
              event={registrationEvent}
              onSuccess={() => {
                setRegistrationEvent(null);
                void refreshEvents();
              }}
            />
          )}
        </VStack>
      </Container>
    </Layout>
  );
};

export default EventsCalendarPage;

// Make this page server-side rendered to avoid useAuth issues during static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
}; 