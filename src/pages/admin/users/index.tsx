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
  Switch,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@chakra-ui/react';
import { FiSearch, FiShield, FiCheck, FiX, FiSlash, FiRotateCcw, FiUsers, FiLink, FiTarget } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminIconActions from '@/components/admin/AdminIconActions';
import MemberLinkedScoresTable from '@/components/admin/MemberLinkedScoresTable';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { UserProfile } from '@/lib/auth';
import { formatIsoDate } from '@/lib/firestoreSerialize';
import type { LinkedScorePreview } from '@/lib/memberLink';

interface LinkHistoryPreview {
  memberId: string;
  memberName: string;
  scoreCount: number;
  registrationCount: number;
  scores: Array<{
    id: string;
    shooterName: string;
    club: string;
    eventName: string;
    date: string;
    discipline: string;
    clubMismatch?: boolean;
  }>;
  registrations: Array<{
    id: string;
    eventTitle: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  linkedScoreCount: number;
  linkedRegistrationCount: number;
  linkedScores: LinkedScorePreview[];
  linkedRegistrations: Array<{
    id: string;
    eventTitle: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
}

interface LinkedScoresView {
  memberId: string;
  memberName: string;
  scores: LinkedScorePreview[];
  registrations: Array<{
    id: string;
    eventTitle: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
}

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
  const {
    isOpen: isLinkOpen,
    onOpen: onLinkOpen,
    onClose: onLinkClose,
  } = useDisclosure();
  const {
    isOpen: isScoresOpen,
    onOpen: onScoresOpen,
    onClose: onScoresClose,
  } = useDisclosure();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'event_scorer'>('user');
  const [newIsAthlete, setNewIsAthlete] = useState(false);
  const [linkUser, setLinkUser] = useState<UserProfile | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkHistoryPreview | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkApplying, setLinkApplying] = useState(false);
  const [scoresUser, setScoresUser] = useState<UserProfile | null>(null);
  const [linkedScoresView, setLinkedScoresView] = useState<LinkedScoresView | null>(null);
  const [scoresViewLoading, setScoresViewLoading] = useState(false);

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
    setNewIsAthlete(user.isAthlete === true);
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
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      const roleIsAdmin = newRole === 'admin';
      const athleteChanged =
        roleIsAdmin && newIsAthlete !== (selectedUser.isAthlete === true);

      if (athleteChanged) {
        const athleteRes = await fetch(`/api/admin/users/${selectedUser.id}/athlete`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ isAthlete: newIsAthlete }),
        });
        if (!athleteRes.ok) {
          const d = await athleteRes.json().catch(() => ({}));
          throw new Error(d.error || 'Failed to update athlete dashboard access');
        }
      }

      toast({ title: 'Success', description: 'Member updated', status: 'success', duration: 3000 });
      onClose();
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update member';
      toast({ title: 'Error', description: message, status: 'error', duration: 3000 });
    }
  };

  const openLinkHistory = async (user: UserProfile) => {
    setLinkUser(user);
    setLinkPreview(null);
    onLinkOpen();
    setLinkLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/admin/users/${user.id}/link-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load link preview');
      }
      setLinkPreview(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load link preview';
      toast({ title: 'Error', description: message, status: 'error', duration: 4000 });
      onLinkClose();
    } finally {
      setLinkLoading(false);
    }
  };

  const openLinkedScoresView = async (user: UserProfile) => {
    setScoresUser(user);
    setLinkedScoresView(null);
    onScoresOpen();
    setScoresViewLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/admin/users/${user.id}/linked-scores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load linked scores');
      }
      setLinkedScoresView(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load linked scores';
      toast({ title: 'Error', description: message, status: 'error', duration: 4000 });
      onScoresClose();
    } finally {
      setScoresViewLoading(false);
    }
  };

  const applyLinkHistory = async () => {
    if (!linkUser) return;
    setLinkApplying(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/admin/users/${linkUser.id}/link-history`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to link historical data');
      }
      toast({
        title: 'Historical data linked',
        description: data.message || `Linked ${data.scoresLinked} score(s) and ${data.registrationsLinked} registration(s).`,
        status: 'success',
        duration: 5000,
      });
      onLinkClose();
      setLinkUser(null);
      setLinkPreview(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to link historical data';
      toast({ title: 'Error', description: message, status: 'error', duration: 4000 });
    } finally {
      setLinkApplying(false);
    }
  };

  const statusOf = (u: UserProfile): string =>
    (u as any).status || (u.isActive === false ? 'suspended' : 'active');

  const getRoleBadge = (user: UserProfile) => {
    const role = user.role || 'user';
    const variant = role === 'admin' ? 'statusClosed' : role === 'event_scorer' ? 'discipline' : 'statusOpen';
    return (
      <HStack spacing={1} flexWrap="wrap">
        <Badge variant={variant}>{role}</Badge>
        {role === 'admin' && user.isAthlete && (
          <Badge colorScheme="teal" variant="subtle">
            Athlete
          </Badge>
        )}
      </HStack>
    );
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
        <AdminPageHeader title="Members" subtitle="Approve registrations and manage member accounts" />
        <AdminTableSkeleton columns={8} />
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <Head>
        <title>Members - SATRF Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AdminPageHeader
        title="Members"
        subtitle="Approve registrations and manage member accounts"
      />

      <HStack mb={4} spacing={2} wrap="wrap">
        <Button
          size="sm"
          variant={statusFilter === 'pending' ? 'satrfGold' : 'satrfOutline'}
          onClick={() => setStatusFilter('pending')}
        >
          Pending {pendingCount > 0 && <Badge ml={2} bg="satrf.flagRed" color="white">{pendingCount}</Badge>}
        </Button>
        <Button size="sm" variant={statusFilter === 'active' ? 'satrf' : 'satrfOutline'} onClick={() => setStatusFilter('active')}>
          Active
        </Button>
        <Button size="sm" variant={statusFilter === 'all' ? 'satrf' : 'satrfOutline'} onClick={() => setStatusFilter('all')}>
          All
        </Button>
      </HStack>

      <Box bg="bg.surface" p={4} borderRadius="lg" borderWidth="1px" borderColor="border.default" mb={4} boxShadow="sm">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search by name, email, or club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </Box>

      <AdminTableCard>
        {filteredUsers.length === 0 ? (
          <AdminEmptyState
            icon={FiUsers}
            title="No members in this view"
            description={
              statusFilter === 'pending'
                ? 'No registrations awaiting approval.'
                : 'Try a different filter or search.'
            }
          />
        ) : (
          <Table variant="admin" size="sm">
            <Thead>
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
                  <Tr key={user.id}>
                    <Td fontWeight="semibold">{user.firstName} {user.lastName}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.club || <Text as="span" color="gray.400">-</Text>}</Td>
                    <Td>
                      <Badge colorScheme="teal" textTransform="capitalize">{user.membershipType || 'N/A'}</Badge>
                    </Td>
                    <Td>{getRoleBadge(user)}</Td>
                    <Td><AdminStatusBadge status={s} /></Td>
                    <Td>{formatIsoDate(user.createdAt)}</Td>
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
                          <>
                            <Tooltip label="View linked scores">
                              <IconButton
                                aria-label="View linked scores"
                                icon={<FiTarget />}
                                size="sm"
                                colorScheme="blue"
                                variant="ghost"
                                onClick={() => openLinkedScoresView(user)}
                              />
                            </Tooltip>
                            <Tooltip label="Link historical scores & registrations">
                              <IconButton
                                aria-label="Link history"
                                icon={<FiLink />}
                                size="sm"
                                colorScheme="teal"
                                variant="ghost"
                                onClick={() => openLinkHistory(user)}
                              />
                            </Tooltip>
                            <Tooltip label="Suspend">
                              <IconButton aria-label="Suspend" icon={<FiSlash />} size="sm" colorScheme="orange" variant="ghost" onClick={() => setStatus(user, 'suspended')} />
                            </Tooltip>
                          </>
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
      </AdminTableCard>

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
                onChange={(e) => {
                  const role = e.target.value as 'user' | 'admin' | 'event_scorer';
                  setNewRole(role);
                  if (role !== 'admin') setNewIsAthlete(false);
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="event_scorer">Event Scorer</option>
              </Select>
              {newRole === 'admin' && (
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel htmlFor="athlete-dashboard" mb={0} fontWeight="medium">
                      Athlete dashboard
                    </FormLabel>
                    <FormHelperText mt={0}>
                      Allow this admin to use the member dashboard and see their own scores.
                    </FormHelperText>
                  </Box>
                  <Switch
                    id="athlete-dashboard"
                    colorScheme="teal"
                    isChecked={newIsAthlete}
                    onChange={(e) => setNewIsAthlete(e.target.checked)}
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button variant="satrf" onClick={handleSaveRole}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isLinkOpen} onClose={() => !linkApplying && onLinkClose()} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Link historical data</ModalHeader>
          <ModalCloseButton isDisabled={linkApplying} />
          <ModalBody>
            {linkLoading ? (
              <Center py={8}>
                <Spinner color="satrf.navy" />
              </Center>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Text>
                  Attach guest scores and registrations to{' '}
                  <strong>
                    {linkUser?.firstName} {linkUser?.lastName}
                  </strong>
                  . Scores match by name; registrations match by email.
                </Text>

                {linkPreview && linkPreview.linkedScoreCount > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2} color="teal.600">
                      Already linked — scores ({linkPreview.linkedScoreCount})
                    </Text>
                    <MemberLinkedScoresTable scores={linkPreview.linkedScores} />
                  </Box>
                )}
                {linkPreview && linkPreview.linkedRegistrationCount > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2} color="teal.600">
                      Already linked — registrations ({linkPreview.linkedRegistrationCount})
                    </Text>
                    <VStack align="stretch" spacing={1} maxH="120px" overflowY="auto">
                      {linkPreview.linkedRegistrations.map((reg) => (
                        <Text key={reg.id} fontSize="sm">
                          {reg.eventTitle || 'Event'} · {reg.email}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                )}

                {linkPreview &&
                  linkPreview.scoreCount === 0 &&
                  linkPreview.registrationCount === 0 &&
                  linkPreview.linkedScoreCount === 0 &&
                  linkPreview.linkedRegistrationCount === 0 && (
                    <Text color="gray.500">No matching unlinked scores or registrations found.</Text>
                  )}

                {linkPreview &&
                  linkPreview.scoreCount === 0 &&
                  linkPreview.registrationCount === 0 &&
                  (linkPreview.linkedScoreCount > 0 || linkPreview.linkedRegistrationCount > 0) && (
                    <Text fontSize="sm" color="gray.600">
                      Nothing new to link.
                    </Text>
                  )}

                {linkPreview && linkPreview.scoreCount > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      Ready to link — scores ({linkPreview.scoreCount})
                    </Text>
                    {linkPreview.scores.some((s) => s.clubMismatch) && (
                      <Text fontSize="sm" color="orange.600" mb={2}>
                        {linkPreview.scores.filter((s) => s.clubMismatch).length} score(s) have a
                        different club than this member — review before linking.
                      </Text>
                    )}
                    <VStack align="stretch" spacing={1} maxH="200px" overflowY="auto">
                      {linkPreview.scores.map((score) => (
                        <HStack key={score.id} fontSize="sm" spacing={2} flexWrap="wrap">
                          <Text>
                            {score.eventName || 'Event'} · {score.discipline} ·{' '}
                            {score.date ? new Date(score.date).toLocaleDateString() : '—'}
                            {score.club ? ` · ${score.club}` : ''}
                          </Text>
                          {score.clubMismatch && (
                            <Badge colorScheme="orange" fontSize="0.65em">
                              Club differs
                            </Badge>
                          )}
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
                {linkPreview && linkPreview.registrationCount > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      Ready to link — registrations ({linkPreview.registrationCount})
                    </Text>
                    <VStack align="stretch" spacing={1} maxH="160px" overflowY="auto">
                      {linkPreview.registrations.map((reg) => (
                        <Text key={reg.id} fontSize="sm">
                          {reg.eventTitle || 'Event'} · {reg.email}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLinkClose} isDisabled={linkApplying}>
              Cancel
            </Button>
            <Button
              variant="satrf"
              onClick={applyLinkHistory}
              isLoading={linkApplying}
              isDisabled={
                linkLoading ||
                !linkPreview ||
                (linkPreview.scoreCount === 0 && linkPreview.registrationCount === 0)
              }
            >
              Link data
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isScoresOpen} onClose={onScoresClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="960px">
          <ModalHeader>Linked scores &amp; registrations</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {scoresViewLoading ? (
              <Center py={8}>
                <Spinner color="satrf.navy" />
              </Center>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Text>
                  Scores and registrations linked to{' '}
                  <strong>
                    {scoresUser?.firstName} {scoresUser?.lastName}
                  </strong>
                  .
                </Text>
                <MemberLinkedScoresTable scores={linkedScoresView?.scores ?? []} />
                {linkedScoresView && linkedScoresView.registrations.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      Registrations ({linkedScoresView.registrations.length})
                    </Text>
                    <VStack align="stretch" spacing={1}>
                      {linkedScoresView.registrations.map((reg) => (
                        <Text key={reg.id} fontSize="sm">
                          {reg.eventTitle || 'Event'} · {reg.name} · {reg.email}
                          {reg.createdAt
                            ? ` · ${new Date(reg.createdAt).toLocaleDateString()}`
                            : ''}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onScoresClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
