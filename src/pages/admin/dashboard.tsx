import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  HStack,
  Button,
  Text,
  Icon,
} from '@chakra-ui/react';
import { FiTarget, FiCalendar, FiUsers, FiUserCheck, FiArrowRight } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminLoadingPanel from '@/components/admin/AdminLoadingPanel';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

interface DashboardStats {
  totalUsers: number;
  totalScores: number;
  totalEvents: number;
  pendingMembers: number;
  recentActivity: number;
}

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export default function AdminDashboard() {
  useProtectedRoute();
  const { isAdmin, isLoading } = useAdminRoute();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setStats(await response.json());
        } else {
          setStats({ totalUsers: 0, totalScores: 0, totalEvents: 0, pendingMembers: 0, recentActivity: 0 });
        }
      } catch {
        setStats({ totalUsers: 0, totalScores: 0, totalEvents: 0, pendingMembers: 0, recentActivity: 0 });
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <AdminLoadingPanel label="Loading statistics…" />
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  const statCards = [
    { label: 'Pending Members', value: stats?.pendingMembers || 0, icon: FiUserCheck, accent: 'satrf.gold.600', href: '/admin/users' },
    { label: 'Total Members', value: stats?.totalUsers || 0, icon: FiUsers, accent: 'brand', href: '/admin/users' },
    { label: 'Total Scores', value: stats?.totalScores || 0, icon: FiTarget, accent: 'satrf.green.600', href: '/admin/scores' },
    { label: 'Total Events', value: stats?.totalEvents || 0, icon: FiCalendar, accent: 'satrf.green.700', href: '/admin/events' },
  ];

  const quickActions = [
    { label: 'Approve Members', href: '/admin/users', variant: 'satrfGold' as const },
    { label: 'Import Scores', href: '/admin/scores/import', variant: 'satrfOutline' as const },
    { label: 'Manage Scores', href: '/admin/scores', variant: 'satrfOutline' as const },
    { label: 'Create Event', href: '/admin/events', variant: 'satrf' as const },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>Statistics - SATRF Admin</title>
      </Head>

      <AdminPageHeader
        title="Statistics"
        subtitle="Overview of members, scores, and events"
      />

      <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} mb={8}>
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Box
              bg="bg.surface"
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="border.default"
              boxShadow="sm"
              _hover={{ borderColor: 'satrf.green.300', boxShadow: 'md' }}
              transition="box-shadow 0.15s ease, border-color 0.15s ease"
              cursor="pointer"
              h="100%"
            >
              <Stat>
                <HStack justify="space-between" mb={2}>
                  <StatLabel fontSize="xs" color="text.muted" textTransform="uppercase" letterSpacing="wider">
                    {card.label}
                  </StatLabel>
                  <Box p={2} borderRadius="md" bg="satrf.green.50" color={card.accent}>
                    <Icon as={card.icon} boxSize={4} />
                  </Box>
                </HStack>
                <StatNumber fontSize="2xl" fontWeight="bold" color="text.primary">
                  {card.value.toLocaleString()}
                </StatNumber>
                <StatHelpText fontSize="xs" color="text.muted" mb={0}>
                  View details →
                </StatHelpText>
              </Stat>
            </Box>
          </Link>
        ))}
      </Grid>

      <Box bg="bg.surface" p={6} borderRadius="lg" borderWidth="1px" borderColor="border.default" boxShadow="sm" mb={6}>
        <Text fontSize="md" fontWeight="semibold" fontFamily="heading" mb={1}>
          Quick Actions
        </Text>
        <Text fontSize="sm" color="text.muted" mb={4}>
          Common administrative tasks
        </Text>
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={3}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button w="full" variant={action.variant} size="md" rightIcon={<FiArrowRight />}>
                {action.label}
              </Button>
            </Link>
          ))}
        </Grid>
      </Box>

      <Box bg="bg.surface" p={6} borderRadius="lg" borderWidth="1px" borderColor="border.default" boxShadow="sm">
        <Text fontSize="md" fontWeight="semibold" fontFamily="heading" mb={1}>
          Recent Activity
        </Text>
        <Text fontSize="sm" color="text.muted" mb={4}>
          Monitor system events and admin actions
        </Text>
        <Box p={5} bg="bg.canvas" borderRadius="md" borderWidth="1px" borderStyle="dashed" borderColor="border.default">
          <Text color="text.muted" fontSize="sm" textAlign="center">
            Recent admin actions and system events will appear here.
          </Text>
        </Box>
        <Link href="/admin/audit">
          <Button variant="link" color="brand" size="sm" mt={4}>
            View full audit log →
          </Button>
        </Link>
      </Box>
    </AdminLayout>
  );
}
