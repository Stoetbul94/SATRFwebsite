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
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Flex,
  Badge,
  Divider,
  IconButton,
  Tooltip,
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
  Spinner,
  Center,
} from '@chakra-ui/react';
import { 
  FaCalendar, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaClock, 
  FaInfoCircle, 
  FaRegCalendarAlt,
  FaFilter,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaGlobe,
  FaHome,
  FaDownload,
  FaShare,
  FaRefresh
} from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import EventsCalendar from '@/components/events/EventsCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI, MOCK_EVENTS, Event, EventFilters, EventRegistration, eventUtils } from '@/lib/events';

const EventsCalendarPage: NextPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<EventRegistration[]>([]);
  const [filters, setFilters] = useState<EventFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();

  // Color scheme for SATRF branding
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  // Load events on component mount and when filters change
  useEffect(() => {
    loadEvents();
  }, [filters, currentPage]);

  // Load user registrations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserRegistrations();
    } else {
      setUserRegistrations([]);
    }
  }, [isAuthenticated]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In development, use mock data if API is not available
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_BASE_URL) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEvents(MOCK_EVENTS);
        setHasMore(false);
      } else {
        // Fetch from backend API
        const response = await eventsAPI.getEvents(filters, currentPage, 20);
        
        if (currentPage === 1) {
          setEvents(response.events);
        } else {
          setEvents(prev => [...prev, ...response.events]);
        }
        
        setHasMore(response.hasMore);
      }
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again later.');
      
      // Fallback to mock data in case of API failure
      if (currentPage === 1) {
        setEvents(MOCK_EVENTS);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserRegistrations = async () => {
    try {
      const registrations = await eventsAPI.getUserRegistrations();
      setUserRegistrations(registrations);
    } catch (err) {
      console.error('Error loading user registrations:', err);
      // Don't show error toast for registrations as it's not critical
    }
  };

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

    try {
      const registration = await eventsAPI.registerForEvent(event.id);
      
      toast({
        title: 'Registration Successful',
        description: `You have been registered for ${event.title}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Update local state
      setUserRegistrations(prev => [...prev, registration]);
      
      // Refresh events to update spot counts
      await refreshEvents();
      
      onClose();
    } catch (err: any) {
      console.error('Error registering for event:', err);
      
      toast({
        title: 'Registration Failed',
        description: err.response?.data?.detail || 'Failed to register for event. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEventUnregister = async (event: Event) => {
    try {
      await eventsAPI.cancelRegistration(event.id);
      
      toast({
        title: 'Registration Cancelled',
        description: `Your registration for ${event.title} has been cancelled`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Update local state
      setUserRegistrations(prev => prev.filter(reg => reg.eventId !== event.id));
      
      // Refresh events to update spot counts
      await refreshEvents();
      
      onClose();
    } catch (err: any) {
      console.error('Error cancelling registration:', err);
      
      toast({
        title: 'Cancellation Failed',
        description: err.response?.data?.detail || 'Failed to cancel registration. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    onOpen();
  };

  const handleFiltersChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const refreshEvents = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadEvents();
    if (isAuthenticated) {
      await loadUserRegistrations();
    }
    setRefreshing(false);
  };

  const loadMoreEvents = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const isUserRegistered = (eventId: string) => {
    return userRegistrations.some(reg => reg.eventId === eventId && reg.status === 'REGISTERED');
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.start) > now && event.status === 'OPEN')
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  };

  const getISSFEvents = () => {
    return events.filter(event => event.source === 'ISSF');
  };

  const getSATRFEvents = () => {
    return events.filter(event => event.source === 'SATRF');
  };

  const exportCalendar = () => {
    // Generate iCal format for calendar export
    const icalContent = events
      .filter(event => event.status === 'OPEN')
      .map(event => {
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
        <meta name="description" content="Interactive calendar of SATRF and ISSF shooting events. View, filter, and register for upcoming competitions and training sessions." />
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
            <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
              Interactive calendar featuring SATRF local events and ISSF international competitions
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
                <FaHome color="#2C5282" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="lg">{getSATRFEvents().length}</Text>
                  <Text fontSize="sm" color="gray.500">SATRF Events</Text>
                </VStack>
              </HStack>
              
              <HStack>
                <FaGlobe color="#3182CE" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="lg">{getISSFEvents().length}</Text>
                  <Text fontSize="sm" color="gray.500">ISSF Events</Text>
                </VStack>
              </HStack>
              
              <HStack>
                <FaClock color="#38A169" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="lg">{getUpcomingEvents().length}</Text>
                  <Text fontSize="sm" color="gray.500">Upcoming</Text>
                </VStack>
              </HStack>
              
              <HStack>
                <FaUsers color="#E53E3E" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="lg">{userRegistrations.length}</Text>
                  <Text fontSize="sm" color="gray.500">Your Registrations</Text>
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
                  leftIcon={<FaRefresh />}
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
            onEventUnregister={handleEventUnregister}
            loading={loading}
            error={error}
            userRegistrations={userRegistrations.map(reg => reg.eventId)}
            onFiltersChange={handleFiltersChange}
            filters={filters}
          />

          {/* Load More Button */}
          {hasMore && !loading && (
            <Center>
              <Button
                colorScheme="satrf"
                variant="outline"
                onClick={loadMoreEvents}
                isLoading={loading}
              >
                Load More Events
              </Button>
            </Center>
          )}

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
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                    cursor="pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack>
                          <Text fontWeight="bold">{event.title}</Text>
                          <Badge colorScheme={event.source === 'ISSF' ? 'blue' : 'satrf'}>
                            {event.source}
                          </Badge>
                          {isUserRegistered(event.id) && (
                            <Badge colorScheme="green">Registered</Badge>
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
                      <Badge colorScheme={selectedEvent.source === 'ISSF' ? 'blue' : 'satrf'}>
                        {selectedEvent.source}
                      </Badge>
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

                            {eventUtils.getRegistrationStatus(selectedEvent) === 'open' && isAuthenticated && !isUserRegistered(selectedEvent.id) && (
                              <Button
                                colorScheme="satrf"
                                size="lg"
                                onClick={() => handleEventRegister(selectedEvent)}
                                leftIcon={<FaCheckCircle />}
                              >
                                Register for Event
                              </Button>
                            )}

                            {isUserRegistered(selectedEvent.id) && (
                              <VStack spacing={3}>
                                <Alert status="success">
                                  <AlertIcon />
                                  <Text>You are registered for this event!</Text>
                                </Alert>
                                <Button
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => handleEventUnregister(selectedEvent)}
                                  leftIcon={<FaTimesCircle />}
                                >
                                  Cancel Registration
                                </Button>
                              </VStack>
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
        </VStack>
      </Container>
    </Layout>
  );
};

export default EventsCalendarPage; 