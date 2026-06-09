import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
  Tooltip,
} from '@chakra-ui/react';
import { FiSearch, FiShield, FiCheck, FiX, FiSlash, FiRotateCcw, FiUsers } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { UserProfile } from '@/lib/auth';

type StatusFilter = 'pending' | 'active' | 'all';

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export default function AdminUsers() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'event_scorer'>('user');

  useEffect(() => {
    if (isAdmin) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    const q = router.query.search;
    if (typeof q === 'string' && q.trim()) {
      setSearchTerm(q.trim());
    }
  }, [router.query.search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch users', status: 'error', duration: 3000 });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: 'Failed to fetch users', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (user: UserProfile, status: 'active' | 'rejected' | 'suspended') => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update status');
      }
      const label = status === 'active' ? 'approved' : status;
      toast({ title: 'Done', description: `${user.firstName} ${user.lastName} ${label}`, status: 'success', duration: 3000 });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update status', status: 'error', duration: 4000 });
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
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        toast({ title: 'Success', description: `Role updated to ${newRole}`, status: 'success', duration: 3000 });
        onClose();
        fetchUsers();
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user role', status: 'error', duration: 3000 });
    }
  };

  const statusOf = (u: UserProfile): string =>
    (u as any).status || (u.isActive === false ? 'suspended' : 'active');

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'yellow',
      active: 'green',
      rejected: 'red',
      suspended: 'orange',
    };
    return <Badge colorScheme={map[status] || 'gray'} textTransform="capitalize">{status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = { admin: 'red', event_scorer: 'purple', user: 'blue' };
    return <Badge colorScheme={colors[role] || 'gray'}>{role}</Badge>;
  };

  const pendingCount = useMemo(() => users.filter((u) => statusOf(u) === 'pending').length, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const s = statusOf(user);
      const matchesStatus =
        statusFilter === 'all' ? true : statusFilter === 'pending' ? s === 'pending' : s === 'active';
      const matchesSearch =
        !searchTerm ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.club?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [users, statusFilter, searchTerm]);

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout title="Members" description="Approve registrations and manage member accounts">
      <Head>
        <title>Members - SATRF Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Filters */}
      <HStack mb={4} spacing={3} wrap="wrap">
        <Button
          colorScheme={statusFilter === 'pending' ? 'yellow' : 'gray'}
          onClick={() => setStatusFilter('pending')}
        >
          Pending {pendingCount > 0 && <Badge ml={2} colorScheme="red">{pendingCount}</Badge>}
        </Button>
        <Button colorScheme={statusFilter === 'active' ? 'green' : 'gray'} onClick={() => setStatusFilter('active')}>
          Active
        </Button>
        <Button colorScheme={statusFilter === 'all' ? 'blue' : 'gray'} onClick={() => setStatusFilter('all')}>
          All
        </Button>
      </HStack>

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
      </Box>

      {/* Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflowX="auto" shadow="sm">
        {filteredUsers.length === 0 ? (
          <Box p={12} textAlign="center">
            <FiUsers size={48} color="gray" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={2}>
              No members in this view
            </Text>
            <Text color="gray.500" fontSize="sm">
              {statusFilter === 'pending' ? 'No registrations awaiting approval.' : 'Try a different filter or search.'}
            </Text>
          </Box>
        ) : (
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Club</Th>
                <Th>Membership</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user) => {
                const s = statusOf(user);
                return (
                  <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="semibold">{user.firstName} {user.lastName}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.club || <Text as="span" color="gray.400">-</Text>}</Td>
                    <Td>
                      <Badge colorScheme="teal" textTransform="capitalize">{user.membershipType || 'N/A'}</Badge>
                    </Td>
                    <Td>{getRoleBadge(user.role || 'user')}</Td>
                    <Td>{getStatusBadge(s)}</Td>
                    <Td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</Td>
                    <Td>
                      <HStack spacing={1}>
                        {s === 'pending' && (
                          <>
                            <Tooltip label="Approve">
                              <IconButton aria-label="Approve" icon={<FiCheck />} size="sm" colorScheme="green" onClick={() => setStatus(user, 'active')} />
                            </Tooltip>
                            <Tooltip label="Reject">
                              <IconButton aria-label="Reject" icon={<FiX />} size="sm" colorScheme="red" variant="outline" onClick={() => setStatus(user, 'rejected')} />
                            </Tooltip>
                          </>
                        )}
                        {s === 'active' && (
                          <Tooltip label="Suspend">
                            <IconButton aria-label="Suspend" icon={<FiSlash />} size="sm" colorScheme="orange" variant="ghost" onClick={() => setStatus(user, 'suspended')} />
                          </Tooltip>
                        )}
                        {(s === 'suspended' || s === 'rejected') && (
                          <Tooltip label="Reactivate">
                            <IconButton aria-label="Reactivate" icon={<FiRotateCcw />} size="sm" colorScheme="green" variant="ghost" onClick={() => setStatus(user, 'active')} />
                          </Tooltip>
                        )}
                        <Tooltip label="Change role">
                          <IconButton aria-label="Change role" icon={<FiShield />} size="sm" colorScheme="blue" variant="ghost" onClick={() => handleRoleChange(user)} />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Box>

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
              <Select value={newRole} onChange={(e) => setNewRole(e.target.value as any)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="event_scorer">Event Scorer</option>
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSaveRole}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
