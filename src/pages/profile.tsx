import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiEdit3, FiCalendar, FiTarget, FiTrendingUp, FiUser, FiSettings } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { scoresAPI, eventsAPI } from '@/lib/api';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: 'junior' | 'senior' | 'veteran';
  club: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  createdAt: string;
}

interface UserScore {
  id: string;
  eventId: string;
  discipline: string;
  score: number;
  xCount?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  eventTitle?: string;
}

interface UserEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  status: 'open' | 'full' | 'closed';
}

export default function Profile() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentScores, setRecentScores] = useState<UserScore[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UserEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchProfileData = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            id: user.uid,
            firstName: data.firstName,
            lastName: data.lastName,
            email: user.email || '',
            membershipType: data.membershipType,
            club: data.club,
            phone: data.phone,
            address: data.address,
            photoURL: user.photoURL || undefined,
            createdAt: data.createdAt,
          });
        }

        // Fetch recent scores
        try {
          const scoresResponse = await scoresAPI.getMyScores(1, 5);
          setRecentScores(scoresResponse.data);
        } catch (error) {
          console.error('Error fetching scores:', error);
        }

        // Fetch upcoming events (this would need to be implemented in the backend)
        // For now, we'll use a placeholder
        setUpcomingEvents([
          {
            id: '1',
            title: 'Spring Championship 2024',
            date: '2024-03-15',
            location: 'National Range',
            type: 'Competition',
            status: 'open',
          },
          {
            id: '2',
            title: 'Training Camp',
            date: '2024-03-22',
            location: 'Local Club',
            type: 'Training',
            status: 'open',
          },
        ]);

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleViewStatistics = () => {
    router.push('/dashboard');
  };

  const handleAccountManagement = () => {
    router.push('/account');
  };

  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case 'junior':
        return 'green';
      case 'senior':
        return 'blue';
      case 'veteran':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getScoreStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Text>Loading profile...</Text>
        </Container>
      </Layout>
    );
  }

  if (!userProfile) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Text>Profile not found</Text>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          {/* Profile Header */}
          <Card bg={cardBg} mb={8} shadow="lg">
            <CardBody p={8}>
              <Flex direction={{ base: 'column', md: 'row' }} gap={8} align="center">
                <Avatar
                  size="2xl"
                  name={`${userProfile.firstName} ${userProfile.lastName}`}
                  src={userProfile.photoURL}
                  bg="blue.500"
                />
                
                <VStack flex={1} align={{ base: 'center', md: 'flex-start' }} spacing={4}>
                  <VStack align={{ base: 'center', md: 'flex-start' }} spacing={2}>
                    <Heading size="lg">
                      {userProfile.firstName} {userProfile.lastName}
                    </Heading>
                    <Text color="gray.500" fontSize="lg">
                      {userProfile.email}
                    </Text>
                    <HStack spacing={4}>
                      <Badge colorScheme={getMembershipTypeColor(userProfile.membershipType)} size="lg">
                        {userProfile.membershipType.charAt(0).toUpperCase() + userProfile.membershipType.slice(1)} Member
                      </Badge>
                      <Badge colorScheme="blue" variant="outline">
                        {userProfile.club}
                      </Badge>
                    </HStack>
                  </VStack>
                  
                  <HStack spacing={4} wrap="wrap">
                    <Button
                      leftIcon={<FiEdit3 />}
                      colorScheme="blue"
                      onClick={handleEditProfile}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      leftIcon={<FiTrendingUp />}
                      variant="outline"
                      onClick={handleViewStatistics}
                    >
                      My Statistics
                    </Button>
                    <Button
                      leftIcon={<FiSettings />}
                      variant="outline"
                      onClick={handleAccountManagement}
                    >
                      Account Settings
                    </Button>
                  </HStack>
                </VStack>
              </Flex>
            </CardBody>
          </Card>

          {/* Profile Content Tabs */}
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
            <TabList>
              <Tab>
                <HStack>
                  <Icon as={FiUser} />
                  <Text>Overview</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FiTarget} />
                  <Text>Recent Scores</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FiCalendar} />
                  <Text>Upcoming Events</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel p={6}>
                <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
                  <VStack align="stretch" spacing={6}>
                    {/* Personal Information */}
                    <Card bg={cardBg} shadow="md">
                      <CardHeader>
                        <Heading size="md">Personal Information</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Box>
                            <Text fontWeight="bold" color="gray.500">Full Name</Text>
                            <Text>{userProfile.firstName} {userProfile.lastName}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" color="gray.500">Email</Text>
                            <Text>{userProfile.email}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" color="gray.500">Membership Type</Text>
                            <Text>{userProfile.membershipType.charAt(0).toUpperCase() + userProfile.membershipType.slice(1)}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" color="gray.500">Club</Text>
                            <Text>{userProfile.club}</Text>
                          </Box>
                          {userProfile.phone && (
                            <Box>
                              <Text fontWeight="bold" color="gray.500">Phone</Text>
                              <Text>{userProfile.phone}</Text>
                            </Box>
                          )}
                          {userProfile.address && (
                            <Box>
                              <Text fontWeight="bold" color="gray.500">Address</Text>
                              <Text>{userProfile.address}</Text>
                            </Box>
                          )}
                        </SimpleGrid>
                      </CardBody>
                    </Card>

                    {/* Quick Stats */}
                    <Card bg={cardBg} shadow="md">
                      <CardHeader>
                        <Heading size="md">Quick Statistics</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                          <VStack>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                              {recentScores.length}
                            </Text>
                            <Text fontSize="sm" color="gray.500">Recent Scores</Text>
                          </VStack>
                          <VStack>
                            <Text fontSize="2xl" fontWeight="bold" color="green.500">
                              {upcomingEvents.length}
                            </Text>
                            <Text fontSize="sm" color="gray.500">Upcoming Events</Text>
                          </VStack>
                          <VStack>
                            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                              {recentScores.filter(s => s.status === 'approved').length}
                            </Text>
                            <Text fontSize="sm" color="gray.500">Approved Scores</Text>
                          </VStack>
                          <VStack>
                            <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                              {userProfile.membershipType}
                            </Text>
                            <Text fontSize="sm" color="gray.500">Member Since</Text>
                          </VStack>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  </VStack>

                  {/* Quick Actions */}
                  <VStack align="stretch" spacing={6}>
                    <Card bg={cardBg} shadow="md">
                      <CardHeader>
                        <Heading size="md">Quick Actions</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4}>
                          <Button
                            leftIcon={<FiTarget />}
                            colorScheme="blue"
                            size="lg"
                            width="full"
                            onClick={() => router.push('/scores/upload')}
                          >
                            Upload Score
                          </Button>
                          <Button
                            leftIcon={<FiCalendar />}
                            colorScheme="green"
                            size="lg"
                            width="full"
                            onClick={() => router.push('/events')}
                          >
                            Register for Event
                          </Button>
                          <Button
                            leftIcon={<FiTrendingUp />}
                            variant="outline"
                            size="lg"
                            width="full"
                            onClick={() => router.push('/scores/leaderboard')}
                          >
                            View Leaderboard
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </Grid>
              </TabPanel>

              {/* Recent Scores Tab */}
              <TabPanel p={6}>
                <Card bg={cardBg} shadow="md">
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Recent Scores</Heading>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => router.push('/scores')}
                      >
                        View All
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {recentScores.length === 0 ? (
                      <VStack py={8} spacing={4}>
                        <Text color="gray.500">No scores uploaded yet</Text>
                        <Button
                          colorScheme="blue"
                          onClick={() => router.push('/scores/upload')}
                        >
                          Upload Your First Score
                        </Button>
                      </VStack>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {recentScores.map((score) => (
                          <Box
                            key={score.id}
                            p={4}
                            border="1px"
                            borderColor={borderColor}
                            borderRadius="md"
                          >
                            <Flex justify="space-between" align="center">
                              <VStack align="flex-start" spacing={1}>
                                <Text fontWeight="bold">
                                  {score.eventTitle || `Event ${score.eventId}`}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {score.discipline} • {new Date(score.createdAt).toLocaleDateString()}
                                </Text>
                              </VStack>
                              <HStack spacing={4}>
                                <VStack align="center" spacing={0}>
                                  <Text fontSize="lg" fontWeight="bold">
                                    {score.score}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">Score</Text>
                                </VStack>
                                {score.xCount && (
                                  <VStack align="center" spacing={0}>
                                    <Text fontSize="lg" fontWeight="bold" color="green.500">
                                      {score.xCount}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">X Count</Text>
                                  </VStack>
                                )}
                                <Badge colorScheme={getScoreStatusColor(score.status)}>
                                  {score.status}
                                </Badge>
                              </HStack>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Upcoming Events Tab */}
              <TabPanel p={6}>
                <Card bg={cardBg} shadow="md">
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Upcoming Events</Heading>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => router.push('/events')}
                      >
                        View All
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {upcomingEvents.length === 0 ? (
                      <VStack py={8} spacing={4}>
                        <Text color="gray.500">No upcoming events registered</Text>
                        <Button
                          colorScheme="blue"
                          onClick={() => router.push('/events')}
                        >
                          Browse Events
                        </Button>
                      </VStack>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {upcomingEvents.map((event) => (
                          <Box
                            key={event.id}
                            p={4}
                            border="1px"
                            borderColor={borderColor}
                            borderRadius="md"
                          >
                            <Flex justify="space-between" align="center">
                              <VStack align="flex-start" spacing={1}>
                                <Text fontWeight="bold">{event.title}</Text>
                                <Text fontSize="sm" color="gray.500">
                                  {event.type} • {event.location}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {new Date(event.date).toLocaleDateString()}
                                </Text>
                              </VStack>
                              <Badge colorScheme={event.status === 'open' ? 'green' : 'red'}>
                                {event.status}
                              </Badge>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </Layout>
  );
} 