import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Box, 
  Grid, 
  GridItem, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FiTarget, FiCalendar, FiUsers, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  totalScores: number;
  totalEvents: number;
  pendingScores: number;
  recentActivity: number;
}

export default function AdminDashboard() {
  useProtectedRoute();
  const { isAdmin, isLoading } = useAdminRoute();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) return;

        // Fetch stats from API
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Fallback stats if API fails
          setStats({
            totalUsers: 0,
            totalScores: 0,
            totalEvents: 0,
            pendingScores: 0,
            recentActivity: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        // Fallback stats
        setStats({
          totalUsers: 0,
          totalScores: 0,
          totalEvents: 0,
          pendingScores: 0,
          recentActivity: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      color: 'blue',
      href: '/admin/users',
    },
    {
      label: 'Total Scores',
      value: stats?.totalScores || 0,
      icon: FiTarget,
      color: 'green',
      href: '/admin/scores',
    },
    {
      label: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: FiCalendar,
      color: 'purple',
      href: '/admin/events',
    },
    {
      label: 'Pending Scores',
      value: stats?.pendingScores || 0,
      icon: FiTrendingUp,
      color: 'orange',
      href: '/admin/scores?status=pending',
    },
  ];

  const quickActions = [
    { label: 'Import Scores', href: '/admin/scores/import', color: 'blue' },
    { label: 'Create Event', href: '/admin/events?action=create', color: 'green' },
    { label: 'Manage Users', href: '/admin/users', color: 'purple' },
    { label: 'View Audit Log', href: '/admin/audit', color: 'gray' },
  ];

  return (
    <AdminLayout title="Admin Dashboard" description="Overview of system statistics and quick actions">
      <Head>
        <title>Admin Dashboard - SATRF</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Welcome Section */}
      <Box mb={8}>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={2}>
          Welcome to the Admin Dashboard
        </Text>
        <Text fontSize="md" color="gray.600">
          Manage users, scores, events, and system administration
        </Text>
      </Box>

      {/* Stats Grid */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={8}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Box
                bg={cardBg}
                p={6}
                borderRadius="lg"
                border="1px"
                borderColor={borderColor}
                _hover={{ shadow: 'lg', transform: 'translateY(-2px)', borderColor: `${card.color}.300` }}
                transition="all 0.2s"
                cursor="pointer"
                height="100%"
              >
                <Stat>
                  <HStack justify="space-between" mb={3}>
                    <StatLabel fontSize="sm" fontWeight="medium" color="gray.600" textTransform="uppercase" letterSpacing="wide">
                      {card.label}
                    </StatLabel>
                    <Box
                      p={2}
                      borderRadius="md"
                      bg={`${card.color}.50`}
                      color={`${card.color}.600`}
                    >
                      <Icon size={20} />
                    </Box>
                  </HStack>
                  <StatNumber fontSize="3xl" fontWeight="bold" color={`${card.color}.600`} mb={1}>
                    {card.value.toLocaleString()}
                  </StatNumber>
                  <StatHelpText fontSize="xs" color="gray.500" mb={0}>
                    Click to view details
                  </StatHelpText>
                </Stat>
              </Box>
            </Link>
          );
        })}
      </Grid>

      {/* Quick Actions Section */}
      <Box bg={cardBg} p={8} borderRadius="lg" border="1px" borderColor={borderColor} mb={8}>
        <VStack align="stretch" spacing={6}>
          <Box>
            <Text fontSize="xl" fontWeight="semibold" color="gray.800" mb={2}>
              Quick Actions
            </Text>
            <Text fontSize="sm" color="gray.600">
              Common administrative tasks and shortcuts
            </Text>
          </Box>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button
                  w="full"
                  colorScheme={action.color}
                  variant="outline"
                  size="lg"
                  rightIcon={<FiArrowRight />}
                  _hover={{ bg: `${action.color}.50`, borderColor: `${action.color}.400`, transform: 'translateX(4px)' }}
                  transition="all 0.2s"
                  justifyContent="space-between"
                >
                  {action.label}
                </Button>
              </Link>
            ))}
          </Grid>
        </VStack>
      </Box>

      {/* Recent Activity Section */}
      <Box bg={cardBg} p={8} borderRadius="lg" border="1px" borderColor={borderColor}>
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="xl" fontWeight="semibold" color="gray.800" mb={2}>
              Recent Activity
            </Text>
            <Text fontSize="sm" color="gray.600">
              Monitor system events and admin actions
            </Text>
          </Box>
          <Box
            p={6}
            bg="gray.50"
            borderRadius="md"
            border="1px dashed"
            borderColor="gray.300"
          >
            <Text color="gray.600" fontSize="sm" textAlign="center">
              Recent admin actions and system events will appear here.
            </Text>
          </Box>
          <Link href="/admin/audit">
            <Button 
              variant="link" 
              colorScheme="blue" 
              size="sm"
              _hover={{ textDecoration: 'underline' }}
            >
              View Full Audit Log →
            </Button>
          </Link>
        </VStack>
      </Box>
    </AdminLayout>
  );
}


