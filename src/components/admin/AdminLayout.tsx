import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import {
  Box,
  Flex,
  Heading,
  VStack,
  HStack,
  Button,
  Badge,
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import {
  FiTarget,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiUpload,
  FiLogOut,
  FiTrendingUp,
  FiBarChart2,
  FiExternalLink,
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { auth } from '@/lib/firebase';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Statistics', icon: FiBarChart2 },
  { href: '/admin/users', label: 'Members', icon: FiUsers },
  { href: '/admin/events', label: 'Events', icon: FiCalendar },
  { href: '/admin/scores', label: 'Scores', icon: FiTarget },
  { href: '/admin/scores/import', label: 'Import Scores', icon: FiUpload },
  { href: '/admin/rankings', label: 'Rankings', icon: FiTrendingUp },
  { href: '/admin/audit', label: 'Audit Log', icon: FiFileText },
];

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isAdmin, isLoading } = useAdminRoute();
  const [pendingMembers, setPendingMembers] = useState(0);

  const sidebarBg = useColorModeValue('gray.900', 'gray.900');
  const sidebarText = useColorModeValue('gray.300', 'gray.300');
  const activeBg = useColorModeValue('blue.600', 'blue.600');
  const hoverBg = useColorModeValue('gray.800', 'gray.800');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorder = useColorModeValue('gray.200', 'gray.700');

  // Pull the pending-approval count so the Members tab shows a live badge.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPendingMembers(data.pendingMembers || 0);
      } catch {
        /* badge is best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, router.pathname]);

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={pageBg}>
        <Text>Loading…</Text>
      </Flex>
    );
  }

  if (!isAdmin) return null; // useAdminRoute handles redirect

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Flex minH="100vh" bg={pageBg}>
        {/* Dedicated admin sidebar */}
        <Box
          as="nav"
          w={{ base: '64px', md: '250px' }}
          bg={sidebarBg}
          color={sidebarText}
          minH="100vh"
          position="sticky"
          top={0}
          py={6}
          px={{ base: 2, md: 4 }}
          flexShrink={0}
        >
          <Box px={2} mb={8} display={{ base: 'none', md: 'block' }}>
            <Heading size="md" color="white" letterSpacing="wide">
              SATRF
            </Heading>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="widest">
              Admin Panel
            </Text>
          </Box>

          <VStack align="stretch" spacing={1}>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                router.pathname === item.href ||
                (item.href !== '/admin/dashboard' && router.pathname.startsWith(item.href));
              const showBadge = item.href === '/admin/users' && pendingMembers > 0;
              return (
                <Link key={item.href} href={item.href}>
                  <Flex
                    align="center"
                    justify={{ base: 'center', md: 'space-between' }}
                    px={3}
                    py={3}
                    borderRadius="md"
                    bg={isActive ? activeBg : 'transparent'}
                    color={isActive ? 'white' : sidebarText}
                    _hover={{ bg: isActive ? activeBg : hoverBg, color: 'white' }}
                    cursor="pointer"
                    transition="all 0.15s"
                  >
                    <HStack spacing={3}>
                      <Icon size={18} />
                      <Text display={{ base: 'none', md: 'block' }} fontWeight={isActive ? 'semibold' : 'normal'}>
                        {item.label}
                      </Text>
                    </HStack>
                    {showBadge && (
                      <Badge colorScheme="red" borderRadius="full" px={2}>
                        {pendingMembers}
                      </Badge>
                    )}
                  </Flex>
                </Link>
              );
            })}
          </VStack>
        </Box>

        {/* Main column */}
        <Flex direction="column" flex="1" minW={0}>
          {/* Top bar */}
          <Flex
            as="header"
            bg={headerBg}
            borderBottom="1px"
            borderColor={headerBorder}
            px={6}
            py={3}
            align="center"
            justify="space-between"
          >
            <Box>
              <Heading size="md" color="blue.600">
                Admin Dashboard
              </Heading>
              {user && (
                <Text fontSize="xs" color="gray.500">
                  {user.firstName} {user.lastName} · {user.email}
                </Text>
              )}
            </Box>
            <HStack spacing={2}>
              <Link href="/" target="_blank">
                <Button variant="ghost" size="sm" leftIcon={<FiExternalLink />}>
                  View Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" leftIcon={<FiLogOut />} onClick={handleLogout}>
                Logout
              </Button>
            </HStack>
          </Flex>

          {/* Page content */}
          <Box flex="1" p={{ base: 4, md: 8 }} overflowX="auto">
            {(title || description) && (
              <Box mb={6}>
                {title && (
                  <Heading size="lg" mb={1}>
                    {title}
                  </Heading>
                )}
                {description && (
                  <Text color="gray.600" fontSize="md">
                    {description}
                  </Text>
                )}
              </Box>
            )}
            {children}
          </Box>
        </Flex>
      </Flex>
    </>
  );
}
