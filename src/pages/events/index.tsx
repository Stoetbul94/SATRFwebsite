import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  useToast,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  Divider,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useState, useMemo, useEffect } from 'react';
import { FaSearch, FaCalendar, FaMapMarkerAlt, FaUsers, FaClock, FaRegCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI } from '@/lib/api';
import Head from 'next/head';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startDate: Date;
  endDate: Date;
  location: string;
  category: string;
  discipline: string;
  price: number;
  maxSpots: number;
  currentSpots: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline: Date;
  image?: string;
  requirements?: string[];
  schedule?: string[];
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface UserRegistration {
  eventId: string;
  status: 'registered' | 'waitlist' | 'cancelled';
  registeredAt: Date;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRegistering, setIsRegistering] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (categoryFilter !== 'all') filters.type = categoryFilter;
      
      const eventsData = await eventsAPI.getAll(filters);
      
      // Transform API response to match our Event interface
      const transformedEvents: Event[] = Array.isArray(eventsData) 
        ? eventsData.map((e: any) => ({
            id: e.id,
            title: e.title || e.name,
            description: e.description || '',
            date: e.date || e.startDate,
            startDate: new Date(e.startDate || e.date),
            endDate: new Date(e.endDate || e.date),
            location: e.location || '',
            category: e.category || e.type || 'All Categories',
            discipline: e.discipline || e.type || 'Target Rifle',
            price: e.price || 0,
            maxSpots: e.maxParticipants || e.maxSpots || 0,
            currentSpots: e.currentParticipants || e.currentSpots || 0,
            status: e.status || 'upcoming',
            registrationDeadline: new Date(e.registrationDeadline || e.deadline || e.date),
            image: e.image || e.imageUrl,
            requirements: e.requirements || [],
            schedule: e.schedule || [],
            contactInfo: e.contactInfo,
          }))
        : [];
      
      setEvents(transformedEvents);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
      // Fallback to empty array on error
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [events, searchTerm, statusFilter, categoryFilter]);

  // Re-fetch events when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchEvents();
    }
  }, [statusFilter, categoryFilter]);

  // Get registration status for an event
  const getRegistrationStatus = (event: Event) => {
    if (event.currentSpots >= event.maxSpots) {
      return 'full';
    }
    
    if (new Date() > event.registrationDeadline) {
      return 'closed';
    }
    
    return 'open';
  };

  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  const handleRegister = async (event: Event) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to register for events.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setIsRegistering(event.id);
    
    try {
      await eventsAPI.register(event.id);
      
      toast({
        title: 'Registration Successful',
        description: `You have been registered for ${event.title}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh events to update spots
      await fetchEvents();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'There was an error processing your registration. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRegistering(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'blue';
      case 'ongoing': return 'green';
      case 'completed': return 'gray';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getRegistrationBadgeColor = (status: string) => {
    switch (status) {
      case 'registered': return 'green';
      case 'full': return 'red';
      case 'closed': return 'gray';
      case 'open': return 'blue';
      default: return 'gray';
    }
  };

  const getRegistrationBadgeText = (status: string) => {
    switch (status) {
      case 'registered': return 'Registered';
      case 'full': return 'Full';
      case 'closed': return 'Closed';
      case 'open': return 'Register Now';
      default: return 'Unknown';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <Head>
        <title>Events & Competitions - SATRF</title>
        <meta name="description" content="Discover and register for upcoming shooting events and competitions organized by the South African Target Rifle Federation." />
        <meta property="og:title" content="Events & Competitions - SATRF" />
        <meta property="og:description" content="Discover and register for upcoming shooting events and competitions." />
        <meta property="og:type" content="website" />
      </Head>
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          {/* Header */}
          <Box>
            <Heading size="xl" mb={2} color="satrf.navy">
              Events & Competitions
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
              Discover and register for upcoming shooting events and competitions
            </Text>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Error loading events</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color={useColorModeValue('gray.600', 'gray.400')}>
                Loading events...
              </Text>
            </Box>
          )}

          {/* Search and Filters */}
          <Box
            bg={useColorModeValue('white', 'gray.700')}
            p={6}
            rounded="lg"
            shadow="md"
            borderWidth="1px"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
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
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </GridItem>
              
              <GridItem>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Filter by category"
                >
                  <option value="all">All Categories</option>
                  <option value="Senior">Senior</option>
                  <option value="Junior">Junior</option>
                  <option value="Women">Women</option>
                  <option value="All Categories">All Categories</option>
                </Select>
              </GridItem>
            </Grid>
          </Box>

          {/* Results Count */}
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Showing {filteredEvents.length} of {events.length} events
          </Text>

          {/* Events Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredEvents.map((event) => {
              const registrationStatus = getRegistrationStatus(event);
              
              return (
                <Box
                  key={event.id}
                  bg={useColorModeValue('white', 'gray.700')}
                  p={6}
                  rounded="lg"
                  shadow="md"
                  borderWidth="1px"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                  _hover={{
                    shadow: 'lg',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }}
                  cursor="pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <VStack align="start" spacing={4}>
                    {/* Event Image */}
                    {event.image ? (
                      <Box
                        w="100%"
                        h="200px"
                        bg={useColorModeValue('gray.100', 'gray.600')}
                        rounded="md"
                        overflow="hidden"
                        position="relative"
                      >
                        <img
                          src={event.image}
                          alt={event.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    ) : (
                      <Box
                        w="100%"
                        h="200px"
                        bg={useColorModeValue('gray.100', 'gray.600')}
                        rounded="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color={useColorModeValue('gray.500', 'gray.400')}>
                          Event Image
                        </Text>
                      </Box>
                    )}

                    {/* Event Title and Badges */}
                    <VStack align="start" spacing={2} w="100%">
                      <Heading size="md" color="satrf.navy">
                        {event.title}
                      </Heading>
                      <HStack spacing={2} flexWrap="wrap">
                        <Badge colorScheme={getStatusBadgeColor(event.status)}>
                          {event.status}
                        </Badge>
                        <Badge colorScheme="blue">{event.category}</Badge>
                        <Badge colorScheme="purple">{event.discipline}</Badge>
                      </HStack>
                    </VStack>

                    {/* Event Details */}
                    <Stack spacing={2} w="100%">
                      <HStack spacing={2}>
                        <FaRegCalendarAlt color="#4a5568" />
                        <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                          {event.date}
                        </Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <FaMapMarkerAlt color="#4a5568" />
                        <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                          {event.location}
                        </Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <FaUsers color="#4a5568" />
                        <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                          {event.currentSpots}/{event.maxSpots} spots filled
                        </Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <FaClock color="#4a5568" />
                        <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                          Registration closes: {formatDate(event.registrationDeadline)}
                        </Text>
                      </HStack>
                    </Stack>

                    {/* Price and Registration */}
                    <VStack spacing={3} w="100%">
                      <Text
                        color={useColorModeValue('gray.800', 'white')}
                        fontWeight="bold"
                        fontSize="lg"
                      >
                        Entry Fee: R{event.price}
                      </Text>
                      
                      <Button
                        colorScheme={registrationStatus === 'open' ? 'blue' : 'gray'}
                        w="100%"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (registrationStatus === 'open') {
                            router.push(`/events/${event.id}`);
                          }
                        }}
                        disabled={registrationStatus !== 'open'}
                      >
                        {getRegistrationBadgeText(registrationStatus)}
                      </Button>
                    </VStack>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>

          {/* No Results */}
          {filteredEvents.length === 0 && (
            <Alert status="info">
              <AlertIcon />
              <AlertTitle>No events found!</AlertTitle>
              <AlertDescription>
                Try adjusting your search terms or filters to find events.
              </AlertDescription>
            </Alert>
          )}
        </Stack>

        {/* Event Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? 'full' : 'xl'}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader color="satrf.navy">
              {selectedEvent?.title}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedEvent && (
                <VStack spacing={6} align="start">
                  {/* Event Image */}
                  <Box
                    w="100%"
                    h="300px"
                    bg={useColorModeValue('gray.100', 'gray.600')}
                    rounded="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color={useColorModeValue('gray.500', 'gray.400')}>
                      Event Image
                    </Text>
                  </Box>

                  {/* Status Badges */}
                  <HStack spacing={2}>
                    <Badge colorScheme={getStatusBadgeColor(selectedEvent.status)}>
                      {selectedEvent.status}
                    </Badge>
                    <Badge colorScheme="blue">{selectedEvent.category}</Badge>
                    <Badge colorScheme="purple">{selectedEvent.discipline}</Badge>
                  </HStack>

                  {/* Description */}
                  <Box>
                    <Heading size="md" mb={3} color="satrf.navy">
                      Description
                    </Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                      {selectedEvent.description}
                    </Text>
                  </Box>

                  {/* Event Details */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
                    <VStack align="start" spacing={3}>
                      <Heading size="sm" color="satrf.navy">
                        Event Information
                      </Heading>
                      
                      <HStack spacing={2}>
                        <FaRegCalendarAlt color="#4a5568" />
                        <Text fontSize="sm">
                          <strong>Date:</strong> {selectedEvent.date}
                        </Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <FaMapMarkerAlt color="#4a5568" />
                        <Text fontSize="sm">
                          <strong>Location:</strong> {selectedEvent.location}
                        </Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <FaUsers color="#4a5568" />
                        <Text fontSize="sm">
                          <strong>Capacity:</strong> {selectedEvent.currentSpots}/{selectedEvent.maxSpots} spots
                        </Text>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <FaClock color="#4a5568" />
                        <Text fontSize="sm">
                          <strong>Registration Deadline:</strong> {formatDate(selectedEvent.registrationDeadline)}
                        </Text>
                      </HStack>
                      
                      <Text fontSize="sm">
                        <strong>Entry Fee:</strong> R{selectedEvent.price}
                      </Text>
                    </VStack>

                    <VStack align="start" spacing={3}>
                      <Heading size="sm" color="satrf.navy">
                        Requirements
                      </Heading>
                      <VStack align="start" spacing={1}>
                        {selectedEvent.requirements?.map((req, index) => (
                          <Text key={index} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                            • {req}
                          </Text>
                        ))}
                      </VStack>
                    </VStack>
                  </SimpleGrid>

                  {/* Schedule */}
                  {selectedEvent.schedule && (
                    <Box w="100%">
                      <Heading size="sm" mb={3} color="satrf.navy">
                        Schedule
                      </Heading>
                      <VStack align="start" spacing={2}>
                        {selectedEvent.schedule.map((item, index) => (
                          <Text key={index} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                            {item}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {/* Contact Information */}
                  {selectedEvent.contactInfo && (
                    <Box w="100%">
                      <Heading size="sm" mb={3} color="satrf.navy">
                        Contact Information
                      </Heading>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm">
                          <strong>Contact:</strong> {selectedEvent.contactInfo.name}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Email:</strong> {selectedEvent.contactInfo.email}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Phone:</strong> {selectedEvent.contactInfo.phone}
                        </Text>
                      </VStack>
                    </Box>
                  )}

                  <Divider />

                  {/* Registration Action */}
                  <VStack spacing={4} w="100%">
                    <Text fontSize="lg" fontWeight="bold" color="satrf.navy">
                      Entry Fee: R{selectedEvent.price}
                    </Text>
                    
                    <Button
                      colorScheme={getRegistrationStatus(selectedEvent) === 'open' ? 'blue' : 'gray'}
                      size="lg"
                      w="100%"
                      onClick={() => handleRegister(selectedEvent)}
                      disabled={getRegistrationStatus(selectedEvent) !== 'open'}
                      isLoading={isRegistering === selectedEvent.id}
                      loadingText="Registering..."
                    >
                      {getRegistrationBadgeText(getRegistrationStatus(selectedEvent))}
                    </Button>
                  </VStack>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
}

// Make this page server-side rendered to avoid useAuth issues during static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
}; 