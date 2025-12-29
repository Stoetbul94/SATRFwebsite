import { Box, Container, Heading, SimpleGrid, Text, VStack, Badge, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const events = [
  {
    id: 1,
    title: 'National Championships 2024',
    date: 'March 15-20, 2024',
    location: 'Pretoria Shooting Range',
    discipline: '50m Rifle 3 Positions',
    status: 'Upcoming'
  },
  {
    id: 2,
    title: 'Regional Qualifier',
    date: 'April 5-7, 2024',
    location: 'Cape Town Shooting Club',
    discipline: 'F-Class Open',
    status: 'Registration Open'
  },
  {
    id: 3,
    title: 'Youth Development Camp',
    date: 'May 1-3, 2024',
    location: 'Durban Shooting Academy',
    discipline: '50m Rifle Prone',
    status: 'Early Bird'
  }
];

const EventHighlights = () => {
  // All useColorModeValue calls must be at the very top, before any other hooks
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const eventTextColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  const headerTextColor = useColorModeValue('gray.600', 'gray.400');
  
  const router = useRouter();

  return (
    <Box py={16} bg={sectionBg}>
      <Container maxW="container.xl">
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center">
            <Heading size="xl">Upcoming Events</Heading>
            <Text fontSize="lg" color={headerTextColor}>
              Join us at these exciting competitions and training sessions
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
            {events.map((event) => (
              <Box
                key={event.id}
                bg={bgColor}
                p={6}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                cursor="pointer"
                onClick={() => router.push(`/events/${event.id}`)}
                transition="all 0.3s"
                _hover={{
                  transform: 'translateY(-4px)',
                  shadow: 'lg',
                  borderColor: 'red.500'
                }}
              >
                <VStack align="start" spacing={4}>
                  <Badge
                    colorScheme={
                      event.status === 'Upcoming'
                        ? 'blue'
                        : event.status === 'Registration Open'
                        ? 'green'
                        : 'orange'
                    }
                  >
                    {event.status}
                  </Badge>
                  <Heading size="md">{event.title}</Heading>
                  <VStack align="start" spacing={2} w="full">
                    <Text color={eventTextColor}>
                      📅 {event.date}
                    </Text>
                    <Text color={eventTextColor}>
                      📍 {event.location}
                    </Text>
                    <Text color={eventTextColor}>
                      🎯 {event.discipline}
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default EventHighlights; 