import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useColorModeValue,
  SimpleGrid,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  Image,
  useToast,
} from '@chakra-ui/react';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaClock, FaRegCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { eventsAPI } from '@/lib/api';

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
  payfastUrl?: string | null;
  eftInstructions?: string | null;
  requirements?: string[];
  schedule?: string[];
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  latitude?: number;
  longitude?: number;
}

export default function EventDetail() {
  // All useColorModeValue calls must be at the very top, before any other hooks
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColorMuted = useColorModeValue('gray.500', 'gray.500');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgLight = useColorModeValue('gray.50', 'gray.800');
  const textColorLight = useColorModeValue('gray.700', 'gray.200');
  
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const eventData = await eventsAPI.getById(eventId);
      
      // Transform API response to match our Event interface
      const transformedEvent: Event = {
        id: eventData.id,
        title: eventData.title || eventData.name,
        description: eventData.description || '',
        date: eventData.date || eventData.startDate,
        startDate: new Date(eventData.startDate || eventData.date),
        endDate: new Date(eventData.endDate || eventData.date),
        location: eventData.location || '',
        category: eventData.category || eventData.type || 'All Categories',
        discipline: eventData.discipline || eventData.type || 'Target Rifle',
        price: eventData.price || 0,
        maxSpots: eventData.maxParticipants || eventData.maxSpots || 0,
        currentSpots: eventData.currentParticipants || eventData.currentSpots || 0,
        status: eventData.status || 'upcoming',
        registrationDeadline: new Date(eventData.registrationDeadline || eventData.deadline || eventData.date),
        image: eventData.image || eventData.imageUrl || eventData.imageURL || null,
        payfastUrl: eventData.payfastUrl || null,
        eftInstructions: eventData.eftInstructions || null,
        requirements: eventData.requirements || [],
        schedule: eventData.schedule || [],
        contactInfo: eventData.contactInfo,
        latitude: eventData.latitude || eventData.lat,
        longitude: eventData.longitude || eventData.lng,
      };
      
      setEvent(transformedEvent);
    } catch (err: any) {
      console.error('Error fetching event:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
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

    if (!event || !id || typeof id !== 'string') return;

    setIsRegistering(true);
    try {
      await eventsAPI.register(id);
      toast({
        title: 'Registration Successful',
        description: `You have been registered for ${event.title}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Refresh event data to update spots
      fetchEvent(id);
    } catch (err: any) {
      toast({
        title: 'Registration Failed',
        description: err.message || 'There was an error processing your registration. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRegistering(false);
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

  const getRegistrationStatus = () => {
    if (!event) return 'closed';
    if (event.currentSpots >= event.maxSpots) return 'full';
    if (new Date() > event.registrationDeadline) return 'closed';
    return 'open';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Loading Event - SATRF</title>
        </Head>
        <Container maxW="container.xl" py={8}>
          <Box textAlign="center" py={12}>
            <Spinner size="xl" color="blue.500" />
            <Text mt={4} color={textColorSecondary}>
              Loading event details...
            </Text>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout>
        <Head>
          <title>Event Not Found - SATRF</title>
        </Head>
        <Container maxW="container.xl" py={8}>
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertIcon />
              <Text>{error || 'Event not found'}</Text>
            </Box>
          </Alert>
          <Button mt={4} onClick={() => router.push('/events')}>
            Back to Events
          </Button>
        </Container>
      </Layout>
    );
  }

  const registrationStatus = getRegistrationStatus();
  const canRegister = registrationStatus === 'open' && isAuthenticated;

  return (
    <Layout>
      <Head>
        <title>{event.title} - SATRF Events</title>
        <meta name="description" content={event.description.substring(0, 160)} />
        <meta property="og:title" content={`${event.title} - SATRF Events`} />
        <meta property="og:description" content={event.description.substring(0, 160)} />
        <meta property="og:type" content="website" />
        {event.image && <meta property="og:image" content={event.image} />}
      </Head>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/events')}
            alignSelf="flex-start"
          >
            ← Back to Events
          </Button>

          {/* Event Image */}
          {event.image && (
            <Box
              w="100%"
              h="400px"
              borderRadius="lg"
              overflow="hidden"
              position="relative"
            >
              <Image
                src={event.image}
                alt={event.title}
                objectFit="cover"
                w="100%"
                h="100%"
              />
            </Box>
          )}

          {/* Event Header */}
          <Box>
            <HStack spacing={4} mb={4} flexWrap="wrap">
              <Badge colorScheme={getStatusBadgeColor(event.status)} fontSize="md" px={3} py={1}>
                {event.status}
              </Badge>
              <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                {event.category}
              </Badge>
              <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                {event.discipline}
              </Badge>
            </HStack>
            <Heading size="2xl" mb={4} color="satrf.navy">
              {event.title}
            </Heading>
            <Text fontSize="lg" color={textColorSecondary}>
              {event.description}
            </Text>
          </Box>

          {/* Event Details Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <VStack align="start" spacing={4} bg={cardBg} p={6} borderRadius="lg" shadow="md">
              <Heading size="md" color="satrf.navy">
                Event Information
              </Heading>
              
              <HStack spacing={2}>
                <FaRegCalendarAlt color="#4a5568" />
                <Text fontSize="sm">
                  <strong>Date:</strong> {formatDate(event.startDate)}
                  {event.endDate && event.startDate.getTime() !== event.endDate.getTime() && 
                    ` - ${formatDate(event.endDate)}`}
                </Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaMapMarkerAlt color="#4a5568" />
                <Text fontSize="sm">
                  <strong>Location:</strong> {event.location}
                </Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaUsers color="#4a5568" />
                <Text fontSize="sm">
                  <strong>Capacity:</strong> {event.currentSpots}/{event.maxSpots} spots
                </Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaClock color="#4a5568" />
                <Text fontSize="sm">
                  <strong>Registration Deadline:</strong> {formatDate(event.registrationDeadline)}
                </Text>
              </HStack>
              
              <Text fontSize="sm">
                <strong>Entry Fee:</strong> R{event.price}
              </Text>

              {/* Google Map if coordinates available */}
              {event.latitude && event.longitude && (
                <Box w="100%" mt={4}>
                  <iframe
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: '8px' }}
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${event.latitude},${event.longitude}`}
                    allowFullScreen
                  />
                </Box>
              )}
            </VStack>

            <VStack align="start" spacing={4} bg={cardBg} p={6} borderRadius="lg" shadow="md">
              <Heading size="md" color="satrf.navy">
                Requirements
              </Heading>
              {event.requirements && event.requirements.length > 0 ? (
                <VStack align="start" spacing={1}>
                  {event.requirements.map((req, index) => (
                    <Text key={index} fontSize="sm" color={textColorSecondary}>
                      • {req}
                    </Text>
                  ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color={textColorMuted}>
                  No specific requirements listed.
                </Text>
              )}
            </VStack>
          </SimpleGrid>

          {/* Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
              <Heading size="md" mb={4} color="satrf.navy">
                Schedule
              </Heading>
              <VStack align="start" spacing={2}>
                {event.schedule.map((item, index) => (
                  <Text key={index} fontSize="sm" color={textColorSecondary}>
                    {item}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}

          {/* Contact Information */}
          {event.contactInfo && (
            <Box bg={cardBg} p={6} borderRadius="lg" shadow="md">
              <Heading size="md" mb={4} color="satrf.navy">
                Contact Information
              </Heading>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm">
                  <strong>Contact:</strong> {event.contactInfo.name}
                </Text>
                <Text fontSize="sm">
                  <strong>Email:</strong> {event.contactInfo.email}
                </Text>
                <Text fontSize="sm">
                  <strong>Phone:</strong> {event.contactInfo.phone}
                </Text>
              </VStack>
            </Box>
          )}

          <Divider />

          {/* Registration Action */}
          <VStack spacing={4} w="100%">
            <Text fontSize="lg" fontWeight="bold" color="satrf.navy">
              Entry Fee: R{event.price}
            </Text>
            
            <Button
              colorScheme={registrationStatus === 'open' ? 'blue' : 'gray'}
              size="lg"
              w="100%"
              onClick={handleRegister}
              disabled={!canRegister}
              isLoading={isRegistering}
              loadingText="Registering..."
            >
              {registrationStatus === 'open' 
                ? (isAuthenticated ? 'Register Now' : 'Login to Register')
                : registrationStatus === 'full'
                ? 'Event Full'
                : 'Registration Closed'}
            </Button>
            
            {registrationStatus === 'open' && !isAuthenticated && (
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Please log in to register for this event
              </Text>
            )}

          {event.payfastUrl && (
            <Button
              as="a"
              href={event.payfastUrl}
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="pink"
              variant="outline"
              w="100%"
            >
              Pay with PayFast
            </Button>
          )}

          {event.eftInstructions && (
            <Box
              w="100%"
              p={4}
              border="1px"
              borderColor={borderColor}
              rounded="md"
              bg={bgLight}
            >
              <Text fontWeight="semibold" mb={1}>EFT Payment Instructions</Text>
              <Text fontSize="sm" color={textColorLight}>
                {event.eftInstructions}
              </Text>
            </Box>
          )}
          </VStack>
        </VStack>
      </Container>
    </Layout>
  );
}


