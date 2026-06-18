import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  Badge,
  Text,
  Tooltip,
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
  FiGrid,
  FiUser,
  FiEdit,
} from 'react-icons/fi';
import { isAdminAthlete } from '@/lib/userAthlete';
import FlagStripe from '@/components/brand/FlagStripe';
import SatrfHorizontalLogo from '@/components/brand/SatrfHorizontalLogo';
import AdminLoadingPanel from '@/components/admin/AdminLoadingPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useFiringLineEditorPermission } from '@/hooks/useFiringLineEditorPermission';
import { auth } from '@/lib/firebase';
import type { IconType } from 'react-icons';

interface AdminLayoutProps {
  children: ReactNode;
  /** @deprecated Use AdminPageHeader inside children instead */
  title?: string;
  /** @deprecated Use AdminPageHeader inside children instead */
  description?: string;
}

const adminNavItems: {
  href: string;
  label: string;
  icon: IconType;
  requiresFiringLineEditor?: boolean;
}[] = [
  { href: '/admin/dashboard', label: 'Statistics', icon: FiBarChart2 },
  { href: '/admin/users', label: 'Members', icon: FiUsers },
  { href: '/admin/events', label: 'Events', icon: FiCalendar },
  { href: '/admin/scores', label: 'Scores', icon: FiTarget },
  { href: '/admin/scores/import', label: 'Import Scores', icon: FiUpload },
  { href: '/admin/rankings', label: 'Rankings', icon: FiTrendingUp },
  { href: '/admin/audit', label: 'Audit Log', icon: FiFileText },
  {
    href: '/admin/firing-line',
    label: 'Firing Line',
    icon: FiEdit,
    requiresFiringLineEditor: true,
  },
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
  const { firingLineEditor } = useFiringLineEditorPermission();
  const [pendingMembers, setPendingMembers] = useState(0);

  const visibleNavItems = adminNavItems.filter(
    (item) => !item.requiresFiringLineEditor || firingLineEditor
  );

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
      <Flex minH="100vh" align="center" justify="center" bg="bg.canvas">
        <AdminLoadingPanel />
      </Flex>
    );
  }

  if (!isAdmin) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Flex minH="100vh" bg="bg.canvas">
        {/* Sidebar */}
        <Box
          as="nav"
          aria-label="Admin navigation"
          w={{ base: '72px', md: '300px' }}
          bg="satrf.green.900"
          color="whiteAlpha.800"
          minH="100vh"
          position="sticky"
          top={0}
          py={5}
          px={{ base: 1.5, md: 3 }}
          flexShrink={0}
          borderRightWidth="1px"
          borderColor="satrf.green.800"
          display="flex"
          flexDirection="column"
        >
          <Box mb={8} px={{ base: 0, md: 1 }} display="flex" justifyContent={{ base: 'center', md: 'stretch' }} w="100%">
            <Box display={{ base: 'none', md: 'block' }} w="100%">
              <SatrfHorizontalLogo variant="admin" />
              <Text fontSize="2xs" color="satrf.gold.400" textTransform="uppercase" letterSpacing="widest" mt={2.5} pl={1}>
                Admin
              </Text>
            </Box>
            <Box
              as="img"
              display={{ base: 'block', md: 'none' }}
              src="/brand/satrf-emblem.png"
              alt="SATRF"
              w="52px"
              h="52px"
              objectFit="contain"
              borderRadius="md"
              bg="white"
              p={1}
              boxShadow="sm"
            />
          </Box>

          <VStack align="stretch" spacing={0.5} flex={1}>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                router.pathname === item.href ||
                (item.href !== '/admin/dashboard' && router.pathname.startsWith(item.href));
              const showBadge = item.href === '/admin/users' && pendingMembers > 0;

              const linkContent = (
                <Flex
                  align="center"
                  justify={{ base: 'center', md: 'space-between' }}
                  px={{ base: 2, md: 3 }}
                  py={2.5}
                  borderRadius="md"
                  bg={isActive ? 'satrf.green.700' : 'transparent'}
                  color={isActive ? 'white' : 'whiteAlpha.700'}
                  borderLeftWidth={{ md: '3px' }}
                  borderLeftColor={isActive ? 'satrf.gold.500' : 'transparent'}
                  _hover={{
                    bg: isActive ? 'satrf.green.700' : 'satrf.green.800',
                    color: 'white',
                  }}
                  cursor="pointer"
                  transition="background 0.15s ease, color 0.15s ease"
                  minH="44px"
                >
                  <HStack spacing={3}>
                    <Icon size={18} />
                    <Text display={{ base: 'none', md: 'block' }} fontSize="sm" fontWeight={isActive ? 'semibold' : 'medium'}>
                      {item.label}
                    </Text>
                  </HStack>
                  {showBadge && (
                    <Badge
                      display={{ base: 'none', md: 'flex' }}
                      bg="satrf.flagRed"
                      color="white"
                      borderRadius="full"
                      px={2}
                      fontSize="2xs"
                    >
                      {pendingMembers}
                    </Badge>
                  )}
                </Flex>
              );

              return (
                <Tooltip
                  key={item.href}
                  label={item.label}
                  placement="right"
                  display={{ base: 'block', md: 'none' }}
                  openDelay={300}
                >
                  <Link href={item.href}>{linkContent}</Link>
                </Tooltip>
              );
            })}
          </VStack>

          {user && isAdminAthlete(user) && (
            <Box mt="auto" pt={6} borderTopWidth="1px" borderColor="satrf.green.800">
              <Text
                display={{ base: 'none', md: 'block' }}
                fontSize="2xs"
                color="satrf.gold.400"
                textTransform="uppercase"
                letterSpacing="widest"
                px={3}
                mb={2}
              >
                My athlete area
              </Text>
              <VStack align="stretch" spacing={0.5}>
                {[
                  { href: '/dashboard', label: 'My Dashboard', icon: FiGrid },
                  { href: '/profile', label: 'My Profile', icon: FiUser },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href;
                  const linkContent = (
                    <Flex
                      align="center"
                      justify={{ base: 'center', md: 'flex-start' }}
                      px={{ base: 2, md: 3 }}
                      py={2.5}
                      borderRadius="md"
                      bg={isActive ? 'satrf.green.700' : 'transparent'}
                      color={isActive ? 'white' : 'whiteAlpha.700'}
                      borderLeftWidth={{ md: '3px' }}
                      borderLeftColor={isActive ? 'satrf.gold.500' : 'transparent'}
                      _hover={{ bg: 'satrf.green.800', color: 'white' }}
                      cursor="pointer"
                      transition="background 0.15s ease, color 0.15s ease"
                      minH="44px"
                    >
                      <HStack spacing={3}>
                        <Icon size={18} />
                        <Text display={{ base: 'none', md: 'block' }} fontSize="sm" fontWeight="medium">
                          {item.label}
                        </Text>
                      </HStack>
                    </Flex>
                  );
                  return (
                    <Tooltip
                      key={item.href}
                      label={item.label}
                      placement="right"
                      display={{ base: 'block', md: 'none' }}
                      openDelay={300}
                    >
                      <Link href={item.href}>{linkContent}</Link>
                    </Tooltip>
                  );
                })}
              </VStack>
            </Box>
          )}
        </Box>

        {/* Main */}
        <Flex direction="column" flex="1" minW={0}>
          <Box as="header" bg="bg.surface" borderBottomWidth="1px" borderColor="border.default" position="sticky" top={0} zIndex="sticky">
            <Flex px={{ base: 4, md: 6 }} py={3} align="center" justify="space-between" gap={3}>
              <Box minW={0}>
                <Text fontSize="sm" fontWeight="semibold" color="text.primary" fontFamily="heading">
                  Admin Dashboard
                </Text>
                {user && (
                  <Text fontSize="xs" color="text.muted" noOfLines={1}>
                    {user.firstName} {user.lastName} · {user.email}
                  </Text>
                )}
              </Box>
              <HStack spacing={2} flexShrink={0}>
                <Link href="/" target="_blank">
                  <Button variant="satrfOutline" size="sm" leftIcon={<FiExternalLink />}>
                    <Box as="span" display={{ base: 'none', sm: 'inline' }}>
                      View Site
                    </Box>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" leftIcon={<FiLogOut />} onClick={handleLogout} color="text.muted">
                  <Box as="span" display={{ base: 'none', sm: 'inline' }}>
                    Logout
                  </Box>
                </Button>
              </HStack>
            </Flex>
            <FlagStripe thickness={3} />
          </Box>

          <Box flex="1" p={{ base: 4, md: 6, lg: 8 }} overflowX="auto">
            {(title || description) && (
              <Box mb={6}>
                {title && (
                  <Text fontSize="xl" fontWeight="bold" fontFamily="heading" color="text.primary" mb={description ? 1 : 0}>
                    {title}
                  </Text>
                )}
                {description && (
                  <Text color="text.muted" fontSize="sm">
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
