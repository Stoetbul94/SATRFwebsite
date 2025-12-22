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
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                cursor="pointer"
              >
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel fontSize="sm" color="gray.600">
                      {card.label}
                    </StatLabel>
                    <Icon size={20} color={`var(--chakra-colors-${card.color}-500)`} />
                  </HStack>
                  <StatNumber fontSize="2xl" color={`${card.color}.600`}>
                    {card.value.toLocaleString()}
                  </StatNumber>
                </Stat>
              </Box>
            </Link>
          );
        })}
      </Grid>

      {/* Quick Actions */}
      <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor} mb={8}>
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Quick Actions
        </Text>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button
                w="full"
                colorScheme={action.color}
                variant="outline"
                rightIcon={<FiArrowRight />}
                _hover={{ bg: `${action.color}.50` }}
              >
                {action.label}
              </Button>
            </Link>
          ))}
        </Grid>
      </Box>

      {/* Recent Activity Placeholder */}
      <Box bg={cardBg} p={6} borderRadius="lg" border="1px" borderColor={borderColor}>
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Recent Activity
        </Text>
        <Text color="gray.600">
          Recent admin actions and system events will appear here.
        </Text>
        <Link href="/admin/audit">
          <Button mt={4} variant="link" colorScheme="blue">
            View Full Audit Log →
          </Button>
        </Link>
      </Box>
    </AdminLayout>
  );
}


