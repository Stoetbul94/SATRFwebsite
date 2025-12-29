import { Box, Container, Grid, Heading, Text, VStack, HStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FaUserPlus, FaHandHoldingHeart, FaCalendarAlt, FaShoppingCart, FaMedal } from 'react-icons/fa';
import { useEffect, useState } from 'react';

const DashboardSection = () => {
  // All useColorModeValue calls must be at the very top, before any other hooks
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tileTextColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2028-07-14T00:00:00-07:00'); // Los Angeles 2028 Opening Ceremony

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const tiles = [
    {
      title: 'JOIN',
      description: 'Become a member of SATRF',
      icon: FaUserPlus,
      path: '/join',
      color: 'blue.500'
    },
    {
      title: 'DONATE',
      description: 'Support our shooting community',
      icon: FaHandHoldingHeart,
      path: '/donate',
      color: 'green.500'
    },
    {
      title: 'EVENTS',
      description: 'View upcoming competitions',
      icon: FaCalendarAlt,
      path: '/events',
      color: 'purple.500'
    },
    {
      title: 'SHOP',
      description: 'Official SATRF merchandise',
      icon: FaShoppingCart,
      path: '/shop',
      color: 'orange.500'
    },
    {
      title: 'OLYMPIC TEAM',
      description: 'Meet our Olympic athletes',
      icon: FaMedal,
      path: '/olympic-team',
      color: 'red.500'
    }
  ];

  return (
    <Box py={16} bg={sectionBg}>
      <Container maxW="container.xl">
        <VStack spacing={12}>
          {/* Countdown Timer */}
          <VStack spacing={4} textAlign="center">
            <Heading size="lg">Countdown to Los Angeles 2028</Heading>
            <HStack spacing={8}>
              <VStack>
                <Text fontSize="4xl" fontWeight="bold" color="red.500">
                  {timeLeft.days}
                </Text>
                <Text>Days</Text>
              </VStack>
              <VStack>
                <Text fontSize="4xl" fontWeight="bold" color="red.500">
                  {timeLeft.hours}
                </Text>
                <Text>Hours</Text>
              </VStack>
              <VStack>
                <Text fontSize="4xl" fontWeight="bold" color="red.500">
                  {timeLeft.minutes}
                </Text>
                <Text>Minutes</Text>
              </VStack>
              <VStack>
                <Text fontSize="4xl" fontWeight="bold" color="red.500">
                  {timeLeft.seconds}
                </Text>
                <Text>Seconds</Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Navigation Tiles */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={6}
            w="full"
          >
            {tiles.map((tile) => (
              <Box
                key={tile.title}
                bg={bgColor}
                p={6}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                cursor="pointer"
                onClick={() => router.push(tile.path)}
                transition="all 0.3s"
                _hover={{
                  transform: 'translateY(-4px)',
                  shadow: 'lg',
                  borderColor: tile.color
                }}
              >
                <VStack spacing={4} align="start">
                  <Icon as={tile.icon} w={8} h={8} color={tile.color} />
                  <Heading size="md">{tile.title}</Heading>
                  <Text color={tileTextColor}>
                    {tile.description}
                  </Text>
                </VStack>
              </Box>
            ))}
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default DashboardSection; 