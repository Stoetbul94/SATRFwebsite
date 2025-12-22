import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Box, 
  Container, 
  Flex, 
  Heading, 
  VStack, 
  HStack,
  Button,
  useColorModeValue,
  Divider,
  Text
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiTarget, 
  FiCalendar, 
  FiUsers, 
  FiFileText,
  FiUpload,
  FiLogOut
} from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRoute } from '@/hooks/useAdminRoute';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/admin/scores', label: 'Scores', icon: FiTarget },
  { href: '/admin/scores/import', label: 'Import Scores', icon: FiUpload },
  { href: '/admin/events', label: 'Events', icon: FiCalendar },
  { href: '/admin/users', label: 'Users', icon: FiUsers },
  { href: '/admin/audit', label: 'Audit Log', icon: FiFileText },
];

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isAdmin, isLoading } = useAdminRoute();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.300');

  if (isLoading) {
    return (
      <Layout>
        <Container maxW="full" py={8}>
          <Text>Loading...</Text>
        </Container>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useAdminRoute
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <Layout>
      <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
        <Container maxW="full" px={0}>
          {/* Admin Header */}
          <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} px={6} py={4}>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={0}>
                <Heading size="lg" color="blue.600">
                  Admin Dashboard
                </Heading>
                {user && (
                  <Text fontSize="sm" color="gray.600">
                    Logged in as {user.firstName} {user.lastName} ({user.email})
                  </Text>
                )}
              </VStack>
              <HStack spacing={4}>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    User Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<FiLogOut />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </HStack>
            </Flex>
          </Box>

          <Flex>
            {/* Sidebar Navigation */}
            <Box
              w="250px"
              bg={bgColor}
              borderRight="1px"
              borderColor={borderColor}
              minH="calc(100vh - 100px)"
              p={4}
            >
              <VStack align="stretch" spacing={2}>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href || 
                    (item.href !== '/admin/dashboard' && router.pathname.startsWith(item.href));
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Box
                        px={4}
                        py={3}
                        borderRadius="md"
                        bg={isActive ? activeBg : 'transparent'}
                        color={isActive ? activeColor : 'inherit'}
                        _hover={{ bg: isActive ? activeBg : useColorModeValue('gray.100', 'gray.700') }}
                        cursor="pointer"
                        transition="all 0.2s"
                      >
                        <HStack spacing={3}>
                          <Icon />
                          <Text fontWeight={isActive ? 'semibold' : 'normal'}>
                            {item.label}
                          </Text>
                        </HStack>
                      </Box>
                    </Link>
                  );
                })}
              </VStack>
            </Box>

            {/* Main Content */}
            <Box flex="1" p={8}>
              {(title || description) && (
                <Box mb={6}>
                  {title && (
                    <Heading size="xl" mb={2}>
                      {title}
                    </Heading>
                  )}
                  {description && (
                    <Text color="gray.600" fontSize="lg">
                      {description}
                    </Text>
                  )}
                </Box>
              )}
              {children}
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
}

