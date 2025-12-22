import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
  Badge,
  IconButton,
  useColorModeValue,
  Spinner,
  Center,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Select,
  VStack,
} from '@chakra-ui/react';
import { FiSearch, FiShield, FiUserX, FiUserCheck, FiUsers } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/auth';

export default function AdminUsers() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'event_scorer'>('user');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role);
    onOpen();
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User role updated to ${newRole}`,
          status: 'success',
          duration: 3000,
        });
        onClose();
        fetchUsers();
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch(`/api/admin/users/${user.id}/active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
          status: 'success',
          duration: 3000,
        });
        fetchUsers();
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'red',
      event_scorer: 'purple',
      user: 'blue',
    };
    return (
      <Badge colorScheme={colors[role as keyof typeof colors] || 'gray'}>
        {role}
      </Badge>
    );
  };

  if (authLoading || loading) {
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.club?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout title="User Management" description="View and manage all users">
      <Head>
        <title>Admin Users - SATRF</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Header Section */}
      <Box mb={6}>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={2}>
          User Management
        </Text>
        <Text fontSize="md" color="gray.600">
          Manage user accounts, roles, and permissions. Data fetched directly from Firestore users collection.
        </Text>
      </Box>

      {/* Search */}
      <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor} mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search by name, email, or club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
          />
        </InputGroup>
        {searchTerm && (
          <Text fontSize="sm" color="gray.600" mt={2}>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </Text>
        )}
      </Box>

      {/* Users Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflowX="auto" shadow="sm">
        {users.length === 0 ? (
          <Box p={12} textAlign="center">
            <FiUsers size={48} color="gray" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={2}>
              No Users Found
            </Text>
            <Text color="gray.500" fontSize="sm">
              The users collection is empty or inaccessible. Users will appear here once they register.
            </Text>
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box p={12} textAlign="center">
            <FiSearch size={48} color="gray" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={2}>
              No Users Match Your Search
            </Text>
            <Text color="gray.500" fontSize="sm" mb={4}>
              Try adjusting your search terms.
            </Text>
            <Button size="sm" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </Box>
        ) : (
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th fontWeight="semibold" color="gray.700">Name</Th>
                <Th fontWeight="semibold" color="gray.700">Email</Th>
                <Th fontWeight="semibold" color="gray.700">Club</Th>
                <Th fontWeight="semibold" color="gray.700">Membership</Th>
                <Th fontWeight="semibold" color="gray.700">Role</Th>
                <Th fontWeight="semibold" color="gray.700">Status</Th>
                <Th fontWeight="semibold" color="gray.700">Created</Th>
                <Th fontWeight="semibold" color="gray.700">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user, index) => (
                <Tr 
                  key={user.id}
                  _hover={{ bg: 'gray.50' }}
                  bg={index % 2 === 0 ? 'white' : 'gray.25'}
                >
                  <Td fontWeight="semibold">{user.firstName} {user.lastName}</Td>
                  <Td>{user.email}</Td>
                  <Td>{user.club || <Text as="span" color="gray.400">-</Text>}</Td>
                  <Td>
                    <Badge colorScheme="teal" textTransform="capitalize">{user.membershipType || 'N/A'}</Badge>
                  </Td>
                  <Td>{getRoleBadge(user.role || 'user')}</Td>
                  <Td>
                    <Badge colorScheme={user.isActive !== false ? 'green' : 'red'}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : '-'}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Change role"
                        icon={<FiShield />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => handleRoleChange(user)}
                      />
                      <IconButton
                        aria-label={user.isActive !== false ? 'Deactivate' : 'Activate'}
                        icon={user.isActive !== false ? <FiUserX /> : <FiUserCheck />}
                        size="sm"
                        colorScheme={user.isActive !== false ? 'red' : 'green'}
                        variant="ghost"
                        onClick={() => handleToggleActive(user)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* Info Footer */}
      {users.length > 0 && (
        <Box mt={4}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''} from Firestore users collection
          </Text>
        </Box>
      )}

      {/* Role Change Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change User Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Change role for: <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
              </Text>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="event_scorer">Event Scorer</option>
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveRole}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}


