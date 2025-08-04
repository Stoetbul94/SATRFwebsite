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
import { useState, useMemo } from 'react';
import { FaSearch, FaCalendar, FaMapMarkerAlt, FaUsers, FaClock, FaRegCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/firebase/auth';
import { GetServerSideProps } from 'next';

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

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'National Championship 2024',
    description: 'The premier target rifle shooting championship of the year. This three-day event features multiple disciplines and categories, bringing together the best shooters from across the country.',
    date: 'March 15-17, 2024',
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-03-17'),
    location: 'Johannesburg Shooting Range',
    category: 'Senior',
    discipline: 'Target Rifle',
    price: 500,
    maxSpots: 50,
    currentSpots: 35,
    status: 'upcoming',
    registrationDeadline: new Date('2024-03-01'),
    image: '/images/events/national-championship.jpg',
    requirements: ['Valid shooting license', 'Minimum 6 months experience', 'Own equipment'],
    schedule: [
      'Day 1: Registration and Practice (8:00 AM - 5:00 PM)',
      'Day 2: Qualification Rounds (7:00 AM - 6:00 PM)',
      'Day 3: Finals and Awards (8:00 AM - 4:00 PM)'
    ],
    contactInfo: {
      name: 'John Smith',
      email: 'john.smith@satrf.org.za',
      phone: '+27 11 123 4567'
    }
  },
  {
    id: '2',
    title: 'Junior Development Camp',
    description: 'A comprehensive training camp designed specifically for junior shooters. Learn advanced techniques, safety protocols, and competition strategies from experienced coaches.',
    date: 'April 5-7, 2024',
    startDate: new Date('2024-04-05'),
    endDate: new Date('2024-04-07'),
    location: 'Cape Town Range',
    category: 'Junior',
    discipline: 'Target Rifle',
    price: 300,
    maxSpots: 30,
    currentSpots: 30,
    status: 'upcoming',
    registrationDeadline: new Date('2024-03-20'),
    image: '/images/events/junior-camp.jpg',
    requirements: ['Age 12-18 years', 'Parental consent', 'Basic shooting experience'],
    schedule: [
      'Day 1: Safety Training and Basic Skills (9:00 AM - 4:00 PM)',
      'Day 2: Advanced Techniques (8:00 AM - 5:00 PM)',
      'Day 3: Competition Practice (8:00 AM - 3:00 PM)'
    ],
    contactInfo: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@satrf.org.za',
      phone: '+27 21 987 6543'
    }
  },
  {
    id: '3',
    title: 'Regional Qualifier',
    description: 'Regional qualification event for the upcoming national championships. This event determines which shooters will represent their region at the national level.',
    date: 'May 20-21, 2024',
    startDate: new Date('2024-05-20'),
    endDate: new Date('2024-05-21'),
    location: 'Durban Shooting Club',
    category: 'All Categories',
    discipline: 'Target Rifle',
    price: 400,
    maxSpots: 40,
    currentSpots: 25,
    status: 'upcoming',
    registrationDeadline: new Date('2024-05-05'),
    image: '/images/events/regional-qualifier.jpg',
    requirements: ['Valid SATRF membership', 'Previous competition experience', 'Equipment inspection'],
    schedule: [
      'Day 1: Registration and Equipment Check (7:00 AM - 6:00 PM)',
      'Day 2: Competition Rounds (6:00 AM - 5:00 PM)'
    ],
    contactInfo: {
      name: 'Mike Wilson',
      email: 'mike.wilson@satrf.org.za',
      phone: '+27 31 456 7890'
    }
  },
  {
    id: '4',
    title: 'F-Class Championship',
    description: 'Specialized F-Class shooting competition featuring long-range precision shooting. This event tests shooters\' skills at extended distances.',
    date: 'June 10-12, 2024',
    startDate: new Date('2024-06-10'),
    endDate: new Date('2024-06-12'),
    location: 'Pretoria Long Range Facility',
    category: 'Senior',
    discipline: 'F-Class',
    price: 600,
    maxSpots: 35,
    currentSpots: 20,
    status: 'upcoming',
    registrationDeadline: new Date('2024-05-25'),
    image: '/images/events/f-class-championship.jpg',
    requirements: ['F-Class certification', 'Long-range equipment', 'Wind reading experience'],
    schedule: [
      'Day 1: Equipment Setup and Practice (8:00 AM - 5:00 PM)',
      'Day 2: Long Range Competition (7:00 AM - 6:00 PM)',
      'Day 3: Finals and Awards (8:00 AM - 4:00 PM)'
    ],
    contactInfo: {
      name: 'David Brown',
      email: 'david.brown@satrf.org.za',
      phone: '+27 12 345 6789'
    }
  },
  {
    id: '5',
    title: 'Women\'s Shooting Championship',
    description: 'Dedicated championship event celebrating women in target rifle shooting. Open to all female shooters regardless of experience level.',
    date: 'July 8-9, 2024',
    startDate: new Date('2024-07-08'),
    endDate: new Date('2024-07-09'),
    location: 'Port Elizabeth Range',
    category: 'Women',
    discipline: 'Target Rifle',
    price: 350,
    maxSpots: 45,
    currentSpots: 28,
    status: 'upcoming',
    registrationDeadline: new Date('2024-06-20'),
    image: '/images/events/womens-championship.jpg',
    requirements: ['Female shooter', 'Basic shooting experience', 'Safety certification'],
    schedule: [
      'Day 1: Registration and Practice (9:00 AM - 5:00 PM)',
      'Day 2: Competition and Awards (8:00 AM - 4:00 PM)'
    ],
    contactInfo: {
      name: 'Lisa Thompson',
      email: 'lisa.thompson@satrf.org.za',
      phone: '+27 41 234 5678'
    }
  },
  {
    id: '6',
    title: 'Winter Training Series',
    description: 'Monthly training series during winter months to keep skills sharp. Each session focuses on different aspects of target rifle shooting.',
    date: 'August 3, 2024',
    startDate: new Date('2024-08-03'),
    endDate: new Date('2024-08-03'),
    location: 'Bloemfontein Range',
    category: 'All Categories',
    discipline: 'Target Rifle',
    price: 150,
    maxSpots: 25,
    currentSpots: 15,
    status: 'upcoming',
    registrationDeadline: new Date('2024-07-25'),
    image: '/images/events/winter-training.jpg',
    requirements: ['Valid shooting license', 'Own equipment'],
    schedule: [
      'Morning: Theory and Safety (8:00 AM - 10:00 AM)',
      'Afternoon: Practical Training (11:00 AM - 4:00 PM)'
    ],
    contactInfo: {
      name: 'Robert van der Merwe',
      email: 'robert.vdm@satrf.org.za',
      phone: '+27 51 876 5432'
    }
  }
];

// Mock user registrations
const MOCK_USER_REGISTRATIONS: UserRegistration[] = [
  {
    eventId: '1',
    status: 'registered',
    registeredAt: new Date('2024-02-15')
  },
  {
    eventId: '3',
    status: 'registered',
    registeredAt: new Date('2024-04-20')
  }
];

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRegistering, setIsRegistering] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchTerm, statusFilter, categoryFilter]);

  // Check if user is registered for an event
  const isUserRegistered = (eventId: string) => {
    return MOCK_USER_REGISTRATIONS.some(reg => reg.eventId === eventId && reg.status === 'registered');
  };

  // Get registration status for an event
  const getRegistrationStatus = (event: Event) => {
    if (isUserRegistered(event.id)) {
      return 'registered';
    }
    
    if (event.currentSpots >= event.maxSpots) {
      return 'full';
    }
    
    if (new Date() > event.registrationDeadline) {
      return 'closed';
    }
    
    return 'open';
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    onOpen();
  };

  const handleRegister = async (event: Event) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to register for events.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      router.push('/login');
      return;
    }

    setIsRegistering(event.id);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to mock registrations
      MOCK_USER_REGISTRATIONS.push({
        eventId: event.id,
        status: 'registered',
        registeredAt: new Date()
      });
      
      toast({
        title: 'Registration Successful',
        description: `You have been registered for ${event.title}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: 'There was an error processing your registration. Please try again.',
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
            Showing {filteredEvents.length} of {MOCK_EVENTS.length} events
          </Text>

          {/* Events Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredEvents.map((event) => {
              const registrationStatus = getRegistrationStatus(event);
              const isRegistered = isUserRegistered(event.id);
              
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
                  onClick={() => handleEventClick(event)}
                >
                  <VStack align="start" spacing={4}>
                    {/* Event Image Placeholder */}
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
                        colorScheme={registrationStatus === 'registered' ? 'green' : 'blue'}
                        w="100%"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (registrationStatus === 'open') {
                            handleRegister(event);
                          }
                        }}
                        disabled={registrationStatus !== 'open'}
                        isLoading={isRegistering === event.id}
                        loadingText="Registering..."
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
                      colorScheme={getRegistrationStatus(selectedEvent) === 'registered' ? 'green' : 'blue'}
                      size="lg"
                      w="100%"
                      onClick={() => handleRegister(selectedEvent)}
                      disabled={getRegistrationStatus(selectedEvent) !== 'open'}
                      isLoading={isRegistering === selectedEvent.id}
                      loadingText="Registering..."
                    >
                      {getRegistrationBadgeText(getRegistrationStatus(selectedEvent))}
                    </Button>
                    
                    {getRegistrationStatus(selectedEvent) === 'registered' && (
                      <Text fontSize="sm" color="green.500">
                        ✓ You are registered for this event
                      </Text>
                    )}
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